/**
 * Script local : envoie les 9 emails lifecycle a une adresse de test
 * pour validation visuelle avant activation du flag LIFECYCLE_EMAILS_PAUSED.
 *
 * Usage :
 *   npx tsx --env-file=.env.local scripts/preview-lifecycle-emails.ts
 *
 * Optionnel : adresse cible custom
 *   npx tsx --env-file=.env.local scripts/preview-lifecycle-emails.ts autre@mail.com
 *
 * Securite : ce script n'ecrit RIEN dans la base de donnees (ni
 * lifecycle_emails, ni newsletter_events). Il rend juste les templates
 * et envoie via Resend. Re-executable autant de fois que necessaire.
 */

import { Resend } from "resend";
import { render } from "@react-email/components";
import { VerifyReminderEmail } from "../emails/VerifyReminderEmail";
import { ConfigReminderEmail } from "../emails/ConfigReminderEmail";
import { EngagementFeedbackEmail } from "../emails/EngagementFeedbackEmail";
import { TrialReminderEmail } from "../emails/TrialReminderEmail";
import { LimitReachedEmail } from "../emails/LimitReachedEmail";
import { RetentionInactiveEmail } from "../emails/RetentionInactiveEmail";
import { RetentionUnopenedEmail } from "../emails/RetentionUnopenedEmail";

const DEFAULT_TARGET = "mur.noe.celony@gmail.com";
const target = process.argv[2] || DEFAULT_TARGET;
const name = "Noe";

if (!process.env.RESEND_API_KEY) {
  console.error(
    "❌ RESEND_API_KEY manquant. Verifie que .env.local est charge via --env-file=.env.local"
  );
  process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

interface PreviewJob {
  id: string;
  subject: string;
  render: () => Promise<string>;
}

const jobs: PreviewJob[] = [
  {
    id: "activation_no_verify",
    subject: "[TEST] Confirmez votre email pour activer Sorell",
    render: () => render(VerifyReminderEmail({ name })),
  },
  {
    id: "activation_no_config",
    subject: `[TEST] ${name}, votre premiere newsletter en 5 minutes`,
    render: () => render(ConfigReminderEmail({ name })),
  },
  {
    id: "engagement_after_3nl",
    subject: `[TEST] ${name}, 3 newsletters reçues - votre avis nous intéresse`,
    render: () => render(EngagementFeedbackEmail({ name })),
  },
  {
    id: "conversion_limit_reached (Free)",
    subject: "[TEST] Vous avez utilisé votre newsletter du mois",
    render: () => render(LimitReachedEmail({ name, plan: "Free", limit: 1 })),
  },
  {
    id: "conversion_limit_reached (Pro)",
    subject: "[TEST] Vous avez utilisé vos 4 newsletters du mois",
    render: () => render(LimitReachedEmail({ name, plan: "Pro", limit: 4 })),
  },
  {
    id: "trial_j3 (Pro)",
    subject: "[TEST] Plus que 3 jours d'essai Pro",
    render: () =>
      render(TrialReminderEmail({ name, plan: "Pro", daysLeft: 3 })),
  },
  {
    id: "trial_j3 (Business)",
    subject: "[TEST] Plus que 3 jours d'essai Business",
    render: () =>
      render(TrialReminderEmail({ name, plan: "Business", daysLeft: 3 })),
  },
  {
    id: "trial_j1 (Pro)",
    subject: "[TEST] Votre essai Pro se termine demain",
    render: () =>
      render(TrialReminderEmail({ name, plan: "Pro", daysLeft: 1 })),
  },
  {
    id: "trial_j0 (Pro)",
    subject: "[TEST] Bienvenue dans le plan Pro",
    render: () =>
      render(TrialReminderEmail({ name, plan: "Pro", daysLeft: 0 })),
  },
  {
    id: "trial_j0 (Business)",
    subject: "[TEST] Bienvenue dans le plan Business",
    render: () =>
      render(TrialReminderEmail({ name, plan: "Business", daysLeft: 0 })),
  },
  {
    id: "retention_no_newsletter_30d",
    subject: `[TEST] ${name}, votre veille Sorell s'est arrêtée`,
    render: () => render(RetentionInactiveEmail({ name })),
  },
  {
    id: "retention_unopened_5nl",
    subject: "[TEST] Vos newsletters Sorell vous intéressent-elles encore ?",
    render: () => render(RetentionUnopenedEmail({ name })),
  },
];

async function sendOne(job: PreviewJob): Promise<{ ok: boolean; error?: string }> {
  try {
    const html = await job.render();
    await resend.emails.send({
      from: "Sorell Test <noreply@sorell.fr>",
      to: target,
      replyTo: "noe@sorell.fr",
      subject: job.subject,
      html,
      text: `${job.subject}\n\nPour voir ce message, ouvrez-le dans un client email compatible HTML.\n\nSorell - https://www.sorell.fr`,
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

async function main(): Promise<void> {
  console.log(`\n📧 Envoi des ${jobs.length} previews lifecycle à ${target}\n`);

  let sent = 0;
  let failed = 0;

  for (const job of jobs) {
    process.stdout.write(`  ${job.id.padEnd(40)} ... `);
    const result = await sendOne(job);
    if (result.ok) {
      sent++;
      console.log("✅ envoyé");
    } else {
      failed++;
      console.log(`❌ ${result.error}`);
    }
    // Petite pause pour respecter les rate limits Resend
    // (2 req/sec en plan gratuit, on est large avec 600ms).
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(`\n📊 Résultat : ${sent}/${jobs.length} envoyés, ${failed} échecs\n`);
  process.exit(failed > 0 ? 1 : 0);
}

void main();
