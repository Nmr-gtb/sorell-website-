import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const resend = new Resend(process.env.RESEND_API_KEY!);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === "production" && process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const franceTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const currentHour = franceTime.getHours();
  const currentDay = franceTime.getDay();
  const currentDate = franceTime.getDate();

  const { data: configs, error } = await supabase
    .from("newsletter_config")
    .select("*")
    .not("topics", "eq", "[]");

  if (error || !configs?.length) {
    return NextResponse.json({ message: "No configs to process", error });
  }

  const results = [];

  for (const config of configs) {
    try {
      if (currentHour !== (config.send_hour ?? 9)) continue;

      const freq = config.frequency ?? "weekly";
      const sendDay = config.send_day ?? "monday";

      if (freq === "weekly") {
        const targetDay = DAY_MAP[sendDay];
        if (targetDay === undefined || currentDay !== targetDay) continue;
      } else if (freq === "monthly") {
        if (sendDay === "1st" && currentDate !== 1) continue;
        if (sendDay === "15th" && currentDate !== 15) continue;
      }

      if (config.last_sent_at) {
        const lastSent = new Date(config.last_sent_at);
        const lastSentFrance = new Date(lastSent.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
        if (lastSentFrance.toDateString() === franceTime.toDateString()) continue;
      }

      const topics = (config.topics ?? []).filter((t: { enabled: boolean }) => t.enabled).map((t: { label: string }) => t.label).join(", ");
      const sources = (config.sources ?? []).join(", ");
      const customBrief = config.custom_brief ?? "";

      const prompt = `Tu es un expert en veille sectorielle B2B. Génère une newsletter professionnelle avec exactement 5 articles d'actualité pertinents et RÉCENTS.

${customBrief ? `BRIEF DU CLIENT (PRIORITÉ ABSOLUE) :
"${customBrief}"

Ce brief décrit exactement ce que le client veut recevoir. Les articles doivent correspondre à cette demande en priorité.

` : ""}Thématiques : ${topics}
${sources ? `Sources préférées : ${sources}` : ""}
Date : ${franceTime.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

CONSIGNES :
- Si un brief personnalisé est fourni, génère des articles qui correspondent EXACTEMENT à cette demande
- Les articles doivent être réalistes, professionnels et ressembler à de vrais articles de presse
- Chaque article doit apporter une information concrète et actionnable

Pour CHAQUE article, génère :
- tag : catégorie courte
- title : titre accrocheur et professionnel (max 80 caractères)
- summary : résumé en 1-2 phrases (max 150 caractères)
- source : nom du média source crédible
- featured : true pour le 1er article, false pour les autres

IMPORTANT : Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour, sans backticks markdown.`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      const responseText = message.content[0].type === "text" ? message.content[0].text : "";
      const cleanJson = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const articles = JSON.parse(cleanJson);

      const subject = `Briefing — ${franceTime.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;

      const { data: newsletter } = await supabase
        .from("newsletters")
        .insert({ user_id: config.user_id, subject, content: articles, status: "draft" })
        .select()
        .single();

      if (!newsletter) continue;

      const { data: recipients } = await supabase
        .from("recipients")
        .select("*")
        .eq("user_id", config.user_id);

      if (!recipients?.length) continue;

      const featuredArticle = articles.find((a: { featured: boolean }) => a.featured) || articles[0];
      const otherArticles = articles.filter((a: { featured: boolean }) => a !== featuredArticle);

      for (const recipient of recipients) {
        const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#FFFFFF;">
<div style="padding:24px 32px;border-bottom:1px solid #E5E7EB;">
<span style="font-size:18px;font-weight:700;color:#111827;letter-spacing:-0.02em;">Sorel<span style="color:#2563EB;">l</span></span>
</div>
<div style="padding:32px 32px 24px;">
<h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;">${subject}</h1>
<p style="font-size:14px;color:#6B7280;margin:0;">Votre veille sectorielle personnalisée</p>
</div>
<div style="padding:0 32px 24px;">
<div style="background:#F9FAFB;border-radius:8px;padding:20px;border:1px solid #E5E7EB;">
<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:rgba(37,99,235,0.08);color:#2563EB;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">Article phare · ${featuredArticle.tag}</span>
<a href="https://www.sorell.fr/api/track/click?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}&article=${encodeURIComponent(featuredArticle.title)}&url=${encodeURIComponent("https://sorell.fr")}" style="color:#111827;text-decoration:none;">
<h2 style="font-size:17px;font-weight:600;color:#111827;margin:8px 0 6px;line-height:1.35;">${featuredArticle.title}</h2>
</a>
<p style="font-size:14px;color:#6B7280;margin:0 0 6px;line-height:1.5;">${featuredArticle.summary}</p>
<span style="font-size:12px;color:#9CA3AF;">${featuredArticle.source}</span>
</div>
</div>
<div style="padding:0 32px 32px;">
${otherArticles.map((a: { tag: string; title: string; summary: string; source: string }) => `
<div style="padding:16px 0;border-top:1px solid #E5E7EB;">
<span style="display:inline-block;padding:2px 8px;border-radius:4px;background:#F3F4F6;color:#374151;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">${a.tag}</span>
<a href="https://www.sorell.fr/api/track/click?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}&article=${encodeURIComponent(a.title)}&url=${encodeURIComponent("https://sorell.fr")}" style="color:#111827;text-decoration:none;">
<h3 style="font-size:15px;font-weight:600;color:#111827;margin:4px 0;line-height:1.35;">${a.title}</h3>
</a>
<p style="font-size:13px;color:#6B7280;margin:0 0 4px;line-height:1.5;">${a.summary}</p>
<span style="font-size:11px;color:#9CA3AF;">${a.source}</span>
</div>`).join("")}
</div>
<div style="padding:20px 32px;border-top:1px solid #E5E7EB;text-align:center;">
<p style="font-size:12px;color:#9CA3AF;margin:0;">Généré automatiquement par Sorel<span style="color:#2563EB;">l</span> · <a href="https://sorell.fr" style="color:#9CA3AF;">Se désabonner</a></p>
</div>
</div>
<img src="https://www.sorell.fr/api/track/open?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}" width="1" height="1" style="display:none;" alt="" />
</body></html>`;

        try {
          await resend.emails.send({
            from: "Sorell <newsletter@sorell.fr>",
            to: recipient.email,
            subject,
            html: emailHtml,
          });
        } catch (e) {
          console.error(`Failed to send to ${recipient.email}:`, e);
        }
      }

      await supabase.from("newsletters").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", newsletter.id);
      await supabase.from("newsletter_config").update({ last_sent_at: new Date().toISOString() }).eq("user_id", config.user_id);

      results.push({ userId: config.user_id, status: "sent", recipients: recipients.length });
    } catch (err) {
      console.error(`Error processing config ${config.user_id}:`, err);
      results.push({ userId: config.user_id, status: "error", error: String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
