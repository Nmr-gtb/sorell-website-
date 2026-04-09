import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { OnboardingEmail } from "@/emails/OnboardingEmail";
import { TrialReminderEmail } from "@/emails/TrialReminderEmail";
import { LimitReachedEmail } from "@/emails/LimitReachedEmail";
import { FeedbackEmail } from "@/emails/FeedbackEmail";
import { UpsellEmail } from "@/emails/UpsellEmail";
import { AdminAlertEmail } from "@/emails/AdminAlertEmail";
import { logLifecycleEmail } from "@/lib/activity-log";

export const maxDuration = 60;

const resend = new Resend(process.env.RESEND_API_KEY!);

// ─── Types ───────────────────────────────────────────────────────
type EmailType =
  | "onboarding_j1"
  | "trial_j3"
  | "trial_j1"
  | "trial_j0"
  | "limit_reached"
  | "generation_failed"
  | "feedback_j14"
  | "upsell_j28";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  plan: string;
  created_at: string;
  trial_ends_at: string | null;
}

// ─── Auth CRON ───────────────────────────────────────────────────
function verifyCron(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !process.env.CRON_SECRET) return false;
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

// ─── Helper : vérifier si un email lifecycle a déjà été envoyé ──
async function wasAlreadySent(userId: string, emailType: EmailType): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("lifecycle_emails")
    .select("id")
    .eq("user_id", userId)
    .eq("email_type", emailType)
    .maybeSingle();
  return !!data;
}

// ─── Helper : marquer un email comme envoyé ─────────────────────
async function markAsSent(userId: string, emailType: EmailType): Promise<void> {
  await supabaseAdmin
    .from("lifecycle_emails")
    .upsert({ user_id: userId, email_type: emailType, sent_at: new Date().toISOString() });
}

// ─── Helper : envoyer un email et tracker ───────────────────────
async function sendLifecycleEmail(
  userId: string,
  emailType: EmailType,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const alreadySent = await wasAlreadySent(userId, emailType);
    if (alreadySent) return false;

    await resend.emails.send({
      from: "Sorell <noreply@sorell.fr>",
      to,
      replyTo: "noe@sorell.fr",
      subject,
      html,
      text: `${subject}\n\nPour voir ce message, ouvrez-le dans un client email compatible HTML.\n\nSorell - https://www.sorell.fr`,
    });

    await markAsSent(userId, emailType);

    // Activity log
    void logLifecycleEmail(userId, to, emailType);

    return true;
  } catch {
    return false;
  }
}

// ─── Helper : envoyer une alerte admin ──────────────────────────
async function sendAdminAlert(subject: string, html: string): Promise<void> {
  try {
    await resend.emails.send({
      from: "Sorell Alertes <noreply@sorell.fr>",
      to: "noe@sorell.fr",
      replyTo: "noe@sorell.fr",
      subject,
      html,
      text: `${subject}\n\nVoir les détails sur https://www.sorell.fr/admin`,
    });
  } catch {
    // Silently fail - don't crash the CRON
  }
}

// ─── CRON Handler ───────────────────────────────────────────────
export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const results = {
    onboarding_j1: 0,
    trial_j3: 0,
    trial_j1: 0,
    trial_j0: 0,
    limit_reached: 0,
    feedback_j14: 0,
    upsell_j28: 0,
    errors: 0,
  };

  try {
    // ─── 1. Relance onboarding J+1 ───────────────────────────────
    // Utilisateurs inscrits il y a 24-25h sans config newsletter
    const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const { data: recentUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, plan, created_at")
      .gte("created_at", yesterday.toISOString())
      .lte("created_at", dayAgo.toISOString());

    if (recentUsers && recentUsers.length > 0) {
      // Vérifier lesquels n'ont pas de config
      const userIds = recentUsers.map((u: { id: string }) => u.id);
      const { data: configs } = await supabaseAdmin
        .from("newsletter_config")
        .select("user_id, topics")
        .in("user_id", userIds);

      const configuredUserIds = new Set(
        (configs || [])
          .filter((c: { user_id: string; topics: unknown[] | null }) => c.topics && c.topics.length > 0)
          .map((c: { user_id: string }) => c.user_id)
      );

      for (const user of recentUsers) {
        if (!configuredUserIds.has(user.id)) {
          const name = user.full_name || user.email.split("@")[0];
          const subject = `${name}, votre newsletter IA vous attend`;
          const html = await render(OnboardingEmail({ name }));
          const sent = await sendLifecycleEmail(user.id, "onboarding_j1", user.email, subject, html);
          if (sent) results.onboarding_j1++;
        }
      }
    }

    // ─── 2. Emails trial (J-3, J-1, J0) ─────────────────────────
    const { data: trialUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, plan, trial_ends_at")
      .not("trial_ends_at", "is", null)
      .in("plan", ["pro", "business"]);

    if (trialUsers && trialUsers.length > 0) {
      for (const user of trialUsers as Profile[]) {
        if (!user.trial_ends_at) continue;

        const trialEnd = new Date(user.trial_ends_at);
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const name = user.full_name || user.email.split("@")[0];
        const planLabel = user.plan === "pro" ? "Pro" : "Business";

        if (daysLeft === 3) {
          const subject = `Votre essai ${planLabel} se termine dans 3 jours`;
          const html = await render(TrialReminderEmail({ name, plan: planLabel, daysLeft: 3 }));
          const sent = await sendLifecycleEmail(user.id, "trial_j3", user.email, subject, html);
          if (sent) results.trial_j3++;
        } else if (daysLeft === 1) {
          const subject = `Dernier jour d'essai ${planLabel} demain`;
          const html = await render(TrialReminderEmail({ name, plan: planLabel, daysLeft: 1 }));
          const sent = await sendLifecycleEmail(user.id, "trial_j1", user.email, subject, html);
          if (sent) results.trial_j1++;
        } else if (daysLeft <= 0) {
          const subject = `Votre abonnement ${planLabel} est actif`;
          const html = await render(TrialReminderEmail({ name, plan: planLabel, daysLeft: 0 }));
          const sent = await sendLifecycleEmail(user.id, "trial_j0", user.email, subject, html);
          if (sent) results.trial_j0++;

          // Nettoyer trial_ends_at après envoi de J0
          await supabaseAdmin
            .from("profiles")
            .update({ trial_ends_at: null })
            .eq("id", user.id);
        }
      }
    }

    // ─── 3. Limite atteinte ──────────────────────────────────────
    // Vérifier les utilisateurs Free et Pro qui ont atteint leur limite ce mois
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: limitUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, plan")
      .in("plan", ["free", "pro"]);

    if (limitUsers && limitUsers.length > 0) {
      const planLimits: Record<string, number> = { free: 2, pro: 4 };

      for (const user of limitUsers as Profile[]) {
        const limit = planLimits[user.plan];
        if (!limit) continue;

        const { count } = await supabaseAdmin
          .from("newsletters")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .gte("created_at", startOfMonth)
          .not("sent_at", "is", null);

        if (count !== null && count >= limit) {
          const name = user.full_name || user.email.split("@")[0];
          const planLabel = user.plan === "free" ? "Free" : "Pro";
          // On utilise un email_type unique par mois pour ne pas respammer
          const monthKey = `limit_reached_${now.getFullYear()}_${now.getMonth()}` as EmailType;
          const alreadySent = await wasAlreadySent(user.id, monthKey);
          if (!alreadySent) {
            const subject = `Limite atteinte - Passez au plan ${planLabel === "Free" ? "Pro" : "Business"}`;
            const html = await render(LimitReachedEmail({ name, plan: planLabel, limit }));
            try {
              await resend.emails.send({
                from: "Sorell <noreply@sorell.fr>",
                to: user.email,
                replyTo: "noe@sorell.fr",
                subject,
                html,
                text: `${subject}\n\n${name}, vous avez atteint votre limite de newsletters ce mois-ci. Passez au plan supérieur pour continuer.\n\nhttps://www.sorell.fr/tarifs\n\nSorell - https://www.sorell.fr`,
              });
              await markAsSent(user.id, monthKey);
              results.limit_reached++;
            } catch {
              results.errors++;
            }
          }
        }
      }
    }

    // ─── 4. Feedback J+14 ─────────────────────────────────────────
    // Utilisateurs inscrits il y a 14 jours (fenetre 14j-14j1h)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgoPlus1h = new Date(fourteenDaysAgo.getTime() - 60 * 60 * 1000);

    const { data: feedbackUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, plan, created_at")
      .gte("created_at", fourteenDaysAgoPlus1h.toISOString())
      .lte("created_at", fourteenDaysAgo.toISOString());

    if (feedbackUsers && feedbackUsers.length > 0) {
      for (const user of feedbackUsers) {
        const name = user.full_name || user.email.split("@")[0];
        const subject = `${name}, votre avis compte`;
        const html = await render(FeedbackEmail({ name }));
        const sent = await sendLifecycleEmail(user.id, "feedback_j14", user.email, subject, html);
        if (sent) results.feedback_j14++;
      }
    }

    // ─── 5. Upsell J+28 ────────────────────────────────────────────
    // Utilisateurs Free ou Pro inscrits il y a 28 jours (fenetre 28j-28j1h)
    const twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    const twentyEightDaysAgoPlus1h = new Date(twentyEightDaysAgo.getTime() - 60 * 60 * 1000);

    const { data: upsellUsers } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, plan, created_at")
      .gte("created_at", twentyEightDaysAgoPlus1h.toISOString())
      .lte("created_at", twentyEightDaysAgo.toISOString())
      .in("plan", ["free", "pro"]);

    if (upsellUsers && upsellUsers.length > 0) {
      for (const user of upsellUsers) {
        const name = user.full_name || user.email.split("@")[0];
        const subject = `${name}, et si votre veille allait plus loin ?`;
        const html = await render(UpsellEmail({ name, currentPlan: user.plan }));
        const sent = await sendLifecycleEmail(user.id, "upsell_j28", user.email, subject, html);
        if (sent) results.upsell_j28++;
      }
    }

    // ─── 6. Vérifier les échecs de génération récents ────────────
    // Checker si des newsletters ont échoué dans la dernière heure
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const { data: recentNewsletters } = await supabaseAdmin
      .from("newsletters")
      .select("id, user_id, created_at, sent_at")
      .gte("created_at", oneHourAgo)
      .is("sent_at", null);

    if (recentNewsletters && recentNewsletters.length > 3) {
      // Plus de 3 newsletters non envoyées en 1h = alerte
      const ids = recentNewsletters.map((n: { id: string }) => n.id);
      const alertHtml = await render(AdminAlertEmail({ count: recentNewsletters.length, ids }));
      await sendAdminAlert(
        `Alerte Sorell : ${recentNewsletters.length} newsletters non envoyées`,
        alertHtml
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch {
    return NextResponse.json({ error: "Erreur lifecycle" }, { status: 500 });
  }
}
