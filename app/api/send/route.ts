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

    const raw = newsletter.content;
    let editorial = "";
    let keyFigures: { value: string; label: string; context: string }[] = [];
    let articles: { tag: string; title: string; hook?: string; content?: string; summary?: string; source: string; url?: string; featured: boolean }[] = [];

    if (Array.isArray(raw)) {
      articles = raw;
    } else {
      editorial = raw.editorial || "";
      keyFigures = raw.key_figures || [];
      articles = raw.articles || [];
    }

    const featuredArticle = articles.find((a) => a.featured) || articles[0];
    const otherArticles = articles.filter((a) => a !== featuredArticle);

    const results = [];
    for (const recipient of recipients) {
      const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;">

    <!-- Header -->
    <div style="padding:28px 32px;border-bottom:2px solid #2563EB;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <span style="font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.02em;">Sorel<span style="color:#2563EB;">l</span></span>
          </td>
          <td align="right">
            <span style="font-size:12px;color:#9CA3AF;">${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Subject -->
    <div style="padding:28px 32px 20px;">
      <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 6px;letter-spacing:-0.02em;line-height:1.3;">${newsletter.subject}</h1>
      <p style="font-size:13px;color:#9CA3AF;margin:0;">Votre veille sectorielle personnalisée par IA</p>
    </div>

    ${editorial ? `
    <!-- Éditorial -->
    <div style="padding:0 32px 24px;">
      <div style="border-left:3px solid #2563EB;padding:16px 20px;background:#F8FAFC;border-radius:0 8px 8px 0;">
        <p style="font-size:11px;font-weight:600;color:#2563EB;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;">Éditorial</p>
        <p style="font-size:14px;color:#374151;line-height:1.65;margin:0;font-style:italic;">${editorial}</p>
      </div>
    </div>
    ` : ""}

    ${keyFigures.length > 0 ? `
    <!-- Chiffres clés -->
    <div style="padding:0 32px 24px;">
      <p style="font-size:11px;font-weight:600;color:#2563EB;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Chiffres clés</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${keyFigures.map(fig => `
          <td style="padding:12px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;text-align:center;width:${Math.floor(100 / keyFigures.length)}%;">
            <div style="font-size:22px;font-weight:700;color:#2563EB;letter-spacing:-0.02em;margin-bottom:4px;">${fig.value}</div>
            <div style="font-size:12px;color:#111827;font-weight:500;margin-bottom:2px;">${fig.label}</div>
            <div style="font-size:11px;color:#9CA3AF;">${fig.context}</div>
          </td>
          `).join('<td style="width:8px;"></td>')}
        </tr>
      </table>
    </div>
    ` : ""}

    <!-- Article phare -->
    <div style="padding:0 32px 24px;">
      <div style="background:#F8FAFC;border-radius:10px;padding:24px;border:1px solid #E5E7EB;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <span style="display:inline-block;padding:3px 10px;border-radius:4px;background:#2563EB;color:white;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Article phare · ${featuredArticle.tag}</span>
            </td>
          </tr>
        </table>
        <a href="https://www.sorell.fr/api/track/click?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}&article=${encodeURIComponent(featuredArticle.title)}&url=${encodeURIComponent(featuredArticle.url || "https://sorell.fr")}" style="text-decoration:none;">
          <h2 style="font-size:18px;font-weight:700;color:#111827;margin:12px 0 8px;line-height:1.35;letter-spacing:-0.01em;">${featuredArticle.title}</h2>
        </a>
        ${featuredArticle.hook ? `<p style="font-size:14px;color:#2563EB;margin:0 0 10px;font-weight:500;">${featuredArticle.hook}</p>` : ""}
        <p style="font-size:14px;color:#4B5563;line-height:1.65;margin:0 0 10px;">${featuredArticle.content || featuredArticle.summary || ""}</p>
        <span style="font-size:12px;color:#9CA3AF;">Source : ${featuredArticle.source}</span>
        ${featuredArticle.url ? `<br/><a href="https://www.sorell.fr/api/track/click?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}&article=${encodeURIComponent(featuredArticle.title)}&url=${encodeURIComponent(featuredArticle.url)}" style="font-size:12px;color:#2563EB;text-decoration:none;font-weight:500;">Lire l'article →</a>` : ""}
      </div>
    </div>

    <!-- Autres articles -->
    <div style="padding:0 32px 16px;">
      <p style="font-size:11px;font-weight:600;color:#2563EB;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 16px;">Les actus de la semaine</p>
      ${otherArticles.map((a, i) => `
      <div style="padding:20px 0;${i < otherArticles.length - 1 ? "border-bottom:1px solid #E5E7EB;" : ""}">
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;">
          <tr>
            <td>
              <span style="display:inline-block;padding:2px 8px;border-radius:4px;background:#F3F4F6;color:#374151;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${a.tag}</span>
            </td>
          </tr>
        </table>
        <a href="https://www.sorell.fr/api/track/click?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}&article=${encodeURIComponent(a.title)}&url=${encodeURIComponent(a.url || "https://sorell.fr")}" style="text-decoration:none;">
          <h3 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 6px;line-height:1.35;">${a.title}</h3>
        </a>
        ${a.hook ? `<p style="font-size:13px;color:#2563EB;margin:0 0 8px;font-weight:500;">${a.hook}</p>` : ""}
        <p style="font-size:13px;color:#6B7280;line-height:1.6;margin:0 0 6px;">${a.content || a.summary || ""}</p>
        <span style="font-size:11px;color:#9CA3AF;">Source : ${a.source}</span>
        ${a.url ? `<br/><a href="https://www.sorell.fr/api/track/click?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}&article=${encodeURIComponent(a.title)}&url=${encodeURIComponent(a.url)}" style="font-size:12px;color:#2563EB;text-decoration:none;font-weight:500;">Lire l'article →</a>` : ""}
      </div>
      `).join("")}
    </div>

    <!-- Footer -->
    <div style="padding:24px 32px;border-top:2px solid #E5E7EB;background:#F9FAFB;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <span style="font-size:14px;font-weight:700;color:#111827;letter-spacing:-0.01em;">Sorel<span style="color:#2563EB;">l</span></span>
          </td>
          <td align="right">
            <a href="https://sorell.fr" style="font-size:12px;color:#2563EB;text-decoration:none;">sorell.fr</a>
          </td>
        </tr>
      </table>
      <p style="font-size:11px;color:#9CA3AF;margin:12px 0 0;line-height:1.5;">
        Généré automatiquement par IA · Personnalisé pour vous<br/>
        <a href="https://www.sorell.fr/api/unsubscribe?email=${encodeURIComponent(recipient.email)}&uid=${userId}" style="color:#9CA3AF;">Se désabonner</a>
      </p>
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
