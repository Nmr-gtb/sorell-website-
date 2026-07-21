import { stripe, PRICE_TO_PLAN } from "@/lib/stripe";
import { planForSubscriptionStatus } from "@/lib/price-ids";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { PaymentFailedEmail } from "@/emails/PaymentFailedEmail";
import { logPlanChange, logPaymentFailed, logReferralConverted } from "@/lib/activity-log";
import { notifyAdmin } from "@/lib/admin-notify";

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

  // --- Idempotence : Stripe rejoue un événement tant qu'il n'a pas reçu de 200
  // (timeout, erreur transitoire...). On réserve l'event.id AVANT traitement :
  // si la clé existe déjà, c'est un rejeu → on renvoie 200 sans retraiter (évite
  // double notification, double conversion de parrainage, etc.). En cas d'échec
  // du traitement, la réservation est libérée (catch) pour permettre le rejeu.
  const { error: claimError } = await supabaseAdmin
    .from("stripe_webhook_events")
    .insert({ id: event.id, type: event.type });
  if (claimError) {
    if (claimError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Impossible de réserver (infra dédup indisponible) : on log et on continue
    // plutôt que de bloquer un événement de paiement légitime.
    console.error("[stripe webhook] claim failed", claimError);
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
          stripe_subscription_status: subscription.status,
          updated_at: new Date().toISOString(),
        };

        // Stocker la date de fin de trial si applicable
        if (subscription.trial_end) {
          updateData.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString();
        }

        // Vérifier .error : si l'update échoue, throw pour renvoyer 500 et
        // laisser Stripe rejouer l'événement (sinon plan désynchronisé en silence).
        const { error: updErr } = await supabaseAdmin
          .from("profiles")
          .update(updateData)
          .eq("id", userId);
        if (updErr) throw new Error("profiles update failed (checkout.completed)");

        // Activity log
        const { data: subscriberProfile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, email")
          .eq("id", userId)
          .maybeSingle();

        if (subscriberProfile) {
          void logPlanChange(userId, subscriberProfile.email || "", "free", plan);

          // Notifier Noé par email (même modèle que la notif d'inscription).
          // notifyAdmin est best-effort et ne throw jamais.
          const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
          const trialEnd = subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toLocaleDateString("fr-FR")
            : null;
          await notifyAdmin({
            subject: `Nouvel abonnement ${planLabel} - ${subscriberProfile.email}`,
            title: "Nouvel abonnement payant sur Sorell",
            rows: [
              ["Nom", subscriberProfile.full_name || "Non renseigné"],
              ["Email", subscriberProfile.email || ""],
              ["Plan", planLabel],
              ...(trialEnd ? [["Fin du trial", trialEnd] as [string, string]] : []),
            ],
          });
        }

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

            // Activity log - referral converted
            if (subscriberProfile) {
              void logReferralConverted(referral.referrer_id, "", subscriberProfile.email || "");
            }
          }
        }
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const priceId = subscription.items.data[0]?.price.id;
      // Le plan effectif dépend du STATUT, pas seulement du prix : premium
      // conservé pendant la relance Stripe (past_due), coupé dès que Stripe
      // passe l'abonnement en unpaid/canceled/paused (états où aucun
      // customer.subscription.deleted n'arrivera forcément).
      const plan = planForSubscriptionStatus(subscription.status, priceId);
      const customerId = subscription.customer as string;

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, email, plan")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (profile) {
        const { error: updErr } = await supabaseAdmin
          .from("profiles")
          .update({
            plan,
            stripe_subscription_status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.id);
        if (updErr) throw new Error("profiles update failed (subscription.updated)");

        // Notifier Noé quand une résiliation est programmée ou annulée depuis
        // le portail Stripe. Deux formes selon le contexte : bascule du booléen
        // cancel_at_period_end, OU pose d'une date cancel_at (cas observé en
        // prod le 13/07/2026 : portail sur un abonnement en TRIAL -> cancel_at
        // = fin du trial, cancel_at_period_end reste false). On ne notifie que
        // sur la TRANSITION (présence d'un des champs dans previous_attributes),
        // pas à chaque subscription.updated (renouvellements, etc.).
        const prev = event.data.previous_attributes;
        if (prev && ("cancel_at_period_end" in prev || "cancel_at" in prev)) {
          const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
          const cancellationScheduled =
            subscription.cancel_at_period_end || subscription.cancel_at != null;
          if (cancellationScheduled) {
            const endTimestamp =
              subscription.cancel_at || subscription.items.data[0]?.current_period_end;
            const accessEnd = endTimestamp
              ? new Date(endTimestamp * 1000).toLocaleDateString("fr-FR")
              : "inconnue";
            // Le motif saisi dans le portail est l'info la plus précieuse
            const details = subscription.cancellation_details;
            const motifRows: Array<[string, string]> = [];
            if (details?.feedback) motifRows.push(["Motif", details.feedback]);
            if (details?.comment) motifRows.push(["Commentaire", details.comment]);
            await notifyAdmin({
              subject: `Résiliation programmée - ${profile.email}`,
              title: "Un abonné a programmé sa résiliation",
              rows: [
                ["Email", profile.email || ""],
                ["Plan", planLabel],
                ["Fin d'accès", accessEnd],
                ...motifRows,
              ],
            });
          } else {
            await notifyAdmin({
              subject: `Résiliation annulée - ${profile.email}`,
              title: "Un abonné a annulé sa résiliation",
              rows: [
                ["Email", profile.email || ""],
                ["Plan", planLabel],
              ],
            });
          }
        }
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

        // Activity log
        void logPaymentFailed(profile.id, profile.email, `invoice ${invoice.id}`);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = subscription.customer as string;

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, email, plan")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();

      if (profile) {
        const { error: updErr } = await supabaseAdmin
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null, stripe_subscription_status: "canceled", updated_at: new Date().toISOString() })
          .eq("id", profile.id);
        if (updErr) throw new Error("profiles update failed (subscription.deleted)");

        // Notifier Noé : l'abonnement est terminé (fin de période après
        // résiliation, impayé définitif, ou annulation immédiate).
        const previousPlan = profile.plan
          ? profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)
          : "Inconnu";
        await notifyAdmin({
          subject: `Abonnement terminé - ${profile.email}`,
          title: "Un abonnement payant est terminé",
          rows: [
            ["Email", profile.email || ""],
            ["Ancien plan", previousPlan],
            ["Nouveau plan", "Free"],
          ],
        });
      }
    }
  } catch {
    // Le traitement a échoué : libérer la réservation pour que le rejeu Stripe
    // puisse retraiter l'événement (sinon il serait ignoré comme un doublon).
    await supabaseAdmin.from("stripe_webhook_events").delete().eq("id", event.id);
    return NextResponse.json({ error: "Erreur de traitement du webhook." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
