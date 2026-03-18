import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { newsletterId, userId } = await request.json();

    const { data: newsletter, error: nlError } = await supabase
      .from("newsletters")
      .select("*")
      .eq("id", newsletterId)
      .single();

    if (nlError || !newsletter) {
      return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    }

    const { data: recipients } = await supabase
      .from("recipients")
      .select("*")
      .eq("user_id", userId);

    if (!recipients?.length) {
      return NextResponse.json({ error: "No recipients configured" }, { status: 400 });
    }

    const articles = newsletter.content as Array<{
      tag: string;
      title: string;
      summary: string;
      source: string;
      featured: boolean;
    }>;
    const featuredArticle = articles.find((a) => a.featured) || articles[0];
    const otherArticles = articles.filter((a) => a !== featuredArticle);

    const results = [];
    for (const recipient of recipients) {
      const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;">
    <!-- Header -->
    <div style="padding:24px 32px;border-bottom:1px solid #E5E7EB;">
      <span style="font-size:18px;font-weight:700;color:#111827;letter-spacing:-0.02em;">Sorel<span style="color:#2563EB;">l</span></span>
    </div>
    <!-- Subject -->
    <div style="padding:32px 32px 24px;">
      <h1 style="font-size:20px;font-weight:700;color:#111827;margin:0 0 8px;letter-spacing:-0.01em;">${newsletter.subject}</h1>
      <p style="font-size:14px;color:#6B7280;margin:0;">Votre veille sectorielle de la semaine</p>
    </div>
    <!-- Featured -->
    <div style="padding:0 32px 24px;">
      <div style="background:#F9FAFB;border-radius:8px;padding:20px;border:1px solid #E5E7EB;">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:rgba(37,99,235,0.08);color:#2563EB;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">Article phare · ${featuredArticle.tag}</span>
        <a href="https://www.sorell.fr/api/track/click?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}&article=${encodeURIComponent(featuredArticle.title)}&url=${encodeURIComponent("https://sorell.fr")}" style="color:#111827;text-decoration:none;">
          <h2 style="font-size:17px;font-weight:600;color:#111827;margin:8px 0 6px;line-height:1.35;">${featuredArticle.title}</h2>
        </a>
        <p style="font-size:14px;color:#6B7280;margin:0 0 6px;line-height:1.5;">${featuredArticle.summary}</p>
        <span style="font-size:12px;color:#9CA3AF;">${featuredArticle.source}</span>
      </div>
    </div>
    <!-- Other articles -->
    <div style="padding:0 32px 32px;">
      ${otherArticles
        .map(
          (a) => `
      <div style="padding:16px 0;border-top:1px solid #E5E7EB;">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:#F3F4F6;color:#374151;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">${a.tag}</span>
        <a href="https://www.sorell.fr/api/track/click?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}&article=${encodeURIComponent(a.title)}&url=${encodeURIComponent("https://sorell.fr")}" style="color:#111827;text-decoration:none;">
          <h3 style="font-size:15px;font-weight:600;color:#111827;margin:4px 0;line-height:1.35;">${a.title}</h3>
        </a>
        <p style="font-size:13px;color:#6B7280;margin:0 0 4px;line-height:1.5;">${a.summary}</p>
        <span style="font-size:11px;color:#9CA3AF;">${a.source}</span>
      </div>`
        )
        .join("")}
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #E5E7EB;text-align:center;">
      <p style="font-size:12px;color:#9CA3AF;margin:0;">Généré automatiquement par Sorel<span style="color:#2563EB;">l</span></p>
    </div>
  </div>
  <img src="https://www.sorell.fr/api/track/open?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}" width="1" height="1" style="display:none;" alt="" />
</body>
</html>`;

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
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Send error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
