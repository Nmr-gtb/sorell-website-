/**
 * Script local : rend les 9 emails lifecycle en fichiers HTML.
 *
 * AUCUN ENVOI. Aucune connexion réseau. Aucune écriture en BDD.
 * Les fichiers sont sauvegardés dans previews/ à la racine du projet.
 *
 * Usage :
 *   npx tsx scripts/render-lifecycle-emails-to-html.ts
 *
 * Puis ouvrir previews/index.html dans le navigateur, ou directement chaque
 * fichier individuel.
 */

import { mkdir, writeFile } from "fs/promises";
import { resolve } from "path";
import { render } from "@react-email/components";
import { VerifyReminderEmail } from "../emails/VerifyReminderEmail";
import { ConfigReminderEmail } from "../emails/ConfigReminderEmail";
import { EngagementFeedbackEmail } from "../emails/EngagementFeedbackEmail";
import { TrialReminderEmail } from "../emails/TrialReminderEmail";
import { LimitReachedEmail } from "../emails/LimitReachedEmail";
import { RetentionInactiveEmail } from "../emails/RetentionInactiveEmail";
import { RetentionUnopenedEmail } from "../emails/RetentionUnopenedEmail";
import { WelcomeEmail } from "../emails/WelcomeEmail";

const OUTPUT_DIR = resolve(process.cwd(), "previews");
const name = "Noé";

interface PreviewJob {
  id: string;
  filename: string;
  subject: string;
  trigger: string;
  render: () => Promise<string>;
}

const jobs: PreviewJob[] = [
  // Email de bienvenue (hors lifecycle, envoyé à l'inscription)
  {
    id: "welcome",
    filename: "00-welcome.html",
    subject: "Bienvenue sur Sorell",
    trigger: "Envoyé à l'inscription (après création du compte)",
    render: async () => {
      const html = await render(
        WelcomeEmail({
          name,
          email: "noe@sorell.fr",
          verifyUrl:
            "https://sorell.fr/api/verify-email?email=noe@sorell.fr&token=…",
        })
      );
      return html;
    },
  },
  // Lifecycle - Activation
  {
    id: "activation_no_verify",
    filename: "01-activation_no_verify.html",
    subject: "Confirmez votre email pour activer Sorell",
    trigger: "24h après signup, email pas encore vérifié",
    render: () => render(VerifyReminderEmail({ name })),
  },
  {
    id: "activation_no_config",
    filename: "02-activation_no_config.html",
    subject: `${name}, votre première newsletter en 5 minutes`,
    trigger: "48h après vérification email, aucun topic configuré",
    render: () => render(ConfigReminderEmail({ name })),
  },
  // Lifecycle - Engagement
  {
    id: "engagement_after_3nl",
    filename: "03-engagement_after_3nl.html",
    subject: `${name}, 3 newsletters reçues - votre avis nous intéresse`,
    trigger: "Après la 3ème newsletter envoyée à l'utilisateur",
    render: () => render(EngagementFeedbackEmail({ name })),
  },
  // Lifecycle - Conversion
  {
    id: "conversion_limit_reached_free",
    filename: "04-conversion_limit_reached_free.html",
    subject: "Vous avez utilisé votre newsletter du mois",
    trigger: "User Free qui a consommé sa newsletter mensuelle",
    render: () =>
      render(LimitReachedEmail({ name, plan: "Free", limit: 1 })),
  },
  {
    id: "conversion_limit_reached_pro",
    filename: "05-conversion_limit_reached_pro.html",
    subject: "Vous avez utilisé vos 4 newsletters du mois",
    trigger: "User Pro qui a atteint sa limite mensuelle",
    render: () => render(LimitReachedEmail({ name, plan: "Pro", limit: 4 })),
  },
  // Lifecycle - Trial
  {
    id: "trial_j3_pro",
    filename: "06-trial_j3_pro.html",
    subject: "Plus que 3 jours d'essai Pro",
    trigger: "3 jours avant la fin de l'essai Pro (15 jours)",
    render: () =>
      render(TrialReminderEmail({ name, plan: "Pro", daysLeft: 3 })),
  },
  {
    id: "trial_j3_business",
    filename: "07-trial_j3_business.html",
    subject: "Plus que 3 jours d'essai Business",
    trigger: "3 jours avant la fin de l'essai Business (15 jours)",
    render: () =>
      render(TrialReminderEmail({ name, plan: "Business", daysLeft: 3 })),
  },
  {
    id: "trial_j1_pro",
    filename: "08-trial_j1_pro.html",
    subject: "Votre essai Pro se termine demain",
    trigger: "Veille de fin d'essai (Pro ou Business)",
    render: () =>
      render(TrialReminderEmail({ name, plan: "Pro", daysLeft: 1 })),
  },
  {
    id: "trial_j0_pro",
    filename: "09-trial_j0_pro.html",
    subject: "Bienvenue dans le plan Pro",
    trigger: "Jour J : abonnement actif après essai",
    render: () =>
      render(TrialReminderEmail({ name, plan: "Pro", daysLeft: 0 })),
  },
  {
    id: "trial_j0_business",
    filename: "10-trial_j0_business.html",
    subject: "Bienvenue dans le plan Business",
    trigger: "Jour J : abonnement actif après essai Business",
    render: () =>
      render(TrialReminderEmail({ name, plan: "Business", daysLeft: 0 })),
  },
  // Lifecycle - Rétention
  {
    id: "retention_no_newsletter_30d",
    filename: "11-retention_no_newsletter_30d.html",
    subject: `${name}, votre veille Sorell s'est arrêtée`,
    trigger: "Aucune newsletter envoyée sur ce compte depuis 30 jours",
    render: () => render(RetentionInactiveEmail({ name })),
  },
  {
    id: "retention_unopened_5nl",
    filename: "12-retention_unopened_5nl.html",
    subject: "Vos newsletters Sorell vous intéressent-elles encore ?",
    trigger: "5 dernières newsletters non ouvertes par le propriétaire",
    render: () => render(RetentionUnopenedEmail({ name })),
  },
];

async function buildIndex(jobs: PreviewJob[]): Promise<string> {
  const rows = jobs
    .map(
      (job) => `
    <tr>
      <td style="padding: 16px 12px; border-bottom: 1px solid #E8E0D8;">
        <a href="${job.filename}" style="color: #005058; text-decoration: none; font-weight: 600;">
          ${job.id}
        </a>
      </td>
      <td style="padding: 16px 12px; border-bottom: 1px solid #E8E0D8; color: #4B5563;">
        ${job.subject}
      </td>
      <td style="padding: 16px 12px; border-bottom: 1px solid #E8E0D8; color: #7A7267; font-size: 13px; font-style: italic;">
        ${job.trigger}
      </td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aperçu des emails Sorell</title>
  <style>
    body {
      font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #F5F0EB;
      margin: 0;
      padding: 40px 24px;
      color: #111827;
    }
    .container {
      max-width: 1100px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 80, 88, 0.08);
      padding: 40px 32px;
    }
    h1 {
      font-size: 28px;
      margin: 0 0 8px;
      color: #005058;
    }
    p.lead {
      color: #4B5563;
      margin: 0 0 32px;
      font-size: 15px;
      line-height: 1.6;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th {
      text-align: left;
      padding: 12px;
      background: #F5F0EB;
      color: #7A7267;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-bottom: 2px solid #E8E0D8;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      background: #00505820;
      color: #005058;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-left: 8px;
      vertical-align: middle;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Aperçu des emails Sorell <span class="badge">${jobs.length} templates</span></h1>
    <p class="lead">
      Liste de tous les emails que vos abonnés peuvent recevoir.
      Cliquez sur un identifiant pour voir le rendu exact que recevra l'utilisateur.
      <br />
      <strong>Aucun email n'a été envoyé pour générer cet aperçu.</strong>
    </p>
    <table>
      <thead>
        <tr>
          <th>Identifiant</th>
          <th>Sujet</th>
          <th>Déclencheur</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</body>
</html>`;
}

async function main(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log(`\n📂 Rendu des ${jobs.length} emails dans ${OUTPUT_DIR}\n`);

  for (const job of jobs) {
    const html = await job.render();
    const path = resolve(OUTPUT_DIR, job.filename);
    // Prefix the email HTML with a small banner identifying the email
    const banner = `<!-- ${job.id} | sujet: ${job.subject} | déclencheur: ${job.trigger} -->\n`;
    await writeFile(path, banner + html, "utf-8");
    console.log(`  ✅ ${job.filename.padEnd(40)} ${job.id}`);
  }

  const indexHtml = await buildIndex(jobs);
  await writeFile(resolve(OUTPUT_DIR, "index.html"), indexHtml, "utf-8");
  console.log(`  ✅ ${"index.html".padEnd(40)} sommaire cliquable`);

  console.log(
    `\n📖 Ouvrir : file://${resolve(OUTPUT_DIR, "index.html")}\n`
  );
}

void main();
