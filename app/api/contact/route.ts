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

    // Rate limit par IP réelle, PAS par email : l'email est fourni par
    // l'appelant, donc le faire varier contournait totalement la limite (spam
    // Resant illimité). L'IP est stable côté Vercel (x-forwarded-for / x-real-ip).
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    try {
      const { success: rateLimitOk } = await emailRateLimit.limit(`contact:${ip}`);
      if (!rateLimitOk) {
        return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
      }
    } catch {
      // Redis indisponible : on laisse passer pour ne pas casser un formulaire
      // de contact légitime (fail-open assumé ; la protection principale reste
      // la clé IP ci-dessus).
    }

    const adminHtml = await render(
      ContactAdminEmail({ name, email, subject, message })
    );

    await resend.emails.send({
      from: "Sorell Contact <noreply@sorell.fr>",
      to: "noe@sorell.fr",
      replyTo: email,
      subject: `[Sorell Contact] ${subject || "Nouveau message"} - ${name}`,
      html: adminHtml,
      text: `Nouveau message de ${name} (${email})\n\nSujet : ${subject || "Non renseigné"}\n\n${message}`,
    });

    const userHtml = await render(
      ContactUserEmail({ name, subject, message })
    );

    await resend.emails.send({
      from: "Sorell <noreply@sorell.fr>",
      to: email,
      replyTo: "noe@sorell.fr",
      subject: "Nous avons bien reçu votre message - Sorell",
      html: userHtml,
      text: `Bonjour ${name},\n\nNous avons bien reçu votre message et reviendrons vers vous rapidement.\n\nSujet : ${subject || "Non renseigné"}\nVotre message : ${message}\n\nÀ bientôt,\nNoé - Sorell\nhttps://www.sorell.fr`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
