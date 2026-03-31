import { Resend } from "resend";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { apiRateLimit } from "@/lib/ratelimit";
import { buildNewsletterHtml, Article, KeyFigure } from "@/lib/email-template";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { newsletterId, userId } = await request.json();

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

    const { data: newsletter, error: nlError } = await supabase
      .from("newsletters")
      .select("*")
      .eq("id", newsletterId)
      .single();

    if (nlError || !newsletter) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    }

    const { data: config } = await supabase
      .from("newsletter_config")
      .select("brand_color, custom_logo_url, text_color, bg_color, body_text_color")
      .eq("user_id", newsletter.user_id)
      .single();

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", verifiedUserId)
      .single();

    const brandColor = config?.brand_color || "#005058";
    const customLogo = config?.custom_logo_url || null;
    const textColor = config?.text_color || "#111827";
    const bgColor = config?.bg_color || "#FFFFFF";
    const bodyTextColor = config?.body_text_color || "#4B5563";
    const plan = profile?.plan || "free";

    const { data: recipients } = await supabase
      .from("recipients")
      .select("*")
      .eq("user_id", verifiedUserId);

    if (!recipients?.length) {
      return NextResponse.json({ error: "No recipients configured" }, { status: 400 });
    }

    const raw = newsletter.content;
    let editorial = "";
    let keyFigures: KeyFigure[] = [];
    let articles: Article[] = [];

    if (Array.isArray(raw)) {
      articles = raw;
    } else {
      editorial = raw.editorial || "";
      keyFigures = raw.key_figures || [];
      articles = raw.articles || [];
    }

    const featuredArticle = articles.find((a) => a.featured) || articles[0];
    const otherArticles = articles.filter((a) => a !== featuredArticle);

    const dateStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    const results = [];
    for (const recipient of recipients) {
      const emailHtml = buildNewsletterHtml({
        newsletterId: newsletter.id,
        recipientEmail: recipient.email,
        subject: newsletter.subject,
        brandColor,
        textColor,
        bgColor,
        bodyTextColor,
        customLogo,
        date: `Semaine du ${dateStr}`,
        editorial,
        keyFigures,
        featuredArticle,
        otherArticles,
        plan,
      });

      try {
        const result = await resend.emails.send({
          from: "Sorell <newsletter@sorell.fr>",
          to: recipient.email,
          subject: newsletter.subject,
          html: emailHtml,
        });
        results.push({ email: recipient.email, success: true, id: result.data?.id });
      } catch (e) {
        results.push({ email: recipient.email, success: false, error: String(e) });
      }
    }

    await supabase
      .from("newsletters")
      .update({ status: "sent", sent_at: new Date().toISOString(), recipient_count: recipients.length })
      .eq("id", newsletterId);

    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
