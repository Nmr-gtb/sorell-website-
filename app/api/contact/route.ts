import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    await resend.emails.send({
      from: "Sorell Contact <newsletter@sorell.fr>",
      to: "murnoe@outlook.fr",
      replyTo: email,
      subject: `[Sorell Contact] ${subject || "Nouveau message"} — ${name}`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 24px 32px; border-bottom: 1px solid #E5E7EB;">
            <span style="font-size: 18px; font-weight: 700; color: #111827;">Sorel<span style="color: #2563EB;">l</span></span>
            <span style="font-size: 14px; color: #6B7280; margin-left: 12px;">Nouveau message de contact</span>
          </div>
          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6B7280; width: 100px;">Nom</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Email</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;"><a href="mailto:${email}" style="color: #2563EB;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Sujet</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;">${subject || "Non spécifié"}</td>
              </tr>
            </table>
            <div style="margin-top: 24px; padding: 20px; background: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB;">
              <p style="font-size: 12px; color: #6B7280; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Message</p>
              <p style="font-size: 14px; color: #111827; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="font-size: 12px; color: #9CA3AF; margin-top: 24px;">
              Répondre directement à cet email enverra la réponse à ${email}
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Contact form error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
