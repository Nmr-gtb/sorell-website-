import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { apiRateLimit } from "@/lib/ratelimit";
import { logNewsletterGenerated } from "@/lib/activity-log";

export const maxDuration = 60;
import {
  extractPreviousTitles,
  buildNewsletterPrompt,
  generateNewsletterContent,
  buildSubjectLine,
} from "@/lib/newsletter-generator";

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

    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", verifiedUserId).single();
    const plan = profile?.plan || "free";

    const previewLimits: Record<string, number> = { free: 0, pro: -1, business: -1, enterprise: -1 };
    const maxPreviews = previewLimits[plan] ?? 0;

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

    const sourcesList = resolvedSources?.length ? resolvedSources.join(", ") : "";

    // --- ANTI-DOUBLON : récupérer les titres des 3 dernières newsletters ---
    const { data: recentNewsletters } = await supabase
      .from("newsletters")
      .select("content")
      .eq("user_id", verifiedUserId)
      .order("created_at", { ascending: false })
      .limit(3);

    const previousTitles = extractPreviousTitles(recentNewsletters || []);

    const now = new Date();
    const prompt = buildNewsletterPrompt({
      topics: topicsList,
      sources: sourcesList,
      customBrief: resolvedBrief || "",
      dateString: now.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      searchDateHint: now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      previousTitles,
    });

    const newsletterContent = await generateNewsletterContent(prompt);

    const dateLabel = now.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
    const subject = buildSubjectLine(newsletterContent, dateLabel);

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

    // Activity log
    void logNewsletterGenerated(verifiedUserId, authUser.email || "", subject);

    return NextResponse.json({ newsletter, articles: newsletterContent.articles, editorial: newsletterContent.editorial, keyFigures: newsletterContent.key_figures });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
