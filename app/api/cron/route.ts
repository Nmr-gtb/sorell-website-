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
  const cronSecret = process.env.CRON_SECRET;
  // Accepter si : pas de secret configuré, ou header correct, ou header absent (cron-job.org)
  if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

      const prompt = `Tu es un rédacteur en chef spécialisé en veille sectorielle B2B. Tu dois rédiger une newsletter basée sur de VRAIES actualités récentes trouvées sur le web.

${customBrief ? `BRIEF DU CLIENT (PRIORITÉ ABSOLUE) :
"${customBrief}"
Les articles doivent correspondre EXACTEMENT à cette demande.

` : ""}Thématiques : ${topics}
${sources ? `Sources préférées (à inclure si pertinent, mais ne te limite PAS à celles-ci - cherche sur TOUT le web) : ${sources}` : ""}
Date du jour : ${franceTime.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

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
- OPTIMISATION : Effectue MAXIMUM 5 recherches web ciblées. Fais des recherches précises et spécifiques plutôt que des recherches larges. Par exemple, cherche '${topics} actualités ${franceTime.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}' plutôt que de faire une recherche par article. Regroupe les informations de chaque recherche pour couvrir les 5 articles.
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
      const cleanJson = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      // Gérer les 2 formats possibles (ancien tableau ou nouveau objet)
      let newsletterContent;
      if (Array.isArray(parsed)) {
        newsletterContent = { editorial: "", key_figures: [], articles: parsed };
      } else {
        newsletterContent = {
          editorial: parsed.editorial || "",
          key_figures: parsed.key_figures || [],
          articles: parsed.articles || [],
        };
      }
      const articles = newsletterContent.articles;

      const dateLabel = franceTime.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
      const subjectArticle = articles.find((a: { featured: boolean }) => a.featured) || articles[0];
      const subject = subjectArticle
        ? `${subjectArticle.tag} - ${subjectArticle.title.slice(0, 60)}`
        : `Votre veille du ${dateLabel}`;

      const { data: newsletter } = await supabase
        .from("newsletters")
        .insert({ user_id: config.user_id, subject, content: newsletterContent, status: "draft" })
        .select()
        .single();

      if (!newsletter) continue;

      const { data: recipients } = await supabase
        .from("recipients")
        .select("*")
        .eq("user_id", config.user_id);

      if (!recipients?.length) continue;

      const featuredArticle = articles.find((a: { featured: boolean; url?: string }) => a.featured) || articles[0];
      const otherArticles = articles.filter((a: { featured: boolean; url?: string }) => a !== featuredArticle);

      const { editorial, key_figures: keyFigures } = newsletterContent;

      for (const recipient of recipients) {
        const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;">

    <!-- Header -->
    <div style="padding:28px 32px;border-bottom:2px solid #2563EB;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <span style="font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.02em;">Sorel<span style="color:#2563EB;">l</span></span>
          </td>
          <td align="right">
            <span style="font-size:12px;color:#9CA3AF;">${franceTime.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Subject -->
    <div style="padding:28px 32px 20px;">
      <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 6px;letter-spacing:-0.02em;line-height:1.3;">${subject}</h1>
      <p style="font-size:13px;color:#9CA3AF;margin:0;">Votre veille sectorielle personnalisée par IA</p>
    </div>

    ${editorial ? `
    <!-- Éditorial -->
    <div style="padding:0 32px 24px;">
      <div style="border-left:3px solid #2563EB;padding:16px 20px;background:#F8FAFC;border-radius:0 8px 8px 0;">
        <p style="font-size:11px;font-weight:600;color:#2563EB;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;">Éditorial</p>
        <p style="font-size:14px;color:#374151;line-height:1.65;margin:0;font-style:italic;">${editorial}</p>
      </div>
    </div>
    ` : ""}

    ${keyFigures.length > 0 ? `
    <!-- Chiffres clés -->
    <div style="padding:0 32px 24px;">
      <p style="font-size:11px;font-weight:600;color:#2563EB;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Chiffres clés</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${keyFigures.map((fig: { value: string; label: string; context: string }) => `
          <td style="padding:12px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;text-align:center;width:${Math.floor(100 / keyFigures.length)}%;">
            <div style="font-size:22px;font-weight:700;color:#2563EB;letter-spacing:-0.02em;margin-bottom:4px;">${fig.value}</div>
            <div style="font-size:12px;color:#111827;font-weight:500;margin-bottom:2px;">${fig.label}</div>
            <div style="font-size:11px;color:#9CA3AF;">${fig.context}</div>
          </td>
          `).join('<td style="width:8px;"></td>')}
        </tr>
      </table>
    </div>
    ` : ""}

    <!-- Article phare -->
    <div style="padding:0 32px 24px;">
      <div style="background:#F8FAFC;border-radius:10px;padding:24px;border:1px solid #E5E7EB;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <span style="display:inline-block;padding:3px 10px;border-radius:4px;background:#2563EB;color:white;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Article phare · ${featuredArticle.tag}</span>
            </td>
          </tr>
        </table>
        <a href="https://www.sorell.fr/api/track/click?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}&article=${encodeURIComponent(featuredArticle.title)}&url=${encodeURIComponent(featuredArticle.url || "https://sorell.fr")}" style="text-decoration:none;">
          <h2 style="font-size:18px;font-weight:700;color:#111827;margin:12px 0 8px;line-height:1.35;letter-spacing:-0.01em;">${featuredArticle.title}</h2>
        </a>
        ${featuredArticle.hook ? `<p style="font-size:14px;color:#2563EB;margin:0 0 10px;font-weight:500;">${featuredArticle.hook}</p>` : ""}
        <p style="font-size:14px;color:#4B5563;line-height:1.65;margin:0 0 10px;">${featuredArticle.content || featuredArticle.summary || ""}</p>
        <span style="font-size:12px;color:#9CA3AF;">Source : ${featuredArticle.source}</span>
        ${featuredArticle.url ? `<br/><a href="https://www.sorell.fr/api/track/click?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}&article=${encodeURIComponent(featuredArticle.title)}&url=${encodeURIComponent(featuredArticle.url)}" style="font-size:12px;color:#2563EB;text-decoration:none;font-weight:500;">Lire l'article →</a>` : ""}
      </div>
    </div>

    <!-- Autres articles -->
    <div style="padding:0 32px 16px;">
      <p style="font-size:11px;font-weight:600;color:#2563EB;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 16px;">Les actus de la semaine</p>
      ${otherArticles.map((a: { tag: string; title: string; hook?: string; content?: string; summary?: string; source: string }, i: number) => `
      <div style="padding:20px 0;${i < otherArticles.length - 1 ? "border-bottom:1px solid #E5E7EB;" : ""}">
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
          <tr>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:#F3F4F6;color:#374151;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${a.tag}</span>
            </td>
          </tr>
        </table>
        <a href="https://www.sorell.fr/api/track/click?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}&article=${encodeURIComponent(a.title)}&url=${encodeURIComponent(a.url || "https://sorell.fr")}" style="text-decoration:none;">
          <h3 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 6px;line-height:1.35;">${a.title}</h3>
        </a>
        ${a.hook ? `<p style="font-size:13px;color:#2563EB;margin:0 0 8px;font-weight:500;">${a.hook}</p>` : ""}
        <p style="font-size:13px;color:#6B7280;line-height:1.6;margin:0 0 6px;">${a.content || a.summary || ""}</p>
        <span style="font-size:11px;color:#9CA3AF;">Source : ${a.source}</span>
        ${a.url ? `<br/><a href="https://www.sorell.fr/api/track/click?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}&article=${encodeURIComponent(a.title)}&url=${encodeURIComponent(a.url)}" style="font-size:12px;color:#2563EB;text-decoration:none;font-weight:500;">Lire l'article →</a>` : ""}
      </div>
      `).join("")}
    </div>

    <!-- Footer -->
    <div style="padding:24px 32px;border-top:2px solid #E5E7EB;background:#F9FAFB;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <span style="font-size:14px;font-weight:700;color:#111827;letter-spacing:-0.01em;">Sorel<span style="color:#2563EB;">l</span></span>
          </td>
          <td align="right">
            <a href="https://sorell.fr" style="font-size:12px;color:#2563EB;text-decoration:none;">sorell.fr</a>
          </td>
        </tr>
      </table>
      <p style="font-size:11px;color:#9CA3AF;margin:12px 0 0;line-height:1.5;">
        Généré automatiquement par IA · Personnalisé pour vous<br/>
        <a href="https://www.sorell.fr/api/unsubscribe?email=${encodeURIComponent(recipient.email)}&uid=${config.user_id}" style="color:#9CA3AF;">Se désabonner</a>
      </p>
    </div>

  </div>
  <img src="https://www.sorell.fr/api/track/open?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}" width="1" height="1" style="display:none;" alt="" />
</body>
</html>`;

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

      await supabase.from("newsletters").update({ status: "sent", sent_at: new Date().toISOString(), recipient_count: recipients.length }).eq("id", newsletter.id);
      await supabase.from("newsletter_config").update({ last_sent_at: new Date().toISOString() }).eq("user_id", config.user_id);

      results.push({ userId: config.user_id, status: "sent", recipients: recipients.length });
    } catch (err) {
      console.error(`Error processing config ${config.user_id}:`, err);
      results.push({ userId: config.user_id, status: "error", error: String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
