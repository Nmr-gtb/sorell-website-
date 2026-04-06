import { Resend } from "resend";
import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import { emailRateLimit } from "@/lib/ratelimit";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidEmail, truncateInput } from "@/lib/utils";
import { WelcomeEmail } from "@/emails/WelcomeEmail";

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

    const displayName = name || email.split("@")[0];
    const welcomeHtml = await render(WelcomeEmail({ name: displayName, email }));

    await resend.emails.send({
      from: "Sorell <noe@sorell.fr>",
      to: email,
      replyTo: "noe@sorell.fr",
      subject: "Bienvenue sur Sorell",
      html: welcomeHtml,
      text: `Bienvenue sur Sorell, ${displayName} !\n\nVotre veille automatique est en route. Connectez-vous sur https://www.sorell.fr/dashboard pour configurer votre newsletter.\n\nÀ bientôt,\nNoé - Sorell`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
