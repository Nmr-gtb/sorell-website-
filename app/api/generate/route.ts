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

    const sourcesList = sources?.length ? `Sources préférées : ${sources.join(", ")}` : "";

    const prompt = `Tu es un rédacteur en chef spécialisé en veille sectorielle B2B. Tu rédiges une newsletter professionnelle, percutante et agréable à lire.

${customBrief ? `BRIEF DU CLIENT (PRIORITÉ ABSOLUE) :
"${customBrief}"
Les articles doivent correspondre EXACTEMENT à cette demande.

` : ""}Thématiques : ${topicsList}
${sourcesList}
Date : ${new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

GÉNÈRE une newsletter au format JSON avec cette structure exacte :

{
  "editorial": "Un paragraphe d'analyse de 2-3 phrases qui donne le ton de la semaine. Identifie la tendance principale ou le fil rouge entre les actualités. Ton professionnel mais engageant, pas corporate.",
  "key_figures": [
    { "value": "chiffre marquant", "label": "explication courte", "context": "source ou contexte" }
  ],
  "articles": [
    {
      "tag": "catégorie courte (ex: IA, Réglementation, Concurrent, Marché...)",
      "title": "titre accrocheur et professionnel (max 80 caractères)",
      "hook": "une phrase d'accroche qui donne envie de lire (max 120 caractères)",
      "content": "2-3 phrases de contenu détaillé. Pas un résumé vague, mais une vraie information avec des chiffres, des noms, des faits concrets. Le lecteur doit apprendre quelque chose.",
      "source": "nom du média source crédible",
      "featured": true
    }
  ]
}

CONSIGNES IMPORTANTES :
- L'éditorial doit être percutant : il résume l'état d'esprit de la semaine en 2-3 phrases max. Pas de blabla.
- key_figures : génère 2-3 chiffres clés UNIQUEMENT si l'actualité s'y prête (stats, montants, pourcentages marquants). Si pas de chiffres pertinents, retourne un tableau vide [].
- articles : génère exactement 5 articles. Le premier est "featured": true.
- Chaque article doit avoir un vrai contenu informatif (pas juste "une entreprise a fait X"). Donne des détails, des chiffres, des implications.
- Le "hook" est une phrase courte et punchy qui donne envie de lire l'article.
- Varie les types d'articles : actu breaking, analyse de fond, chiffre marquant, tendance émergente, mouvement stratégique.
- Varie les sources : presse spécialisée, rapports d'analystes, communiqués, médias internationaux.
- Le ton est professionnel mais pas ennuyeux. Comme un briefing que tu ferais à ton boss le lundi matin.

IMPORTANT : Réponds UNIQUEMENT avec le JSON valide, sans texte autour, sans backticks markdown.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const cleanJson = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleanJson);

    // Gérer les 2 formats possibles (ancien tableau ou nouveau objet)
    let newsletterContent;
    if (Array.isArray(parsed)) {
      // Ancien format (tableau d'articles) — backward compatible
      newsletterContent = { editorial: "", key_figures: [], articles: parsed };
    } else {
      newsletterContent = {
        editorial: parsed.editorial || "",
        key_figures: parsed.key_figures || [],
        articles: parsed.articles || [],
      };
    }

    const today = new Date();
    const weekNum = Math.ceil(today.getDate() / 7);
    const subject = `Briefing S${weekNum} — ${topicsList.split(",").slice(0, 2).join(" &")}`;

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
