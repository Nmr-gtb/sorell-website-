import { stripe, PRICE_IDS } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkoutRateLimit } from "@/lib/ratelimit";

const VALID_PRICE_IDS = new Set(Object.values(PRICE_IDS));

// Remise parrainage appliquée au 1er mois : -20% arrondi au chiffre en dessous.
// La valeur est le montant DÉDUIT (amount_off Stripe, en centimes) = prix plein
// - prix filleul cible. Doit rester < prix plein, sinon le 1er mois passe à 0€.
const REFERRAL_PRICES: Record<string, number> = {
  [PRICE_IDS.pro_monthly]: 299,        // 9,99€ → 7€ (remise 2,99€)
  [PRICE_IDS.business_monthly]: 1000,   // 49€ → 39€ (remise 10€)
};

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { success } = await checkoutRateLimit.limit(authUser.id);
    if (!success) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans une heure." },
        { status: 429 }
      );
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

    // --- Garde-fou anti double-abonnement + réutilisation du customer Stripe ---
    // Sans ça, chaque checkout créait un NOUVEAU customer (customer_email) : un
    // abonné payant pouvait souscrire une 2e fois (double facturation) et le
    // trial de 15j était réutilisable à l'infini. On lit le profil pour bloquer
    // les abonnés actifs et réutiliser leur customer existant (Stripe gère alors
    // l'unicité du trial et détecte les abonnements en cours).
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, stripe_customer_id, stripe_subscription_id")
      .eq("id", userId)
      .maybeSingle();

    const hasPaidPlan = profile?.plan === "pro" || profile?.plan === "business";
    if (hasPaidPlan && profile?.stripe_subscription_id) {
      return NextResponse.json(
        {
          error:
            "Vous avez déjà un abonnement actif. Gérez-le depuis votre espace facturation.",
          alreadySubscribed: true,
        },
        { status: 409 }
      );
    }

    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://sorell.fr";
    const successUrl = fromOnboarding
      ? `${base}/dashboard?onboarding=true`
      : `${base}/dashboard/profile?upgraded=true`;
    const cancelUrl = fromOnboarding
      ? `${base}/dashboard`
      : `${base}/tarifs`;

    // --- Parrainage ---
    let referralCouponId: string | undefined;
    const { data: referral } = await supabaseAdmin
      .from("referrals")
      .select("id, referrer_id, expires_at")
      .eq("referee_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (referral && new Date(referral.expires_at) > new Date()) {
      const discountAmount = REFERRAL_PRICES[priceId];
      if (discountAmount) {
        const couponKey = `sorell_ref_${referral.id}`;
        try {
          const existing = await stripe.coupons.retrieve(couponKey);
          referralCouponId = existing.id;
        } catch {
          const coupon = await stripe.coupons.create({
            id: couponKey,
            amount_off: discountAmount,
            currency: "eur",
            duration: "once",
            name: "Parrainage Sorell -20%",
          });
          referralCouponId = coupon.id;
        }
      }
    }

    // --- Construire la session Stripe ---
    // Réutiliser le customer existant s'il y en a un (évite les doublons et
    // permet à Stripe d'appliquer sa règle d'unicité de trial par customer) ;
    // sinon, laisser Stripe créer le customer à partir de l'email.
    const sessionParams: Record<string, unknown> = {
      mode: "subscription",
      payment_method_types: ["card"],
      ...(profile?.stripe_customer_id
        ? { customer: profile.stripe_customer_id }
        : { customer_email: userEmail }),
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: referralCouponId ? undefined : 15,
      },
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        referralId: referral?.id || "",
      },
    };

    if (referralCouponId) {
      sessionParams.discounts = [{ coupon: referralCouponId }];
      // Pas de trial standard si coupon parrainage appliqué
      (sessionParams.subscription_data as Record<string, unknown>).trial_period_days = undefined;
      // allow_promotion_codes incompatible avec discounts dans Stripe
      sessionParams.allow_promotion_codes = undefined;
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    );

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
