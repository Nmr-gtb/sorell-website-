import { Resend } from "resend";
import { NextResponse } from "next/server";
import { escapeHtml, isValidEmail, truncateInput } from "@/lib/utils";
import { emailRateLimit } from "@/lib/ratelimit";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    const raw = await request.json();

    const name = truncateInput(String(raw.name || ""), 200);
    const email = truncateInput(String(raw.email || ""), 320);
    const subject = truncateInput(String(raw.subject || ""), 200);
    const message = truncateInput(String(raw.message || ""), 5000);

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Format email invalide" }, { status: 400 });
    }

    try {
      const { success: rateLimitOk } = await emailRateLimit.limit(`contact:${email}`);
      if (!rateLimitOk) {
        return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
      }
    } catch {
      // Redis unavailable — allow contact form to proceed
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message);

    await resend.emails.send({
      from: "Sorell Contact <newsletter@sorell.fr>",
      to: "noe@sorell.fr",
      replyTo: email,
      subject: `[Sorell Contact] ${subject || "Nouveau message"} - ${name}`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="padding: 24px 32px; border-bottom: 1px solid #E5E7EB;">
            <span style="font-size: 18px; font-weight: 700; color: #111827;">Sorel<span style="color: #005058;">l</span></span>
            <span style="font-size: 14px; color: #6B7280; margin-left: 12px;">Nouveau message de contact</span>
          </div>
          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #6B7280; width: 100px;">Nom</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Email</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;"><a href="mailto:${safeEmail}" style="color: #005058;">${safeEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6B7280;">Sujet</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500;">${safeSubject || "Non sp&eacute;cifi&eacute;"}</td>
              </tr>
            </table>
            <div style="margin-top: 24px; padding: 20px; background: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB;">
              <p style="font-size: 12px; color: #6B7280; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Message</p>
              <p style="font-size: 14px; color: #111827; line-height: 1.6; margin: 0; white-space: pre-wrap;">${safeMessage}</p>
            </div>
            <p style="font-size: 12px; color: #9CA3AF; margin-top: 24px;">
              R&eacute;pondre directement &agrave; cet email enverra la r&eacute;ponse &agrave; ${safeEmail}
            </p>
          </div>
        </div>
      `,
    });

    const truncatedMessage = safeMessage.length > 300 ? safeMessage.slice(0, 300) + "&hellip;" : safeMessage;

    await resend.emails.send({
      from: "Sorell <newsletter@sorell.fr>",
      to: email,
      replyTo: "noe@sorell.fr",
      subject: "Nous avons bien reçu votre message - Sorell",
      html: `
        <div style="font-family: 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="padding: 24px 32px; border-bottom: 2px solid #005058;">
            <span style="font-size: 22px; font-weight: 700; color: #111827;">Sorel<span style="color: #005058;">l</span></span>
          </div>
          <div style="padding: 40px 32px;">
            <h1 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 12px;">Merci pour votre message, ${safeName} !</h1>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 28px;">
              Nous avons bien reçu votre demande et nous vous répondrons dans les plus brefs délais.
            </p>
            <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-left: 4px solid #005058; border-radius: 6px; padding: 20px;">
              <p style="font-size: 12px; color: #6B7280; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Récapitulatif de votre message</p>
              <p style="font-size: 13px; color: #6B7280; margin: 0 0 4px;"><strong style="color: #374151;">Sujet :</strong> ${safeSubject || "Non sp&eacute;cifi&eacute;"}</p>
              <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 8px 0 0; white-space: pre-wrap;">${truncatedMessage}</p>
            </div>
            <p style="font-size: 14px; color: #6B7280; line-height: 1.6; margin: 28px 0 0;">
              Pour toute urgence, vous pouvez nous contacter directement à
              <a href="mailto:noe@sorell.fr" style="color: #005058; text-decoration: none; font-weight: 500;">noe@sorell.fr</a>.
            </p>
          </div>
          <div style="padding: 20px 32px; border-top: 1px solid #E5E7EB; background: #F9FAFB;">
            <p style="font-size: 12px; color: #9CA3AF; margin: 0;">
              Cet email a été envoyé automatiquement suite à votre demande de contact sur sorell.fr.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
