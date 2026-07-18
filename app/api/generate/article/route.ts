import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { apiRateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

import {
  extractPreviousTitles,
  generateSingleArticle,
  regenerateEditorial,
  regenerateKeyFigures,
  buildSubjectLine,
  NewsletterArticle,
  NewsletterContent,
} from "@/lib/newsletter-generator";
import { getModelForPlan, canUseEditor, MAX_CUSTOM_ARTICLES } from "@/lib/plans";

type RegenerateTarget = "article" | "editorial" | "key_figures" | "new_article";

/** Normalise le content JSONB (objet moderne ou tableau legacy) en NewsletterContent. */
function normalizeContent(raw: unknown): NewsletterContent {
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (Array.isArray(parsed)) {
    return { editorial: "", key_figures: [], articles: parsed };
  }
  const obj = (parsed || {}) as Record<string, unknown>;
  return {
    editorial: (obj.editorial as string) || "",
    key_figures: (obj.key_figures as NewsletterContent["key_figures"]) || [],
    articles: (obj.articles as NewsletterArticle[]) || [],
  };
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const verifiedUserId = authUser.id;

    try {
      const { success: rateLimitOk } = await apiRateLimit.limit(verifiedUserId);
      if (!rateLimitOk) {
        return NextResponse.json(
          { error: "Trop de requetes. Reessayez dans une heure." },
          { status: 429 }
        );
      }
    } catch {
      // Rate limiter unavailable — fail close to prevent uncontrolled API costs
      return NextResponse.json(
        { error: "Service temporairement indisponible. Réessayez dans quelques minutes." },
        { status: 503 }
      );
    }

    const { newsletterId, target, articleIndex } = (await request.json()) as {
      newsletterId?: string;
      target?: RegenerateTarget;
      articleIndex?: number;
    };

    if (!newsletterId || typeof newsletterId !== "string") {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const resolvedTarget: RegenerateTarget = target || "article";
    if (!["article", "editorial", "key_figures", "new_article"].includes(resolvedTarget)) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", verifiedUserId)
      .single();
    const plan = profile?.plan || "free";

    if (!canUseEditor(plan)) {
      return NextResponse.json(
        { error: "Le mode éditeur est réservé aux plans Business et Enterprise." },
        { status: 403 }
      );
    }

    const { data: newsletter, error: nlError } = await supabase
      .from("newsletters")
      .select("id, user_id, subject, content, status")
      .eq("id", newsletterId)
      .eq("user_id", verifiedUserId)
      .single();

    if (nlError || !newsletter) {
      return NextResponse.json({ error: "Newsletter introuvable" }, { status: 404 });
    }

    if (newsletter.status !== "draft") {
      return NextResponse.json(
        { error: "Seul un brouillon peut être modifié." },
        { status: 400 }
      );
    }

    let content: NewsletterContent;
    try {
      content = normalizeContent(newsletter.content);
    } catch {
      return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
    }

    const model = getModelForPlan(plan);
    let newSubject = newsletter.subject as string;

    // Génère un article frais en excluant une liste de titres (anti-doublon).
    // Réutilise la config de l'utilisateur (thématiques, sources, brief) et les
    // titres des newsletters récentes. Partagé entre "article" (remplacement) et
    // "new_article" (ajout).
    async function generateFreshArticle(
      draftTitlesToExclude: string[]
    ): Promise<NewsletterArticle | null> {
      const { data: config } = await supabase
        .from("newsletter_config")
        .select("topics, sources, custom_brief")
        .eq("user_id", verifiedUserId)
        .single();

      const topicsList = ((config?.topics as Array<{ enabled: boolean; label: string }>) || [])
        .filter((t) => t.enabled)
        .map((t) => t.label)
        .join(", ");
      const sourcesList = ((config?.sources as string[]) || []).join(", ");
      const customBrief = (config?.custom_brief as string) || "";

      // Anti-doublon : titres du brouillon + titres des newsletters récentes.
      const { data: recentNewsletters } = await supabase
        .from("newsletters")
        .select("content")
        .eq("user_id", verifiedUserId)
        .neq("id", newsletterId)
        .order("generated_at", { ascending: false })
        .limit(3);

      const previousTitles = extractPreviousTitles(recentNewsletters || []);
      const excludeTitles = [...draftTitlesToExclude, ...previousTitles].filter(Boolean);

      const now = new Date();
      return generateSingleArticle(
        {
          topics: topicsList,
          sources: sourcesList,
          customBrief,
          dateString: now.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          searchDateHint: now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
          excludeTitles,
        },
        { model, referenceDate: now }
      );
    }

    if (resolvedTarget === "article") {
      if (
        typeof articleIndex !== "number" ||
        !Number.isInteger(articleIndex) ||
        articleIndex < 0 ||
        articleIndex >= content.articles.length
      ) {
        return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
      }

      const otherTitles = content.articles
        .filter((_, i) => i !== articleIndex)
        .map((a) => a.title)
        .filter(Boolean);

      const newArticle = await generateFreshArticle(otherTitles);

      if (!newArticle) {
        return NextResponse.json(
          {
            error:
              "Aucune actualité récente (moins de 90 jours) n'a été trouvée pour remplacer cet article. Réessayez plus tard.",
          },
          { status: 422 }
        );
      }

      // L'article régénéré hérite du flag "featured" de celui qu'il remplace.
      const wasFeatured = Boolean(content.articles[articleIndex]?.featured);
      const replaced: NewsletterArticle = { ...newArticle, featured: wasFeatured };
      content.articles = content.articles.map((a, i) => (i === articleIndex ? replaced : a));

      // L'objet de l'email est dérivé de l'article à la une : le rafraîchir si besoin.
      if (wasFeatured) {
        const dateLabel = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
        newSubject = buildSubjectLine(content, dateLabel);
      }
    } else if (resolvedTarget === "new_article") {
      // Compléter un brouillon plafonné par la génération serverless (Vercel 60s).
      if (content.articles.length >= MAX_CUSTOM_ARTICLES) {
        return NextResponse.json(
          { error: `Le nombre maximum de ${MAX_CUSTOM_ARTICLES} articles est atteint.` },
          { status: 400 }
        );
      }

      const existingTitles = content.articles.map((a) => a.title).filter(Boolean);
      const newArticle = await generateFreshArticle(existingTitles);

      if (!newArticle) {
        return NextResponse.json(
          {
            error:
              "Aucune actualité récente (moins de 90 jours) n'a été trouvée pour ajouter un article. Réessayez plus tard.",
          },
          { status: 422 }
        );
      }

      // Le nouvel article vient s'ajouter à la fin, jamais à la une (l'article
      // vedette existant reste inchangé).
      content.articles = [...content.articles, { ...newArticle, featured: false }];
    } else if (resolvedTarget === "editorial") {
      if (!content.articles.length) {
        return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
      }
      const editorial = await regenerateEditorial(content.articles, model);
      if (!editorial) {
        return NextResponse.json(
          { error: "La régénération a échoué. Réessayez dans quelques instants." },
          { status: 422 }
        );
      }
      content.editorial = editorial;
    } else {
      if (!content.articles.length) {
        return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
      }
      const keyFigures = await regenerateKeyFigures(content.articles, model);
      if (keyFigures === null) {
        return NextResponse.json(
          { error: "La régénération a échoué. Réessayez dans quelques instants." },
          { status: 422 }
        );
      }
      content.key_figures = keyFigures;
    }

    const { data: updated, error: updateError } = await supabase
      .from("newsletters")
      .update({ content, subject: newSubject })
      .eq("id", newsletterId)
      .eq("user_id", verifiedUserId)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
    }

    return NextResponse.json({
      newsletter: updated,
      articles: content.articles,
      editorial: content.editorial,
      keyFigures: content.key_figures,
      subject: newSubject,
    });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
