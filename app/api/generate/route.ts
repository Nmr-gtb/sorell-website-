import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { apiRateLimit } from "@/lib/ratelimit";

function cleanCiteTags(text: string): string {
  if (!text) return text;
  return text.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, "").trim();
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { userId, topics, sources, customBrief } = await request.json();

    if (userId && userId !== authUser.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const verifiedUserId = authUser.id;

    const { success: rateLimitOk } = await apiRateLimit.limit(verifiedUserId);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Trop de requetes. Reessayez dans une heure." },
        { status: 429 }
      );
    }

    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", verifiedUserId).single();
    const plan = profile?.plan || "free";

    const previewLimits: Record<string, number> = { free: 1, pro: 4, business: -1, enterprise: -1 };
    const maxPreviews = previewLimits[plan] ?? 1;

    if (maxPreviews !== -1) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("newsletters")
        .select("id", { count: "exact", head: true })
        .eq("user_id", verifiedUserId)
        .eq("status", "draft")
        .gte("generated_at", startOfMonth.toISOString());

      if ((count || 0) >= maxPreviews) {
        return NextResponse.json(
          { error: `Limite de ${maxPreviews} aperçu(s) par mois atteinte. Passez au plan supérieur pour plus d'aperçus.` },
          { status: 403 }
        );
      }
    }

    // Auto-add user as recipient if they have none
    if (authUser.email) {
      const { data: existingRecipients } = await supabase
        .from("recipients")
        .select("email")
        .eq("user_id", verifiedUserId);

      if (!existingRecipients || existingRecipients.length === 0) {
        await supabase.from("recipients").upsert(
          { user_id: verifiedUserId, email: authUser.email, name: "" },
          { onConflict: "user_id,email" }
        );
      }
    }

    // Si pas de topics fournis, lire la config depuis la BDD
    let resolvedTopics = topics;
    let resolvedSources = sources;
    let resolvedBrief = customBrief;
    if (!resolvedTopics?.length) {
      const { data: config } = await supabase
        .from("newsletter_config")
        .select("topics, sources, custom_brief")
        .eq("user_id", verifiedUserId)
        .single();
      if (!config?.topics?.length) {
        return NextResponse.json({ error: "Aucune thematique configuree" }, { status: 400 });
      }
      resolvedTopics = config.topics;
      resolvedSources = resolvedSources || config.sources;
      resolvedBrief = resolvedBrief || config.custom_brief;
    }

    const topicsList = resolvedTopics
      .filter((t: { enabled: boolean }) => t.enabled)
      .map((t: { label: string }) => t.label)
      .join(", ");

    const sourcesList = resolvedSources?.length ? `Sources préférées (à inclure si pertinent, mais ne te limite PAS à celles-ci - cherche sur TOUT le web) : ${resolvedSources.join(", ")}` : "";

    // --- ANTI-DOUBLON : récupérer les titres des 3 dernières newsletters ---
    const { data: recentNewsletters } = await supabase
      .from("newsletters")
      .select("content")
      .eq("user_id", verifiedUserId)
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

${resolvedBrief ? `BRIEF DU CLIENT (PRIORITÉ ABSOLUE) :
"${resolvedBrief}"
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
      // Ancien format (tableau d'articles) - backward compatible
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

    const featuredArticle = newsletterContent.articles.find((a: { featured: boolean }) => a.featured) || newsletterContent.articles[0];
    const dateLabel = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    let subject = featuredArticle
      ? `${featuredArticle.tag} - ${featuredArticle.title}`
      : `Votre veille du ${dateLabel}`;
    if (subject.length > 65) {
      subject = subject.substring(0, 62) + "...";
    }

    const { data: newsletter, error } = await supabase
      .from("newsletters")
      .insert({
        user_id: verifiedUserId,
        subject,
        content: newsletterContent,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
    }

    return NextResponse.json({ newsletter, articles: newsletterContent.articles, editorial: newsletterContent.editorial, keyFigures: newsletterContent.key_figures });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
