import { stripe, PRICE_TO_PLAN } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const subscriptionId = session.subscription as string;

    if (userId && subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const priceId = subscription.items.data[0]?.price.id;
      const plan = PRICE_TO_PLAN[priceId] || "free";

      await supabaseAdmin
        .from("profiles")
        .update({
          plan,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const priceId = subscription.items.data[0]?.price.id;
    const plan = PRICE_TO_PLAN[priceId] || "free";
    const customerId = subscription.customer as string;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (profile) {
      await supabaseAdmin
        .from("profiles")
        .update({ plan, updated_at: new Date().toISOString() })
        .eq("id", profile.id);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customerId = subscription.customer as string;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (profile) {
      await supabaseAdmin
        .from("profiles")
        .update({ plan: "free", stripe_subscription_id: null, updated_at: new Date().toISOString() })
        .eq("id", profile.id);
    }
  }

  return NextResponse.json({ received: true });
}
