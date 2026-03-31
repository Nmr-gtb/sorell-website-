// ─── Template Email Newsletter V3 ────────────────────────────────
// Fichier unique pour cron/route.ts et send/route.ts
// Inline HTML compatible Gmail, Outlook, Apple Mail, Yahoo

import { buildUnsubscribeUrl } from "@/lib/unsubscribe-token";

export interface Article {
  tag: string;
  title: string;
  hook?: string;
  content?: string;
  summary?: string;
  source: string;
  url?: string;
  featured?: boolean;
}

export interface KeyFigure {
  value: string;
  label: string;
  context: string;
}

export interface EmailTemplateParams {
  newsletterId: string;
  recipientEmail: string;
  subject: string;
  brandColor: string;
  textColor: string;
  bgColor: string;
  bodyTextColor: string;
  customLogo: string | null;
  date: string;
  editorial: string;
  keyFigures: KeyFigure[];
  featuredArticle: Article;
  otherArticles: Article[];
  plan: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(text: string, maxLen: number): string {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).replace(/\s+\S*$/, "") + "...";
}

function trackClick(newsletterId: string, recipientEmail: string, articleTitle: string, url: string): string {
  return `https://www.sorell.fr/api/track/click?nid=${newsletterId}&email=${encodeURIComponent(recipientEmail)}&article=${encodeURIComponent(articleTitle)}&url=${encodeURIComponent(url)}`;
}

export function buildNewsletterHtml(params: EmailTemplateParams): string {
  const {
    newsletterId,
    recipientEmail,
    subject,
    brandColor,
    textColor,
    bgColor,
    bodyTextColor,
    customLogo,
    date,
    editorial,
    keyFigures,
    featuredArticle,
    otherArticles,
    plan,
  } = params;

  const articleCount = otherArticles.length + 1;
  const preheaderText = `${articleCount} actualités clés de votre secteur - ${subject}`;

  // ─── Header ────────────────────────────────────────────────────
  const headerHtml = `
    <div style="padding:24px 32px;border-bottom:3px solid ${brandColor};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            ${customLogo
              ? '<img src="' + customLogo + '" alt="Logo" style="max-height:36px;max-width:180px;" />'
              : '<span style="font-size:22px;font-weight:700;color:' + textColor + ';letter-spacing:-0.02em;">Sorel<span style="color:' + brandColor + ';">l</span></span>'
            }
          </td>
          <td align="right">
            <span style="font-size:12px;color:#9CA3AF;">${date}</span>
          </td>
        </tr>
      </table>
    </div>`;

  // ─── Salutation ────────────────────────────────────────────────
  const introHtml = `
    <div style="padding:28px 32px 20px;">
      <p style="font-size:15px;color:${textColor};line-height:1.6;margin:0;">
        <span style="font-weight:600;">Bonjour,</span>
        <span style="color:${bodyTextColor};"> voici les ${articleCount} actualités clés de votre secteur, sélectionnées et résumées par IA.</span>
      </p>
    </div>`;

  // ─── Article phare ─────────────────────────────────────────────
  const featuredUrl = featuredArticle.url || "https://sorell.fr";
  const featuredClickUrl = trackClick(newsletterId, recipientEmail, featuredArticle.title, featuredUrl);
  const featuredContent = featuredArticle.content || featuredArticle.summary || "";

  const featuredHtml = `
    <div style="padding:0 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:10px;overflow:hidden;border:1px solid #E5E7EB;">
        <tr>
          <td style="background:${brandColor};height:6px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:24px;background:${bgColor};">
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
              <tr>
                <td>
                  <span style="display:inline-block;padding:4px 12px;border-radius:4px;background:${brandColor};color:white;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">A la une</span>
                  ${featuredArticle.tag ? '<span style="display:inline-block;padding:4px 10px;border-radius:4px;background:#F3F4F6;color:#374151;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-left:8px;">' + escapeHtml(featuredArticle.tag) + '</span>' : ''}
                </td>
              </tr>
            </table>
            <a href="${featuredClickUrl}" style="text-decoration:none;">
              <h2 style="font-size:20px;font-weight:700;color:${textColor};margin:0 0 10px;line-height:1.35;letter-spacing:-0.01em;">${featuredArticle.title}</h2>
            </a>
            ${featuredArticle.hook ? '<p style="font-size:14px;color:' + bodyTextColor + ';margin:0 0 12px;font-style:italic;line-height:1.55;">' + featuredArticle.hook + '</p>' : ''}
            <p style="font-size:14px;color:${bodyTextColor};line-height:1.65;margin:0 0 16px;">${featuredContent}</p>
            <a href="${featuredClickUrl}" style="display:inline-block;padding:8px 18px;background:${brandColor};color:white;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">Lire l'article →</a>
            <span style="font-size:12px;color:#9CA3AF;margin-left:12px;">via ${escapeHtml(featuredArticle.source)}</span>
          </td>
        </tr>
      </table>
    </div>`;

  // ─── Éditorial ─────────────────────────────────────────────────
  const editorialHtml = editorial
    ? `
    <div style="padding:0 32px 24px;">
      <div style="border-left:3px solid ${brandColor};padding:16px 20px;background:#F8FAFC;border-radius:0 8px 8px 0;">
        <p style="font-size:11px;font-weight:600;color:${brandColor};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;">Le point de vue</p>
        <p style="font-size:14px;color:${bodyTextColor};line-height:1.65;margin:0;font-style:italic;">${editorial}</p>
      </div>
    </div>`
    : "";

  // ─── Chiffres clés ────────────────────────────────────────────
  const keyFiguresHtml = keyFigures.length > 0
    ? `
    <div style="padding:0 32px 24px;">
      <p style="font-size:11px;font-weight:600;color:${brandColor};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">Chiffres clés</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${keyFigures.map((fig) => `
          <td style="padding:14px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;text-align:center;width:${Math.floor(100 / keyFigures.length)}%;">
            <div style="font-size:24px;font-weight:700;color:${brandColor};margin-bottom:4px;">${escapeHtml(fig.value)}</div>
            <div style="font-size:12px;color:${textColor};font-weight:500;margin-bottom:2px;">${escapeHtml(fig.label)}</div>
            <div style="font-size:11px;color:#9CA3AF;">${escapeHtml(fig.context)}</div>
          </td>`).join('<td style="width:8px;"></td>')}
        </tr>
      </table>
    </div>`
    : "";

  // ─── Articles secondaires (single column) ─────────────────────
  const articlesHtml = otherArticles.length > 0
    ? `
    <div style="padding:0 32px 8px;">
      <p style="font-size:11px;font-weight:600;color:${brandColor};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 16px;">A lire aussi</p>
      ${otherArticles.map((a) => {
        const articleUrl = a.url || "https://sorell.fr";
        const clickUrl = trackClick(newsletterId, recipientEmail, a.title, articleUrl);
        const articleContent = truncate(a.content || a.summary || "", 180);
        return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="padding:20px;background:${bgColor};">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <span style="display:inline-block;padding:3px 8px;border-radius:4px;background:#F3F4F6;color:#374151;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(a.tag)}</span>
                </td>
                <td align="right">
                  <span style="font-size:11px;color:#9CA3AF;">${escapeHtml(a.source)}</span>
                </td>
              </tr>
            </table>
            <a href="${clickUrl}" style="text-decoration:none;">
              <h3 style="font-size:16px;font-weight:600;color:${textColor};margin:10px 0 6px;line-height:1.35;">${a.title}</h3>
            </a>
            ${a.hook ? '<p style="font-size:13px;color:' + bodyTextColor + ';margin:0 0 6px;font-style:italic;line-height:1.5;">' + a.hook + '</p>' : ''}
            <p style="font-size:13px;color:${bodyTextColor};line-height:1.6;margin:0 0 12px;">${articleContent}</p>
            <a href="${clickUrl}" style="font-size:12px;color:${brandColor};text-decoration:none;font-weight:600;">Lire la suite →</a>
          </td>
        </tr>
      </table>`;
      }).join("")}
    </div>`
    : "";

  // ─── CTA contextuel ───────────────────────────────────────────
  const isFreePlan = plan === "free";
  const ctaHtml = `
    <div style="padding:8px 32px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:${brandColor};padding:24px 28px;text-align:center;">
            <p style="font-size:15px;color:rgba(255,255,255,0.9);margin:0 0 14px;line-height:1.5;">
              ${isFreePlan
                ? "Envoyez cette veille à toute votre équipe - passez au plan Pro."
                : "Cette newsletter vous a été utile ? Partagez-la avec un collègue."}
            </p>
            <a href="${isFreePlan ? 'https://sorell.fr/tarifs' : 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent('Découvre cette newsletter sectorielle générée par IA : https://sorell.fr')}" style="display:inline-block;padding:11px 28px;background:white;color:${brandColor};font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
              ${isFreePlan ? "Voir les plans →" : "Transférer à un collègue →"}
            </a>
          </td>
        </tr>
      </table>
    </div>`;

  // ─── Footer ───────────────────────────────────────────────────
  const footerHtml = `
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
        Généré par Sorell · Votre veille sectorielle par IA<br/>
        <a href="${buildUnsubscribeUrl(recipientEmail)}" style="color:#9CA3AF;">Se désabonner</a>
      </p>
    </div>`;

  // ─── Tracking pixel ───────────────────────────────────────────
  const trackingPixel = `<img src="https://www.sorell.fr/api/track/open?nid=${newsletterId}&email=${encodeURIComponent(recipientEmail)}" width="1" height="1" style="display:none;" alt="" />`;

  // ─── Assemblage final ─────────────────────────────────────────
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(preheaderText)}
    ${"&nbsp;&zwnj;".repeat(30)}
  </div>
  <div style="max-width:620px;margin:0 auto;background:${bgColor};">
    ${headerHtml}
    ${introHtml}
    ${featuredHtml}
    ${editorialHtml}
    ${keyFiguresHtml}
    ${articlesHtml}
    ${ctaHtml}
    ${footerHtml}
  </div>
  ${trackingPixel}
</body>
</html>`;
}
