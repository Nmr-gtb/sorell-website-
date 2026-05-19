import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import { getAuthenticatedAdmin } from "@/lib/admin/auth";
import { VerifyReminderEmail } from "@/emails/VerifyReminderEmail";
import { ConfigReminderEmail } from "@/emails/ConfigReminderEmail";
import { EngagementFeedbackEmail } from "@/emails/EngagementFeedbackEmail";
import { TrialReminderEmail } from "@/emails/TrialReminderEmail";
import { LimitReachedEmail } from "@/emails/LimitReachedEmail";
import { RetentionInactiveEmail } from "@/emails/RetentionInactiveEmail";
import { RetentionUnopenedEmail } from "@/emails/RetentionUnopenedEmail";

// Route admin pour previsualiser un email lifecycle en l'envoyant a
// l'admin (noe@sorell.fr) sans toucher a la table lifecycle_emails.
// Permet de valider visuellement les 9 templates avant d'activer le
// flag LIFECYCLE_EMAILS_PAUSED = false en production.
//
// Usage : POST /api/admin/test-lifecycle
// Body  : { "email_type": "activation_no_verify", "plan": "Pro" }
//   - plan est optionnel, par defaut "Pro" pour les emails qui
//     necessitent un plan (trial_*, conversion_limit_reached).

const resend = new Resend(process.env.RESEND_API_KEY!);

type TestableEmailType =
  | "activation_no_verify"
  | "activation_no_config"
  | "engagement_after_3nl"
  | "conversion_limit_reached"
  | "trial_j3"
  | "trial_j1"
  | "trial_j0"
  | "retention_no_newsletter_30d"
  | "retention_unopened_5nl";

const VALID_TYPES: TestableEmailType[] = [
  "activation_no_verify",
  "activation_no_config",
  "engagement_after_3nl",
  "conversion_limit_reached",
  "trial_j3",
  "trial_j1",
  "trial_j0",
  "retention_no_newsletter_30d",
  "retention_unopened_5nl",
];

function isValidType(value: unknown): value is TestableEmailType {
  return (
    typeof value === "string" &&
    (VALID_TYPES as string[]).includes(value)
  );
}

async function renderEmail(
  emailType: TestableEmailType,
  name: string,
  plan: string
): Promise<{ subject: string; html: string }> {
  switch (emailType) {
    case "activation_no_verify":
      return {
        subject: "[TEST] Confirmez votre email pour activer Sorell",
        html: await render(VerifyReminderEmail({ name })),
      };
    case "activation_no_config":
      return {
        subject: `[TEST] ${name}, votre premiere newsletter en 5 minutes`,
        html: await render(ConfigReminderEmail({ name })),
      };
    case "engagement_after_3nl":
      return {
        subject: `[TEST] ${name}, 3 newsletters reçues - votre avis nous intéresse`,
        html: await render(EngagementFeedbackEmail({ name })),
      };
    case "conversion_limit_reached": {
      const limit = plan === "Free" ? 1 : 4;
      const subject =
        limit === 1
          ? "[TEST] Vous avez utilisé votre newsletter du mois"
          : `[TEST] Vous avez utilisé vos ${limit} newsletters du mois`;
      return {
        subject,
        html: await render(LimitReachedEmail({ name, plan, limit })),
      };
    }
    case "trial_j3":
      return {
        subject: `[TEST] Plus que 3 jours d'essai ${plan}`,
        html: await render(
          TrialReminderEmail({ name, plan, daysLeft: 3 })
        ),
      };
    case "trial_j1":
      return {
        subject: `[TEST] Votre essai ${plan} se termine demain`,
        html: await render(
          TrialReminderEmail({ name, plan, daysLeft: 1 })
        ),
      };
    case "trial_j0":
      return {
        subject: `[TEST] Bienvenue dans le plan ${plan}`,
        html: await render(
          TrialReminderEmail({ name, plan, daysLeft: 0 })
        ),
      };
    case "retention_no_newsletter_30d":
      return {
        subject: `[TEST] ${name}, votre veille Sorell s'est arrêtée`,
        html: await render(RetentionInactiveEmail({ name })),
      };
    case "retention_unopened_5nl":
      return {
        subject:
          "[TEST] Vos newsletters Sorell vous intéressent-elles encore ?",
        html: await render(RetentionUnopenedEmail({ name })),
      };
  }
}

export async function POST(request: Request) {
  const admin = getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { email_type?: unknown; plan?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Body JSON invalide" },
      { status: 400 }
    );
  }

  if (!isValidType(body.email_type)) {
    return NextResponse.json(
      {
        error: "email_type manquant ou invalide",
        valid_types: VALID_TYPES,
      },
      { status: 400 }
    );
  }

  // Defauts raisonnables pour les variables interpolees
  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim()
      : "Noe";
  const planInput = typeof body.plan === "string" ? body.plan : "Pro";
  // Normaliser : Free, Pro ou Business
  const plan =
    planInput === "Free" || planInput === "Business" ? planInput : "Pro";

  try {
    const { subject, html } = await renderEmail(body.email_type, name, plan);

    await resend.emails.send({
      from: "Sorell Test <noreply@sorell.fr>",
      to: admin.email,
      replyTo: "noe@sorell.fr",
      subject,
      html,
      text: `${subject}\n\nPour voir ce message, ouvrez-le dans un client email compatible HTML.\n\nSorell - https://www.sorell.fr`,
    });

    return NextResponse.json({
      success: true,
      sent_to: admin.email,
      email_type: body.email_type,
      subject,
      plan: ["conversion_limit_reached", "trial_j3", "trial_j1", "trial_j0"].includes(
        body.email_type
      )
        ? plan
        : null,
      name,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erreur lors de l'envoi de l'email de test",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// GET : retourne la liste des email_types testables et leurs params
export async function GET(request: Request) {
  const admin = getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  return NextResponse.json({
    valid_types: VALID_TYPES,
    plans_per_type: {
      conversion_limit_reached: ["Free", "Pro"],
      trial_j3: ["Pro", "Business"],
      trial_j1: ["Pro", "Business"],
      trial_j0: ["Pro", "Business"],
    },
    default_plan: "Pro",
    default_name: "Noe",
    usage: {
      method: "POST",
      body: {
        email_type: "<one of valid_types>",
        plan: "<optional, see plans_per_type>",
        name: "<optional, default Noe>",
      },
    },
  });
}
