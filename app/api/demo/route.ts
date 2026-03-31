import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function cleanCiteTags(text: string): string {
  if (!text) return text;
  return text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, "").trim();
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SECTOR_PROMPTS: Record<string, string> = {
  tech: "Technologies, IA, startups, innovation digitale, cloud computing",
  finance: "Finance, marchés, fintech, investissement, réglementation financière",
  sante: "Santé, biotech, medtech, réglementation pharmaceutique, innovation médicale",
  rh: "Ressources humaines, management, recrutement, droit du travail, formation",
  immobilier: "Immobilier, construction, promotion immobilière, réglementation urbanisme",
  energie: "Énergie, transition énergétique, énergies renouvelables, réglementation environnementale",
};

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 heure

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sector = searchParams.get("sector") || "tech";

  if (!SECTOR_PROMPTS[sector]) {
    return NextResponse.json({ error: "Secteur invalide" }, { status: 400 });
  }

  try {
    // Vérifier le cache
    const { data: cached } = await supabase
      .from("demo_cache")
      .select("*")
      .eq("sector", sector)
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
    const prompt = `Tu es un expert en veille sectorielle B2B. Génère exactement 5 articles d'actualité professionnels et RÉCENTS pour le secteur suivant, basés sur de VRAIES actualités trouvées sur le web.

Secteur : ${SECTOR_PROMPTS[sector]}
Date du jour : ${new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

INSTRUCTIONS :
1. Utilise la recherche web pour trouver des actualités RÉELLES et RÉCENTES (moins de 7 jours) pour ce secteur.
2. Chaque article DOIT être basé sur un vrai article publié avec une vraie URL.

Pour CHAQUE article, génère :
- tag : catégorie courte
- title : titre accrocheur et professionnel (max 80 caractères)
- summary : résumé en 2-3 phrases factuel basé sur le vrai article
- source : nom du média source crédible
- url : URL COMPLÈTE de l'article original (https://...)
- featured : true pour le 1er article, false pour les autres

OPTIMISATION : Effectue MAXIMUM 5 recherches web ciblées. Fais des recherches précises et spécifiques plutôt que des recherches larges. Par exemple, cherche '${SECTOR_PROMPTS[sector]} actualités ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}' plutôt que de faire une recherche par article. Regroupe les informations de chaque recherche pour couvrir les 5 articles.

CRITICAL : Ta réponse doit commencer par { ou [ et se terminer par } ou ]. Aucun texte avant, aucun texte après. Pas de markdown, pas de backticks, pas d'explication. UNIQUEMENT le JSON brut.`;

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
    const articles = (Array.isArray(rawArticles) ? rawArticles : rawArticles.articles || []).map((a: any) => ({
      ...a,
      title: cleanCiteTags(a.title || ""),
      hook: cleanCiteTags(a.hook || ""),
      content: cleanCiteTags(a.content || ""),
      summary: cleanCiteTags(a.summary || ""),
    }));
    const generatedAt = new Date().toISOString();

    // Sauvegarder en cache (upsert)
    await supabase.from("demo_cache").upsert(
      {
        sector,
        content: articles,
        generated_at: generatedAt,
      },
      { onConflict: "sector" }
    );

    return NextResponse.json({ articles, fromCache: false, generatedAt });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
