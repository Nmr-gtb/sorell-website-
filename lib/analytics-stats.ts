// Calcul des statistiques d'analytics — module pur, sans I/O, testé unitairement.
//
// Règles de justesse (issues de l'audit du 21/07/2026) :
// - Les taux se calculent sur des événements DÉDUPLIQUÉS par couple
//   (newsletter_id, recipient_email) : la route pixel "open" déduplique déjà à
//   l'insertion, mais la route "click" enregistre CHAQUE clic — sans dédup ici,
//   un destinataire qui clique 5 fois produisait un taux de clic de 500 %.
// - Un dénominateur inconnu (recipient_count absent ou 0 sur une newsletter
//   historique) donne un taux null (affiché « — ») — jamais un dénominateur
//   inventé à partir de la liste de destinataires actuelle.
// - Les compteurs bruts (totalOpens, totalClicks, Top articles) restent NON
//   dédupliqués : ce sont des volumes d'engagement, pas des taux.

export interface AnalyticsNewsletterRow {
  id: string;
  subject: string | null;
  sent_at: string | null;
  recipient_count: number | null;
  content: unknown;
}

export interface AnalyticsEventRow {
  newsletter_id: string;
  recipient_email: string | null;
  event_type: string;
  metadata?: { article?: string } | null;
}

export interface NewsletterStats {
  id: string;
  date: string | null;
  subject: string | null;
  recipients: number | null;
  openRate: number | null;
  clickRate: number | null;
  articleCount: number;
}

export interface AnalyticsResult {
  openRate: number | null;
  clickRate: number | null;
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  activeRecipients: number;
  newsletters: NewsletterStats[];
  topArticles: Array<{ title: string; clicks: number }>;
  trend: Array<{ date: string | null; value: number }>;
}

function uniquePairs(events: AnalyticsEventRow[]): Set<string> {
  return new Set(events.map((e) => `${e.newsletter_id}|${e.recipient_email ?? ""}`));
}

function uniqueCountFor(pairs: Set<string>, newsletterId: string): number {
  let count = 0;
  for (const pair of pairs) {
    if (pair.startsWith(`${newsletterId}|`)) count++;
  }
  return count;
}

function clampRate(numerator: number, denominator: number): number {
  return Math.min(100, Math.round((numerator / denominator) * 100));
}

export function computeAnalytics(
  newsletters: AnalyticsNewsletterRow[],
  events: AnalyticsEventRow[],
  activeRecipients: number
): AnalyticsResult {
  const opens = events.filter((e) => e.event_type === "open");
  const clicks = events.filter((e) => e.event_type === "click");
  const uniqueOpens = uniquePairs(opens);
  const uniqueClicks = uniquePairs(clicks);

  const perNewsletter: NewsletterStats[] = newsletters.map((nl) => {
    const denominator = nl.recipient_count && nl.recipient_count > 0 ? nl.recipient_count : null;
    return {
      id: nl.id,
      date: nl.sent_at,
      subject: nl.subject,
      recipients: denominator,
      openRate: denominator ? clampRate(uniqueCountFor(uniqueOpens, nl.id), denominator) : null,
      clickRate: denominator ? clampRate(uniqueCountFor(uniqueClicks, nl.id), denominator) : null,
      articleCount: Array.isArray(nl.content) ? nl.content.length : 0,
    };
  });

  // Taux globaux : uniquement sur les newsletters au dénominateur connu,
  // pour ne pas polluer le taux avec des envois au dénominateur inventé.
  const known = newsletters.filter((nl) => nl.recipient_count && nl.recipient_count > 0);
  const totalRecipients = known.reduce((sum, nl) => sum + (nl.recipient_count as number), 0);
  const knownIds = new Set(known.map((nl) => nl.id));
  const knownOpens = [...uniqueOpens].filter((pair) => knownIds.has(pair.split("|")[0])).length;
  const knownClicks = [...uniqueClicks].filter((pair) => knownIds.has(pair.split("|")[0])).length;
  const openRate = totalRecipients > 0 ? clampRate(knownOpens, totalRecipients) : null;
  const clickRate = totalRecipients > 0 ? clampRate(knownClicks, totalRecipients) : null;

  // Top articles : volume de clics brut, en excluant les clics sans titre
  // (sinon une entrée vide peut truster le classement).
  const articleClicks: Record<string, number> = {};
  for (const click of clicks) {
    const article = click.metadata?.article;
    if (!article) continue;
    articleClicks[article] = (articleClicks[article] || 0) + 1;
  }
  const topArticles = Object.entries(articleClicks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([title, count]) => ({ title, clicks: count }));

  // Tendance : les 8 derniers envois au taux connu, du plus ancien au plus
  // récent, avec leur vraie date (le client formate le label).
  const trend = perNewsletter
    .filter((nl) => nl.openRate !== null)
    .slice(0, 8)
    .reverse()
    .map((nl) => ({ date: nl.date, value: nl.openRate as number }));

  return {
    openRate,
    clickRate,
    totalSent: newsletters.length,
    totalOpens: opens.length,
    totalClicks: clicks.length,
    activeRecipients,
    newsletters: perNewsletter.slice(0, 10),
    topArticles,
    trend,
  };
}
