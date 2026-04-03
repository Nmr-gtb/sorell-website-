import { stripe, PRICE_IDS } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";

const VALID_PRICE_IDS = new Set(Object.values(PRICE_IDS));

// Prix filleul avec -20% (arrondis au chiffre en dessous)
const REFERRAL_PRICES: Record<string, number> = {
  [PRICE_IDS.pro_monthly]: 1500,       // 19€ → 15€ (en centimes)
  [PRICE_IDS.business_monthly]: 3900,   // 49€ → 39€ (en centimes)
};

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { priceId, fromOnboarding } = await request.json();
    const userId = authUser.id;
    const userEmail = authUser.email;

    if (!priceId) {
      return NextResponse.json({ error: "Missing priceId" }, { status: 400 });
    }

    if (!VALID_PRICE_IDS.has(priceId)) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://sorell.fr";
    const successUrl = fromOnboarding
      ? `${base}/dashboard?onboarding=true`
      : `${base}/dashboard/profile?upgraded=true`;
    const cancelUrl = fromOnboarding
      ? `${base}/dashboard`
      : `${base}/tarifs`;

    // Vérifier si le user a été parrainé (referral pending)
    let couponId: string | undefined;
    const { data: referral } = await supabaseAdmin
      .from("referrals")
      .select("id, referrer_id, expires_at")
      .eq("referee_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (referral && new Date(referral.expires_at) > new Date()) {
      const discountAmount = REFERRAL_PRICES[priceId];
      if (discountAmount) {
        // Coupon idempotent : un seul coupon par referral (évite les orphelins si checkout appelé plusieurs fois)
        const couponKey = `sorell_ref_${referral.id}`;
        try {
          // Réutiliser le coupon existant s'il a déjà été créé
          const existing = await stripe.coupons.retrieve(couponKey);
          couponId = existing.id;
        } catch {
          // Le coupon n'existe pas encore, on le crée avec un ID déterministe
          const coupon = await stripe.coupons.create({
            id: couponKey,
            amount_off: discountAmount,
            currency: "eur",
            duration: "once",
            name: "Parrainage Sorell -20%",
          });
          couponId = coupon.id;
        }
      }
    }

    const sessionParams: Record<string, unknown> = {
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 15,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { userId, referralId: referral?.id || "" },
    };

    if (couponId) {
      sessionParams.discounts = [{ coupon: couponId }];
      // Pas de trial si coupon appliqué (le -20% s'applique au premier mois)
      (sessionParams.subscription_data as Record<string, unknown>).trial_period_days = undefined;
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    );

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
