import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    const firstName = name?.split(" ")[0] || "";
    const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

    await resend.emails.send({
      from: "Sorell <noe@sorell.fr>",
      to: email,
      subject: "Bienvenue sur Sorell - votre veille automatique est en route",
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:white;border-radius:12px;padding:32px;border:1px solid #E5E7EB;">

      <div style="margin-bottom:24px;">
        <span style="font-size:20px;font-weight:700;color:#111827;">Sorel<span style="color:#2563EB;">l</span></span>
      </div>

      <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Bienvenue sur Sorell</h1>
      <p style="font-size:15px;color:#6B7280;margin:0 0 24px;line-height:1.6;">
        ${greeting} votre compte est créé et votre première newsletter est en route.
      </p>

      <div style="background:#F9FAFB;border-radius:8px;padding:20px;margin-bottom:24px;">
        <p style="font-size:13px;font-weight:600;color:#111827;margin:0 0 12px;">Ce que vous pouvez faire maintenant :</p>

        <div style="margin-bottom:12px;">
          <span style="display:inline-block;width:22px;height:22px;background:#2563EB;color:white;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:600;margin-right:8px;">1</span>
          <span style="font-size:14px;color:#374151;font-weight:500;">Enrichissez votre brief</span>
          <p style="font-size:13px;color:#6B7280;margin:4px 0 0 30px;">Plus il est détaillé, plus vos newsletters seront variées et pertinentes.</p>
        </div>

        <div style="margin-bottom:12px;">
          <span style="display:inline-block;width:22px;height:22px;background:#2563EB;color:white;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:600;margin-right:8px;">2</span>
          <span style="font-size:14px;color:#374151;font-weight:500;">Ajoutez vos collaborateurs</span>
          <p style="font-size:13px;color:#6B7280;margin:4px 0 0 30px;">Partagez la newsletter avec votre équipe depuis la page Configuration.</p>
        </div>

        <div>
          <span style="display:inline-block;width:22px;height:22px;background:#2563EB;color:white;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:600;margin-right:8px;">3</span>
          <span style="font-size:14px;color:#374151;font-weight:500;">Laissez faire</span>
          <p style="font-size:13px;color:#6B7280;margin:4px 0 0 30px;">Votre newsletter arrive automatiquement. Vous n'avez rien à faire.</p>
        </div>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://sorell.fr/dashboard" style="display:inline-block;padding:12px 28px;background:#2563EB;color:white;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">Accéder à mon dashboard</a>
      </div>

      <p style="font-size:13px;color:#9CA3AF;text-align:center;margin:0;">
        Une question ? Répondez directement à cet email.
      </p>
    </div>

    <p style="font-size:11px;color:#9CA3AF;text-align:center;margin-top:16px;">
      Sorell - Newsletter IA automatique pour les entreprises<br/>
      <a href="https://sorell.fr" style="color:#9CA3AF;">sorell.fr</a>
    </p>
  </div>
</body>
</html>`
    });

    try {
      const now = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
      await resend.emails.send({
        from: "Sorell <noe@sorell.fr>",
        to: "noe@sorell.fr",
        subject: `Nouvel inscrit Sorell - ${email}`,
        html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Roboto,Arial,sans-serif;background:#F3F4F6;margin:0;padding:0;">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:10px;padding:28px;border:1px solid #E5E7EB;">
    <h2 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 16px;">Nouvel inscrit sur Sorell</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
      <tr><td style="padding:8px 0;font-weight:600;width:120px;">Nom</td><td style="padding:8px 0;">${name || "Non renseigne"}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Email</td><td style="padding:8px 0;">${email}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;">Date</td><td style="padding:8px 0;">${now}</td></tr>
    </table>
  </div>
</body>
</html>`
      });
    } catch (notifError) {
      console.error("Admin notification email error:", notifError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Welcome email error:", error);
    return NextResponse.json({ error: "Failed to send welcome email" }, { status: 500 });
  }
}
