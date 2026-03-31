import { NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase-admin";

const resend = new Resend(process.env.RESEND_API_KEY!);

// ─── Types ───────────────────────────────────────────────────────
type EmailType =
  | "onboarding_j1"
  | "trial_j3"
  | "trial_j1"
  | "trial_j0"
  | "limit_reached"
  | "generation_failed";

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
      from: "Sorell <noe@sorell.fr>",
      to,
      replyTo: "noe@sorell.fr",
      subject,
      html,
    });

    await markAsSent(userId, emailType);
    return true;
  } catch {
    return false;
  }
}

// ─── Helper : envoyer une alerte admin ──────────────────────────
async function sendAdminAlert(subject: string, html: string): Promise<void> {
  try {
    await resend.emails.send({
      from: "Sorell Alertes <noe@sorell.fr>",
      to: "noe@sorell.fr",
      subject,
      html,
    });
  } catch {
    // Silently fail - don't crash the CRON
  }
}

// ─── Email wrapper HTML ─────────────────────────────────────────
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;">
    <div style="padding:28px 32px;border-bottom:2px solid #005058;">
      <span style="font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.02em;">Sorel<span style="color:#005058;">l</span></span>
    </div>
    ${content}
    <div style="padding:24px 32px;border-top:2px solid #E5E7EB;background:#F9FAFB;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td><span style="font-size:14px;font-weight:700;color:#111827;letter-spacing:-0.01em;">Sorel<span style="color:#005058;">l</span></span></td>
          <td align="right"><a href="https://sorell.fr" style="font-size:12px;color:#005058;text-decoration:none;">sorell.fr</a></td>
        </tr>
      </table>
      <p style="font-size:11px;color:#9CA3AF;margin:12px 0 0;line-height:1.5;">
        Vous recevez cet email car vous avez un compte sur Sorell.<br/>
        <a href="mailto:noe@sorell.fr" style="color:#9CA3AF;">Besoin d'aide ? Contactez-nous</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Templates ──────────────────────────────────────────────────

function templateOnboardingJ1(name: string): { subject: string; html: string } {
  return {
    subject: `${name}, votre newsletter IA vous attend`,
    html: emailWrapper(`
    <div style="padding:40px 32px 24px;">
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 12px;">Vous y êtes presque, ${name} !</h1>
      <p style="font-size:15px;color:#4B5563;line-height:1.65;margin:0 0 24px;">
        Vous avez créé votre compte Sorell hier, mais votre première newsletter n'a pas encore été configurée.
      </p>
      <p style="font-size:15px;color:#4B5563;line-height:1.65;margin:0 0 24px;">
        En <strong>5 minutes</strong>, vous pouvez recevoir automatiquement une veille sectorielle personnalisée, générée par IA à partir de vraies actualités du web.
      </p>
    </div>
    <div style="padding:0 32px 20px;">
      <div style="background:#F0FDFA;border-radius:8px;padding:20px;border:1px solid #CCFBF1;">
        <p style="font-size:14px;color:#115E59;line-height:1.6;margin:0;">
          <strong>3 étapes rapides :</strong><br/>
          1. Décrivez votre activité (votre brief)<br/>
          2. Choisissez vos thématiques<br/>
          3. Cliquez sur "Générer"
        </p>
      </div>
    </div>
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard/config" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
        Configurer ma newsletter →
      </a>
    </div>`),
  };
}

function templateTrialJ3(name: string, plan: string): { subject: string; html: string } {
  return {
    subject: `Votre essai ${plan} se termine dans 3 jours`,
    html: emailWrapper(`
    <div style="padding:40px 32px 24px;">
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 12px;">Plus que 3 jours d'essai, ${name}</h1>
      <p style="font-size:15px;color:#4B5563;line-height:1.65;margin:0 0 24px;">
        Votre essai gratuit du plan <strong>${plan}</strong> se termine dans 3 jours. Pour continuer à profiter de toutes les fonctionnalités, aucune action n'est requise - votre abonnement démarrera automatiquement.
      </p>
    </div>
    <div style="padding:0 32px 20px;">
      <div style="background:#FEF3C7;border-radius:8px;padding:20px;border:1px solid #FDE68A;">
        <p style="font-size:14px;color:#92400E;line-height:1.6;margin:0;">
          <strong>Ce que vous gardez avec ${plan} :</strong><br/>
          ${plan === "Pro" ? "• 4 newsletters/mois • 5 destinataires • Analytics complets • Sources custom" : "• Newsletters illimitées • 25 destinataires • Analytics complets • Logo personnalisé"}
        </p>
      </div>
    </div>
    <div style="padding:0 32px 20px;">
      <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0;">
        Si vous ne souhaitez pas continuer, vous pouvez annuler depuis votre <a href="https://sorell.fr/dashboard/profile" style="color:#005058;text-decoration:underline;">profil</a> avant la fin de l'essai. Vous passerez alors au plan Free.
      </p>
    </div>
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
        Accéder à mon dashboard →
      </a>
    </div>`),
  };
}

function templateTrialJ1(name: string, plan: string): { subject: string; html: string } {
  return {
    subject: `Dernier jour d'essai ${plan} demain`,
    html: emailWrapper(`
    <div style="padding:40px 32px 24px;">
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 12px;">Dernier jour d'essai demain, ${name}</h1>
      <p style="font-size:15px;color:#4B5563;line-height:1.65;margin:0 0 24px;">
        Votre essai du plan <strong>${plan}</strong> se termine demain. Votre abonnement commencera automatiquement - aucune interruption de service.
      </p>
      <p style="font-size:15px;color:#4B5563;line-height:1.65;margin:0 0 24px;">
        Pour annuler avant le premier paiement, rendez-vous sur votre <a href="https://sorell.fr/dashboard/profile" style="color:#005058;text-decoration:underline;">profil</a>.
      </p>
    </div>
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard/profile" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
        Gérer mon abonnement →
      </a>
    </div>`),
  };
}

function templateTrialJ0(name: string, plan: string): { subject: string; html: string } {
  return {
    subject: `Votre essai ${plan} est terminé`,
    html: emailWrapper(`
    <div style="padding:40px 32px 24px;">
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 12px;">Votre essai est terminé, ${name}</h1>
      <p style="font-size:15px;color:#4B5563;line-height:1.65;margin:0 0 24px;">
        Votre période d'essai du plan <strong>${plan}</strong> vient de se terminer. Si votre moyen de paiement est valide, votre abonnement est désormais actif. Bienvenue parmi nos utilisateurs ${plan} !
      </p>
    </div>
    <div style="padding:0 32px 20px;">
      <div style="background:#F0FDFA;border-radius:8px;padding:20px;border:1px solid #CCFBF1;">
        <p style="font-size:14px;color:#115E59;line-height:1.6;margin:0;">
          <strong>Astuce :</strong> Profitez de toutes les fonctionnalités de votre plan ${plan}. Configurez vos sources, ajoutez des destinataires, et explorez vos analytics.
        </p>
      </div>
    </div>
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
        Mon dashboard →
      </a>
    </div>`),
  };
}

function templateLimitReached(name: string, plan: string, limit: number): { subject: string; html: string } {
  return {
    subject: `Limite de newsletters atteinte - Passez au niveau supérieur`,
    html: emailWrapper(`
    <div style="padding:40px 32px 24px;">
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 12px;">Vous avez atteint votre limite, ${name}</h1>
      <p style="font-size:15px;color:#4B5563;line-height:1.65;margin:0 0 24px;">
        Vous avez utilisé vos <strong>${limit} newsletters</strong> du mois sur le plan <strong>${plan}</strong>. Votre prochaine newsletter sera disponible le mois prochain.
      </p>
    </div>
    <div style="padding:0 32px 20px;">
      <div style="background:#F0FDFA;border-radius:8px;padding:20px;border:1px solid #CCFBF1;">
        <p style="font-size:14px;color:#115E59;line-height:1.6;margin:0;">
          <strong>Besoin de plus ?</strong> Passez au plan supérieur pour envoyer plus de newsletters chaque mois.<br/><br/>
          ${plan === "Free" ? "• <strong>Pro</strong> (19€/mois) : 4 newsletters/mois, 5 destinataires, analytics" : "• <strong>Business</strong> (49€/mois) : newsletters illimitées, 25 destinataires, logo custom"}
        </p>
      </div>
    </div>
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="https://sorell.fr/tarifs" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
        Voir les plans →
      </a>
    </div>`),
  };
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
          const { subject, html } = templateOnboardingJ1(name);
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
          const { subject, html } = templateTrialJ3(name, planLabel);
          const sent = await sendLifecycleEmail(user.id, "trial_j3", user.email, subject, html);
          if (sent) results.trial_j3++;
        } else if (daysLeft === 1) {
          const { subject, html } = templateTrialJ1(name, planLabel);
          const sent = await sendLifecycleEmail(user.id, "trial_j1", user.email, subject, html);
          if (sent) results.trial_j1++;
        } else if (daysLeft <= 0) {
          const { subject, html } = templateTrialJ0(name, planLabel);
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
            const { subject, html } = templateLimitReached(name, planLabel, limit);
            try {
              await resend.emails.send({
                from: "Sorell <noe@sorell.fr>",
                to: user.email,
                replyTo: "noe@sorell.fr",
                subject,
                html,
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

    // ─── 4. Vérifier les échecs de génération récents ────────────
    // Checker si des newsletters ont échoué dans la dernière heure
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const { data: recentNewsletters } = await supabaseAdmin
      .from("newsletters")
      .select("id, user_id, created_at, sent_at")
      .gte("created_at", oneHourAgo)
      .is("sent_at", null);

    if (recentNewsletters && recentNewsletters.length > 3) {
      // Plus de 3 newsletters non envoyées en 1h = alerte
      await sendAdminAlert(
        `⚠️ Alerte Sorell : ${recentNewsletters.length} newsletters non envoyées`,
        emailWrapper(`
        <div style="padding:40px 32px 24px;">
          <h1 style="font-size:24px;font-weight:700;color:#DC2626;margin:0 0 12px;">Alerte : échecs de génération</h1>
          <p style="font-size:15px;color:#4B5563;line-height:1.65;margin:0 0 24px;">
            <strong>${recentNewsletters.length} newsletters</strong> ont été créées dans la dernière heure mais n'ont pas été envoyées. Cela peut indiquer un problème avec l'API Claude, Resend, ou le CRON principal.
          </p>
          <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0;">
            IDs concernés : ${recentNewsletters.slice(0, 10).map((n: { id: string }) => n.id).join(", ")}
          </p>
        </div>`)
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
