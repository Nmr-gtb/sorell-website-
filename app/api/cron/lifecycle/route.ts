import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { VerifyReminderEmail } from "@/emails/VerifyReminderEmail";
import { ConfigReminderEmail } from "@/emails/ConfigReminderEmail";
import { EngagementFeedbackEmail } from "@/emails/EngagementFeedbackEmail";
import { TrialReminderEmail } from "@/emails/TrialReminderEmail";
import { LimitReachedEmail } from "@/emails/LimitReachedEmail";
import { RetentionInactiveEmail } from "@/emails/RetentionInactiveEmail";
import { RetentionUnopenedEmail } from "@/emails/RetentionUnopenedEmail";
import { AdminAlertEmail } from "@/emails/AdminAlertEmail";
import { logLifecycleEmail } from "@/lib/activity-log";

export const maxDuration = 60;

// Pause manuelle des relances lifecycle. Repasser a false pour reactiver.
// L'email de bienvenue (WelcomeEmail) n'est PAS concerne, il est envoye via
// /api/welcome-email, hors de ce cron.
const LIFECYCLE_EMAILS_PAUSED = true;

const resend = new Resend(process.env.RESEND_API_KEY!);

// ─── Types ───────────────────────────────────────────────────────
// Note : conversion_limit_reached, retention_no_newsletter_30d et
// retention_unopened_5nl utilisent une cle mensuelle dynamique (suffixe
// _YYYY_M) pour autoriser un re-envoi mensuel sans toucher a la contrainte
// UNIQUE(user_id, email_type) de lifecycle_emails.
type EmailType =
  | "activation_no_verify"
  | "activation_no_config"
  | "engagement_after_3nl"
  | "conversion_limit_reached"
  | "trial_j3"
  | "trial_j1"
  | "trial_j0"
  | "retention_no_newsletter_30d"
  | "retention_unopened_5nl"
  | string;

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  plan: string;
  trial_ends_at: string | null;
}

// ─── Auth CRON ───────────────────────────────────────────────────
function verifyCron(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !process.env.CRON_SECRET) return false;
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

// ─── Helpers tracking lifecycle ─────────────────────────────────
async function wasAlreadySent(
  userId: string,
  emailType: EmailType
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("lifecycle_emails")
    .select("id")
    .eq("user_id", userId)
    .eq("email_type", emailType)
    .maybeSingle();
  return !!data;
}

async function markAsSent(
  userId: string,
  emailType: EmailType
): Promise<void> {
  await supabaseAdmin
    .from("lifecycle_emails")
    .upsert({
      user_id: userId,
      email_type: emailType,
      sent_at: new Date().toISOString(),
    });
}

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
    void logLifecycleEmail(userId, to, emailType);

    return true;
  } catch {
    return false;
  }
}

async function sendAdminAlert(subject: string, html: string): Promise<void> {
  try {
    await resend.emails.send({
      from: "Sorell Alertes <noreply@sorell.fr>",
      to: "noe@sorell.fr",
      replyTo: "noe@sorell.fr",
      subject,
      html,
      text: `${subject}\n\nVoir les details sur https://www.sorell.fr/admin`,
    });
  } catch {
    // Silently fail - don't crash the CRON
  }
}

// ─── Helper : cle mensuelle pour les emails autorisant un re-envoi ──
function monthlyKey(base: string, now: Date): string {
  return `${base}_${now.getFullYear()}_${now.getMonth()}`;
}

// ─── Helper : nom d'affichage a partir du profil ────────────────
function displayName(profile: { email: string; full_name: string | null }): string {
  if (profile.full_name && profile.full_name.trim().length > 0) {
    return profile.full_name.trim();
  }
  return profile.email.split("@")[0];
}

// ─── CRON Handler ───────────────────────────────────────────────
export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (LIFECYCLE_EMAILS_PAUSED) {
    return NextResponse.json({
      success: true,
      paused: true,
      message: "Relances lifecycle en pause - aucun email envoyé",
      timestamp: new Date().toISOString(),
    });
  }

  const now = new Date();
  const results = {
    activation_no_verify: 0,
    activation_no_config: 0,
    engagement_after_3nl: 0,
    conversion_limit_reached: 0,
    trial_j3: 0,
    trial_j1: 0,
    trial_j0: 0,
    retention_no_newsletter_30d: 0,
    retention_unopened_5nl: 0,
    errors: 0,
  };

  try {
    // ═══════════════════════════════════════════════════════════════
    // BLOC 1 - ACTIVATION
    // ═══════════════════════════════════════════════════════════════

    // 1.1 activation_no_verify
    // Users inscrits il y a 24h-25h et qui n'ont toujours pas verifie.
    {
      const lower = new Date(now.getTime() - 25 * 60 * 60 * 1000);
      const upper = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const { data: unverified } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name")
        .eq("email_verified", false)
        .gte("created_at", lower.toISOString())
        .lte("created_at", upper.toISOString());

      for (const user of unverified || []) {
        const name = displayName(user);
        const subject = "Confirmez votre email pour activer Sorell";
        const html = await render(VerifyReminderEmail({ name }));
        const sent = await sendLifecycleEmail(
          user.id,
          "activation_no_verify",
          user.email,
          subject,
          html
        );
        if (sent) results.activation_no_verify++;
      }
    }

    // 1.2 activation_no_config
    // Users dont l'email a ete verifie il y a 48h-49h et qui n'ont
    // toujours pas de config newsletter avec des topics.
    {
      const lower = new Date(now.getTime() - 49 * 60 * 60 * 1000);
      const upper = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      const { data: verified } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name")
        .eq("email_verified", true)
        .gte("email_verified_at", lower.toISOString())
        .lte("email_verified_at", upper.toISOString());

      if (verified && verified.length > 0) {
        const userIds = verified.map((u: { id: string }) => u.id);
        const { data: configs } = await supabaseAdmin
          .from("newsletter_config")
          .select("user_id, topics")
          .in("user_id", userIds);

        const configuredUserIds = new Set(
          (configs || [])
            .filter(
              (c: { user_id: string; topics: unknown[] | null }) =>
                Array.isArray(c.topics) && c.topics.length > 0
            )
            .map((c: { user_id: string }) => c.user_id)
        );

        for (const user of verified) {
          if (configuredUserIds.has(user.id)) continue;

          const name = displayName(user);
          const subject = `${name}, votre premiere newsletter en 5 minutes`;
          const html = await render(ConfigReminderEmail({ name }));
          const sent = await sendLifecycleEmail(
            user.id,
            "activation_no_config",
            user.email,
            subject,
            html
          );
          if (sent) results.activation_no_config++;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // BLOC 2 - ENGAGEMENT
    // ═══════════════════════════════════════════════════════════════

    // 2.1 engagement_after_3nl
    // Users qui ont recu leur 3eme newsletter dans les 24 dernieres heures.
    // On evite le full scan en ne regardant que les destinataires d'envois
    // recents.
    {
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const { data: recentSends } = await supabaseAdmin
        .from("newsletters")
        .select("user_id")
        .gte("sent_at", oneDayAgo.toISOString())
        .not("sent_at", "is", null);

      const candidateIds = Array.from(
        new Set(
          (recentSends || []).map((n: { user_id: string }) => n.user_id)
        )
      );

      if (candidateIds.length > 0) {
        const { data: candidates } = await supabaseAdmin
          .from("profiles")
          .select("id, email, full_name")
          .in("id", candidateIds);

        for (const user of candidates || []) {
          const { count } = await supabaseAdmin
            .from("newsletters")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .not("sent_at", "is", null);

          if (count !== null && count >= 3) {
            const name = displayName(user);
            const subject = `${name}, 3 newsletters reçues - votre avis nous intéresse`;
            const html = await render(EngagementFeedbackEmail({ name }));
            const sent = await sendLifecycleEmail(
              user.id,
              "engagement_after_3nl",
              user.email,
              subject,
              html
            );
            if (sent) results.engagement_after_3nl++;
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // BLOC 3 - CONVERSION
    // ═══════════════════════════════════════════════════════════════

    // 3.1 conversion_limit_reached
    // Free (limit=1) et Pro (limit=4) qui ont atteint leur quota mensuel.
    // Cle mensuelle pour autoriser une relance par mois si le user reste
    // dans le meme plan.
    {
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();

      const { data: limitCandidates } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, plan")
        .in("plan", ["free", "pro"]);

      if (limitCandidates && limitCandidates.length > 0) {
        const planLimits: Record<string, number> = { free: 1, pro: 4 };

        for (const user of limitCandidates as Profile[]) {
          const limit = planLimits[user.plan];
          if (!limit) continue;

          const { count } = await supabaseAdmin
            .from("newsletters")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("created_at", startOfMonth)
            .not("sent_at", "is", null);

          if (count === null || count < limit) continue;

          const name = displayName(user);
          const planLabel = user.plan === "free" ? "Free" : "Pro";
          const nextPlan = user.plan === "free" ? "Pro" : "Business";
          const subject =
            limit === 1
              ? "Vous avez utilisé votre newsletter du mois"
              : `Vous avez utilisé vos ${limit} newsletters du mois`;
          const html = await render(
            LimitReachedEmail({ name, plan: planLabel, limit })
          );

          const key = monthlyKey("conversion_limit_reached", now);
          const sent = await sendLifecycleEmail(
            user.id,
            key,
            user.email,
            subject,
            html
          );
          if (sent) results.conversion_limit_reached++;

          // nextPlan non utilise dans le sujet mais conserve si on veut
          // l'inclure plus tard.
          void nextPlan;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // BLOC 4 - TRIAL (transactionnel)
    // ═══════════════════════════════════════════════════════════════

    // 4.1 / 4.2 / 4.3 trial_j3, trial_j1, trial_j0
    {
      const { data: trialUsers } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name, plan, trial_ends_at")
        .not("trial_ends_at", "is", null)
        .in("plan", ["pro", "business"]);

      for (const user of (trialUsers || []) as Profile[]) {
        if (!user.trial_ends_at) continue;

        const trialEnd = new Date(user.trial_ends_at);
        const daysLeft = Math.ceil(
          (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const name = displayName(user);
        const planLabel = user.plan === "pro" ? "Pro" : "Business";

        if (daysLeft === 3) {
          const subject = `Plus que 3 jours d'essai ${planLabel}`;
          const html = await render(
            TrialReminderEmail({ name, plan: planLabel, daysLeft: 3 })
          );
          const sent = await sendLifecycleEmail(
            user.id,
            "trial_j3",
            user.email,
            subject,
            html
          );
          if (sent) results.trial_j3++;
        } else if (daysLeft === 1) {
          const subject = `Votre essai ${planLabel} se termine demain`;
          const html = await render(
            TrialReminderEmail({ name, plan: planLabel, daysLeft: 1 })
          );
          const sent = await sendLifecycleEmail(
            user.id,
            "trial_j1",
            user.email,
            subject,
            html
          );
          if (sent) results.trial_j1++;
        } else if (daysLeft <= 0) {
          const subject = `Bienvenue dans le plan ${planLabel}`;
          const html = await render(
            TrialReminderEmail({ name, plan: planLabel, daysLeft: 0 })
          );
          const sent = await sendLifecycleEmail(
            user.id,
            "trial_j0",
            user.email,
            subject,
            html
          );
          if (sent) results.trial_j0++;

          // Nettoyer trial_ends_at apres envoi de J0 pour eviter
          // de redeclencher les emails trial sur ce profil.
          await supabaseAdmin
            .from("profiles")
            .update({ trial_ends_at: null })
            .eq("id", user.id);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // BLOC 5 - RETENTION
    // ═══════════════════════════════════════════════════════════════

    // 5.1 retention_no_newsletter_30d
    // Users dont la derniere newsletter date d'il y a 30-31 jours
    // (fenetre d'1 jour pour eviter les envois quotidiens).
    // Cle mensuelle pour autoriser un re-envoi si l'inactivite persiste
    // sur plusieurs mois.
    {
      const thirtyDaysAgo = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      );
      const thirtyOneDaysAgo = new Date(
        now.getTime() - 31 * 24 * 60 * 60 * 1000
      );

      // Recuperer les user_ids dont une newsletter a ete envoyee dans
      // la fenetre [J-31, J-30].
      const { data: oldSends } = await supabaseAdmin
        .from("newsletters")
        .select("user_id, sent_at")
        .gte("sent_at", thirtyOneDaysAgo.toISOString())
        .lte("sent_at", thirtyDaysAgo.toISOString())
        .not("sent_at", "is", null);

      const candidateIds = Array.from(
        new Set(
          (oldSends || []).map((n: { user_id: string }) => n.user_id)
        )
      );

      for (const userId of candidateIds) {
        // Verifier que c'est bien leur DERNIERE newsletter
        // (sinon ils n'ont pas 30j d'inactivite).
        const { data: latest } = await supabaseAdmin
          .from("newsletters")
          .select("sent_at")
          .eq("user_id", userId)
          .not("sent_at", "is", null)
          .order("sent_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!latest?.sent_at) continue;
        const lastSent = new Date(latest.sent_at);
        if (lastSent > thirtyDaysAgo) continue;
        if (lastSent < thirtyOneDaysAgo) continue;

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, email, full_name")
          .eq("id", userId)
          .maybeSingle();

        if (!profile) continue;

        const name = displayName(profile);
        const subject = `${name}, votre veille Sorell s'est arrêtée`;
        const html = await render(RetentionInactiveEmail({ name }));
        const key = monthlyKey("retention_no_newsletter_30d", now);
        const sent = await sendLifecycleEmail(
          profile.id,
          key,
          profile.email,
          subject,
          html
        );
        if (sent) results.retention_no_newsletter_30d++;
      }
    }

    // 5.2 retention_unopened_5nl
    // Users dont les 5 dernieres newsletters n'ont aucune ouverture
    // par eux-memes (recipient_email = profile.email).
    // Cle mensuelle pour autoriser un re-envoi mensuel si la situation
    // perdure (cooldown de fait).
    {
      // Pour limiter le scope, on ne considere que les users qui ont
      // recu une newsletter dans les 7 derniers jours (sinon ils sont
      // traites par retention_no_newsletter_30d).
      const sevenDaysAgo = new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
      );

      const { data: activeSends } = await supabaseAdmin
        .from("newsletters")
        .select("user_id")
        .gte("sent_at", sevenDaysAgo.toISOString())
        .not("sent_at", "is", null);

      const activeUserIds = Array.from(
        new Set(
          (activeSends || []).map((n: { user_id: string }) => n.user_id)
        )
      );

      for (const userId of activeUserIds) {
        // Recuperer le profil + email
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, email, full_name")
          .eq("id", userId)
          .maybeSingle();

        if (!profile?.email) continue;

        // Recuperer les 5 dernieres newsletters envoyees
        const { data: last5 } = await supabaseAdmin
          .from("newsletters")
          .select("id, sent_at")
          .eq("user_id", userId)
          .not("sent_at", "is", null)
          .order("sent_at", { ascending: false })
          .limit(5);

        if (!last5 || last5.length < 5) continue;

        const nlIds = last5.map((n: { id: string }) => n.id);

        // Compter les opens du proprietaire sur ces 5 newsletters
        const { count: openCount } = await supabaseAdmin
          .from("newsletter_events")
          .select("id", { count: "exact", head: true })
          .in("newsletter_id", nlIds)
          .eq("recipient_email", profile.email)
          .eq("event_type", "opened");

        if (openCount !== null && openCount === 0) {
          const name = displayName(profile);
          const subject =
            "Vos newsletters Sorell vous intéressent-elles encore ?";
          const html = await render(RetentionUnopenedEmail({ name }));
          const key = monthlyKey("retention_unopened_5nl", now);
          const sent = await sendLifecycleEmail(
            profile.id,
            key,
            profile.email,
            subject,
            html
          );
          if (sent) results.retention_unopened_5nl++;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // SUPERVISION - Alerte admin si trop d'echecs de generation
    // ═══════════════════════════════════════════════════════════════
    {
      const oneHourAgo = new Date(
        now.getTime() - 60 * 60 * 1000
      ).toISOString();
      const { data: recentNewsletters } = await supabaseAdmin
        .from("newsletters")
        .select("id, user_id, created_at, sent_at")
        .gte("created_at", oneHourAgo)
        .is("sent_at", null);

      if (recentNewsletters && recentNewsletters.length > 3) {
        const ids = recentNewsletters.map((n: { id: string }) => n.id);
        const alertHtml = await render(
          AdminAlertEmail({ count: recentNewsletters.length, ids })
        );
        await sendAdminAlert(
          `Alerte Sorell : ${recentNewsletters.length} newsletters non envoyées`,
          alertHtml
        );
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch {
    return NextResponse.json(
      { error: "Erreur lifecycle" },
      { status: 500 }
    );
  }
}
