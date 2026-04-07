import { stripe, PRICE_TO_PLAN } from "@/lib/stripe";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { PaymentFailedEmail } from "@/emails/PaymentFailedEmail";

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

  try {
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
        // Ne PAS downgrader ici — attendre customer.subscription.deleted
        // Envoyer seulement un email d'alerte au client
        try {
          const firstName = profile.full_name?.split(" ")[0] || "";
          const html = await render(PaymentFailedEmail({ firstName }));

          await resend.emails.send({
            from: "Sorell <noreply@sorell.fr>",
            to: profile.email,
            replyTo: "noe@sorell.fr",
            subject: "Problème de paiement \u2014 Action requise",
            html,
            text: `Problème de paiement - Action requise\n\n${firstName ? `Bonjour ${firstName},\n\n` : ""}Votre dernier paiement Sorell a échoué. Veuillez mettre à jour vos informations de paiement pour continuer à profiter de votre abonnement.\n\nhttps://www.sorell.fr/dashboard/profile\n\nSorell - https://www.sorell.fr`,
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
  } catch {
    return NextResponse.json({ error: "Erreur de traitement du webhook." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
