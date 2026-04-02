import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

const TEST_EMAIL = "mur.noe.celony@gmail.com";
const TEST_NAME = "Noe";

// ─── Auth ───────────────────────────────────────────────────────
function verifyCron(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !process.env.CRON_SECRET) return false;
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

// ─── Email wrapper (copie DA newsletter V4) ─────────────────────
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

function welcomeEmail(): { subject: string; html: string } {
  const warmBorder = "#E8E0D8";
  const secondaryText = "#7A7267";
  return {
    subject: `[TEST 1/7] ${TEST_NAME}, votre veille sectorielle commence maintenant`,
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;">
    <div style="padding:20px 32px;border-bottom:1px solid ${warmBorder};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:36px;"><img src="https://www.sorell.fr/icone.png" alt="S." style="width:32px;height:32px;" /></td>
          <td align="right"><a href="https://sorell.fr" style="font-size:12px;color:#005058;text-decoration:none;">sorell.fr</a></td>
        </tr>
      </table>
    </div>
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Bienvenue sur Sorell</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Votre veille sectorielle commence maintenant, ${TEST_NAME}</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;"><div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div></td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Votre compte est cree. A partir de maintenant, Sorell peut vous envoyer <strong>chaque semaine un resume des actualites cles de votre secteur</strong>. L'IA s'occupe de tout.</p>
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">Il ne reste qu'une chose : <strong>5 minutes de configuration</strong> pour que Sorell comprenne votre metier.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <div style="border:1px solid ${warmBorder};border-radius:10px;padding:24px;">
        <p style="font-size:11px;color:${secondaryText};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;font-weight:600;">Ce qui va se passer</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:0 0 10px;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#005058;color:#FFFFFF;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">1</span><span style="font-size:14px;color:#111827;">Vous decrivez votre activite en quelques lignes</span></td></tr>
          <tr><td style="padding:0 0 10px;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#005058;color:#FFFFFF;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">2</span><span style="font-size:14px;color:#111827;">Sorell analyse 147+ sources (Les Echos, Bloomberg, Reuters...)</span></td></tr>
          <tr><td style="padding:0;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#005058;color:#FFFFFF;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">3</span><span style="font-size:14px;color:#111827;">Vous recevez votre newsletter par email, chaque semaine, automatiquement</span></td></tr>
        </table>
      </div>
    </div>
    <div style="padding:0 32px 12px;text-align:center;">
      <a href="https://sorell.fr/dashboard" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">Configurer ma newsletter &rarr;</a>
    </div>
    <div style="padding:0 32px 28px;text-align:center;">
      <p style="font-size:13px;color:${secondaryText};margin:0;">Ca prend 5 minutes, promis.</p>
    </div>
    <div style="padding:22px 32px;border-top:1px solid ${warmBorder};background:#F5F0EB;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:32px;"><img src="https://www.sorell.fr/icone.png" alt="S." style="width:24px;height:24px;" /></td>
          <td align="right"><a href="https://sorell.fr" style="font-size:12px;color:#005058;text-decoration:none;">sorell.fr</a></td>
        </tr>
      </table>
      <p style="font-size:11px;color:${secondaryText};margin:14px 0 0;line-height:1.5;">Vous recevez cet email car vous avez cree un compte sur Sorell.<br/><a href="mailto:noe@sorell.fr" style="color:${secondaryText};">Besoin d'aide ? Repondez a cet email</a></p>
    </div>
  </div>
</body>
</html>`,
  };
}

function onboardingJ1(): { subject: string; html: string } {
  const t = {
    subject: `${TEST_NAME}, votre newsletter IA vous attend`,
    html: emailWrapper(`
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Votre compte Sorell</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Votre veille sectorielle vous attend, ${TEST_NAME}</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;"><div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div></td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Votre compte a ete cree hier, mais votre premiere newsletter n'est pas encore configuree.</p>
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">En <strong>5 minutes</strong>, Sorell peut vous envoyer automatiquement une veille sectorielle personnalisee, generee par IA a partir de vraies actualites du web.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <div style="border:1px solid #E8E0D8;border-radius:10px;padding:24px;">
        <p style="font-size:11px;color:#7A7267;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;font-weight:600;">3 etapes rapides</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:0 0 10px;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#005058;color:#FFFFFF;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">1</span><span style="font-size:14px;color:#111827;">Decrivez votre activite (votre brief)</span></td></tr>
          <tr><td style="padding:0 0 10px;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#005058;color:#FFFFFF;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">2</span><span style="font-size:14px;color:#111827;">Choisissez vos thematiques</span></td></tr>
          <tr><td style="padding:0;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#005058;color:#FFFFFF;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">3</span><span style="font-size:14px;color:#111827;">Cliquez sur "Generer"</span></td></tr>
        </table>
      </div>
    </div>
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard/config" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">Configurer ma newsletter &rarr;</a>
    </div>`),
  };
  return { subject: `[TEST 2/7] ${t.subject}`, html: t.html };
}

function trialJ3(): { subject: string; html: string } {
  const plan = "Pro";
  const t = {
    subject: `Votre essai ${plan} se termine dans 3 jours`,
    html: emailWrapper(`
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Votre essai ${plan}</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Plus que 3 jours d'essai, ${TEST_NAME}</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;"><div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div></td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">Votre essai gratuit du plan <strong>${plan}</strong> se termine dans 3 jours. Pour continuer, aucune action requise - votre abonnement demarrera automatiquement.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <div style="border:1px solid #E8E0D8;border-radius:10px;padding:24px;">
        <p style="font-size:11px;color:#7A7267;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;font-weight:600;">Ce que vous gardez avec ${plan}</p>
        <p style="font-size:14px;color:#111827;line-height:1.7;margin:0;">&#8226; 4 newsletters/mois &#8226; 5 destinataires &#8226; Analytics complets &#8226; Sources custom</p>
      </div>
    </div>
    <div style="padding:0 32px 8px;">
      <div style="border-left:3px solid #E8E0D8;padding-left:20px;">
        <p style="font-size:13px;color:#7A7267;line-height:1.6;margin:0;font-style:italic;">Pour annuler avant le premier paiement, rendez-vous sur votre <a href="https://sorell.fr/dashboard/profile" style="color:#005058;text-decoration:underline;">profil</a>.</p>
      </div>
    </div>
    <div style="padding:16px 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">Mon dashboard &rarr;</a>
    </div>`),
  };
  return { subject: `[TEST 3/7] ${t.subject}`, html: t.html };
}

function limitReached(): { subject: string; html: string } {
  const t = {
    subject: `Limite atteinte - Passez au plan Pro`,
    html: emailWrapper(`
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Plan Free</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Limite de newsletters atteinte</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;"><div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div></td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">${TEST_NAME}, vous avez utilise vos <strong>2 newsletters</strong> du mois sur le plan <strong>Free</strong>. Votre prochaine newsletter sera disponible le mois prochain.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:#005058;padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:28px 28px 28px 32px;vertical-align:middle;width:65%;">
                  <p style="font-size:16px;font-weight:600;color:#FFFFFF;margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;line-height:1.4;">Passez au plan Pro - 19&euro;/mois</p>
                  <p style="font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 18px;line-height:1.5;">4 newsletters/mois, 5 destinataires, analytics, sources custom</p>
                  <a href="https://sorell.fr/tarifs" style="display:inline-block;padding:11px 26px;background:white;color:#005058;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">Voir les plans &rarr;</a>
                </td>
                <td style="width:35%;vertical-align:bottom;padding:0;"><div style="height:120px;background:rgba(255,255,255,0.06);border-radius:8px 0 0 0;"></div></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>`),
  };
  return { subject: `[TEST 4/7] ${t.subject}`, html: t.html };
}

function feedbackJ14(): { subject: string; html: string } {
  const t = {
    subject: `${TEST_NAME}, votre avis compte`,
    html: emailWrapper(`
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">2 semaines avec Sorell</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Votre avis nous interesse, ${TEST_NAME}</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;"><div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div></td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Vous utilisez Sorell depuis 2 semaines. Avant de continuer, une question simple : <strong>est-ce que ca vous est utile ?</strong></p>
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">Pas de formulaire. <strong>Repondez directement a cet email</strong>, meme en une phrase.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <div style="border:1px solid #E8E0D8;border-radius:10px;padding:24px;">
        <p style="font-size:11px;color:#7A7267;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;font-weight:600;">Ce qui nous interesse</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:0 0 10px;"><span style="font-size:14px;color:#111827;line-height:1.6;">&#8226; Les sujets couverts sont-ils pertinents pour votre activite ?</span></td></tr>
          <tr><td style="padding:0 0 10px;"><span style="font-size:14px;color:#111827;line-height:1.6;">&#8226; La frequence vous convient-elle ?</span></td></tr>
          <tr><td style="padding:0;"><span style="font-size:14px;color:#111827;line-height:1.6;">&#8226; Qu'est-ce qu'on pourrait ameliorer ?</span></td></tr>
        </table>
      </div>
    </div>
    <div style="padding:0 32px 28px;">
      <div style="border-left:3px solid #E8E0D8;padding-left:20px;">
        <p style="font-size:13px;color:#7A7267;line-height:1.6;margin:0;font-style:italic;">Chaque retour aide a rendre Sorell meilleur. On lit et on repond a chaque message.</p>
      </div>
    </div>`),
  };
  return { subject: `[TEST 5/7] ${t.subject}`, html: t.html };
}

function upsellJ28Free(): { subject: string; html: string } {
  const t = {
    subject: `${TEST_NAME}, et si votre veille allait plus loin ?`,
    html: emailWrapper(`
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">1 mois avec Sorell</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Et si votre veille allait plus loin ?</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;"><div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div></td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">${TEST_NAME}, ca fait 4 semaines que Sorell fait votre veille sectorielle. Si vous souhaitez aller plus loin, le plan <strong>Pro</strong> debloque de nouvelles possibilites.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:#005058;padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:28px 28px 28px 32px;vertical-align:middle;width:65%;">
                  <p style="font-size:16px;font-weight:600;color:#FFFFFF;margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;line-height:1.4;">Plan Pro - 19&euro;/mois</p>
                  <p style="font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 18px;line-height:1.5;">4 newsletters/mois, 5 destinataires, sources custom, analytics, historique</p>
                  <a href="https://sorell.fr/tarifs" style="display:inline-block;padding:11px 26px;background:white;color:#005058;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">Voir les plans &rarr;</a>
                </td>
                <td style="width:35%;vertical-align:bottom;padding:0;"><div style="height:120px;background:rgba(255,255,255,0.06);border-radius:8px 0 0 0;"></div></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:0 32px 28px;">
      <div style="border-left:3px solid #E8E0D8;padding-left:20px;">
        <p style="font-size:13px;color:#7A7267;line-height:1.6;margin:0;font-style:italic;">Pas de pression - votre plan actuel reste actif. Une question ? Repondez a cet email.</p>
      </div>
    </div>`),
  };
  return { subject: `[TEST 6/7 - Free→Pro] ${t.subject}`, html: t.html };
}

function upsellJ28Pro(): { subject: string; html: string } {
  const t = {
    subject: `${TEST_NAME}, et si votre veille allait plus loin ?`,
    html: emailWrapper(`
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">1 mois avec Sorell</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Et si votre veille allait plus loin ?</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;"><div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div></td>
        </tr>
      </table>
    </div>
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">${TEST_NAME}, ca fait 4 semaines que Sorell fait votre veille sectorielle. Si vous souhaitez aller plus loin, le plan <strong>Business</strong> debloque de nouvelles possibilites.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:#005058;padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:28px 28px 28px 32px;vertical-align:middle;width:65%;">
                  <p style="font-size:16px;font-weight:600;color:#FFFFFF;margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;line-height:1.4;">Plan Business - 49&euro;/mois</p>
                  <p style="font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 18px;line-height:1.5;">Newsletters illimitees, 25 destinataires, logo personnalise</p>
                  <a href="https://sorell.fr/tarifs" style="display:inline-block;padding:11px 26px;background:white;color:#005058;font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;">Voir les plans &rarr;</a>
                </td>
                <td style="width:35%;vertical-align:bottom;padding:0;"><div style="height:120px;background:rgba(255,255,255,0.06);border-radius:8px 0 0 0;"></div></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:0 32px 28px;">
      <div style="border-left:3px solid #E8E0D8;padding-left:20px;">
        <p style="font-size:13px;color:#7A7267;line-height:1.6;margin:0;font-style:italic;">Pas de pression - votre plan actuel reste actif. Une question ? Repondez a cet email.</p>
      </div>
    </div>`),
  };
  return { subject: `[TEST 7/7 - Pro→Biz] ${t.subject}`, html: t.html };
}

// ─── Route Handler ──────────────────────────────────────────────
export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const emails = [
    welcomeEmail(),
    onboardingJ1(),
    trialJ3(),
    limitReached(),
    feedbackJ14(),
    upsellJ28Free(),
    upsellJ28Pro(),
  ];

  const results: { subject: string; status: string }[] = [];

  for (const email of emails) {
    try {
      await resend.emails.send({
        from: "Sorell <noe@sorell.fr>",
        to: TEST_EMAIL,
        replyTo: "noe@sorell.fr",
        subject: email.subject,
        html: email.html,
      });
      results.push({ subject: email.subject, status: "sent" });
    } catch {
      results.push({ subject: email.subject, status: "error" });
    }
  }

  return NextResponse.json({ success: true, results });
}
