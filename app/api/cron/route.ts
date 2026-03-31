import Anthropic from "@anthropic-ai/sdk";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function cleanCiteTags(text: string): string {
  if (!text) return text;
  return text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, "").trim();
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const resend = new Resend(process.env.RESEND_API_KEY!);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
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

  // Batch fetch all profiles to avoid N+1 queries
  const userIds = configs.map((c: { user_id: string }) => c.user_id);
  const { data: allProfiles } = await supabase.from("profiles").select("id, plan").in("id", userIds);
  const profileMap = new Map((allProfiles || []).map((p: { id: string; plan: string }) => [p.id, p.plan]));

  const results = [];

  for (const config of configs) {
    try {
      const configHour = config.send_hour ?? 9;
      const currentMinutes = franceTime.getMinutes();
      if (Number.isInteger(configHour)) {
        if (currentHour !== configHour) continue;
      } else {
        const wholeHour = Math.floor(configHour);
        if (currentHour !== wholeHour || currentMinutes < 30) continue;
      }

      const freq = config.frequency ?? "weekly";
      const sendDay = config.send_day ?? "monday";

      if (freq === "bimonthly") {
        if (currentDate !== 1 && currentDate !== 15) continue;
      } else if (freq === "weekly") {
        const targetDay = DAY_MAP[sendDay];
        if (targetDay === undefined || currentDay !== targetDay) continue;
      } else if (freq === "biweekly") {
        const days = sendDay.split(",").map((d: string) => d.trim());
        const matchDay = days.some((d: string) => DAY_MAP[d] === currentDay);
        if (!matchDay) continue;
      } else if (freq === "daily") {
        if (currentDay === 0 || currentDay === 6) continue;
      } else if (freq === "monthly") {
        if (sendDay === "1st" && currentDate !== 1) continue;
        if (sendDay === "15th" && currentDate !== 15) continue;
      }

      if (config.last_sent_at) {
        const lastSent = new Date(config.last_sent_at);
        const lastSentFrance = new Date(lastSent.toLocaleString("en-US", { timeZone: "Europe/Paris" }));
        if (lastSentFrance.toDateString() === franceTime.toDateString()) continue;
      }

      const profile = { plan: profileMap.get(config.user_id) || "free" };
      const userPlan = profile?.plan || "free";

      const autoLimits: Record<string, number> = { free: 2, pro: 4, business: -1, enterprise: -1 };
      const maxAuto = autoLimits[userPlan] ?? 2;

      if (maxAuto !== -1) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count } = await supabase
          .from("newsletters")
          .select("id", { count: "exact", head: true })
          .eq("user_id", config.user_id)
          .eq("status", "sent")
          .gte("generated_at", startOfMonth.toISOString());

        if ((count || 0) >= maxAuto) continue;
      }

      const topics = (config.topics ?? []).filter((t: { enabled: boolean }) => t.enabled).map((t: { label: string }) => t.label).join(", ");
      const sources = (config.sources ?? []).join(", ");
      const customBrief = config.custom_brief ?? "";

      // --- ANTI-DOUBLON : récupérer les titres des 3 dernières newsletters ---
      const { data: recentNewsletters } = await supabase
        .from("newsletters")
        .select("content")
        .eq("user_id", config.user_id)
        .order("created_at", { ascending: false })
        .limit(3);

      let previousTopicsBlock = "";
      if (recentNewsletters && recentNewsletters.length > 0) {
        const allTitles: string[] = [];
        for (const nl of recentNewsletters) {
          try {
            const parsed = typeof nl.content === "string" ? JSON.parse(nl.content) : nl.content;
            if (parsed.featuredArticle?.title) allTitles.push(parsed.featuredArticle.title);
            if (parsed.articles) {
              for (const a of parsed.articles) {
                if (a.title) allTitles.push(a.title);
              }
            }
          } catch (e) {
            // ignore parsing errors
          }
        }
        if (allTitles.length > 0) {
          previousTopicsBlock = `

=== SUJETS DÉJÀ TRAITÉS DANS LES NEWSLETTERS PRÉCÉDENTES ===
NE PAS reprendre ces sujets. NE PAS reformuler les mêmes informations. Chercher des actualités COMPLÈTEMENT DIFFÉRENTES.
${allTitles.map(t => "- " + t).join("\n")}
=== FIN DES SUJETS DÉJÀ TRAITÉS ===`;
        }
      }

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

      // Nettoyer les balises cite de tout le contenu
      if (newsletterContent.editorial) {
        newsletterContent.editorial = cleanCiteTags(newsletterContent.editorial);
      }
      if (newsletterContent.articles) {
        newsletterContent.articles = newsletterContent.articles.map((a: any) => ({
          ...a,
          title: cleanCiteTags(a.title || ""),
          hook: cleanCiteTags(a.hook || ""),
          content: cleanCiteTags(a.content || ""),
          summary: cleanCiteTags(a.summary || ""),
        }));
      }
      if (newsletterContent.key_figures) {
        newsletterContent.key_figures = newsletterContent.key_figures.map((f: any) => ({
          ...f,
          value: cleanCiteTags(f.value || ""),
          label: cleanCiteTags(f.label || ""),
          context: cleanCiteTags(f.context || ""),
        }));
      }

      const articles = newsletterContent.articles;

      const dateLabel = franceTime.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
      const subjectArticle = articles.find((a: { featured: boolean }) => a.featured) || articles[0];
      let subject = subjectArticle
        ? `${subjectArticle.tag} - ${subjectArticle.title}`
        : `Votre veille du ${dateLabel}`;
      if (subject.length > 65) {
        subject = subject.substring(0, 62) + "...";
      }

      const { data: newsletter } = await supabase
        .from("newsletters")
        .insert({ user_id: config.user_id, subject, content: newsletterContent, status: "draft" })
        .select()
        .single();

      if (!newsletter) continue;

      let recipients = (await supabase
        .from("recipients")
        .select("*")
        .eq("user_id", config.user_id)).data || [];

      if (!recipients.length) {
        // Try to auto-add user email as recipient
        if (supabaseAdmin) {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(config.user_id);
          const userEmail = authUser?.user?.email;
          if (userEmail) {
            await supabase.from("recipients").upsert(
              { user_id: config.user_id, email: userEmail, name: "" },
              { onConflict: "user_id,email" }
            );
            const { data: refreshed } = await supabase
              .from("recipients")
              .select("*")
              .eq("user_id", config.user_id);
            if (!refreshed?.length) continue;
            recipients = refreshed;
          } else {
            continue;
          }
        } else {
          continue;
        }
      }

      // Brand config already available from initial config query (select *)
      const brandColor = config.brand_color || "#005058";
      const customLogo = config.custom_logo_url || null;
      const textColor = config.text_color || "#111827";
      const bgColor = config.bg_color || "#FFFFFF";
      const bodyTextColor = config.body_text_color || "#4B5563";

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
  <div style="max-width:620px;margin:0 auto;background:${bgColor};">

    <!-- Header -->
    <div style="padding:24px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            ${customLogo
              ? '<img src="' + customLogo + '" alt="Logo" style="max-height:36px;max-width:180px;" />'
              : '<span style="font-size:20px;font-weight:700;color:' + textColor + ';letter-spacing:-0.02em;">Sorel<span style="color:' + brandColor + ';">l</span></span>'
            }
          </td>
          <td align="right">
            <span style="font-size:12px;color:#9CA3AF;">Semaine du ${franceTime.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Article phare avec bandeau décoratif -->
    <div style="padding:0 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:10px;overflow:hidden;border:1px solid #E5E7EB;">
        <tr>
          <td style="background:#1F2937;height:120px;"></td>
        </tr>
        <tr>
          <td style="padding:20px 24px;background:${bgColor};">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <span style="display:inline-block;padding:4px 12px;border-radius:4px;background:${brandColor};color:white;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Article phare</span>
                </td>
              </tr>
            </table>
            <a href="https://www.sorell.fr/api/track/click?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}&article=${encodeURIComponent(featuredArticle.title)}&url=${encodeURIComponent(featuredArticle.url || "https://sorell.fr")}" style="text-decoration:none;">
              <h2 style="font-size:18px;font-weight:700;color:${textColor};margin:12px 0 8px;line-height:1.35;letter-spacing:-0.01em;">${featuredArticle.title}</h2>
            </a>
            ${featuredArticle.hook ? '<p style="font-size:14px;color:' + (bodyTextColor || '#4B5563') + ';margin:0 0 10px;font-style:italic;line-height:1.5;">' + featuredArticle.hook + '</p>' : ''}
            <p style="font-size:14px;color:${bodyTextColor || '#4B5563'};line-height:1.65;margin:0 0 12px;">${featuredArticle.content || featuredArticle.summary || ""}</p>
            <a href="${featuredArticle.url || 'https://sorell.fr'}" style="font-size:12px;color:${brandColor};text-decoration:none;font-weight:500;">${featuredArticle.source} →</a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Intro personnalisée -->
    <div style="padding:0 32px 20px;">
      <p style="font-size:14px;color:${textColor};line-height:1.6;">
        <span style="font-weight:600;">Bonjour,</span>
        <span style="color:#6B7280;"> voici les ${otherArticles.length + 1} actualités clés de votre secteur cette semaine, sélectionnées et résumées par Sorell.</span>
      </p>
    </div>

    ${editorial ? '<!-- Éditorial --><div style="padding:0 32px 24px;"><div style="border-left:3px solid ' + brandColor + ';padding:16px 20px;background:#F8FAFC;"><p style="font-size:11px;font-weight:600;color:' + brandColor + ';text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;">Éditorial</p><p style="font-size:14px;color:' + (bodyTextColor || '#374151') + ';line-height:1.65;margin:0;font-style:italic;">' + editorial + '</p></div></div>' : ''}

    ${keyFigures.length > 0 ? '<!-- Chiffres clés --><div style="padding:0 32px 24px;"><p style="font-size:11px;font-weight:600;color:' + brandColor + ';text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Chiffres clés</p><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' + keyFigures.map((fig: {value: string; label: string; context: string}) => '<td style="padding:12px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;text-align:center;width:' + Math.floor(100 / keyFigures.length) + '%;"><div style="font-size:22px;font-weight:700;color:' + brandColor + ';margin-bottom:4px;">' + fig.value + '</div><div style="font-size:12px;color:' + textColor + ';font-weight:500;margin-bottom:2px;">' + fig.label + '</div><div style="font-size:11px;color:#9CA3AF;">' + fig.context + '</div></td>').join('<td style="width:8px;"></td>') + '</tr></table></div>' : ''}

    <!-- Articles secondaires -->
    <div style="padding:0 32px 16px;">
      <p style="font-size:11px;font-weight:600;color:${brandColor};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 16px;">Les actus de la semaine</p>

      ${otherArticles.length >= 2 ? '<!-- 2 premiers articles en grille --><table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;"><tr><td style="width:48%;vertical-align:top;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;"><tr><td style="background:#374151;height:80px;"></td></tr><tr><td style="padding:14px;background:' + bgColor + ';"><span style="display:inline-block;padding:3px 8px;border-radius:4px;background:#F3F4F6;color:#374151;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">' + otherArticles[0].tag + '</span><a href="https://www.sorell.fr/api/track/click?nid=' + newsletter.id + '&email=' + encodeURIComponent(recipient.email) + '&article=' + encodeURIComponent(otherArticles[0].title) + '&url=' + encodeURIComponent(otherArticles[0].url || "https://sorell.fr") + '" style="text-decoration:none;"><h3 style="font-size:14px;font-weight:600;color:' + textColor + ';margin:8px 0;line-height:1.35;">' + otherArticles[0].title + '</h3></a><p style="font-size:12px;color:' + (bodyTextColor || '#6B7280') + ';line-height:1.5;margin:0 0 8px;">' + ((otherArticles[0].content || otherArticles[0].summary || "").length > 120 ? (otherArticles[0].content || otherArticles[0].summary || "").substring(0, 120) + "..." : (otherArticles[0].content || otherArticles[0].summary || "")) + '</p><a href="' + (otherArticles[0].url || 'https://sorell.fr') + '" style="font-size:11px;color:' + brandColor + ';text-decoration:none;font-weight:500;">' + otherArticles[0].source + ' →</a></td></tr></table></td><td style="width:4%;"></td><td style="width:48%;vertical-align:top;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;"><tr><td style="background:#374151;height:80px;"></td></tr><tr><td style="padding:14px;background:' + bgColor + ';"><span style="display:inline-block;padding:3px 8px;border-radius:4px;background:#F3F4F6;color:#374151;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">' + otherArticles[1].tag + '</span><a href="https://www.sorell.fr/api/track/click?nid=' + newsletter.id + '&email=' + encodeURIComponent(recipient.email) + '&article=' + encodeURIComponent(otherArticles[1].title) + '&url=' + encodeURIComponent(otherArticles[1].url || "https://sorell.fr") + '" style="text-decoration:none;"><h3 style="font-size:14px;font-weight:600;color:' + textColor + ';margin:8px 0;line-height:1.35;">' + otherArticles[1].title + '</h3></a><p style="font-size:12px;color:' + (bodyTextColor || '#6B7280') + ';line-height:1.5;margin:0 0 8px;">' + ((otherArticles[1].content || otherArticles[1].summary || "").length > 120 ? (otherArticles[1].content || otherArticles[1].summary || "").substring(0, 120) + "..." : (otherArticles[1].content || otherArticles[1].summary || "")) + '</p><a href="' + (otherArticles[1].url || 'https://sorell.fr') + '" style="font-size:11px;color:' + brandColor + ';text-decoration:none;font-weight:500;">' + otherArticles[1].source + ' →</a></td></tr></table></td></tr></table>' : ''}

      ${otherArticles.slice(2).map((a: {tag: string; title: string; hook?: string; content?: string; summary?: string; source: string; url?: string}, i: number) => '<!-- Article ' + (i + 3) + ' --><table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;"><tr><td style="background:#374151;height:60px;"></td></tr><tr><td style="padding:16px 20px;background:' + bgColor + ';"><span style="display:inline-block;padding:3px 8px;border-radius:4px;background:#F3F4F6;color:#374151;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">' + a.tag + '</span><a href="https://www.sorell.fr/api/track/click?nid=' + newsletter.id + '&email=' + encodeURIComponent(recipient.email) + '&article=' + encodeURIComponent(a.title) + '&url=' + encodeURIComponent(a.url || "https://sorell.fr") + '" style="text-decoration:none;"><h3 style="font-size:15px;font-weight:600;color:' + textColor + ';margin:8px 0;line-height:1.35;">' + a.title + '</h3></a>' + (a.hook ? '<p style="font-size:13px;color:' + (bodyTextColor || '#4B5563') + ';margin:0 0 8px;font-style:italic;">' + a.hook + '</p>' : '') + '<p style="font-size:13px;color:' + (bodyTextColor || '#6B7280') + ';line-height:1.6;margin:0 0 10px;">' + (a.content || a.summary || "") + '</p><a href="' + (a.url || 'https://sorell.fr') + '" style="font-size:12px;color:' + brandColor + ';text-decoration:none;font-weight:500;">' + a.source + ' →</a></td></tr></table>').join('')}
    </div>

    <!-- Statistiques -->
    <div style="padding:8px 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="text-align:center;padding:12px;border:1px solid #E5E7EB;border-radius:8px;">
            <div style="font-size:20px;font-weight:700;color:${brandColor};">147</div>
            <div style="font-size:11px;color:#9CA3AF;">Sources analysées</div>
          </td>
          <td style="width:8px;"></td>
          <td style="text-align:center;padding:12px;border:1px solid #E5E7EB;border-radius:8px;">
            <div style="font-size:20px;font-weight:700;color:${brandColor};">${otherArticles.length + 1}</div>
            <div style="font-size:11px;color:#9CA3AF;">Articles retenus</div>
          </td>
          <td style="width:8px;"></td>
          <td style="text-align:center;padding:12px;border:1px solid #E5E7EB;border-radius:8px;">
            <div style="font-size:20px;font-weight:700;color:${brandColor};">3min</div>
            <div style="font-size:11px;color:#9CA3AF;">Temps de lecture</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="padding:0 32px 24px;text-align:center;">
      <p style="font-size:14px;color:#6B7280;margin:0 0 12px;">Cette newsletter vous a été utile ?</p>
      <a href="https://sorell.fr/tarifs" style="display:inline-block;padding:10px 24px;background:${brandColor};color:white;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">Partager avec votre équipe</a>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #E5E7EB;background:#F9FAFB;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            ${customLogo
              ? '<img src="' + customLogo + '" alt="Logo" style="max-height:28px;max-width:140px;" />'
              : '<span style="font-size:14px;font-weight:700;color:' + textColor + ';letter-spacing:-0.01em;">Sorel<span style="color:' + brandColor + ';">l</span></span>'
            }
          </td>
          <td align="right">
            <a href="https://sorell.fr" style="font-size:12px;color:${brandColor};text-decoration:none;">sorell.fr</a>
          </td>
        </tr>
      </table>
      <p style="font-size:11px;color:#9CA3AF;margin:12px 0 0;line-height:1.5;">
        Généré automatiquement par Sorell · Personnalisé pour vous<br/>
        <a href="https://www.sorell.fr/desabonnement?email=${encodeURIComponent(recipient.email)}" style="color:#9CA3AF;">Se désabonner</a>
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
          // silently ignore
        }
      }

      await supabase.from("newsletters").update({ status: "sent", sent_at: new Date().toISOString(), recipient_count: recipients.length }).eq("id", newsletter.id);
      await supabase.from("newsletter_config").update({ last_sent_at: new Date().toISOString() }).eq("user_id", config.user_id);

      results.push({ userId: config.user_id, status: "sent", recipients: recipients.length });
    } catch (err) {
      results.push({ userId: config.user_id, status: "error", error: String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
