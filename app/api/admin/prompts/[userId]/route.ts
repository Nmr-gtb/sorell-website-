import { NextResponse } from "next/server";
import { getAuthenticatedAdmin, isValidUUID } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildNewsletterPrompt, extractPreviousTitles } from "@/lib/newsletter-generator";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const admin = getAuthenticatedAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { userId } = await params;

  if (!isValidUUID(userId)) {
    return NextResponse.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  try {
    // Get user profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, plan")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });
    }

    // Get newsletter config
    const { data: config } = await supabaseAdmin
      .from("newsletter_config")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!config) {
      return NextResponse.json({
        profile,
        config: null,
        prompt: null,
        lastGeneration: null,
        message: "Cet utilisateur n'a pas encore configuré sa newsletter.",
      });
    }

    // Get last 3 newsletters for anti-duplication
    const { data: recentNewsletters } = await supabaseAdmin
      .from("newsletters")
      .select("content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);

    const previousTitles = extractPreviousTitles(recentNewsletters || []);

    // Build the prompt as it would be for generation
    const now = new Date();
    const dateString = now.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const enabledTopics = (config.topics || [])
      .filter((t: { enabled?: boolean }) => t.enabled)
      .map((t: { label?: string }) => t.label || "");
    const topics = enabledTopics.join(", ");

    const prompt = buildNewsletterPrompt({
      topics,
      sources: config.sources || "",
      customBrief: config.custom_brief || "",
      dateString,
      searchDateHint: `semaine du ${now.toLocaleDateString("fr-FR")}`,
      previousTitles,
    });

    // Get last generation
    const { data: lastNewsletter } = await supabaseAdmin
      .from("newsletters")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      profile,
      config,
      prompt,
      previousTitles,
      lastGeneration: lastNewsletter || null,
    });
  } catch {
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
