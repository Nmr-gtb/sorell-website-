import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Shared newsletter generation logic used by /api/generate and /api/cron
// ---------------------------------------------------------------------------

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// --- Helpers ---------------------------------------------------------------

/** Remove <cite> tags injected by Claude web-search responses. */
export function cleanCiteTags(text: string): string {
  if (!text) return text;
  return text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, "").trim();
}

/** Extract previous article titles from recent newsletters (anti-duplicate). */
export function extractPreviousTitles(
  recentNewsletters: { content: unknown }[]
): string[] {
  const allTitles: string[] = [];
  for (const nl of recentNewsletters) {
    try {
      const parsed =
        typeof nl.content === "string" ? JSON.parse(nl.content) : nl.content;
      if (parsed.featuredArticle?.title)
        allTitles.push(parsed.featuredArticle.title);
      if (parsed.articles) {
        for (const a of parsed.articles) {
          if (a.title) allTitles.push(a.title);
        }
      }
    } catch {
      // ignore parsing errors
    }
  }
  return allTitles;
}

// --- Prompt ----------------------------------------------------------------

export interface BuildPromptParams {
  topics: string;
  sources: string;
  customBrief: string;
  dateString: string;
  searchDateHint: string;
  previousTitles: string[];
  feedbackHistory?: Array<{ feedback: string; date: string }>;
  currentFeedback?: string;
  /** Nombre d'articles visé (dépend du plan). Défaut 5. */
  articleCount?: number;
}

/** Build the feedback injection block for the prompt (empty string if no feedback). */
function buildFeedbackBlock(
  feedbackHistory?: Array<{ feedback: string; date: string }>,
  currentFeedback?: string
): string {
  const hasFeedbackHistory = feedbackHistory && feedbackHistory.length > 0;
  const hasCurrentFeedback = currentFeedback && currentFeedback.trim().length > 0;

  if (!hasFeedbackHistory && !hasCurrentFeedback) {
    return "";
  }

  let block = `
=== RETOURS DE L'UTILISATEUR ===
L'utilisateur a donné ces retours sur les newsletters précédentes. Tu DOIS en tenir compte :`;

  if (hasFeedbackHistory) {
    const recentFeedbacks = [...feedbackHistory]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    for (const entry of recentFeedbacks) {
      block += `\n- [${entry.date}] ${entry.feedback}`;
    }
  }

  if (hasCurrentFeedback) {
    block += `

FEEDBACK ACTUEL (priorité maximale) :
${currentFeedback}`;
  }

  block += `
=== FIN DES RETOURS ===
`;

  return block;
}

export function buildNewsletterPrompt(params: BuildPromptParams): string {
  const {
    topics,
    sources,
    customBrief,
    dateString,
    searchDateHint,
    previousTitles,
    feedbackHistory,
    currentFeedback,
    articleCount,
  } = params;

  const count = articleCount ?? 5;

  const sourcesLine = sources
    ? `Sources préférées (à inclure si pertinent, mais ne te limite PAS à celles-ci - cherche sur TOUT le web) : ${sources}`
    : "";

  let previousTopicsBlock = "";
  if (previousTitles.length > 0) {
    previousTopicsBlock = `

=== SUJETS DÉJÀ TRAITÉS DANS LES NEWSLETTERS PRÉCÉDENTES ===
NE PAS reprendre ces sujets. NE PAS reformuler les mêmes informations. Chercher des actualités COMPLÈTEMENT DIFFÉRENTES.
${previousTitles.map((t) => "- " + t).join("\n")}
=== FIN DES SUJETS DÉJÀ TRAITÉS ===`;
  }

  return `Tu es un rédacteur en chef spécialisé en veille sectorielle B2B. Tu dois rédiger une newsletter basée sur de VRAIES actualités récentes trouvées sur le web.

${
  customBrief
    ? `BRIEF DU CLIENT :
"${customBrief}"

Essaie d'abord de trouver des articles qui correspondent précisément à ce brief. Si tu ne trouves pas suffisamment d'articles récents (<90 jours) collant au brief, ÉLARGIS à la thématique générale (${topics}) et au secteur d'activité concerné. L'objectif est de livrer une newsletter UTILE et RÉCENTE.

`
    : ""
}Thématiques : ${topics}
${sourcesLine}
Date du jour : ${dateString}

INSTRUCTIONS :
1. Utilise la recherche web pour trouver ${count} actualités RÉELLES et RÉCENTES (moins de 30 jours idéalement, maximum 90 jours) correspondant aux thématiques demandées.
2. Pour chaque actualité trouvée, rédige un article de newsletter professionnel.
3. Chaque article DOIT être basé sur un vrai article publié avec une vraie URL.
4. Chaque article DOIT indiquer sa date de publication exacte (published_at) au format YYYY-MM-DD. Utilise la date affichée sur la page source. Ne devine pas, ne hallucine pas : si tu ne trouves pas la date précise, écarte l'article.

GÉNÈRE un JSON avec cette structure exacte :

{
  "editorial": "Un paragraphe d'analyse de 2-3 phrases qui donne le ton de la semaine. Identifie la tendance principale ou le fil rouge entre les actualités. Ton professionnel mais engageant.",
  "key_figures": [
    { "value": "chiffre marquant trouvé dans les articles", "label": "explication courte", "context": "source" }
  ],
  "articles": [
    {
      "tag": "catégorie courte",
      "title": "titre accrocheur basé sur le vrai article (max 80 chars)",
      "hook": "une phrase d'accroche (max 120 chars)",
      "content": "2-3 phrases de contenu factuel basé sur le vrai article. Chiffres, noms, faits concrets.",
      "source": "nom du média (ex: Les Echos, TechCrunch, Reuters...)",
      "url": "URL COMPLÈTE de l'article original (https://...)",
      "published_at": "YYYY-MM-DD (date de publication lue sur la page source)",
      "featured": true
    }
  ]
}

CONSIGNES :
- OPTIMISATION : Effectue MAXIMUM ${Math.min(8, count + 1)} recherches web ciblées. Fais des recherches précises et spécifiques plutôt que des recherches larges. Par exemple, cherche '${topics} actualités ${searchDateHint}' plutôt que de faire une recherche par article. Regroupe les informations de chaque recherche pour couvrir les ${count} articles.
- Cherche sur TOUT le web, pas seulement les sources listées. Les sources préférées sont indicatives, pas restrictives. L'objectif est de trouver les actualités les plus pertinentes peu importe d'où elles viennent.
- TOUS les articles doivent avoir une URL réelle et fonctionnelle vers la source.
- FRAÎCHEUR OBLIGATOIRE : ne retiens QUE les articles publiés dans les 90 derniers jours maximum. Écarte sans exception les articles plus anciens, même s'ils semblent pertinents.
- Si tu ne trouves pas ${count} articles récents pertinents, réduis à ce que tu trouves (minimum 3). Mieux vaut quelques articles frais que des articles périmés.
- key_figures : 2-3 chiffres trouvés dans les articles. Si pas de chiffres pertinents, tableau vide [].
- Le premier article est "featured": true.
- Sois factuel : ne déforme pas les informations des articles sources.
- L'éditorial doit faire le lien entre les différentes actus trouvées.

RÈGLES DE DIVERSITÉ DU CONTENU (OBLIGATOIRE) :

1. JAMAIS de doublons : Si un sujet a été traité dans les newsletters précédentes (voir liste ci-dessous si elle existe), NE PAS le reprendre. Chercher des actualités NOUVELLES publiées dans les 7 derniers jours.

2. VARIER les angles : Si un sujet majeur domine l'actualité (ex: une nouvelle réglementation), traiter UN SEUL article dessus et chercher 4 autres sujets COMPLÈTEMENT DIFFÉRENTS. Si ce sujet majeur a déjà été couvert la semaine précédente, chercher plutôt : les réactions des entreprises, les cas concrets d'application, les impacts business chiffrés, les solutions adoptées par les acteurs du secteur, ou passer à un autre sujet.

3. DIVERSIFIER les catégories : Les ${count} articles doivent couvrir AU MINIMUM 3 catégories différentes parmi :
   - Réglementation / Conformité
   - Innovation produit / R&D
   - Marché / Business / Chiffres
   - International / Export
   - Tendances consommateurs
   - Concurrence / Fusions-acquisitions
   - Digital / Tech / IA
   - RH / Emploi / Formation
   - Développement durable / RSE
   - Événements / Salons / Congrès

4. PRIORISER la nouveauté : Privilégier les articles publiés dans les 3-4 derniers jours. Éviter les articles qui datent de plus de 7 jours. Si la recherche web ne retourne que des résultats anciens, élargir les termes de recherche pour trouver des actualités fraîches.

5. FORMAT des tags : Chaque article doit avoir un tag de catégorie DIFFÉRENT (pas 3 articles avec le tag "RÉGLEMENTATION"). Utiliser des tags variés et spécifiques.

STRATÉGIE DE RECHERCHE WEB :
- Effectuer au moins 3 recherches web avec des termes DIFFÉRENTS
- Recherche 1 : actualités récentes du secteur (cette semaine)
- Recherche 2 : innovations, nouveaux produits, lancements récents
- Recherche 3 : chiffres marché, business, levées de fonds, résultats financiers
- NE PAS chercher les mêmes termes que la semaine précédente
- Varier les mots-clés : ne pas toujours chercher "réglementation [secteur]" mais aussi "innovation [secteur]", "marché [secteur]", "tendance [secteur] 2026", "entreprise [secteur] actualité"
${previousTopicsBlock}
${buildFeedbackBlock(feedbackHistory, currentFeedback)}
CRITICAL : Ta réponse doit commencer par { ou [ et se terminer par } ou ]. Aucun texte avant, aucun texte après. Pas de markdown, pas de backticks, pas d'explication. UNIQUEMENT le JSON brut.`;
}

// --- Claude API call + JSON parsing ----------------------------------------

export interface NewsletterArticle {
  tag: string;
  title: string;
  hook: string;
  content: string;
  summary?: string;
  source: string;
  url: string;
  featured: boolean;
  published_at?: string;
}

export interface NewsletterContent {
  editorial: string;
  key_figures: Array<{ value: string; label: string; context: string }>;
  articles: NewsletterArticle[];
}

/** Default model when none is provided (free plan / public contexts). */
export const DEFAULT_MODEL = "claude-haiku-4-5-20251001";

/** Call Claude with web search, parse & clean the JSON response.
 *  The model defaults to Haiku but can be overridden per plan (Sonnet/Opus). */
export async function generateNewsletterContent(
  prompt: string,
  model: string = DEFAULT_MODEL,
  maxTokens: number = 4096
): Promise<NewsletterContent> {
  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    tools: [
      {
        type: "web_search_20250305" as const,
        name: "web_search",
      },
    ],
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = message.content
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { type: string; text?: string }) => block.text || "")
    .join("");

  return parseAndCleanResponse(responseText);
}

/** Parse Claude's raw text response into a clean NewsletterContent object. */
export function parseAndCleanResponse(responseText: string): NewsletterContent {
  // Remove markdown backticks
  let cleanJson = responseText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Find the JSON boundaries
  const firstBrace = cleanJson.indexOf("{");
  const firstBracket = cleanJson.indexOf("[");
  let startIndex = -1;

  if (firstBrace === -1 && firstBracket === -1) {
    throw new Error("Aucun JSON trouvé dans la réponse");
  }

  if (firstBrace === -1) startIndex = firstBracket;
  else if (firstBracket === -1) startIndex = firstBrace;
  else startIndex = Math.min(firstBrace, firstBracket);

  const isObject = cleanJson[startIndex] === "{";
  const lastIndex = isObject
    ? cleanJson.lastIndexOf("}")
    : cleanJson.lastIndexOf("]");

  if (lastIndex === -1 || lastIndex <= startIndex) {
    throw new Error("JSON incomplet dans la réponse");
  }

  cleanJson = cleanJson.substring(startIndex, lastIndex + 1);
  const parsed = JSON.parse(cleanJson);

  // Handle both formats (legacy array or object)
  let newsletterContent: NewsletterContent;
  if (Array.isArray(parsed)) {
    newsletterContent = { editorial: "", key_figures: [], articles: parsed };
  } else {
    newsletterContent = {
      editorial: parsed.editorial || "",
      key_figures: parsed.key_figures || [],
      articles: parsed.articles || [],
    };
  }

  // Clean cite tags from all content
  if (newsletterContent.editorial) {
    newsletterContent.editorial = cleanCiteTags(newsletterContent.editorial);
  }
  if (newsletterContent.articles) {
    newsletterContent.articles = (
      newsletterContent.articles as unknown as Array<Record<string, unknown>>
    ).map((a) => {
      const rawPublishedAt = a.published_at;
      return {
        ...a,
        title: cleanCiteTags((a.title as string) || ""),
        hook: cleanCiteTags((a.hook as string) || ""),
        content: cleanCiteTags((a.content as string) || ""),
        summary: cleanCiteTags((a.summary as string) || ""),
        published_at:
          typeof rawPublishedAt === "string" && rawPublishedAt.trim()
            ? rawPublishedAt.trim()
            : undefined,
      } as NewsletterArticle;
    });
  }
  if (newsletterContent.key_figures) {
    newsletterContent.key_figures = newsletterContent.key_figures.map(
      (f: Record<string, unknown>) => ({
        value: cleanCiteTags((f.value as string) || ""),
        label: cleanCiteTags((f.label as string) || ""),
        context: cleanCiteTags((f.context as string) || ""),
      })
    );
  }

  return newsletterContent;
}

// --- Régénération ciblée (mode éditeur) --------------------------------------
// Le mode éditeur permet de régénérer un seul bloc du brouillon (un article,
// l'édito ou les chiffres clés) sans toucher au reste de la newsletter.

export interface SingleArticleParams {
  topics: string;
  sources: string;
  customBrief: string;
  dateString: string;
  searchDateHint: string;
  /** Titres à exclure : les autres articles du brouillon + les newsletters récentes. */
  excludeTitles: string[];
}

export function buildSingleArticlePrompt(params: SingleArticleParams): string {
  const { topics, sources, customBrief, dateString, searchDateHint, excludeTitles } = params;

  const sourcesLine = sources
    ? `Sources préférées (indicatives, pas restrictives - cherche sur TOUT le web) : ${sources}`
    : "";

  const briefBlock = customBrief
    ? `BRIEF DU CLIENT :
"${customBrief}"

`
    : "";

  const excludeBlock = excludeTitles.length
    ? `
=== SUJETS DÉJÀ TRAITÉS (INTERDITS) ===
NE PAS reprendre ces sujets, NE PAS reformuler les mêmes informations. Chercher une actualité COMPLÈTEMENT DIFFÉRENTE.
${excludeTitles.map((t) => "- " + t).join("\n")}
=== FIN DES SUJETS INTERDITS ===
`
    : "";

  return `Tu es un rédacteur en chef spécialisé en veille sectorielle B2B. Tu dois rédiger UN SEUL article de newsletter basé sur une VRAIE actualité récente trouvée sur le web.

${briefBlock}Thématiques : ${topics}
${sourcesLine}
Date du jour : ${dateString}

INSTRUCTIONS :
1. Utilise la recherche web (MAXIMUM 3 recherches ciblées, ex: '${topics} actualités ${searchDateHint}') pour trouver UNE actualité RÉELLE et RÉCENTE (moins de 30 jours idéalement, maximum 90 jours).
2. L'article DOIT être basé sur un vrai article publié avec une vraie URL.
3. L'article DOIT indiquer sa date de publication exacte (published_at) au format YYYY-MM-DD, lue sur la page source. Si tu ne trouves pas la date précise, écarte l'article et cherches-en un autre.
4. FRAÎCHEUR OBLIGATOIRE : uniquement un article publié dans les 90 derniers jours.
${excludeBlock}
GÉNÈRE un JSON avec cette structure exacte (un seul objet, pas de tableau) :

{
  "tag": "catégorie courte",
  "title": "titre accrocheur basé sur le vrai article (max 80 chars)",
  "hook": "une phrase d'accroche (max 120 chars)",
  "content": "2-3 phrases de contenu factuel basé sur le vrai article. Chiffres, noms, faits concrets.",
  "source": "nom du média (ex: Les Echos, TechCrunch, Reuters...)",
  "url": "URL COMPLÈTE de l'article original (https://...)",
  "published_at": "YYYY-MM-DD"
}

CRITICAL : Ta réponse doit commencer par { et se terminer par }. Aucun texte avant, aucun texte après. Pas de markdown, pas de backticks, pas d'explication. UNIQUEMENT le JSON brut.`;
}

/** Parse the raw response of a single-article regeneration into a clean article. */
export function parseSingleArticleResponse(responseText: string): NewsletterArticle | null {
  const cleanJson = responseText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const start = cleanJson.indexOf("{");
  const end = cleanJson.lastIndexOf("}");
  if (start === -1 || end <= start) return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleanJson.substring(start, end + 1));
  } catch {
    return null;
  }

  // Tolère un objet enveloppé ({ articles: [...] } ou { article: {...} })
  if (Array.isArray(parsed.articles) && parsed.articles.length) {
    parsed = parsed.articles[0] as Record<string, unknown>;
  } else if (parsed.article && typeof parsed.article === "object") {
    parsed = parsed.article as Record<string, unknown>;
  }

  const title = cleanCiteTags((parsed.title as string) || "");
  const url = typeof parsed.url === "string" ? parsed.url.trim() : "";
  if (!title || !url) return null;

  const rawPublishedAt = parsed.published_at;
  return {
    tag: cleanCiteTags((parsed.tag as string) || ""),
    title,
    hook: cleanCiteTags((parsed.hook as string) || ""),
    content: cleanCiteTags((parsed.content as string) || ""),
    source: cleanCiteTags((parsed.source as string) || ""),
    url,
    featured: false,
    published_at:
      typeof rawPublishedAt === "string" && rawPublishedAt.trim()
        ? rawPublishedAt.trim()
        : undefined,
  };
}

export interface SingleArticleOptions {
  /** Claude model to use (dépend du plan). */
  model?: string;
  /** Reference date for the freshness check. Default now. */
  referenceDate?: Date;
  /** Max age in days. Default 90. */
  maxAgeDays?: number;
}

/**
 * Regenerate a single article with web search.
 * Returns null when no fresh, valid article could be produced.
 */
export async function generateSingleArticle(
  params: SingleArticleParams,
  options: SingleArticleOptions = {}
): Promise<NewsletterArticle | null> {
  const model = options.model ?? DEFAULT_MODEL;
  const refDate = options.referenceDate ?? new Date();
  const maxAge = options.maxAgeDays ?? 90;

  const prompt = buildSingleArticlePrompt(params);
  const message = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    tools: [
      {
        type: "web_search_20250305" as const,
        name: "web_search",
      },
    ],
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = message.content
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { type: string; text?: string }) => block.text || "")
    .join("");

  const article = parseSingleArticleResponse(responseText);
  if (!article) return null;
  if (!isArticleFresh(article, refDate, maxAge)) return null;
  return article;
}

/**
 * Rewrite the editorial based on the current articles of the draft.
 * Plain text call, no web search needed.
 */
export async function regenerateEditorial(
  articles: NewsletterArticle[],
  model: string = DEFAULT_MODEL
): Promise<string | null> {
  const articlesBlock = articles
    .map((a, i) => `${i + 1}. [${a.tag}] ${a.title} — ${a.content || a.hook || ""}`)
    .join("\n");

  const prompt = `Tu es un rédacteur en chef spécialisé en veille sectorielle B2B. Voici les articles de la newsletter de cette semaine :

${articlesBlock}

Rédige un éditorial de 2-3 phrases qui donne le ton de la semaine. Identifie la tendance principale ou le fil rouge entre ces actualités. Ton professionnel mais engageant. Sois factuel, ne déforme pas les informations.

CRITICAL : Réponds UNIQUEMENT avec le texte de l'éditorial. Pas de guillemets, pas de titre, pas d'explication.`;

  const message = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { type: string; text?: string }) => block.text || "")
    .join("")
    .trim();

  const cleaned = cleanCiteTags(text);
  return cleaned || null;
}

/**
 * Re-extract the key figures from the current articles of the draft.
 * Plain text call, no web search needed.
 */
export async function regenerateKeyFigures(
  articles: NewsletterArticle[],
  model: string = DEFAULT_MODEL
): Promise<Array<{ value: string; label: string; context: string }> | null> {
  const articlesBlock = articles
    .map((a, i) => `${i + 1}. [${a.tag}] ${a.title} — ${a.content || a.hook || ""} (source : ${a.source})`)
    .join("\n");

  const prompt = `Tu es un rédacteur en chef spécialisé en veille sectorielle B2B. Voici les articles de la newsletter de cette semaine :

${articlesBlock}

Extrais 2-3 chiffres marquants présents dans ces articles. Ne pas inventer de chiffres : uniquement ceux mentionnés dans les textes ci-dessus. S'il n'y a pas de chiffres pertinents, renvoie un tableau vide.

GÉNÈRE un JSON avec cette structure exacte :
[
  { "value": "chiffre marquant", "label": "explication courte", "context": "source" }
]

CRITICAL : Ta réponse doit commencer par [ et se terminer par ]. Aucun texte avant, aucun texte après. Pas de markdown, pas de backticks. UNIQUEMENT le JSON brut.`;

  const message = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { type: string; text?: string }) => block.text || "")
    .join("")
    .trim();

  const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(cleaned.substring(start, end + 1));
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((f: Record<string, unknown>) => f && typeof f === "object")
      .slice(0, 3)
      .map((f: Record<string, unknown>) => ({
        value: cleanCiteTags((f.value as string) || ""),
        label: cleanCiteTags((f.label as string) || ""),
        context: cleanCiteTags((f.context as string) || ""),
      }))
      .filter((f) => f.value);
  } catch {
    return null;
  }
}

// --- Subject line builder --------------------------------------------------

export function buildSubjectLine(
  newsletterContent: NewsletterContent,
  dateLabel: string
): string {
  const featuredArticle =
    newsletterContent.articles.find(
      (a: { featured: boolean }) => a.featured
    ) || newsletterContent.articles[0];

  let subject = featuredArticle
    ? `${featuredArticle.tag} - ${featuredArticle.title}`
    : `Votre veille du ${dateLabel}`;

  if (subject.length > 65) {
    subject = subject.substring(0, 62) + "...";
  }

  return subject;
}

// --- Freshness filter ------------------------------------------------------

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Parse an article's published_at string (YYYY-MM-DD or ISO) into a Date. */
function parsePublishedAt(raw: string | undefined | null): Date | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Accept YYYY-MM-DD and full ISO timestamps
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Decide whether an article is recent enough to be included.
 * Returns false if published_at is missing, unparseable, or outside the window.
 */
export function isArticleFresh(
  article: NewsletterArticle,
  referenceDate: Date = new Date(),
  maxAgeDays: number = 90
): boolean {
  const published = parsePublishedAt(article.published_at);
  if (!published) return false;
  const ageDays =
    (referenceDate.getTime() - published.getTime()) / MS_PER_DAY;
  // Allow a 1-day slack for timezone differences when article is "in the future"
  return ageDays >= -1 && ageDays <= maxAgeDays;
}

/** Split articles into fresh vs stale buckets. */
export function filterFreshArticles(
  articles: NewsletterArticle[],
  referenceDate: Date = new Date(),
  maxAgeDays: number = 90
): { fresh: NewsletterArticle[]; stale: NewsletterArticle[] } {
  const fresh: NewsletterArticle[] = [];
  const stale: NewsletterArticle[] = [];
  for (const a of articles) {
    if (isArticleFresh(a, referenceDate, maxAgeDays)) fresh.push(a);
    else stale.push(a);
  }
  return { fresh, stale };
}

/** Ensure exactly one article carries featured: true. */
function ensureFeaturedFlag(articles: NewsletterArticle[]): NewsletterArticle[] {
  if (!articles.length) return articles;
  if (articles.some((a) => a.featured)) return articles;
  return articles.map((a, i) => ({ ...a, featured: i === 0 }));
}

/** De-duplicate a list of articles by URL (lowercased). */
function dedupeByUrl(articles: NewsletterArticle[]): NewsletterArticle[] {
  const seen = new Set<string>();
  const out: NewsletterArticle[] = [];
  for (const a of articles) {
    const key = (a.url || "").toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

export interface FreshNewsletterOptions {
  /** Minimum number of fresh articles required before broadening. Default 3. */
  minFreshArticles?: number;
  /** Max age in days for an article to count as fresh. Default 90. */
  maxAgeDays?: number;
  /** Reference date for the freshness check. Default now. */
  referenceDate?: Date;
  /** Hard cap on articles kept in the final newsletter. Default 5. */
  maxArticles?: number;
  /** Claude model to use. Defaults to Haiku; pass Sonnet/Opus for higher plans. */
  model?: string;
}

export interface FreshNewsletterResult {
  content: NewsletterContent;
  broadened: boolean;
  freshArticleCount: number;
  staleArticleCount: number;
  attempts: number;
}

/**
 * Generate a newsletter with freshness enforcement.
 *
 * - Calls Claude with the user's brief.
 * - Filters out articles older than maxAgeDays (90 by default).
 * - If < minFreshArticles remain AND a brief was provided, retries once
 *   without the brief (fallback to the general topics).
 * - Combines both passes (brief first, then broadened), dedupes by URL,
 *   trims to maxArticles, and returns the result plus metadata.
 */
export async function generateFreshNewsletter(
  params: BuildPromptParams,
  options: FreshNewsletterOptions = {}
): Promise<FreshNewsletterResult> {
  const minFresh = options.minFreshArticles ?? 3;
  const maxAge = options.maxAgeDays ?? 90;
  const refDate = options.referenceDate ?? new Date();
  const maxArticles = options.maxArticles ?? 5;
  const model = options.model ?? DEFAULT_MODEL;
  // Plus d'articles = plus de tokens nécessaires pour ne pas couper le JSON.
  // Plafond à 12000 pour les newsletters longues (jusqu'à 12 articles, plans
  // premium sur Opus) — largement sous les limites de sortie des modèles.
  const maxTokens = Math.min(12000, 3000 + maxArticles * 550);
  // On demande au modèle le nombre d'articles visé (dépend du plan).
  const promptParams: BuildPromptParams = { ...params, articleCount: maxArticles };

  // --- Attempt 1 : with brief ---------------------------------------------
  const firstPrompt = buildNewsletterPrompt(promptParams);
  const firstContent = await generateNewsletterContent(firstPrompt, model, maxTokens);
  const first = filterFreshArticles(firstContent.articles, refDate, maxAge);

  const hasBrief = Boolean(params.customBrief && params.customBrief.trim());
  const firstEnough = first.fresh.length >= minFresh;

  if (firstEnough || !hasBrief) {
    const kept = ensureFeaturedFlag(
      dedupeByUrl(first.fresh).slice(0, maxArticles)
    );
    return {
      content: {
        editorial: firstContent.editorial,
        key_figures: kept.length ? firstContent.key_figures : [],
        articles: kept,
      },
      broadened: false,
      freshArticleCount: kept.length,
      staleArticleCount: first.stale.length,
      attempts: 1,
    };
  }

  // --- Attempt 2 : broadened (drop the brief) -----------------------------
  const broadenedParams: BuildPromptParams = {
    ...promptParams,
    customBrief: "",
  };
  const secondPrompt = buildNewsletterPrompt(broadenedParams);
  const secondContent = await generateNewsletterContent(secondPrompt, model, maxTokens);
  const second = filterFreshArticles(secondContent.articles, refDate, maxAge);

  // Brief-specific articles first, then sector-wide to fill up
  const combined = ensureFeaturedFlag(
    dedupeByUrl([...first.fresh, ...second.fresh]).slice(0, maxArticles)
  );

  return {
    content: {
      editorial: secondContent.editorial || firstContent.editorial,
      key_figures: combined.length
        ? secondContent.key_figures.length
          ? secondContent.key_figures
          : firstContent.key_figures
        : [],
      articles: combined,
    },
    broadened: true,
    freshArticleCount: combined.length,
    staleArticleCount: first.stale.length + second.stale.length,
    attempts: 2,
  };
}
