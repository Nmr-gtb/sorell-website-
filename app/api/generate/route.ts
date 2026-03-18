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
    const { userId, topics, sources } = await request.json();

    if (!userId || !topics?.length) {
      return NextResponse.json({ error: "Missing userId or topics" }, { status: 400 });
    }

    const topicsList = topics
      .filter((t: { enabled: boolean }) => t.enabled)
      .map((t: { label: string }) => t.label)
      .join(", ");

    const sourcesList = sources?.length ? `Sources préférées : ${sources.join(", ")}` : "";

    const prompt = `Tu es un expert en veille sectorielle B2B. Génère une newsletter professionnelle avec exactement 5 articles d'actualité pertinents.

Thématiques demandées : ${topicsList}
${sourcesList}
Date : ${new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

Pour CHAQUE article, génère :
- tag : catégorie courte (ex: "IA", "Réglementation", "Concurrent", "Tendance", "Cybersécurité")
- title : titre accrocheur et professionnel (max 80 caractères)
- summary : résumé en 1-2 phrases (max 150 caractères)
- source : nom du média source crédible (ex: "Les Echos", "TechCrunch", "McKinsey")
- featured : true pour le 1er article (article phare), false pour les autres

IMPORTANT : Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour, sans backticks markdown. Juste le JSON pur.

Exemple de format :
[{"tag":"IA","title":"...","summary":"...","source":"TechCrunch","featured":true},{"tag":"Réglementation","title":"...","summary":"...","source":"Les Echos","featured":false}]`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    const cleanJson = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const articles = JSON.parse(cleanJson);

    const today = new Date();
    const weekNum = Math.ceil(today.getDate() / 7);
    const subject = `Briefing S${weekNum} — ${topicsList.split(",").slice(0, 2).join(" &")}`;

    const { data: newsletter, error } = await supabase
      .from("newsletters")
      .insert({
        user_id: userId,
        subject,
        content: articles,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ newsletter, articles });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Generate error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
