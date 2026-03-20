import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId, topics, sources, customBrief } = await request.json();

    if (!userId || !topics?.length) {
      return NextResponse.json({ error: "Missing userId or topics" }, { status: 400 });
    }

    const topicsList = topics
      .filter((t: { enabled: boolean }) => t.enabled)
      .map((t: { label: string }) => t.label)
      .join(", ");

    const sourcesList = sources?.length ? `Sources préférées (à inclure si pertinent, mais ne te limite PAS à celles-ci - cherche sur TOUT le web) : ${sources.join(", ")}` : "";

    const prompt = `Tu es un rédacteur en chef spécialisé en veille sectorielle B2B. Tu dois rédiger une newsletter basée sur de VRAIES actualités récentes trouvées sur le web.

${customBrief ? `BRIEF DU CLIENT (PRIORITÉ ABSOLUE) :
"${customBrief}"
Les articles doivent correspondre EXACTEMENT à cette demande.

` : ""}Thématiques : ${topicsList}
${sourcesList}
Date du jour : ${new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

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
- OPTIMISATION : Effectue MAXIMUM 5 recherches web ciblées. Fais des recherches précises et spécifiques plutôt que des recherches larges. Par exemple, cherche '${topicsList} actualités ${new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}' plutôt que de faire une recherche par article. Regroupe les informations de chaque recherche pour couvrir les 5 articles.
- Cherche sur TOUT le web, pas seulement les sources listées. Les sources préférées sont indicatives, pas restrictives. L'objectif est de trouver les actualités les plus pertinentes peu importe d'où elles viennent.
- TOUS les articles doivent avoir une URL réelle et fonctionnelle vers la source.
- Si tu ne trouves pas 5 articles récents pertinents, réduis à ce que tu trouves (minimum 3).
- key_figures : 2-3 chiffres trouvés dans les articles. Si pas de chiffres pertinents, tableau vide [].
- Le premier article est "featured": true.
- Sois factuel : ne déforme pas les informations des articles sources.
- L'éditorial doit faire le lien entre les différentes actus trouvées.

IMPORTANT : Réponds UNIQUEMENT avec le JSON valide, sans texte autour, sans backticks markdown.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      tools: [
        {
          type: "web_search_20250305" as "web_search_20250305",
          name: "web_search",
        },
      ],
      messages: [{ role: "user", content: prompt }],
    });

    // Extraire le texte de la réponse (peut contenir plusieurs blocs avec web search)
    let responseText = "";
    for (const block of message.content) {
      if (block.type === "text") {
        responseText = block.text;
      }
    }

    const cleanJson = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleanJson);

    // Gérer les 2 formats possibles (ancien tableau ou nouveau objet)
    let newsletterContent;
    if (Array.isArray(parsed)) {
      // Ancien format (tableau d'articles) - backward compatible
      newsletterContent = { editorial: "", key_figures: [], articles: parsed };
    } else {
      newsletterContent = {
        editorial: parsed.editorial || "",
        key_figures: parsed.key_figures || [],
        articles: parsed.articles || [],
      };
    }

    const featuredArticle = newsletterContent.articles.find((a: { featured: boolean }) => a.featured) || newsletterContent.articles[0];
    const dateLabel = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    const subject = featuredArticle
      ? `${featuredArticle.tag} - ${featuredArticle.title.slice(0, 60)}`
      : `Votre veille du ${dateLabel}`;

    const { data: newsletter, error } = await supabase
      .from("newsletters")
      .insert({
        user_id: userId,
        subject,
        content: newsletterContent,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ newsletter, articles: newsletterContent.articles, editorial: newsletterContent.editorial, keyFigures: newsletterContent.key_figures });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Generate error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
