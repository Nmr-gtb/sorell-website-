import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { emailRateLimit } from "@/lib/ratelimit";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidEmail, truncateInput, escapeHtml } from "@/lib/utils";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { buildVerifyEmailUrl } from "@/lib/verify-email-token";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const raw = await request.json();
    const email = truncateInput(String(raw.email || ""), 320);
    const name = truncateInput(String(raw.name || ""), 200);

    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

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

    const verifyUrl = buildVerifyEmailUrl(email);
    const welcomeHtml = await render(WelcomeEmail({ name: name || "", email, verifyUrl }));

    await resend.emails.send({
      from: "Sorell <noreply@sorell.fr>",
      replyTo: "noe@sorell.fr",
      to: email,
      subject: "Bienvenue sur Sorell - votre veille automatique est en route",
      html: welcomeHtml,
      text: `Bienvenue sur Sorell, ${name || ""} !\n\nVotre veille automatique est en route. Confirmez votre adresse email en cliquant sur ce lien :\n${verifyUrl}\n\nA bientot,\nNoe - Sorell`,
    });

    try {
      const now = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
      await resend.emails.send({
        from: "Sorell <noreply@sorell.fr>",
        to: "noe@sorell.fr",
        replyTo: "noe@sorell.fr",
        subject: `Nouvel inscrit Sorell - ${email}`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Roboto,Arial,sans-serif;background:#F3F4F6;margin:0;padding:0;">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:10px;padding:28px;border:1px solid #E5E7EB;">
    <h2 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 16px;">Nouvel inscrit sur Sorell</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
      <tr><td style="padding:8px 0;font-weight:600;width:120px;">Nom</td><td style="padding:8px 0;">${escapeHtml(name || "Non renseigné")}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Email</td><td style="padding:8px 0;">${escapeHtml(email)}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Date</td><td style="padding:8px 0;">${now}</td></tr>
    </table>
  </div>
</body>
</html>`,
        text: `Nouvel inscrit Sorell\n\nNom : ${name || "Non renseigné"}\nEmail : ${email}\nDate : ${now}`,
      });
    } catch {
      // silently ignore
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
