import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { draftSaveRateLimit } from "@/lib/ratelimit";
import { NewsletterArticle, NewsletterContent } from "@/lib/newsletter-generator";
import { canUseEditor } from "@/lib/plans";

// ---------------------------------------------------------------------------
// Sauvegarde des modifications d'un brouillon (mode éditeur) :
// textes édités, articles réordonnés/supprimés, changement de "featured", objet.
// ---------------------------------------------------------------------------

const MAX_ARTICLES = 12;
const MAX_KEY_FIGURES = 5;

function cleanString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLength);
}

/** Valide et nettoie le content envoyé par le client. Retourne null si invalide. */
function sanitizeContent(raw: unknown): NewsletterContent | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;

  if (!Array.isArray(obj.articles) || obj.articles.length === 0 || obj.articles.length > MAX_ARTICLES) {
    return null;
  }

  const articles: NewsletterArticle[] = [];
  for (const item of obj.articles) {
    if (!item || typeof item !== "object") return null;
    const a = item as Record<string, unknown>;

    const title = cleanString(a.title, 200).trim();
    if (!title) return null;

    const url = cleanString(a.url, 500).trim();
    if (url && !/^https?:\/\//.test(url)) return null;

    const publishedAt = cleanString(a.published_at, 30).trim();

    articles.push({
      tag: cleanString(a.tag, 60),
      title,
      hook: cleanString(a.hook, 300),
      content: cleanString(a.content, 2000),
      summary: cleanString(a.summary, 2000) || undefined,
      source: cleanString(a.source, 120),
      url,
      featured: a.featured === true,
      published_at: publishedAt || undefined,
    });
  }

  // Exactement un article "à la une" : on garde le premier flag rencontré,
  // et le premier article devient featured si aucun ne l'est.
  const firstFeatured = articles.findIndex((a) => a.featured);
  const featuredIndex = firstFeatured === -1 ? 0 : firstFeatured;
  const normalizedArticles = articles.map((a, i) => ({ ...a, featured: i === featuredIndex }));

  const rawFigures = Array.isArray(obj.key_figures) ? obj.key_figures : [];
  if (rawFigures.length > MAX_KEY_FIGURES) return null;
  const keyFigures = rawFigures
    .filter((f) => f && typeof f === "object")
    .map((f) => {
      const fig = f as Record<string, unknown>;
      return {
        value: cleanString(fig.value, 100),
        label: cleanString(fig.label, 200),
        context: cleanString(fig.context, 200),
      };
    })
    .filter((f) => f.value.trim());

  return {
    editorial: cleanString(obj.editorial, 2000),
    key_figures: keyFigures,
    articles: normalizedArticles,
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
      const { success: rateLimitOk } = await draftSaveRateLimit.limit(verifiedUserId);
      if (!rateLimitOk) {
        return NextResponse.json(
          { error: "Trop de requetes. Reessayez dans une heure." },
          { status: 429 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Service temporairement indisponible. Réessayez dans quelques minutes." },
        { status: 503 }
      );
    }

    // L'édition de brouillon fait partie du mode éditeur : même gating que
    // /api/generate/article (plans Business/Enterprise uniquement).
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", verifiedUserId)
      .single();

    if (!canUseEditor(profile?.plan || "free")) {
      return NextResponse.json(
        { error: "Le mode éditeur est réservé aux plans Business et Enterprise." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      newsletterId?: string;
      content?: unknown;
      subject?: unknown;
      reset?: boolean;
    };

    if (!body.newsletterId || typeof body.newsletterId !== "string") {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    // --- RESET : restaurer la version générée d'origine ----------------------
    if (body.reset === true) {
      const { data: original, error: origError } = await supabase
        .from("newsletters")
        .select("id, status, original_content, original_subject")
        .eq("id", body.newsletterId)
        .eq("user_id", verifiedUserId)
        .single();

      if (origError || !original) {
        return NextResponse.json({ error: "Newsletter introuvable" }, { status: 404 });
      }
      if (original.status !== "draft") {
        return NextResponse.json(
          { error: "Seul un brouillon peut être modifié." },
          { status: 400 }
        );
      }
      if (!original.original_content) {
        return NextResponse.json(
          { error: "Aucune version d'origine disponible pour ce brouillon." },
          { status: 400 }
        );
      }

      const resetUpdates: Record<string, unknown> = { content: original.original_content };
      if (original.original_subject) resetUpdates.subject = original.original_subject;

      const { data: restored, error: resetError } = await supabase
        .from("newsletters")
        .update(resetUpdates)
        .eq("id", body.newsletterId)
        .eq("user_id", verifiedUserId)
        .select()
        .single();

      if (resetError || !restored) {
        return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
      }

      return NextResponse.json({ newsletter: restored });
    }

    const content = sanitizeContent(body.content);
    if (!content) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const { data: newsletter, error: nlError } = await supabase
      .from("newsletters")
      .select("id, status")
      .eq("id", body.newsletterId)
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

    const updates: Record<string, unknown> = { content };
    const subject = cleanString(body.subject, 200).trim();
    if (subject) updates.subject = subject;

    const { data: updated, error: updateError } = await supabase
      .from("newsletters")
      .update(updates)
      .eq("id", body.newsletterId)
      .eq("user_id", verifiedUserId)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
    }

    return NextResponse.json({ newsletter: updated });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
