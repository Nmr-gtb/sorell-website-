/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Script de dépannage : déclenche manuellement la 1ère newsletter
 * d'un utilisateur qui a fait son onboarding mais n'a rien reçu.
 *
 * Usage : node scripts/trigger-first-newsletter.js <user_id>
 *
 * Fait les étapes équivalentes à /api/generate + /api/send,
 * en bypassant l'auth Bearer (utilise service_role côté serveur).
 */

const fs = require("fs");
const path = require("path");
const { createHmac } = require("crypto");

// --- Charger .env.local ----------------------------------------------------
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_][A-Z0-9_]*)=["']?(.*?)["']?$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2];
  }
}

const { createClient } = require("@supabase/supabase-js");
const Anthropic = require("@anthropic-ai/sdk").default || require("@anthropic-ai/sdk");
const { Resend } = require("resend");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET;

for (const [k, v] of Object.entries({ SUPABASE_URL, SERVICE_ROLE, ANTHROPIC_KEY, RESEND_KEY, UNSUBSCRIBE_SECRET })) {
  if (!v) {
    console.error(`Variable d'environnement manquante : ${k}`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
const resend = new Resend(RESEND_KEY);

// --- Helpers ---------------------------------------------------------------

function cleanCiteTags(text) {
  if (!text) return text;
  return text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, "").trim();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildUnsubscribeUrl(email) {
  const token = createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(email.toLowerCase().trim())
    .digest("hex")
    .substring(0, 16);
  const params = new URLSearchParams({ email, token });
  return `https://www.sorell.fr/api/unsubscribe?${params.toString()}`;
}

function buildPrompt({ topics, customBrief, dateString, searchDateHint }) {
  return `Tu es un rédacteur en chef spécialisé en veille sectorielle B2B. Tu dois rédiger une newsletter basée sur de VRAIES actualités récentes trouvées sur le web.

${customBrief ? `BRIEF DU CLIENT :
"${customBrief}"

Essaie d'abord de trouver des articles qui correspondent précisément à ce brief. Si tu n'en trouves pas suffisamment, ÉLARGIS à la thématique générale (${topics}) et au secteur d'activité concerné. L'objectif est de toujours livrer une newsletter utile au lecteur.

` : ""}Thématiques : ${topics}
Date du jour : ${dateString}

INSTRUCTIONS :
1. Utilise la recherche web pour trouver 5 actualités RÉELLES et récentes (idéalement <30 jours, acceptable jusqu'à 90 jours).
2. Si le brief est très niche et que tu ne trouves pas assez d'actus ciblées, ÉLARGIS à la thématique générale indiquée ci-dessus. Ne refuse JAMAIS de produire le JSON.
3. Pour chaque actualité trouvée, rédige un article de newsletter professionnel.
4. Chaque article DOIT être basé sur un vrai article publié avec une vraie URL.

GÉNÈRE un JSON avec cette structure exacte :

{
  "editorial": "Un paragraphe d'analyse de 2-3 phrases qui donne le ton. Identifie la tendance principale ou le fil rouge entre les actualités.",
  "key_figures": [
    { "value": "chiffre", "label": "explication courte", "context": "source" }
  ],
  "articles": [
    {
      "tag": "catégorie courte",
      "title": "titre accrocheur (max 80 chars)",
      "hook": "une phrase d'accroche (max 120 chars)",
      "content": "2-3 phrases de contenu factuel. Chiffres, noms, faits concrets.",
      "source": "nom du média",
      "url": "URL COMPLÈTE de l'article original (https://...)",
      "featured": true
    }
  ]
}

CONSIGNES :
- Effectue MAXIMUM 5 recherches web ciblées.
- TOUS les articles doivent avoir une URL réelle et fonctionnelle.
- Si tu ne trouves pas 5 articles, livre ce que tu as (minimum 3).
- key_figures : 2-3 chiffres trouvés dans les articles. Si rien de pertinent, tableau vide [].
- Le premier article est "featured": true.
- Sois factuel.
- Recherche pour ${searchDateHint}.

IMPÉRATIF : Ta réponse DOIT être un JSON valide commençant par { et se terminant par }. Aucun texte avant, aucun texte après. Pas de markdown, pas de backticks, pas d'explication en texte libre. Si tu hésites sur la pertinence, produis quand même le JSON avec les articles les plus proches trouvés.`;
}

function parseClaudeJson(responseText) {
  let clean = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const firstBrace = clean.indexOf("{");
  if (firstBrace === -1) throw new Error("Aucun JSON trouvé dans la réponse");
  const lastBrace = clean.lastIndexOf("}");
  if (lastBrace <= firstBrace) throw new Error("JSON incomplet");
  clean = clean.substring(firstBrace, lastBrace + 1);
  const parsed = JSON.parse(clean);
  const nl = {
    editorial: cleanCiteTags(parsed.editorial || ""),
    key_figures: (parsed.key_figures || []).map((f) => ({
      value: cleanCiteTags(f.value || ""),
      label: cleanCiteTags(f.label || ""),
      context: cleanCiteTags(f.context || ""),
    })),
    articles: (parsed.articles || []).map((a) => ({
      tag: cleanCiteTags(a.tag || ""),
      title: cleanCiteTags(a.title || ""),
      hook: cleanCiteTags(a.hook || ""),
      content: cleanCiteTags(a.content || ""),
      source: cleanCiteTags(a.source || ""),
      url: a.url || "",
      featured: !!a.featured,
    })),
  };
  return nl;
}

function buildSubjectLine(content, dateLabel) {
  const featured = content.articles.find((a) => a.featured) || content.articles[0];
  let subject = featured ? `${featured.tag} - ${featured.title}` : `Votre veille du ${dateLabel}`;
  if (subject.length > 65) subject = subject.substring(0, 62) + "...";
  return subject;
}

function buildHtml({ newsletterId, recipientEmail, subject, brandColor, textColor, bgColor, bodyTextColor, date, editorial, keyFigures, articles }) {
  const featured = articles.find((a) => a.featured) || articles[0];
  const others = articles.filter((a) => a !== featured);
  const unsubscribeUrl = buildUnsubscribeUrl(recipientEmail);
  const trackPixel = `https://www.sorell.fr/api/track/open?nid=${newsletterId}&email=${encodeURIComponent(recipientEmail)}`;
  const trackClick = (url, title) =>
    `https://www.sorell.fr/api/track/click?nid=${newsletterId}&email=${encodeURIComponent(recipientEmail)}&article=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

  const keyFiguresHtml = keyFigures && keyFigures.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
         <tr>${keyFigures.slice(0, 3).map((kf) => `
           <td valign="top" style="padding:16px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;width:33%;">
             <div style="font-size:24px;font-weight:700;color:${brandColor};line-height:1.2;">${escapeHtml(kf.value)}</div>
             <div style="font-size:12px;color:${bodyTextColor};margin-top:4px;">${escapeHtml(kf.label)}</div>
             <div style="font-size:11px;color:#9CA3AF;margin-top:4px;font-style:italic;">${escapeHtml(kf.context)}</div>
           </td>`).join("<td style=\"width:8px;\">&nbsp;</td>")}
         </tr>
       </table>`
    : "";

  const featuredHtml = featured ? `
    <div style="margin:24px 0;padding:20px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;">
      <div style="display:inline-block;padding:4px 10px;background:${brandColor};color:#FFFFFF;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">À LA UNE - ${escapeHtml(featured.tag)}</div>
      <h2 style="font-size:22px;font-weight:700;color:${textColor};margin:12px 0 8px;line-height:1.3;">
        <a href="${trackClick(featured.url, featured.title)}" style="color:${textColor};text-decoration:none;">${escapeHtml(featured.title)}</a>
      </h2>
      <p style="font-size:14px;color:${brandColor};font-weight:500;margin:0 0 12px;font-style:italic;">${escapeHtml(featured.hook)}</p>
      <p style="font-size:15px;color:${bodyTextColor};line-height:1.6;margin:0 0 12px;">${escapeHtml(featured.content)}</p>
      <div style="font-size:12px;color:#9CA3AF;">Source : ${escapeHtml(featured.source)} - <a href="${trackClick(featured.url, featured.title)}" style="color:${brandColor};text-decoration:none;">Lire l'article</a></div>
    </div>` : "";

  const othersHtml = others.map((a) => `
    <div style="margin:20px 0;padding:16px 0;border-top:1px solid #E5E7EB;">
      <div style="display:inline-block;padding:3px 8px;background:#F3F4F6;color:${brandColor};border-radius:999px;font-size:10px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">${escapeHtml(a.tag)}</div>
      <h3 style="font-size:17px;font-weight:700;color:${textColor};margin:10px 0 6px;line-height:1.35;">
        <a href="${trackClick(a.url, a.title)}" style="color:${textColor};text-decoration:none;">${escapeHtml(a.title)}</a>
      </h3>
      <p style="font-size:14px;color:${bodyTextColor};line-height:1.6;margin:0 0 8px;">${escapeHtml(a.content)}</p>
      <div style="font-size:12px;color:#9CA3AF;">Source : ${escapeHtml(a.source)} - <a href="${trackClick(a.url, a.title)}" style="color:${brandColor};text-decoration:none;">Lire l'article</a></div>
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${textColor};">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px;">
    <div style="text-align:center;padding:16px 0 24px;">
      <div style="font-size:24px;font-weight:700;color:${brandColor};letter-spacing:-0.5px;">Sorell</div>
      <div style="font-size:12px;color:#6B7280;margin-top:4px;">${escapeHtml(date)}</div>
    </div>
    <div style="background:${bgColor};border-radius:16px;padding:28px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      ${editorial ? `<div style="padding:16px;background:#F9FAFB;border-left:3px solid ${brandColor};border-radius:4px;margin-bottom:16px;"><p style="font-size:14px;color:${bodyTextColor};line-height:1.6;margin:0;font-style:italic;">${escapeHtml(editorial)}</p></div>` : ""}
      ${keyFiguresHtml}
      ${featuredHtml}
      ${othersHtml}
    </div>
    <div style="text-align:center;padding:24px 16px;font-size:12px;color:#9CA3AF;line-height:1.6;">
      <div>Vous recevez cet email car vous êtes inscrit à Sorell.</div>
      <div style="margin-top:8px;">
        <a href="https://www.sorell.fr/dashboard" style="color:${brandColor};text-decoration:none;">Modifier ma veille</a>
        &nbsp;·&nbsp;
        <a href="${unsubscribeUrl}" style="color:#9CA3AF;text-decoration:underline;">Se désabonner</a>
      </div>
    </div>
    <img src="${trackPixel}" width="1" height="1" alt="" style="display:none;">
  </div>
</body>
</html>`;
}

// --- Main ------------------------------------------------------------------

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error("Usage : node scripts/trigger-first-newsletter.js <user_id>");
    process.exit(1);
  }

  console.log(`[1/6] Lecture des données user ${userId}...`);
  const { data: profile, error: pErr } = await supabase
    .from("profiles").select("id, email, plan, email_verified").eq("id", userId).single();
  if (pErr || !profile) throw new Error(`Profile introuvable : ${pErr?.message}`);

  const { data: config, error: cErr } = await supabase
    .from("newsletter_config")
    .select("topics, custom_brief, sources, brand_color, text_color, bg_color, body_text_color, custom_logo_url")
    .eq("user_id", userId).single();
  if (cErr || !config) throw new Error(`Config introuvable : ${cErr?.message}`);

  const { data: recipients, error: rErr } = await supabase
    .from("recipients").select("email, name").eq("user_id", userId);
  if (rErr || !recipients?.length) throw new Error(`Aucun recipient : ${rErr?.message}`);

  const { count: existingCount } = await supabase
    .from("newsletters").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if ((existingCount || 0) > 0) {
    console.warn(`ATTENTION : l'user a déjà ${existingCount} newsletter(s). Interrompu pour éviter un doublon.`);
    console.warn(`Pour forcer, commente ce garde-fou dans le script.`);
    process.exit(2);
  }

  const topicsList = (config.topics || [])
    .filter((t) => t.enabled)
    .map((t) => t.label)
    .join(", ");

  if (!topicsList) throw new Error("Aucun topic activé dans la config");

  console.log(`      Email : ${profile.email}`);
  console.log(`      Topics : ${topicsList}`);
  console.log(`      Brief : ${(config.custom_brief || "(aucun)").substring(0, 80)}...`);
  console.log(`      Destinataires : ${recipients.length}`);

  console.log(`[2/6] Génération via Claude Haiku (web search)...`);
  const now = new Date();
  const dateString = now.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const searchDateHint = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const prompt = buildPrompt({ topics: topicsList, customBrief: config.custom_brief || "", dateString, searchDateHint });

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text || "")
    .join("");

  let newsletterContent;
  try {
    newsletterContent = parseClaudeJson(responseText);
  } catch (e) {
    console.error("\n--- REPONSE CLAUDE BRUTE ---");
    console.error(responseText.substring(0, 3000));
    console.error("--- FIN REPONSE ---\n");
    throw e;
  }

  if (!newsletterContent.articles.length) {
    console.error("\n--- REPONSE CLAUDE BRUTE (0 articles) ---");
    console.error(responseText.substring(0, 3000));
    console.error("--- FIN REPONSE ---\n");
    throw new Error("Claude n'a renvoyé aucun article");
  }
  console.log(`      ${newsletterContent.articles.length} articles générés`);

  const dateLabel = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const subject = buildSubjectLine(newsletterContent, dateLabel);
  console.log(`      Subject : ${subject}`);

  console.log(`[3/6] Insertion en BDD (status=draft)...`);
  const { data: inserted, error: insErr } = await supabase
    .from("newsletters")
    .insert({
      user_id: userId,
      subject,
      content: newsletterContent,
      status: "draft",
    })
    .select()
    .single();
  if (insErr) throw new Error(`Insert newsletter échoué : ${insErr.message}`);
  const newsletterId = inserted.id;
  console.log(`      Newsletter créée : ${newsletterId}`);

  console.log(`[4/6] Construction du HTML...`);
  const brandColor = config.brand_color || "#005058";
  const textColor = config.text_color || "#111827";
  const bgColor = config.bg_color || "#FFFFFF";
  const bodyTextColor = config.body_text_color || "#4B5563";
  const dateStr = `Semaine du ${now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;

  console.log(`[5/6] Envoi via Resend...`);
  const results = [];
  for (const recipient of recipients) {
    const html = buildHtml({
      newsletterId,
      recipientEmail: recipient.email,
      subject,
      brandColor,
      textColor,
      bgColor,
      bodyTextColor,
      date: dateStr,
      editorial: newsletterContent.editorial,
      keyFigures: newsletterContent.key_figures,
      articles: newsletterContent.articles,
    });
    const unsubscribeUrl = buildUnsubscribeUrl(recipient.email);
    try {
      const result = await resend.emails.send({
        from: "Sorell <newsletters@sorell.fr>",
        replyTo: "noe@sorell.fr",
        to: recipient.email,
        subject,
        html,
        text: `${subject}\n\nPour lire cette newsletter, ouvrez-la dans un client email compatible HTML.\n\nSe désabonner : ${unsubscribeUrl}`,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      results.push({ email: recipient.email, ok: true, id: result.data?.id });
      console.log(`      ✓ ${recipient.email} -> ${result.data?.id}`);
    } catch (e) {
      results.push({ email: recipient.email, ok: false, error: e.message });
      console.log(`      ✗ ${recipient.email} -> ${e.message}`);
    }
  }

  console.log(`[6/6] Update newsletter -> sent...`);
  await supabase
    .from("newsletters")
    .update({ status: "sent", sent_at: new Date().toISOString(), recipient_count: recipients.length })
    .eq("id", newsletterId);

  const successCount = results.filter((r) => r.ok).length;
  console.log(`\nTerminé : ${successCount}/${results.length} emails envoyés.`);
}

main().catch((e) => {
  console.error("ERREUR :", e.message);
  console.error(e.stack);
  process.exit(1);
});
