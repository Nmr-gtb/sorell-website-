import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { priceId, userId, userEmail, fromOnboarding } = await request.json();

    if (!priceId || !userId) {
      return NextResponse.json({ error: "Missing priceId or userId" }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://sorell.fr";
    const successUrl = fromOnboarding
      ? `${base}/dashboard?onboarding=true`
      : `${base}/dashboard/profile?upgraded=true`;
    const cancelUrl = fromOnboarding
      ? `${base}/dashboard`
      : `${base}/tarifs`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 15,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
