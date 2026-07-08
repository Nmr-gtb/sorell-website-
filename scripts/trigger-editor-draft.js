/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Script de dépannage : déclenche manuellement la génération d'un BROUILLON
 * en mode éditeur (équivalent de la branche "editor" du cron), sans la
 * limite de 60s de Vercel.
 *
 * Usage : node scripts/trigger-editor-draft.js <user_id> [--force]
 *
 * Reproduit app/api/cron/route.ts (branche editorMode) :
 * - génère avec le modèle et le nombre d'articles du plan
 * - anti-doublon avec les 3 dernières newsletters
 * - filtre de fraîcheur 90 jours (published_at obligatoire)
 * - insère la newsletter en status "draft"
 * - stocke son id dans newsletter_config.pending_draft_id
 * - N'ENVOIE RIEN et ne touche PAS à last_sent_at
 */

const fs = require("fs");
const path = require("path");

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

for (const [k, v] of Object.entries({ SUPABASE_URL, SERVICE_ROLE, ANTHROPIC_KEY })) {
  if (!v) {
    console.error(`Variable d'environnement manquante : ${k}`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

// --- Tiering par plan (aligné sur lib/plans.ts) ------------------------------
const MODEL_BY_PLAN = {
  free: "claude-haiku-4-5-20251001",
  pro: "claude-sonnet-4-6",
  business: "claude-opus-4-8",
  enterprise: "claude-opus-4-8",
};
const ARTICLES_BY_PLAN = { free: 5, pro: 5, business: 8, enterprise: 10 };
const canUseEditor = (plan) => plan === "business" || plan === "enterprise";

// --- Helpers (alignés sur lib/newsletter-generator.ts) ----------------------

function cleanCiteTags(text) {
  if (!text) return text;
  return text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, "").trim();
}

function extractPreviousTitles(recentNewsletters) {
  const titles = [];
  for (const nl of recentNewsletters || []) {
    try {
      const parsed = typeof nl.content === "string" ? JSON.parse(nl.content) : nl.content;
      if (parsed.featuredArticle?.title) titles.push(parsed.featuredArticle.title);
      for (const a of parsed.articles || []) {
        if (a.title) titles.push(a.title);
      }
    } catch {
      // ignore
    }
  }
  return titles;
}

function buildPrompt({ topics, sources, customBrief, dateString, searchDateHint, previousTitles, count }) {
  const sourcesLine = sources
    ? `Sources préférées (à inclure si pertinent, mais ne te limite PAS à celles-ci - cherche sur TOUT le web) : ${sources}`
    : "";

  const previousTopicsBlock = previousTitles.length
    ? `

=== SUJETS DÉJÀ TRAITÉS DANS LES NEWSLETTERS PRÉCÉDENTES ===
NE PAS reprendre ces sujets. NE PAS reformuler les mêmes informations. Chercher des actualités COMPLÈTEMENT DIFFÉRENTES.
${previousTitles.map((t) => "- " + t).join("\n")}
=== FIN DES SUJETS DÉJÀ TRAITÉS ===`
    : "";

  return `Tu es un rédacteur en chef spécialisé en veille sectorielle B2B. Tu dois rédiger une newsletter basée sur de VRAIES actualités récentes trouvées sur le web.

${customBrief ? `BRIEF DU CLIENT :
"${customBrief}"

Essaie d'abord de trouver des articles qui correspondent précisément à ce brief. Si tu ne trouves pas suffisamment d'articles récents (<90 jours) collant au brief, ÉLARGIS à la thématique générale (${topics}) et au secteur d'activité concerné. L'objectif est de livrer une newsletter UTILE et RÉCENTE.

` : ""}Thématiques : ${topics}
${sourcesLine}
Date du jour : ${dateString}

INSTRUCTIONS :
1. Utilise la recherche web pour trouver ${count} actualités RÉELLES et RÉCENTES (moins de 30 jours idéalement, maximum 90 jours) correspondant aux thématiques demandées.
2. Pour chaque actualité trouvée, rédige un article de newsletter professionnel.
3. Chaque article DOIT être basé sur un vrai article publié avec une vraie URL.
4. Chaque article DOIT indiquer sa date de publication exacte (published_at) au format YYYY-MM-DD. Utilise la date affichée sur la page source. Ne devine pas, ne hallucine pas : si tu ne trouves pas la date précise, écarte l'article.

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
      "published_at": "YYYY-MM-DD (date de publication lue sur la page source)",
      "featured": true
    }
  ]
}

CONSIGNES :
- OPTIMISATION : Effectue MAXIMUM ${Math.min(8, count + 1)} recherches web ciblées. Fais des recherches précises et spécifiques plutôt que des recherches larges. Par exemple, cherche '${topics} actualités ${searchDateHint}' plutôt que de faire une recherche par article. Regroupe les informations de chaque recherche pour couvrir les ${count} articles.
- Cherche sur TOUT le web, pas seulement les sources listées.
- TOUS les articles doivent avoir une URL réelle et fonctionnelle vers la source.
- FRAÎCHEUR OBLIGATOIRE : ne retiens QUE les articles publiés dans les 90 derniers jours maximum.
- Si tu ne trouves pas ${count} articles récents pertinents, réduis à ce que tu trouves (minimum 3).
- key_figures : 2-3 chiffres trouvés dans les articles. Si pas de chiffres pertinents, tableau vide [].
- Le premier article est "featured": true.
- Sois factuel : ne déforme pas les informations des articles sources.
- L'éditorial doit faire le lien entre les différentes actus trouvées.
${previousTopicsBlock}
CRITICAL : Ta réponse doit commencer par { ou [ et se terminer par } ou ]. Aucun texte avant, aucun texte après. Pas de markdown, pas de backticks, pas d'explication. UNIQUEMENT le JSON brut.`;
}

function parseClaudeJson(responseText) {
  let clean = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const firstBrace = clean.indexOf("{");
  if (firstBrace === -1) throw new Error("Aucun JSON trouvé dans la réponse");
  const lastBrace = clean.lastIndexOf("}");
  if (lastBrace <= firstBrace) throw new Error("JSON incomplet");
  clean = clean.substring(firstBrace, lastBrace + 1);
  const parsed = JSON.parse(clean);
  return {
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
      published_at: typeof a.published_at === "string" && a.published_at.trim() ? a.published_at.trim() : undefined,
    })),
  };
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function isArticleFresh(article, referenceDate, maxAgeDays = 90) {
  if (!article.published_at) return false;
  const published = new Date(article.published_at);
  if (isNaN(published.getTime())) return false;
  const ageDays = (referenceDate.getTime() - published.getTime()) / MS_PER_DAY;
  return ageDays >= -1 && ageDays <= maxAgeDays;
}

function dedupeByUrl(articles) {
  const seen = new Set();
  const out = [];
  for (const a of articles) {
    const key = (a.url || "").toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

function ensureFeaturedFlag(articles) {
  if (!articles.length) return articles;
  if (articles.some((a) => a.featured)) return articles;
  return articles.map((a, i) => ({ ...a, featured: i === 0 }));
}

function buildSubjectLine(content, dateLabel) {
  const featured = content.articles.find((a) => a.featured) || content.articles[0];
  let subject = featured ? `${featured.tag} - ${featured.title}` : `Votre veille du ${dateLabel}`;
  if (subject.length > 65) subject = subject.substring(0, 62) + "...";
  return subject;
}

// --- Main ------------------------------------------------------------------

async function main() {
  const userId = process.argv[2];
  const forceMode = process.argv.includes("--force");
  if (!userId) {
    console.error("Usage : node scripts/trigger-editor-draft.js <user_id> [--force]");
    process.exit(1);
  }

  console.log(`[1/5] Lecture des données user ${userId}...`);
  const { data: profile, error: pErr } = await supabase
    .from("profiles").select("id, email, plan, email_verified").eq("id", userId).single();
  if (pErr || !profile) throw new Error(`Profile introuvable : ${pErr?.message}`);

  if (!canUseEditor(profile.plan)) {
    throw new Error(`Plan "${profile.plan}" non éligible au mode éditeur (business/enterprise requis)`);
  }

  const { data: config, error: cErr } = await supabase
    .from("newsletter_config")
    .select("topics, custom_brief, sources, edit_mode, pending_draft_id")
    .eq("user_id", userId).single();
  if (cErr || !config) throw new Error(`Config introuvable : ${cErr?.message}`);

  if (config.edit_mode !== "editor") {
    throw new Error(`edit_mode = "${config.edit_mode}" : active d'abord le mode éditeur dans la config`);
  }
  if (config.pending_draft_id && !forceMode) {
    console.warn(`ATTENTION : un brouillon attend déjà (${config.pending_draft_id}).`);
    console.warn(`Pour le remplacer, relance avec --force`);
    process.exit(2);
  }

  const topicsList = (config.topics || [])
    .filter((t) => t.enabled)
    .map((t) => t.label)
    .join(", ");
  if (!topicsList) throw new Error("Aucun topic activé dans la config");

  const sourcesList = Array.isArray(config.sources) ? config.sources.join(", ") : "";
  const model = MODEL_BY_PLAN[profile.plan] || MODEL_BY_PLAN.free;
  const maxArticles = ARTICLES_BY_PLAN[profile.plan] || 5;

  console.log(`      Email : ${profile.email}`);
  console.log(`      Plan : ${profile.plan} -> ${model}, ${maxArticles} articles`);
  console.log(`      Topics : ${topicsList}`);

  console.log(`[2/5] Anti-doublon : titres des 3 dernières newsletters...`);
  const { data: recentNewsletters } = await supabase
    .from("newsletters")
    .select("content")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(3);
  const previousTitles = extractPreviousTitles(recentNewsletters || []);
  console.log(`      ${previousTitles.length} titres exclus`);

  console.log(`[3/5] Génération via ${model} (web search) - peut prendre plusieurs minutes...`);
  const now = new Date();
  const prompt = buildPrompt({
    topics: topicsList,
    sources: sourcesList,
    customBrief: config.custom_brief || "",
    dateString: now.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
    searchDateHint: now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    previousTitles,
    count: maxArticles,
  });

  const maxTokens = Math.min(8192, 3000 + maxArticles * 550);
  const message = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = message.content
    .filter((b) => b.type === "text")
    .map((b) => b.text || "")
    .join("");

  let content;
  try {
    content = parseClaudeJson(responseText);
  } catch (e) {
    console.error("\n--- REPONSE CLAUDE BRUTE ---");
    console.error(responseText.substring(0, 3000));
    console.error("--- FIN REPONSE ---\n");
    throw e;
  }

  const fresh = content.articles.filter((a) => isArticleFresh(a, now));
  const kept = ensureFeaturedFlag(dedupeByUrl(fresh).slice(0, maxArticles));
  console.log(`      ${content.articles.length} articles générés, ${kept.length} frais retenus`);

  if (!kept.length) {
    throw new Error("Aucun article frais (<90 jours) : rien à mettre en brouillon. Réessaie plus tard.");
  }

  content = {
    editorial: content.editorial,
    key_figures: kept.length ? content.key_figures : [],
    articles: kept,
  };

  const dateLabel = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const subject = buildSubjectLine(content, dateLabel);
  console.log(`      Subject : ${subject}`);

  console.log(`[4/5] Insertion en BDD (status=draft, avec instantané d'origine)...`);
  const { data: inserted, error: insErr } = await supabase
    .from("newsletters")
    .insert({
      user_id: userId,
      subject,
      content,
      status: "draft",
      // Instantané figé pour le bouton "Réinitialiser" de l'éditeur
      original_content: content,
      original_subject: subject,
    })
    .select()
    .single();
  if (insErr) throw new Error(`Insert newsletter échoué : ${insErr.message}`);
  console.log(`      Brouillon créé : ${inserted.id}`);

  console.log(`[5/5] Stockage de pending_draft_id (pas d'envoi, last_sent_at intact)...`);
  const { error: updErr } = await supabase
    .from("newsletter_config")
    .update({ pending_draft_id: inserted.id })
    .eq("user_id", userId);
  if (updErr) throw new Error(`Update config échoué : ${updErr.message}`);

  console.log(`\nTerminé : le brouillon attend sa validation dans https://www.sorell.fr/dashboard/editor`);
}

main().catch((e) => {
  console.error("ERREUR :", e.message);
  console.error(e.stack);
  process.exit(1);
});
