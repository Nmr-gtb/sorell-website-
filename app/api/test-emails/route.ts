import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const TO = "mur.noe.celony@gmail.com";
const N = "Noe";

function verifyCron(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !process.env.CRON_SECRET) return false;
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

const warmBorder = "#E8E0D8";
const warmBg = "#F5F0EB";
const secondaryText = "#7A7267";

function wrap(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${warmBg};font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ""}
<div style="max-width:620px;margin:0 auto;background:#FFFFFF;">
  <div style="padding:20px 32px;border-bottom:1px solid ${warmBorder};">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="width:36px;"><img src="https://www.sorell.fr/icone.png" alt="S." style="width:32px;height:32px;" /></td>
      <td align="right"><a href="https://sorell.fr" style="font-size:12px;color:#005058;text-decoration:none;">sorell.fr</a></td>
    </tr></table>
  </div>
  ${content}
  <div style="padding:22px 32px;border-top:1px solid ${warmBorder};background:${warmBg};">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="width:32px;"><img src="https://www.sorell.fr/icone.png" alt="S." style="width:24px;height:24px;" /></td>
      <td align="right"><a href="https://sorell.fr" style="font-size:12px;color:#005058;text-decoration:none;">sorell.fr</a></td>
    </tr></table>
    <p style="font-size:11px;color:${secondaryText};margin:14px 0 0;line-height:1.5;">Vous recevez cet email car vous avez un compte sur Sorell.<br/><a href="mailto:noe@sorell.fr" style="color:${secondaryText};">Besoin d'aide ? Repondez a cet email</a></p>
  </div>
</div>
</body></html>`;
}

const emails = [
  {
    subject: `[TEST 1/7] Bienvenue sur Sorell`,
    html: wrap(`
    <div style="padding:36px 32px 0;">
      <h1 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 24px;">Bienvenue sur Sorell</h1>
    </div>
    <div style="padding:0 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Bonjour ${N}, merci de nous avoir rejoints. Vous avez desormais acces a une veille sectorielle automatique, generee par IA a partir de vraies actualites du web, et livree dans votre boite mail chaque semaine.</p>
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">Il ne reste que 5 minutes de configuration pour que Sorell comprenne votre metier et commence a travailler pour vous.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <p style="font-size:11px;color:${secondaryText};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">Ce qu'on configure ensemble</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding:0 0 10px;"><span style="font-size:14px;color:#111827;line-height:1.6;">&middot;&nbsp;&nbsp;Votre brief : decrivez votre activite en quelques lignes</span></td></tr>
        <tr><td style="padding:0 0 10px;"><span style="font-size:14px;color:#111827;line-height:1.6;">&middot;&nbsp;&nbsp;Vos thematiques et sources preferees</span></td></tr>
        <tr><td style="padding:0;"><span style="font-size:14px;color:#111827;line-height:1.6;">&middot;&nbsp;&nbsp;Votre creneau d'envoi et vos destinataires</span></td></tr>
      </table>
    </div>
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:500;text-decoration:none;border-radius:8px;">Configurer ma newsletter</a>
    </div>`, `Votre veille sectorielle IA est prete`),
  },
  {
    subject: `[TEST 2/7] ${N}, votre newsletter IA vous attend`,
    html: wrap(`
    <div style="padding:36px 32px 0;">
      <h1 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 24px;">Votre veille sectorielle vous attend</h1>
    </div>
    <div style="padding:0 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Bonjour ${N}, votre compte a ete cree hier, mais votre premiere newsletter n'est pas encore configuree.</p>
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">En 5 minutes, Sorell peut vous envoyer automatiquement une veille sectorielle personnalisee, generee par IA a partir de vraies actualites du web.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <p style="font-size:11px;color:${secondaryText};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">3 etapes rapides</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding:0 0 10px;"><span style="font-size:14px;color:#111827;line-height:1.6;">&middot;&nbsp;&nbsp;Decrivez votre activite (votre brief)</span></td></tr>
        <tr><td style="padding:0 0 10px;"><span style="font-size:14px;color:#111827;line-height:1.6;">&middot;&nbsp;&nbsp;Choisissez vos thematiques</span></td></tr>
        <tr><td style="padding:0;"><span style="font-size:14px;color:#111827;line-height:1.6;">&middot;&nbsp;&nbsp;Cliquez sur "Generer"</span></td></tr>
      </table>
    </div>
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard/config" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:500;text-decoration:none;border-radius:8px;">Configurer ma newsletter</a>
    </div>`),
  },
  {
    subject: `[TEST 3/7] Votre essai Pro se termine dans 3 jours`,
    html: wrap(`
    <div style="padding:36px 32px 0;">
      <h1 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 24px;">Plus que 3 jours d'essai</h1>
    </div>
    <div style="padding:0 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">Bonjour ${N}, votre essai gratuit du plan Pro se termine dans 3 jours. Pour continuer, aucune action requise - votre abonnement demarrera automatiquement.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <p style="font-size:11px;color:${secondaryText};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">Ce que vous gardez avec Pro</p>
      <p style="font-size:14px;color:#111827;line-height:1.7;margin:0;">&middot;&nbsp;&nbsp;4 newsletters/mois&nbsp;&nbsp;&middot;&nbsp;&nbsp;5 destinataires&nbsp;&nbsp;&middot;&nbsp;&nbsp;Analytics&nbsp;&nbsp;&middot;&nbsp;&nbsp;Sources custom</p>
    </div>
    <div style="padding:0 32px 8px;">
      <p style="font-size:13px;color:${secondaryText};line-height:1.6;margin:0;font-style:italic;">Pour annuler avant le premier paiement, rendez-vous sur votre <a href="https://sorell.fr/dashboard/profile" style="color:#005058;text-decoration:underline;">profil</a>.</p>
    </div>
    <div style="padding:16px 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:500;text-decoration:none;border-radius:8px;">Mon dashboard</a>
    </div>`),
  },
  {
    subject: `[TEST 4/7] Limite atteinte - Passez au plan Pro`,
    html: wrap(`
    <div style="padding:36px 32px 0;">
      <h1 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 24px;">Limite de newsletters atteinte</h1>
    </div>
    <div style="padding:0 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">${N}, vous avez utilise vos 2 newsletters du mois sur le plan Free. Votre prochaine newsletter sera disponible le mois prochain.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <p style="font-size:11px;color:${secondaryText};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">Besoin de plus ?</p>
      <p style="font-size:14px;color:#111827;line-height:1.7;margin:0 0 20px;">Le plan Pro a 19&euro;/mois inclut : 4 newsletters/mois, 5 destinataires, analytics, sources custom.</p>
    </div>
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="https://sorell.fr/tarifs" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:500;text-decoration:none;border-radius:8px;">Voir les plans</a>
    </div>`),
  },
  {
    subject: `[TEST 5/7] ${N}, votre avis compte`,
    html: wrap(`
    <div style="padding:36px 32px 0;">
      <h1 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 24px;">2 semaines de veille automatique</h1>
    </div>
    <div style="padding:0 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">Bonjour ${N}, vous utilisez Sorell depuis 2 semaines. Avant de continuer, une question simple : est-ce que ca vous est utile ?</p>
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">Pas de formulaire. Repondez directement a cet email, meme en une phrase.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <p style="font-size:11px;color:${secondaryText};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">Ce qui nous interesse</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding:0 0 10px;"><span style="font-size:14px;color:#111827;line-height:1.6;">&middot;&nbsp;&nbsp;Les sujets couverts sont-ils pertinents pour votre activite ?</span></td></tr>
        <tr><td style="padding:0 0 10px;"><span style="font-size:14px;color:#111827;line-height:1.6;">&middot;&nbsp;&nbsp;La frequence vous convient-elle ?</span></td></tr>
        <tr><td style="padding:0;"><span style="font-size:14px;color:#111827;line-height:1.6;">&middot;&nbsp;&nbsp;Qu'est-ce qu'on pourrait ameliorer ?</span></td></tr>
      </table>
    </div>
    <div style="padding:0 32px 28px;">
      <p style="font-size:13px;color:${secondaryText};line-height:1.6;margin:0;font-style:italic;">Chaque retour aide a rendre Sorell meilleur. On lit et on repond a chaque message.</p>
    </div>`),
  },
  {
    subject: `[TEST 6/7 Free→Pro] ${N}, et si votre veille allait plus loin ?`,
    html: wrap(`
    <div style="padding:36px 32px 0;">
      <h1 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 24px;">1 mois avec Sorell</h1>
    </div>
    <div style="padding:0 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">${N}, ca fait 4 semaines que Sorell fait votre veille sectorielle. Si vous souhaitez aller plus loin, le plan Pro debloque de nouvelles possibilites.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <p style="font-size:11px;color:${secondaryText};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">Plan Pro - 19&euro;/mois</p>
      <p style="font-size:14px;color:#111827;line-height:1.7;margin:0 0 20px;">4 newsletters/mois, 5 destinataires, sources custom, analytics, historique</p>
    </div>
    <div style="padding:0 32px 12px;text-align:center;">
      <a href="https://sorell.fr/tarifs" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:500;text-decoration:none;border-radius:8px;">Voir les plans</a>
    </div>
    <div style="padding:4px 32px 28px;text-align:center;">
      <p style="font-size:13px;color:${secondaryText};margin:0;">Pas de pression, votre plan actuel reste actif.</p>
    </div>`),
  },
  {
    subject: `[TEST 7/7 Pro→Biz] ${N}, et si votre veille allait plus loin ?`,
    html: wrap(`
    <div style="padding:36px 32px 0;">
      <h1 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 24px;">1 mois avec Sorell</h1>
    </div>
    <div style="padding:0 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">${N}, ca fait 4 semaines que Sorell fait votre veille sectorielle. Si vous souhaitez aller plus loin, le plan Business debloque de nouvelles possibilites.</p>
    </div>
    <div style="padding:0 32px 24px;">
      <p style="font-size:11px;color:${secondaryText};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">Plan Business - 49&euro;/mois</p>
      <p style="font-size:14px;color:#111827;line-height:1.7;margin:0 0 20px;">Newsletters illimitees, 25 destinataires, logo personnalise</p>
    </div>
    <div style="padding:0 32px 12px;text-align:center;">
      <a href="https://sorell.fr/tarifs" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:500;text-decoration:none;border-radius:8px;">Voir les plans</a>
    </div>
    <div style="padding:4px 32px 28px;text-align:center;">
      <p style="font-size:13px;color:${secondaryText};margin:0;">Pas de pression, votre plan actuel reste actif.</p>
    </div>`),
  },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const results: { subject: string; status: string }[] = [];

  for (const email of emails) {
    try {
      await resend.emails.send({
        from: "Sorell <noe@sorell.fr>",
        to: TO,
        replyTo: "noe@sorell.fr",
        subject: email.subject,
        html: email.html,
      });
      results.push({ subject: email.subject, status: "sent" });
      await delay(1500);
    } catch {
      results.push({ subject: email.subject, status: "error" });
    }
  }

  return NextResponse.json({ success: true, results });
}
