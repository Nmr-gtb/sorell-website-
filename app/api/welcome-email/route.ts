import { Resend } from "resend";
import { NextResponse } from "next/server";
import { emailRateLimit } from "@/lib/ratelimit";
import { getAuthenticatedUser } from "@/lib/auth";
import { escapeHtml, isValidEmail, truncateInput } from "@/lib/utils";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const raw = await request.json();
    const email = truncateInput(String(raw.email || ""), 320);
    const name = truncateInput(String(raw.name || ""), 200);

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Format email invalide" }, { status: 400 });
    }

    try {
      const { success: rateLimitOk } = await emailRateLimit.limit(email);
      if (!rateLimitOk) {
        return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
      }
    } catch {
      // Redis unavailable — allow welcome email to proceed
    }

    const displayName = escapeHtml(name || email.split("@")[0]);

    const warmBorder = "#E8E0D8";
    const warmBg = "#F5F0EB";
    const secondaryText = "#7A7267";

    await resend.emails.send({
      from: "Sorell <noe@sorell.fr>",
      to: email,
      replyTo: "noe@sorell.fr",
      subject: `${displayName}, votre veille sectorielle commence maintenant`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:${warmBg};font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Configurez votre newsletter IA en 5 minutes${"&nbsp;&zwnj;".repeat(20)}</div>
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;">

    <!-- Header -->
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

    <!-- Hero -->
    <div style="background:#005058;padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;">Bienvenue sur Sorell</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Votre veille sectorielle commence maintenant, ${displayName}</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;">
            <div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Contenu -->
    <div style="padding:32px 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">
        Votre compte est cree. A partir de maintenant, Sorell peut vous envoyer <strong>chaque semaine un resume des actualites cles de votre secteur</strong>. L'IA s'occupe de tout.
      </p>
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">
        Il ne reste qu'une chose : <strong>5 minutes de configuration</strong> pour que Sorell comprenne votre metier.
      </p>
    </div>

    <!-- Etapes -->
    <div style="padding:0 32px 24px;">
      <div style="border:1px solid ${warmBorder};border-radius:10px;padding:24px;">
        <p style="font-size:11px;color:${secondaryText};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;font-weight:600;">Ce qui va se passer</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:0 0 10px;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#005058;color:#FFFFFF;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">1</span><span style="font-size:14px;color:#111827;">Vous decrivez votre activite en quelques lignes</span></td>
          </tr>
          <tr>
            <td style="padding:0 0 10px;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#005058;color:#FFFFFF;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">2</span><span style="font-size:14px;color:#111827;">Sorell analyse 147+ sources (Les Echos, Bloomberg, Reuters...)</span></td>
          </tr>
          <tr>
            <td style="padding:0;"><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:#005058;color:#FFFFFF;font-size:11px;font-weight:700;text-align:center;line-height:20px;margin-right:10px;">3</span><span style="font-size:14px;color:#111827;">Vous recevez votre newsletter par email, chaque semaine, automatiquement</span></td>
          </tr>
        </table>
      </div>
    </div>

    <!-- CTA -->
    <div style="padding:0 32px 12px;text-align:center;">
      <a href="https://sorell.fr/dashboard" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
        Configurer ma newsletter &rarr;
      </a>
    </div>
    <div style="padding:0 32px 28px;text-align:center;">
      <p style="font-size:13px;color:${secondaryText};margin:0;">Ca prend 5 minutes, promis.</p>
    </div>

    <!-- Footer -->
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
        Vous recevez cet email car vous avez cree un compte sur Sorell.<br/>
        <a href="mailto:noe@sorell.fr" style="color:${secondaryText};">Besoin d'aide ? Repondez a cet email</a>
      </p>
    </div>

  </div>
</body>
</html>`,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
