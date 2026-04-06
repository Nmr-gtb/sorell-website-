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
}

export function buildNewsletterPrompt(params: BuildPromptParams): string {
  const {
    topics,
    sources,
    customBrief,
    dateString,
    searchDateHint,
    previousTitles,
  } = params;

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
    ? `BRIEF DU CLIENT (PRIORITÉ ABSOLUE) :
"${customBrief}"
Les articles doivent correspondre EXACTEMENT à cette demande.

`
    : ""
}Thématiques : ${topics}
${sourcesLine}
Date du jour : ${dateString}

INSTRUCTIONS :
1. Utilise la recherche web pour trouver 5 actualités RÉELLES et RÉCENTES (moins de 7 jours) correspondant aux thématiques demandées.
2. Pour chaque actualité trouvée, rédige un article de newsletter professionnel.
3. Chaque article DOIT être basé sur un vrai article publié avec une vraie URL.

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
      "featured": true
    }
  ]
}

CONSIGNES :
- OPTIMISATION : Effectue MAXIMUM 5 recherches web ciblées. Fais des recherches précises et spécifiques plutôt que des recherches larges. Par exemple, cherche '${topics} actualités ${searchDateHint}' plutôt que de faire une recherche par article. Regroupe les informations de chaque recherche pour couvrir les 5 articles.
- Cherche sur TOUT le web, pas seulement les sources listées. Les sources préférées sont indicatives, pas restrictives. L'objectif est de trouver les actualités les plus pertinentes peu importe d'où elles viennent.
- TOUS les articles doivent avoir une URL réelle et fonctionnelle vers la source.
- Si tu ne trouves pas 5 articles récents pertinents, réduis à ce que tu trouves (minimum 3).
- key_figures : 2-3 chiffres trouvés dans les articles. Si pas de chiffres pertinents, tableau vide [].
- Le premier article est "featured": true.
- Sois factuel : ne déforme pas les informations des articles sources.
- L'éditorial doit faire le lien entre les différentes actus trouvées.

RÈGLES DE DIVERSITÉ DU CONTENU (OBLIGATOIRE) :

1. JAMAIS de doublons : Si un sujet a été traité dans les newsletters précédentes (voir liste ci-dessous si elle existe), NE PAS le reprendre. Chercher des actualités NOUVELLES publiées dans les 7 derniers jours.

2. VARIER les angles : Si un sujet majeur domine l'actualité (ex: une nouvelle réglementation), traiter UN SEUL article dessus et chercher 4 autres sujets COMPLÈTEMENT DIFFÉRENTS. Si ce sujet majeur a déjà été couvert la semaine précédente, chercher plutôt : les réactions des entreprises, les cas concrets d'application, les impacts business chiffrés, les solutions adoptées par les acteurs du secteur, ou passer à un autre sujet.

3. DIVERSIFIER les catégories : Les 5 articles doivent couvrir AU MINIMUM 3 catégories différentes parmi :
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

CRITICAL : Ta réponse doit commencer par { ou [ et se terminer par } ou ]. Aucun texte avant, aucun texte après. Pas de markdown, pas de backticks, pas d'explication. UNIQUEMENT le JSON brut.`;
}

// --- Claude API call + JSON parsing ----------------------------------------

export interface NewsletterContent {
  editorial: string;
  key_figures: Array<{ value: string; label: string; context: string }>;
  articles: Array<{
    tag: string;
    title: string;
    hook: string;
    content: string;
    summary?: string;
    source: string;
    url: string;
    featured: boolean;
  }>;
}

/** Call Claude Haiku with web search, parse & clean the JSON response. */
export async function generateNewsletterContent(
  prompt: string
): Promise<NewsletterContent> {
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
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
    newsletterContent.articles = newsletterContent.articles.map(
      (a: Record<string, unknown>) => ({
        ...a,
        title: cleanCiteTags((a.title as string) || ""),
        hook: cleanCiteTags((a.hook as string) || ""),
        content: cleanCiteTags((a.content as string) || ""),
        summary: cleanCiteTags((a.summary as string) || ""),
      })
    ) as NewsletterContent["articles"];
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
