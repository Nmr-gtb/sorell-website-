import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { emailRateLimit } from "@/lib/ratelimit";

function cleanCiteTags(text: string): string {
  if (!text) return text;
  return text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, "").trim();
}

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SECTOR_PROMPTS: Record<string, Record<string, string>> = {
  fr: {
    tech: "Technologies, IA, startups, innovation digitale, cloud computing",
    finance: "Finance, marchés, fintech, investissement, réglementation financière",
    sante: "Santé, biotech, medtech, réglementation pharmaceutique, innovation médicale",
    rh: "Ressources humaines, management, recrutement, droit du travail, formation",
    immobilier: "Immobilier, construction, promotion immobilière, réglementation urbanisme",
    energie: "Énergie, transition énergétique, énergies renouvelables, réglementation environnementale",
  },
  en: {
    tech: "Technology, AI, startups, digital innovation, cloud computing",
    finance: "Finance, markets, fintech, investment, financial regulation",
    sante: "Healthcare, biotech, medtech, pharmaceutical regulation, medical innovation",
    rh: "Human resources, management, recruitment, labor law, training",
    immobilier: "Real estate, construction, property development, urban planning regulation",
    energie: "Energy, energy transition, renewable energy, environmental regulation",
  },
};

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 heure

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sector = searchParams.get("sector") || "tech";
  const lang = searchParams.get("lang") === "en" ? "en" : "fr";
  const sectorPrompts = SECTOR_PROMPTS[lang];

  if (!sectorPrompts[sector]) {
    return NextResponse.json({ error: "Secteur invalide" }, { status: 400 });
  }

  // Rate limit by IP to prevent API cost abuse (5 req/hour)
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  try {
    const { success: rateLimitOk } = await emailRateLimit.limit(`demo:${ip}`);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Trop de requetes. Reessayez dans une heure." },
        { status: 429 }
      );
    }
  } catch {
    // Rate limiter unavailable — fail close to prevent uncontrolled API costs
    return NextResponse.json(
      { error: "Service temporairement indisponible. Réessayez dans quelques minutes." },
      { status: 503 }
    );
  }

  try {
    // Vérifier le cache (clé = sector_lang pour séparer FR/EN)
    const cacheKey = `${sector}_${lang}`;
    const { data: cached } = await supabase
      .from("demo_cache")
      .select("*")
      .eq("sector", cacheKey)
      .single();

    if (cached && cached.generated_at) {
      const cacheAge = Date.now() - new Date(cached.generated_at).getTime();
      if (cacheAge < CACHE_DURATION_MS) {
        return NextResponse.json({
          articles: cached.content,
          fromCache: true,
          generatedAt: cached.generated_at,
        });
      }
    }

    // Générer avec Claude
    const sectorLabel = sectorPrompts[sector];
    const dateFmt = lang === "fr" ? "fr-FR" : "en-US";
    const dateStr = new Date().toLocaleDateString(dateFmt, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const monthStr = new Date().toLocaleDateString(dateFmt, { month: "long", year: "numeric" });

    const prompt = lang === "fr"
      ? `Tu es un expert en veille sectorielle B2B. Génère exactement 5 articles d'actualité professionnels et RÉCENTS pour le secteur suivant, basés sur de VRAIES actualités trouvées sur le web.

Secteur : ${sectorLabel}
Date du jour : ${dateStr}

INSTRUCTIONS :
1. Utilise la recherche web pour trouver des actualités RÉELLES et RÉCENTES (moins de 7 jours) pour ce secteur.
2. Chaque article DOIT être basé sur un vrai article publié avec une vraie URL.
3. TOUS les titres, tags, résumés et contenus DOIVENT être rédigés en FRANÇAIS. Si la source est en anglais, traduis le contenu en français.

Pour CHAQUE article, génère :
- tag : catégorie courte (en français)
- title : titre accrocheur et professionnel en français (max 80 caractères)
- summary : résumé en 2-3 phrases factuel en français basé sur le vrai article
- source : nom du média source crédible
- url : URL COMPLÈTE de l'article original (https://...)
- image_url : URL de l'image principale de l'article si disponible (sinon null)
- featured : true pour le 1er article, false pour les autres

OPTIMISATION : Effectue MAXIMUM 5 recherches web ciblées. Fais des recherches précises et spécifiques plutôt que des recherches larges. Par exemple, cherche '${sectorLabel} actualités ${monthStr}' plutôt que de faire une recherche par article. Regroupe les informations de chaque recherche pour couvrir les 5 articles.

CRITICAL : Ta réponse doit commencer par { ou [ et se terminer par } ou ]. Aucun texte avant, aucun texte après. Pas de markdown, pas de backticks, pas d'explication. UNIQUEMENT le JSON brut.`
      : `You are a B2B industry intelligence expert. Generate exactly 5 professional and RECENT news articles for the following sector, based on REAL news found on the web.

Sector: ${sectorLabel}
Today's date: ${dateStr}

INSTRUCTIONS:
1. Use web search to find REAL and RECENT news (less than 7 days old) for this sector.
2. Each article MUST be based on a real published article with a real URL.
3. ALL titles, tags, summaries and content MUST be written in ENGLISH.

For EACH article, generate:
- tag: short category (in English)
- title: catchy and professional title in English (max 80 characters)
- summary: 2-3 sentence factual summary in English based on the real article
- source: name of the credible media source
- url: FULL URL of the original article (https://...)
- image_url: URL of the article's main image if available (otherwise null)
- featured: true for the 1st article, false for the others

OPTIMIZATION: Perform MAXIMUM 5 targeted web searches. Use precise and specific searches rather than broad ones. For example, search '${sectorLabel} news ${monthStr}' rather than searching per article. Group information from each search to cover all 5 articles.

CRITICAL: Your response must start with { or [ and end with } or ]. No text before, no text after. No markdown, no backticks, no explanation. ONLY raw JSON.`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      tools: [
        {
          type: "web_search_20250305" as "web_search_20250305",
          name: "web_search",
        },
      ],
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { type: string; text?: string }) => block.text || "")
      .join("");

    // Nettoyer : supprimer backticks markdown
    let cleanJson = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    // Extraire le JSON : trouver le premier { ou [ et le dernier } ou ]
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
    const lastIndex = isObject ? cleanJson.lastIndexOf("}") : cleanJson.lastIndexOf("]");

    if (lastIndex === -1 || lastIndex <= startIndex) {
      throw new Error("JSON incomplet dans la réponse");
    }

    cleanJson = cleanJson.substring(startIndex, lastIndex + 1);
    const rawArticles = JSON.parse(cleanJson);
    interface RawArticle {
      title?: string;
      hook?: string;
      content?: string;
      summary?: string;
      image_url?: string | null;
      tag?: string;
      source?: string;
      url?: string;
      featured?: boolean;
    }
    const articles = (Array.isArray(rawArticles) ? rawArticles : rawArticles.articles || []).map((a: RawArticle) => ({
      ...a,
      title: cleanCiteTags(a.title || ""),
      hook: cleanCiteTags(a.hook || ""),
      content: cleanCiteTags(a.content || ""),
      summary: cleanCiteTags(a.summary || ""),
      image_url: a.image_url || null,
    }));
    const generatedAt = new Date().toISOString();

    // Sauvegarder en cache (upsert)
    await supabase.from("demo_cache").upsert(
      {
        sector: cacheKey,
        content: articles,
        generated_at: generatedAt,
      },
      { onConflict: "sector" }
    );

    return NextResponse.json({ articles, fromCache: false, generatedAt });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
