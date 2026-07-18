import type { Resend } from "resend";
import { buildNewsletterHtml, Article, KeyFigure } from "@/lib/email-template";
import { buildUnsubscribeUrl } from "@/lib/unsubscribe-token";

// ---------------------------------------------------------------------------
// Envoi des newsletters par lots via l'API batch de Resend.
//
// Remplace l'ancienne boucle séquentielle (1 await réseau par destinataire,
// ~200-450ms/email) qui menaçait le timeout Vercel 60s dès ~50 destinataires
// et dépassait le rate limit Resend (2 req/s). Le HTML reste rendu PAR
// destinataire (tracking et lien de désabonnement embarquent l'email), mais le
// rendu se fait en parallèle et l'envoi en 1 requête par tranche de 100.
// ---------------------------------------------------------------------------

/** Limite dure de l'API batch Resend : 100 emails par requête. */
const BATCH_SIZE = 100;

export interface NewsletterSendResult {
  email: string;
  success: boolean;
  id?: string;
  error?: string;
}

export interface SendNewsletterEmailsParams {
  resend: Resend;
  newsletterId: string;
  userId: string;
  recipients: Array<{ email: string }>;
  subject: string;
  brandColor: string;
  textColor: string;
  bgColor: string;
  bodyTextColor: string;
  customLogo: string | null;
  date: string;
  editorial: string;
  keyFigures: KeyFigure[];
  featuredArticle: Article;
  otherArticles: Article[];
  plan: string;
}

/**
 * Rend le HTML de chaque destinataire en parallèle puis envoie par lots de 100
 * (mode permissif : un email invalide ne bloque pas le reste de la tranche).
 * Retourne le détail par destinataire et le nombre réellement envoyé — à
 * utiliser pour recipient_count au lieu de recipients.length.
 */
export async function sendNewsletterEmails(
  params: SendNewsletterEmailsParams
): Promise<{ results: NewsletterSendResult[]; sentCount: number }> {
  const {
    resend, newsletterId, userId, recipients, subject,
    brandColor, textColor, bgColor, bodyTextColor, customLogo,
    date, editorial, keyFigures, featuredArticle, otherArticles, plan,
  } = params;

  // 1. Pré-rendu concurrent des HTML (rendu React Email, pas d'appel réseau).
  const messages = await Promise.all(
    recipients.map(async (recipient) => {
      const emailHtml = await buildNewsletterHtml({
        newsletterId,
        recipientEmail: recipient.email,
        subject,
        brandColor,
        textColor,
        bgColor,
        bodyTextColor,
        customLogo,
        date,
        editorial,
        keyFigures,
        featuredArticle,
        otherArticles,
        plan,
      });

      const unsubscribeUrl = buildUnsubscribeUrl(recipient.email, userId);
      return {
        from: "Sorell <newsletters@sorell.fr>",
        replyTo: "noe@sorell.fr",
        to: recipient.email,
        subject,
        html: emailHtml,
        text: `${subject}\n\nPour lire cette newsletter, ouvrez-la dans un client email compatible HTML.\n\nSe désabonner : ${unsubscribeUrl}`,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        // Attribution fiable des webhooks Resend (opened/clicked) : l'id interne
        // voyage avec l'email au lieu d'un matching fragile par subject.
        tags: [
          { name: "newsletter_id", value: newsletterId },
          { name: "user_id", value: userId },
        ],
      };
    })
  );

  // 2. Envoi par tranches de 100, 1 requête réseau par tranche.
  const results: NewsletterSendResult[] = [];

  for (let start = 0; start < messages.length; start += BATCH_SIZE) {
    const chunk = messages.slice(start, start + BATCH_SIZE);
    try {
      const response = await resend.batch.send(chunk, { batchValidation: "permissive" });

      if (response.error || !response.data) {
        // Toute la tranche a échoué (clé invalide, réseau...) : marquer chaque email.
        for (const message of chunk) {
          results.push({ email: message.to, success: false, error: "Échec de l'envoi." });
        }
        continue;
      }

      // Mode permissif : data.data liste les ids des envois réussis dans l'ordre
      // des entrées restantes, data.errors liste les index (relatifs à la tranche)
      // des emails rejetés.
      const failedIndexes = new Set(
        ((response.data as { errors?: Array<{ index: number }> }).errors || []).map((e) => e.index)
      );
      const sentIds = response.data.data;
      let idCursor = 0;

      chunk.forEach((message, index) => {
        if (failedIndexes.has(index)) {
          results.push({ email: message.to, success: false, error: "Échec de l'envoi." });
        } else {
          results.push({ email: message.to, success: true, id: sentIds[idCursor]?.id });
          idCursor += 1;
        }
      });
    } catch {
      for (const message of chunk) {
        results.push({ email: message.to, success: false, error: "Échec de l'envoi." });
      }
    }
  }

  return { results, sentCount: results.filter((r) => r.success).length };
}
