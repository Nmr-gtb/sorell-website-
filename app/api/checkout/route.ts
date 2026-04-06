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

interface PromoCode {
  id: string;
  code: string;
  type: "free_months" | "percentage" | "fixed";
  value: number;
  applicable_plans: string[];
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { priceId, fromOnboarding, promoCode } = await request.json();
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

    // --- Code promo ---
    let promoCouponId: string | undefined;
    let promoId: string | undefined;
    let promoTrialDays: number | undefined;

    if (promoCode && typeof promoCode === "string") {
      const { data: promo } = await supabaseAdmin
        .from("promo_codes")
        .select("id, code, type, value, applicable_plans, max_uses, current_uses, expires_at")
        .eq("code", promoCode.trim())
        .eq("active", true)
        .maybeSingle();

      if (promo) {
        const p = promo as PromoCode;
        const isExpired = p.expires_at && new Date(p.expires_at) < new Date();
        const isMaxUsed = p.max_uses !== null && p.current_uses >= p.max_uses;

        // Vérifier que le user n'a pas déjà utilisé ce code
        const { data: existingUse } = await supabaseAdmin
          .from("promo_code_uses")
          .select("id")
          .eq("promo_code_id", p.id)
          .eq("user_id", userId)
          .maybeSingle();

        if (!isExpired && !isMaxUsed && !existingUse) {
          promoId = p.id;

          if (p.type === "free_months") {
            // X mois gratuits = trial de X*30 jours (Stripe trial)
            promoTrialDays = p.value * 30;
          } else if (p.type === "percentage") {
            // Réduction en pourcentage
            const couponKey = `sorell_promo_${p.id}`;
            try {
              const existing = await stripe.coupons.retrieve(couponKey);
              promoCouponId = existing.id;
            } catch {
              const coupon = await stripe.coupons.create({
                id: couponKey,
                percent_off: p.value,
                duration: "once",
                name: `Promo Sorell -${p.value}%`,
              });
              promoCouponId = coupon.id;
            }
          } else if (p.type === "fixed") {
            // Réduction fixe en centimes
            const couponKey = `sorell_promo_${p.id}`;
            try {
              const existing = await stripe.coupons.retrieve(couponKey);
              promoCouponId = existing.id;
            } catch {
              const coupon = await stripe.coupons.create({
                id: couponKey,
                amount_off: p.value,
                currency: "eur",
                duration: "once",
                name: `Promo Sorell -${(p.value / 100).toFixed(0)}€`,
              });
              promoCouponId = coupon.id;
            }
          }
        }
      }
    }

    // --- Parrainage (seulement si pas de code promo appliqué) ---
    let referralCouponId: string | undefined;
    const { data: referral } = await supabaseAdmin
      .from("referrals")
      .select("id, referrer_id, expires_at")
      .eq("referee_id", userId)
      .eq("status", "pending")
      .maybeSingle();

    if (!promoCouponId && !promoTrialDays && referral && new Date(referral.expires_at) > new Date()) {
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
    const activeCouponId = promoCouponId || referralCouponId;
    const trialDays = promoTrialDays || (activeCouponId ? undefined : 15);

    const sessionParams: Record<string, unknown> = {
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: trialDays,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        referralId: referral?.id || "",
        promoCodeId: promoId || "",
      },
    };

    if (activeCouponId) {
      sessionParams.discounts = [{ coupon: activeCouponId }];
      // Pas de trial standard si coupon appliqué
      (sessionParams.subscription_data as Record<string, unknown>).trial_period_days = undefined;
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    );

    // Enregistrer l'utilisation du code promo
    if (promoId) {
      await supabaseAdmin.from("promo_code_uses").insert({
        promo_code_id: promoId,
        user_id: userId,
      });
      await supabaseAdmin.rpc("increment_promo_uses", { promo_id: promoId });
    }

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
