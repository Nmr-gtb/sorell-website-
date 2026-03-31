import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { apiRateLimit } from "@/lib/ratelimit";

const resend = new Resend(process.env.RESEND_API_KEY!);
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

    const brandColor = config?.brand_color || "#005058";
    const customLogo = config?.custom_logo_url || null;
    const textColor = config?.text_color || "#111827";
    const bgColor = config?.bg_color || "#FFFFFF";
    const bodyTextColor = config?.body_text_color || "#4B5563";

    const { data: recipients } = await supabase
      .from("recipients")
      .select("*")
      .eq("user_id", verifiedUserId);

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
  <div style="max-width:620px;margin:0 auto;background:${bgColor};">

    <!-- Header -->
    <div style="padding:24px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            ${customLogo
              ? '<img src="' + customLogo + '" alt="Logo" style="max-height:36px;max-width:180px;" />'
              : '<span style="font-size:20px;font-weight:700;color:' + textColor + ';letter-spacing:-0.02em;">Sorel<span style="color:' + brandColor + ';">l</span></span>'
            }
          </td>
          <td align="right">
            <span style="font-size:12px;color:#9CA3AF;">Semaine du ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Article phare avec bandeau décoratif -->
    <div style="padding:0 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:10px;overflow:hidden;border:1px solid #E5E7EB;">
        <tr>
          <td style="background:#1F2937;height:120px;"></td>
        </tr>
        <tr>
          <td style="padding:20px 24px;background:${bgColor};">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <span style="display:inline-block;padding:4px 12px;border-radius:4px;background:${brandColor};color:white;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Article phare</span>
                </td>
              </tr>
            </table>
            <a href="https://www.sorell.fr/api/track/click?nid=${newsletter.id}&email=${encodeURIComponent(recipient.email)}&article=${encodeURIComponent(featuredArticle.title)}&url=${encodeURIComponent(featuredArticle.url || "https://sorell.fr")}" style="text-decoration:none;">
              <h2 style="font-size:18px;font-weight:700;color:${textColor};margin:12px 0 8px;line-height:1.35;letter-spacing:-0.01em;">${featuredArticle.title}</h2>
            </a>
            ${featuredArticle.hook ? '<p style="font-size:14px;color:' + (bodyTextColor || '#4B5563') + ';margin:0 0 10px;font-style:italic;line-height:1.5;">' + featuredArticle.hook + '</p>' : ''}
            <p style="font-size:14px;color:${bodyTextColor || '#4B5563'};line-height:1.65;margin:0 0 12px;">${featuredArticle.content || featuredArticle.summary || ""}</p>
            <a href="${featuredArticle.url || 'https://sorell.fr'}" style="font-size:12px;color:${brandColor};text-decoration:none;font-weight:500;">${featuredArticle.source} →</a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Intro personnalisée -->
    <div style="padding:0 32px 20px;">
      <p style="font-size:14px;color:${textColor};line-height:1.6;">
        <span style="font-weight:600;">Bonjour,</span>
        <span style="color:#6B7280;"> voici les ${otherArticles.length + 1} actualités clés de votre secteur cette semaine, sélectionnées et résumées par Sorell.</span>
      </p>
    </div>

    ${editorial ? '<!-- Éditorial --><div style="padding:0 32px 24px;"><div style="border-left:3px solid ' + brandColor + ';padding:16px 20px;background:#F8FAFC;"><p style="font-size:11px;font-weight:600;color:' + brandColor + ';text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;">Éditorial</p><p style="font-size:14px;color:' + (bodyTextColor || '#374151') + ';line-height:1.65;margin:0;font-style:italic;">' + editorial + '</p></div></div>' : ''}

    ${keyFigures.length > 0 ? '<!-- Chiffres clés --><div style="padding:0 32px 24px;"><p style="font-size:11px;font-weight:600;color:' + brandColor + ';text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">Chiffres clés</p><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' + keyFigures.map((fig: {value: string; label: string; context: string}) => '<td style="padding:12px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;text-align:center;width:' + Math.floor(100 / keyFigures.length) + '%;"><div style="font-size:22px;font-weight:700;color:' + brandColor + ';margin-bottom:4px;">' + fig.value + '</div><div style="font-size:12px;color:' + textColor + ';font-weight:500;margin-bottom:2px;">' + fig.label + '</div><div style="font-size:11px;color:#9CA3AF;">' + fig.context + '</div></td>').join('<td style="width:8px;"></td>') + '</tr></table></div>' : ''}

    <!-- Articles secondaires -->
    <div style="padding:0 32px 16px;">
      <p style="font-size:11px;font-weight:600;color:${brandColor};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 16px;">Les actus de la semaine</p>

      ${otherArticles.length >= 2 ? '<!-- 2 premiers articles en grille --><table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;"><tr><td style="width:48%;vertical-align:top;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;"><tr><td style="background:#374151;height:80px;"></td></tr><tr><td style="padding:14px;background:' + bgColor + ';"><span style="display:inline-block;padding:3px 8px;border-radius:4px;background:#F3F4F6;color:#374151;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">' + otherArticles[0].tag + '</span><a href="https://www.sorell.fr/api/track/click?nid=' + newsletter.id + '&email=' + encodeURIComponent(recipient.email) + '&article=' + encodeURIComponent(otherArticles[0].title) + '&url=' + encodeURIComponent(otherArticles[0].url || "https://sorell.fr") + '" style="text-decoration:none;"><h3 style="font-size:14px;font-weight:600;color:' + textColor + ';margin:8px 0;line-height:1.35;">' + otherArticles[0].title + '</h3></a><p style="font-size:12px;color:' + (bodyTextColor || '#6B7280') + ';line-height:1.5;margin:0 0 8px;">' + ((otherArticles[0].content || otherArticles[0].summary || "").length > 120 ? (otherArticles[0].content || otherArticles[0].summary || "").substring(0, 120) + "..." : (otherArticles[0].content || otherArticles[0].summary || "")) + '</p><a href="' + (otherArticles[0].url || 'https://sorell.fr') + '" style="font-size:11px;color:' + brandColor + ';text-decoration:none;font-weight:500;">' + otherArticles[0].source + ' →</a></td></tr></table></td><td style="width:4%;"></td><td style="width:48%;vertical-align:top;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;"><tr><td style="background:#374151;height:80px;"></td></tr><tr><td style="padding:14px;background:' + bgColor + ';"><span style="display:inline-block;padding:3px 8px;border-radius:4px;background:#F3F4F6;color:#374151;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">' + otherArticles[1].tag + '</span><a href="https://www.sorell.fr/api/track/click?nid=' + newsletter.id + '&email=' + encodeURIComponent(recipient.email) + '&article=' + encodeURIComponent(otherArticles[1].title) + '&url=' + encodeURIComponent(otherArticles[1].url || "https://sorell.fr") + '" style="text-decoration:none;"><h3 style="font-size:14px;font-weight:600;color:' + textColor + ';margin:8px 0;line-height:1.35;">' + otherArticles[1].title + '</h3></a><p style="font-size:12px;color:' + (bodyTextColor || '#6B7280') + ';line-height:1.5;margin:0 0 8px;">' + ((otherArticles[1].content || otherArticles[1].summary || "").length > 120 ? (otherArticles[1].content || otherArticles[1].summary || "").substring(0, 120) + "..." : (otherArticles[1].content || otherArticles[1].summary || "")) + '</p><a href="' + (otherArticles[1].url || 'https://sorell.fr') + '" style="font-size:11px;color:' + brandColor + ';text-decoration:none;font-weight:500;">' + otherArticles[1].source + ' →</a></td></tr></table></td></tr></table>' : ''}

      ${otherArticles.slice(2).map((a: {tag: string; title: string; hook?: string; content?: string; summary?: string; source: string; url?: string}, i: number) => '<!-- Article ' + (i + 3) + ' --><table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;"><tr><td style="background:#374151;height:60px;"></td></tr><tr><td style="padding:16px 20px;background:' + bgColor + ';"><span style="display:inline-block;padding:3px 8px;border-radius:4px;background:#F3F4F6;color:#374151;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">' + a.tag + '</span><a href="https://www.sorell.fr/api/track/click?nid=' + newsletter.id + '&email=' + encodeURIComponent(recipient.email) + '&article=' + encodeURIComponent(a.title) + '&url=' + encodeURIComponent(a.url || "https://sorell.fr") + '" style="text-decoration:none;"><h3 style="font-size:15px;font-weight:600;color:' + textColor + ';margin:8px 0;line-height:1.35;">' + a.title + '</h3></a>' + (a.hook ? '<p style="font-size:13px;color:' + (bodyTextColor || '#4B5563') + ';margin:0 0 8px;font-style:italic;">' + a.hook + '</p>' : '') + '<p style="font-size:13px;color:' + (bodyTextColor || '#6B7280') + ';line-height:1.6;margin:0 0 10px;">' + (a.content || a.summary || "") + '</p><a href="' + (a.url || 'https://sorell.fr') + '" style="font-size:12px;color:' + brandColor + ';text-decoration:none;font-weight:500;">' + a.source + ' →</a></td></tr></table>').join('')}
    </div>

    <!-- Statistiques -->
    <div style="padding:8px 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="text-align:center;padding:12px;border:1px solid #E5E7EB;border-radius:8px;">
            <div style="font-size:20px;font-weight:700;color:${brandColor};">147</div>
            <div style="font-size:11px;color:#9CA3AF;">Sources analysées</div>
          </td>
          <td style="width:8px;"></td>
          <td style="text-align:center;padding:12px;border:1px solid #E5E7EB;border-radius:8px;">
            <div style="font-size:20px;font-weight:700;color:${brandColor};">${otherArticles.length + 1}</div>
            <div style="font-size:11px;color:#9CA3AF;">Articles retenus</div>
          </td>
          <td style="width:8px;"></td>
          <td style="text-align:center;padding:12px;border:1px solid #E5E7EB;border-radius:8px;">
            <div style="font-size:20px;font-weight:700;color:${brandColor};">3min</div>
            <div style="font-size:11px;color:#9CA3AF;">Temps de lecture</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="padding:0 32px 24px;text-align:center;">
      <p style="font-size:14px;color:#6B7280;margin:0 0 12px;">Cette newsletter vous a été utile ?</p>
      <a href="https://sorell.fr/tarifs" style="display:inline-block;padding:10px 24px;background:${brandColor};color:white;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">Partager avec votre équipe</a>
    </div>

    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #E5E7EB;background:#F9FAFB;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            ${customLogo
              ? '<img src="' + customLogo + '" alt="Logo" style="max-height:28px;max-width:140px;" />'
              : '<span style="font-size:14px;font-weight:700;color:' + textColor + ';letter-spacing:-0.01em;">Sorel<span style="color:' + brandColor + ';">l</span></span>'
            }
          </td>
          <td align="right">
            <a href="https://sorell.fr" style="font-size:12px;color:${brandColor};text-decoration:none;">sorell.fr</a>
          </td>
        </tr>
      </table>
      <p style="font-size:11px;color:#9CA3AF;margin:12px 0 0;line-height:1.5;">
        Généré automatiquement par Sorell · Personnalisé pour vous<br/>
        <a href="https://www.sorell.fr/desabonnement?email=${encodeURIComponent(recipient.email)}" style="color:#9CA3AF;">Se désabonner</a>
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
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
