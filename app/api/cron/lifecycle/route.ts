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

// ─── Email wrapper HTML (DA Newsletter Sorell V4) ──────────────
function emailWrapper(content: string, preheader?: string): string {
  const warmBorder = "#E8E0D8";
  const warmBg = "#F5F0EB";
  const secondaryText = "#7A7267";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:${warmBg};font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}${"&nbsp;&zwnj;".repeat(20)}</div>` : ""}
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;">
    <div style="padding:20px 32px;border-bottom:1px solid ${warmBorder};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:36px;">
            <img src="https://www.sorell.fr/icone.png" alt="S." style="width:32px;height:32px;" />
          </td>
          <td align="right">
            <a href="https://sorell.fr" style="font-size:12px;color:#005058;text-decoration:none;">sorell.fr</a>
          </td>
        </tr>
      </table>
    </div>
    ${content}
    <div style="padding:22px 32px;border-top:1px solid ${warmBorder};background:${warmBg};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:32px;">
            <img src="https://www.sorell.fr/icone.png" alt="S." style="width:24px;height:24px;" />
          </td>
          <td align="right">
            <a href="https://sorell.fr" style="font-size:12px;color:#005058;text-decoration:none;">sorell.fr</a>
          </td>
        </tr>
      </table>
      <p style="font-size:11px;color:${secondaryText};margin:14px 0 0;line-height:1.5;">
        Vous recevez cet email car vous avez un compte sur Sorell.<br/>
        <a href="mailto:noe@sorell.fr" style="color:${secondaryText};">Besoin d'aide ? Repondez a cet email</a>
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
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Votre compte Sorell</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Votre veille sectorielle vous attend, ${name}</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;">
            <div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">
        Votre compte a ete cree hier, mais votre premiere newsletter n'est pas encore configuree.
      </p>
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">
        En <strong>5 minutes</strong>, Sorell peut vous envoyer automatiquement une veille sectorielle personnalisee, generee par IA a partir de vraies actualites du web.
      </p>
    </div>
    <div style="padding:0 32px 24px;">
      <div style="border:1px solid #E8E0D8;border-radius:10px;padding:24px;">
        <p style="font-size:11px;color:#7A7267;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;font-weight:600;">3 etapes rapides</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:0 0 10px;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#005058;color:#FFFFFF;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">1</span><span style="font-size:14px;color:#111827;">Decrivez votre activite (votre brief)</span></td>
          </tr>
          <tr>
            <td style="padding:0 0 10px;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#005058;color:#FFFFFF;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">2</span><span style="font-size:14px;color:#111827;">Choisissez vos thematiques</span></td>
          </tr>
          <tr>
            <td style="padding:0;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#005058;color:#FFFFFF;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">3</span><span style="font-size:14px;color:#111827;">Cliquez sur "Generer"</span></td>
          </tr>
        </table>
      </div>
    </div>
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard/config" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
        Configurer ma newsletter &rarr;
      </a>
    </div>`, `${name}, configurez votre newsletter IA en 5 minutes`),
  };
}

function templateTrialJ3(name: string, plan: string): { subject: string; html: string } {
  return {
    subject: `Votre essai ${plan} se termine dans 3 jours`,
    html: emailWrapper(`
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Votre essai ${plan}</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Plus que 3 jours d'essai, ${name}</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;">
            <div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">
        Votre essai gratuit du plan <strong>${plan}</strong> se termine dans 3 jours. Pour continuer, aucune action requise - votre abonnement demarrera automatiquement.
      </p>
    </div>
    <div style="padding:0 32px 24px;">
      <div style="border:1px solid #E8E0D8;border-radius:10px;padding:24px;">
        <p style="font-size:11px;color:#7A7267;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;font-weight:600;">Ce que vous gardez avec ${plan}</p>
        <p style="font-size:14px;color:#111827;line-height:1.7;margin:0;">
          ${plan === "Pro" ? "&#8226; 4 newsletters/mois &#8226; 5 destinataires &#8226; Analytics complets &#8226; Sources custom" : "&#8226; Newsletters illimitees &#8226; 25 destinataires &#8226; Analytics complets &#8226; Logo personnalise"}
        </p>
      </div>
    </div>
    <div style="padding:0 32px 8px;">
      <div style="border-left:3px solid #E8E0D8;padding-left:20px;">
        <p style="font-size:13px;color:#7A7267;line-height:1.6;margin:0;font-style:italic;">
          Pour annuler avant le premier paiement, rendez-vous sur votre <a href="https://sorell.fr/dashboard/profile" style="color:#005058;text-decoration:underline;">profil</a>.
        </p>
      </div>
    </div>
    <div style="padding:16px 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
        Mon dashboard &rarr;
      </a>
    </div>`, `Plus que 3 jours d'essai ${plan}`),
  };
}

function templateTrialJ1(name: string, plan: string): { subject: string; html: string } {
  return {
    subject: `Dernier jour d'essai ${plan} demain`,
    html: emailWrapper(`
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Votre essai ${plan}</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Dernier jour d'essai demain, ${name}</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;">
            <div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">
        Votre essai du plan <strong>${plan}</strong> se termine demain. Votre abonnement commencera automatiquement - aucune interruption de service.
      </p>
    </div>
    <div style="padding:0 32px 8px;">
      <div style="border-left:3px solid #E8E0D8;padding-left:20px;">
        <p style="font-size:13px;color:#7A7267;line-height:1.6;margin:0;font-style:italic;">
          Pour annuler avant le premier paiement, rendez-vous sur votre <a href="https://sorell.fr/dashboard/profile" style="color:#005058;text-decoration:underline;">profil</a>.
        </p>
      </div>
    </div>
    <div style="padding:16px 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard/profile" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
        Gerer mon abonnement &rarr;
      </a>
    </div>`, `Dernier jour d'essai ${plan} - ${name}`),
  };
}

function templateTrialJ0(name: string, plan: string): { subject: string; html: string } {
  return {
    subject: `Votre essai ${plan} est termine`,
    html: emailWrapper(`
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Bienvenue ${plan}</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Votre abonnement ${plan} est actif, ${name}</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;">
            <div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">
        Votre periode d'essai est terminee et votre abonnement <strong>${plan}</strong> est desormais actif. Profitez de toutes les fonctionnalites de votre plan.
      </p>
    </div>
    <div style="padding:0 32px 24px;">
      <div style="border:1px solid #E8E0D8;border-radius:10px;padding:24px;">
        <p style="font-size:11px;color:#7A7267;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;font-weight:600;">A explorer</p>
        <p style="font-size:14px;color:#111827;line-height:1.7;margin:0;">
          Configurez vos sources, ajoutez des destinataires et explorez vos analytics depuis votre dashboard.
        </p>
      </div>
    </div>
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
        Mon dashboard &rarr;
      </a>
    </div>`, `Votre abonnement ${plan} est actif`),
  };
}

function templateLimitReached(name: string, plan: string, limit: number): { subject: string; html: string } {
  const nextPlan = plan === "Free" ? "Pro" : "Business";
  const nextPrice = plan === "Free" ? "19" : "49";
  const nextBenefits = plan === "Free"
    ? "4 newsletters/mois, 5 destinataires, analytics, sources custom"
    : "Newsletters illimitees, 25 destinataires, logo personnalise";

  return {
    subject: `Limite atteinte - Passez au plan ${nextPlan}`,
    html: emailWrapper(`
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Plan ${plan}</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Limite de newsletters atteinte</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;">
            <div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">
        ${name}, vous avez utilise vos <strong>${limit} newsletters</strong> du mois sur le plan <strong>${plan}</strong>. Votre prochaine newsletter sera disponible le mois prochain.
      </p>
    </div>
    <div style="padding:0 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:#005058;padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:28px 28px 28px 32px;vertical-align:middle;width:65%;">
                  <p style="font-size:16px;font-weight:600;color:#FFFFFF;margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;line-height:1.4;">
                    Passez au plan ${nextPlan} - ${nextPrice}&euro;/mois
                  </p>
                  <p style="font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 18px;line-height:1.5;">
                    ${nextBenefits}
                  </p>
                  <a href="https://sorell.fr/tarifs" style="display:inline-block;padding:11px 26px;background:white;color:#005058;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">
                    Voir les plans &rarr;
                  </a>
                </td>
                <td style="width:35%;vertical-align:bottom;padding:0;">
                  <div style="height:120px;background:rgba(255,255,255,0.06);border-radius:8px 0 0 0;"></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>`, `Vous avez utilise vos ${limit} newsletters du mois`),
  };
}

function templateFeedbackJ14(name: string): { subject: string; html: string } {
  return {
    subject: `${name}, votre avis compte`,
    html: emailWrapper(`
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">2 semaines avec Sorell</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Votre avis nous interesse, ${name}</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;">
            <div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">
        Vous utilisez Sorell depuis 2 semaines. Avant de continuer, une question simple : <strong>est-ce que ca vous est utile ?</strong>
      </p>
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">
        Pas de formulaire. <strong>Repondez directement a cet email</strong>, meme en une phrase.
      </p>
    </div>
    <div style="padding:0 32px 24px;">
      <div style="border:1px solid #E8E0D8;border-radius:10px;padding:24px;">
        <p style="font-size:11px;color:#7A7267;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;font-weight:600;">Ce qui nous interesse</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:0 0 10px;">
              <span style="font-size:14px;color:#111827;line-height:1.6;">&#8226; Les sujets couverts sont-ils pertinents pour votre activite ?</span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 10px;">
              <span style="font-size:14px;color:#111827;line-height:1.6;">&#8226; La frequence vous convient-elle ?</span>
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              <span style="font-size:14px;color:#111827;line-height:1.6;">&#8226; Qu'est-ce qu'on pourrait ameliorer ?</span>
            </td>
          </tr>
        </table>
      </div>
    </div>
    <div style="padding:0 32px 28px;">
      <div style="border-left:3px solid #E8E0D8;padding-left:20px;">
        <p style="font-size:13px;color:#7A7267;line-height:1.6;margin:0;font-style:italic;">
          Chaque retour aide a rendre Sorell meilleur. On lit et on repond a chaque message.
        </p>
      </div>
    </div>`, `${name}, ca fait 2 semaines - votre avis compte`),
  };
}

function templateUpsellJ28(name: string, currentPlan: string): { subject: string; html: string } {
  const isPro = currentPlan === "pro";
  const nextPlan = isPro ? "Business" : "Pro";
  const nextPrice = isPro ? "49" : "19";
  const nextBenefits = isPro
    ? "Newsletters illimitees, 25 destinataires, logo personnalise"
    : "4 newsletters/mois, 5 destinataires, sources custom, analytics, historique";

  return {
    subject: `${name}, et si votre veille allait plus loin ?`,
    html: emailWrapper(`
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">1 mois avec Sorell</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Et si votre veille allait plus loin ?</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;">
            <div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">
        ${name}, ca fait 4 semaines que Sorell fait votre veille sectorielle. Si vous souhaitez aller plus loin, le plan <strong>${nextPlan}</strong> debloque de nouvelles possibilites.
      </p>
    </div>
    <div style="padding:0 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:#005058;padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:28px 28px 28px 32px;vertical-align:middle;width:65%;">
                  <p style="font-size:16px;font-weight:600;color:#FFFFFF;margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;line-height:1.4;">
                    Plan ${nextPlan} - ${nextPrice}&euro;/mois
                  </p>
                  <p style="font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 18px;line-height:1.5;">
                    ${nextBenefits}
                  </p>
                  <a href="https://sorell.fr/tarifs" style="display:inline-block;padding:11px 26px;background:white;color:#005058;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">
                    Voir les plans &rarr;
                  </a>
                </td>
                <td style="width:35%;vertical-align:bottom;padding:0;">
                  <div style="height:120px;background:rgba(255,255,255,0.06);border-radius:8px 0 0 0;"></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:0 32px 28px;">
      <div style="border-left:3px solid #E8E0D8;padding-left:20px;">
        <p style="font-size:13px;color:#7A7267;line-height:1.6;margin:0;font-style:italic;">
          Pas de pression - votre plan actuel reste actif. Une question ? Repondez a cet email.
        </p>
      </div>
    </div>`, `${name}, decouvrez le plan ${nextPlan}`),
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
        const { subject, html } = templateFeedbackJ14(name);
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
        const { subject, html } = templateUpsellJ28(name, user.plan);
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
