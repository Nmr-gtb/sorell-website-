import { Resend } from "resend";
import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import { emailRateLimit } from "@/lib/ratelimit";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidEmail, truncateInput } from "@/lib/utils";
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
    const name = truncateInput(String(raw.name || ""), 200);

    // Toujours l'email de l'utilisateur AUTHENTIFIÉ, jamais une adresse du corps
    // (empêche l'envoi d'un email de bienvenue + lien de vérification à des tiers).
    const email = user.email;
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    try {
      const { success: rateLimitOk } = await emailRateLimit.limit(email);
      if (!rateLimitOk) {
        return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
      }
    } catch {
      // Redis unavailable — allow welcome email to proceed
    }

    const displayName = name || email.split("@")[0];
    const verifyUrl = buildVerifyEmailUrl(email);
    const welcomeHtml = await render(WelcomeEmail({ name: displayName, email, verifyUrl }));

    await resend.emails.send({
      from: "Sorell <noreply@sorell.fr>",
      to: email,
      replyTo: "noe@sorell.fr",
      subject: "Bienvenue sur Sorell",
      html: welcomeHtml,
      text: `Bienvenue sur Sorell, ${displayName} !\n\nVotre veille automatique est en route. Confirmez votre adresse email en cliquant sur ce lien :\n${verifyUrl}\n\nA bientot,\nNoe - Sorell`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
