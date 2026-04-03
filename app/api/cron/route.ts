import { Resend } from "resend";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildNewsletterHtml } from "@/lib/email-template";
import {
  extractPreviousTitles,
  buildNewsletterPrompt,
  generateNewsletterContent,
  buildSubjectLine,
} from "@/lib/newsletter-generator";

const resend = new Resend(process.env.RESEND_API_KEY!);

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

  const { data: configs, error } = await supabaseAdmin
    .from("newsletter_config")
    .select("*")
    .not("topics", "eq", "[]");

  if (error || !configs?.length) {
    return NextResponse.json({ message: "No configs to process", error });
  }

  // Batch fetch all profiles to avoid N+1 queries
  const userIds = configs.map((c: { user_id: string }) => c.user_id);
  const { data: allProfiles } = await supabaseAdmin.from("profiles").select("id, plan").in("id", userIds);
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

        const { count } = await supabaseAdmin
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
      const { data: recentNewsletters } = await supabaseAdmin
        .from("newsletters")
        .select("content")
        .eq("user_id", config.user_id)
        .order("created_at", { ascending: false })
        .limit(3);

      const previousTitles = extractPreviousTitles(recentNewsletters || []);

      const prompt = buildNewsletterPrompt({
        topics,
        sources,
        customBrief,
        dateString: franceTime.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
        searchDateHint: franceTime.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
        previousTitles,
      });

      const newsletterContent = await generateNewsletterContent(prompt);

      const articles = newsletterContent.articles;

      const dateLabel = franceTime.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
      const subject = buildSubjectLine(newsletterContent, dateLabel);

      const { data: newsletter } = await supabaseAdmin
        .from("newsletters")
        .insert({ user_id: config.user_id, subject, content: newsletterContent, status: "draft" })
        .select()
        .single();

      if (!newsletter) continue;

      let recipients = (await supabaseAdmin
        .from("recipients")
        .select("*")
        .eq("user_id", config.user_id)).data || [];

      if (!recipients.length) {
        // Try to auto-add user email as recipient
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(config.user_id);
        const userEmail = authUser?.user?.email;
        if (userEmail) {
          await supabaseAdmin.from("recipients").upsert(
            { user_id: config.user_id, email: userEmail, name: "" },
            { onConflict: "user_id,email" }
          );
          const { data: refreshed } = await supabaseAdmin
            .from("recipients")
            .select("*")
            .eq("user_id", config.user_id);
          if (!refreshed?.length) continue;
          recipients = refreshed;
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
      const dateStr = franceTime.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

      for (const recipient of recipients) {
        const emailHtml = await buildNewsletterHtml({
          newsletterId: newsletter.id,
          recipientEmail: recipient.email,
          subject,
          brandColor,
          textColor,
          bgColor,
          bodyTextColor,
          customLogo,
          date: `Semaine du ${dateStr}`,
          editorial: editorial || "",
          keyFigures: keyFigures || [],
          featuredArticle,
          otherArticles,
          plan: userPlan,
        });

        try {
          await resend.emails.send({
            from: "Sorell <newsletter@sorell.fr>",
            to: recipient.email,
            subject,
            html: emailHtml,
          });
        } catch {
          // silently ignore
        }
      }

      await supabaseAdmin.from("newsletters").update({ status: "sent", sent_at: new Date().toISOString(), recipient_count: recipients.length }).eq("id", newsletter.id);
      await supabaseAdmin.from("newsletter_config").update({ last_sent_at: new Date().toISOString() }).eq("user_id", config.user_id);

      results.push({ userId: config.user_id, status: "sent", recipients: recipients.length });
    } catch (err) {
      results.push({ userId: config.user_id, status: "error", error: "Erreur lors du traitement" });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
