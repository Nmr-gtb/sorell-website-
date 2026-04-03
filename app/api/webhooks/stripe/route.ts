import { stripe, PRICE_TO_PLAN } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

// Ajouter 15 jours de gratuit au parrain en décalant la date de facturation Stripe
async function rewardReferrer(referrerId: string) {
  try {
    const { data: referrerProfile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", referrerId)
      .maybeSingle();

    if (referrerProfile?.stripe_subscription_id) {
      const sub = await stripe.subscriptions.retrieve(referrerProfile.stripe_subscription_id);
      if (sub.status === "active" || sub.status === "trialing") {
        // current_period_end est sur les items dans Stripe API v2026
        const currentEnd = sub.trial_end || sub.items.data[0]?.current_period_end || Math.floor(Date.now() / 1000);
        const newEnd = currentEnd + (15 * 24 * 60 * 60); // +15 jours en secondes
        await stripe.subscriptions.update(referrerProfile.stripe_subscription_id, {
          trial_end: newEnd,
          proration_behavior: "none",
        });
      }
    }
  } catch {
    // Ne pas faire échouer le webhook si la récompense échoue
  }
}

export async function POST(request: Request) {
  let body: string;
  let sig: string | null;

  try {
    body = await request.text();
    sig = request.headers.get("stripe-signature");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
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

      const updateData: Record<string, unknown> = {
        plan,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      };

      // Stocker la date de fin de trial si applicable
      if (subscription.trial_end) {
        updateData.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString();
      }

      await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      // Traiter le parrainage si présent
      const referralId = session.metadata?.referralId;
      if (referralId) {
        // Marquer le referral comme converti
        const { data: referral } = await supabaseAdmin
          .from("referrals")
          .select("referrer_id")
          .eq("id", referralId)
          .eq("status", "pending")
          .maybeSingle();

        if (referral) {
          await supabaseAdmin
            .from("referrals")
            .update({
              status: "converted",
              converted_at: new Date().toISOString(),
            })
            .eq("id", referralId);

          // Récompenser le parrain (+15 jours gratuits)
          await rewardReferrer(referral.referrer_id);
        }
      }
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
      .maybeSingle();

    if (profile) {
      await supabaseAdmin
        .from("profiles")
        .update({ plan, updated_at: new Date().toISOString() })
        .eq("id", profile.id);
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object;
    const customerId = invoice.customer as string;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (profile) {
      await supabaseAdmin
        .from("profiles")
        .update({ plan: "free", updated_at: new Date().toISOString() })
        .eq("id", profile.id);

      // Envoyer un email de notification de paiement échoué
      try {
        const firstName = profile.full_name?.split(" ")[0] || "";
        const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

        await resend.emails.send({
          from: "Sorell <noe@sorell.fr>",
          to: profile.email,
          subject: "Problème de paiement \u2014 Action requise",
          html: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#005058;padding:32px 40px;text-align:center;">
              <span style="font-size:28px;font-weight:700;color:#ffffff;letter-spacing:1px;">Sorell</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#1a1a1a;">${greeting}</p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#1a1a1a;">Nous n'avons pas pu traiter votre dernier paiement pour votre abonnement Sorell.</p>
              <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:#1a1a1a;">Votre compte a été temporairement basculé vers le plan <strong>Gratuit</strong>. Vos configurations sont conservées, mais certaines fonctionnalités ne sont plus accessibles.</p>
              <p style="margin:0 0 30px;font-size:16px;line-height:1.6;color:#1a1a1a;">Pour retrouver votre abonnement, il vous suffit de mettre à jour votre moyen de paiement :</p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://sorell.fr/dashboard/profile" style="display:inline-block;background-color:#005058;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:6px;">Mettre à jour mon paiement</a>
                  </td>
                </tr>
              </table>
              <p style="margin:30px 0 0;font-size:14px;line-height:1.6;color:#6b7280;">Si vous pensez qu'il s'agit d'une erreur ou si vous avez besoin d'aide, répondez simplement à cet email. Nous sommes là pour vous aider.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;color:#9ca3af;">Sorell - Votre veille sectorielle automatisée</p>
              <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">Cet email a été envoyé automatiquement suite à un problème de paiement.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        });
      } catch {
        // Ne pas faire échouer le webhook si l'envoi d'email échoue
      }
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const customerId = subscription.customer as string;

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (profile) {
      await supabaseAdmin
        .from("profiles")
        .update({ plan: "free", stripe_subscription_id: null, updated_at: new Date().toISOString() })
        .eq("id", profile.id);
    }
  }

  return NextResponse.json({ received: true });
}
