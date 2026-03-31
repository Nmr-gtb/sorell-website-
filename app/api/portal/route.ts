import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId || userId !== authUser.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "No subscription found" }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://sorell.fr"}/dashboard/profile`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Portal error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
