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

    await resend.emails.send({
      from: "Sorell <noe@sorell.fr>",
      to: email,
      replyTo: "noe@sorell.fr",
      subject: `Bienvenue sur Sorell`,
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#F5F0EB;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">Votre veille sectorielle IA est prete${"&nbsp;&zwnj;".repeat(20)}</div>
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;">

    <!-- Header -->
    <div style="padding:20px 32px;border-bottom:1px solid #E8E0D8;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:36px;"><img src="https://www.sorell.fr/icone.png" alt="S." style="width:32px;height:32px;" /></td>
          <td align="right"><a href="https://sorell.fr" style="font-size:12px;color:#005058;text-decoration:none;">sorell.fr</a></td>
        </tr>
      </table>
    </div>

    <!-- Titre -->
    <div style="padding:36px 32px 0;">
      <h1 style="font-size:22px;font-weight:600;color:#111827;margin:0 0 24px;">Bienvenue sur Sorell</h1>
    </div>

    <!-- Contenu -->
    <div style="padding:0 32px 24px;">
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 16px;">
        Bonjour ${displayName}, merci de nous avoir rejoints. Vous avez desormais acces a une veille sectorielle automatique, generee par IA a partir de vraies actualites du web, et livree dans votre boite mail chaque semaine.
      </p>
      <p style="font-size:15px;color:#4B5563;line-height:1.7;margin:0 0 24px;">
        Il ne reste que 5 minutes de configuration pour que Sorell comprenne votre metier et commence a travailler pour vous.
      </p>
    </div>

    <!-- Ce qu'on configure ensemble -->
    <div style="padding:0 32px 24px;">
      <p style="font-size:11px;color:#7A7267;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">Ce qu'on configure ensemble</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="padding:0 0 10px;"><span style="font-size:14px;color:#111827;line-height:1.6;">&middot;&nbsp;&nbsp;Votre brief : decrivez votre activite en quelques lignes</span></td></tr>
        <tr><td style="padding:0 0 10px;"><span style="font-size:14px;color:#111827;line-height:1.6;">&middot;&nbsp;&nbsp;Vos thematiques et sources preferees</span></td></tr>
        <tr><td style="padding:0;"><span style="font-size:14px;color:#111827;line-height:1.6;">&middot;&nbsp;&nbsp;Votre creneau d'envoi et vos destinataires</span></td></tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard" style="display:inline-block;padding:14px 32px;background:#005058;color:white;font-size:14px;font-weight:500;text-decoration:none;border-radius:8px;">
        Configurer ma newsletter
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:22px 32px;border-top:1px solid #E8E0D8;background:#F5F0EB;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:32px;"><img src="https://www.sorell.fr/icone.png" alt="S." style="width:24px;height:24px;" /></td>
          <td align="right"><a href="https://sorell.fr" style="font-size:12px;color:#005058;text-decoration:none;">sorell.fr</a></td>
        </tr>
      </table>
      <p style="font-size:11px;color:#7A7267;margin:14px 0 0;line-height:1.5;">
        Vous recevez cet email car vous avez cree un compte sur Sorell.<br/>
        <a href="mailto:noe@sorell.fr" style="color:#7A7267;">Besoin d'aide ? Repondez a cet email</a>
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
