import { Resend } from "resend";
import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import { isValidEmail, truncateInput } from "@/lib/utils";
import { emailRateLimit } from "@/lib/ratelimit";
import { ContactAdminEmail } from "@/emails/ContactAdminEmail";
import { ContactUserEmail } from "@/emails/ContactUserEmail";

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

    const adminHtml = await render(
      ContactAdminEmail({ name, email, subject, message })
    );

    await resend.emails.send({
      from: "Sorell Contact <newsletter@sorell.fr>",
      to: "noe@sorell.fr",
      replyTo: email,
      subject: `[Sorell Contact] ${subject || "Nouveau message"} - ${name}`,
      html: adminHtml,
    });

    const userHtml = await render(
      ContactUserEmail({ name, subject, message })
    );

    await resend.emails.send({
      from: "Sorell <newsletter@sorell.fr>",
      to: email,
      replyTo: "noe@sorell.fr",
      subject: "Nous avons bien reçu votre message - Sorell",
      html: userHtml,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
