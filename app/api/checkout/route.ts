import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { priceId, userId, userEmail } = await request.json();

    if (!priceId || !userId) {
      return NextResponse.json({ error: "Missing priceId or userId" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://sorell.fr"}/dashboard/profile?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://sorell.fr"}/pricing`,
      metadata: { userId },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
