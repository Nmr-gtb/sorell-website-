// ─── Template Email Newsletter V4 ────────────────────────────────
// Design premium crème/teal — référence Mayur Bhuva
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

  // Palette premium
  const warmBorder = "#E8E0D8";
  const warmBg = "#F5F0EB";
  const secondaryText = "#7A7267";
  const cardBg = bgColor === "#FFFFFF" ? "#FFFFFF" : bgColor;

  // ─── Header ────────────────────────────────────────────────────
  const headerHtml = `
    <div style="padding:20px 32px;border-bottom:1px solid ${warmBorder};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:36px;">
            ${customLogo
              ? '<img src="' + customLogo + '" alt="Logo" style="max-height:32px;max-width:160px;" />'
              : '<img src="https://www.sorell.fr/icone.png" alt="S." style="width:32px;height:32px;" />'
            }
          </td>
          <td align="right">
            <span style="font-size:12px;color:${secondaryText};font-family:Georgia,\'Times New Roman\',serif;">${date}</span>
          </td>
        </tr>
      </table>
    </div>`;

  // ─── Hero ──────────────────────────────────────────────────────
  const heroHtml = `
    <div style="background:${brandColor};padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:36px 32px 32px;vertical-align:middle;width:65%;">
            <p style="font-size:11px;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.1em;margin:0 0 16px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${date} &middot; ${escapeHtml(subject)}</p>
            <h1 style="font-size:26px;font-weight:700;color:#FFFFFF;margin:0;line-height:1.3;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">Ce qui change dans votre secteur cette semaine</h1>
          </td>
          <td style="width:35%;vertical-align:bottom;padding:0;">
            <div style="height:140px;background:rgba(255,255,255,0.08);border-radius:8px 0 0 0;"></div>
          </td>
        </tr>
      </table>
    </div>`;

  // ─── Article phare ─────────────────────────────────────────────
  const featuredUrl = featuredArticle.url || "https://sorell.fr";
  const featuredClickUrl = trackClick(newsletterId, recipientEmail, featuredArticle.title, featuredUrl);
  const featuredContent = featuredArticle.content || featuredArticle.summary || "";

  const featuredHtml = `
    <div style="padding:28px 32px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:14px;">
              <tr>
                <td>
                  <span style="display:inline-block;padding:4px 12px;border-radius:4px;background:${brandColor};color:white;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;font-family:'Segoe UI',Roboto,Arial,sans-serif;">A la une</span>
                  ${featuredArticle.tag ? '<span style="display:inline-block;padding:4px 10px;border-radius:4px;background:' + warmBg + ';color:' + secondaryText + ';font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-left:8px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;">' + escapeHtml(featuredArticle.tag) + '</span>' : ''}
                </td>
              </tr>
            </table>
            <a href="${featuredClickUrl}" style="text-decoration:none;">
              <h2 style="font-size:22px;font-weight:700;color:${textColor};margin:0 0 10px;line-height:1.35;font-family:Georgia,'Times New Roman',serif;letter-spacing:-0.01em;">${featuredArticle.title}</h2>
            </a>
            ${featuredArticle.hook ? '<p style="font-size:14px;color:' + secondaryText + ';margin:0 0 14px;font-style:italic;line-height:1.55;font-family:Georgia,\'Times New Roman\',serif;">' + featuredArticle.hook + '</p>' : ''}
            <p style="font-size:14px;color:${bodyTextColor};line-height:1.7;margin:0 0 18px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${featuredContent}</p>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <a href="${featuredClickUrl}" style="display:inline-block;padding:10px 22px;background:${brandColor};color:white;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Lire l'article &rarr;</a>
                </td>
                <td style="padding-left:14px;">
                  <span style="font-size:12px;color:${secondaryText};font-family:'Segoe UI',Roboto,Arial,sans-serif;">via ${escapeHtml(featuredArticle.source)}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:0 32px;"><div style="border-top:1px solid ${warmBorder};"></div></div>`;

  // ─── Éditorial ─────────────────────────────────────────────────
  const editorialHtml = editorial
    ? `
    <div style="padding:24px 32px;">
      <div style="border-left:3px solid ${brandColor};padding:18px 22px;background:${warmBg};border-radius:0 8px 8px 0;">
        <p style="font-size:11px;font-weight:600;color:${brandColor};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Le point de vue</p>
        <p style="font-size:15px;color:${bodyTextColor};line-height:1.7;margin:0;font-style:italic;font-family:Georgia,'Times New Roman',serif;">${editorial}</p>
      </div>
    </div>
    <div style="padding:0 32px;"><div style="border-top:1px solid ${warmBorder};"></div></div>`
    : "";

  // ─── Chiffres clés ────────────────────────────────────────────
  const keyFiguresHtml = keyFigures.length > 0
    ? `
    <div style="padding:24px 32px;">
      <p style="font-size:11px;font-weight:600;color:${brandColor};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 16px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Chiffres cl&eacute;s</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${keyFigures.map((fig) => `
          <td style="padding:16px;background:${warmBg};border:1px solid ${warmBorder};border-radius:8px;text-align:center;width:${Math.floor(100 / keyFigures.length)}%;">
            <div style="font-size:26px;font-weight:700;color:${brandColor};margin-bottom:6px;font-family:Georgia,'Times New Roman',serif;">${escapeHtml(fig.value)}</div>
            <div style="font-size:12px;color:${textColor};font-weight:600;margin-bottom:3px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">${escapeHtml(fig.label)}</div>
            <div style="font-size:11px;color:${secondaryText};font-family:'Segoe UI',Roboto,Arial,sans-serif;">${escapeHtml(fig.context)}</div>
          </td>`).join('<td style="width:10px;"></td>')}
        </tr>
      </table>
    </div>
    <div style="padding:0 32px;"><div style="border-top:1px solid ${warmBorder};"></div></div>`
    : "";

  // ─── Articles secondaires ─────────────────────────────────────
  const articlesHtml = otherArticles.length > 0
    ? `
    <div style="padding:24px 32px 8px;">
      <p style="font-size:11px;font-weight:600;color:${brandColor};text-transform:uppercase;letter-spacing:0.08em;margin:0 0 18px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">A lire aussi</p>
      ${otherArticles.map((a) => {
        const articleUrl = a.url || "https://sorell.fr";
        const clickUrl = trackClick(newsletterId, recipientEmail, a.title, articleUrl);
        const articleContent = truncate(a.content || a.summary || "", 180);
        return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;border:1px solid ${warmBorder};border-radius:10px;overflow:hidden;">
        <tr>
          <td style="padding:22px;background:${cardBg};">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <span style="display:inline-block;padding:3px 10px;border-radius:4px;background:${warmBg};color:${secondaryText};font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;font-family:'Segoe UI',Roboto,Arial,sans-serif;">${escapeHtml(a.tag)}</span>
                </td>
                <td align="right">
                  <span style="font-size:11px;color:${secondaryText};font-family:'Segoe UI',Roboto,Arial,sans-serif;">${escapeHtml(a.source)}</span>
                </td>
              </tr>
            </table>
            <a href="${clickUrl}" style="text-decoration:none;">
              <h3 style="font-size:17px;font-weight:600;color:${textColor};margin:12px 0 8px;line-height:1.35;font-family:Georgia,'Times New Roman',serif;">${a.title}</h3>
            </a>
            ${a.hook ? '<p style="font-size:13px;color:' + secondaryText + ';margin:0 0 8px;font-style:italic;line-height:1.5;font-family:Georgia,\'Times New Roman\',serif;">' + a.hook + '</p>' : ''}
            <p style="font-size:13px;color:${bodyTextColor};line-height:1.65;margin:0 0 14px;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">${articleContent}</p>
            <a href="${clickUrl}" style="font-size:12px;color:${brandColor};text-decoration:none;font-weight:600;font-family:'Segoe UI',Roboto,Arial,sans-serif;">Lire la suite &rarr;</a>
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
          <td style="background:${brandColor};padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:28px 28px 28px 32px;vertical-align:middle;width:65%;">
                  <p style="font-size:16px;font-weight:600;color:#FFFFFF;margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;line-height:1.4;">
                    ${isFreePlan
                      ? "Partagez cette veille avec votre &eacute;quipe"
                      : "Cette newsletter vous a &eacute;t&eacute; utile ?"}
                  </p>
                  <p style="font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 18px;line-height:1.5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                    ${isFreePlan
                      ? "Passez au plan Pro pour envoyer cette veille &agrave; vos collaborateurs."
                      : "Transf&eacute;rez-la &agrave; un coll&egrave;gue qui devrait la lire."}
                  </p>
                  <a href="${isFreePlan ? 'https://sorell.fr/tarifs' : 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent('Découvre cette newsletter sectorielle : https://sorell.fr')}" style="display:inline-block;padding:11px 26px;background:white;color:${brandColor};font-size:13px;font-weight:600;text-decoration:none;border-radius:8px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
                    ${isFreePlan ? "Voir les plans &rarr;" : "Transf&eacute;rer &rarr;"}
                  </a>
                </td>
                <td style="width:35%;vertical-align:bottom;padding:0;">
                  <div style="height:120px;background:rgba(255,255,255,0.06);border-radius:8px 0 0 0;"></div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>`;

  // ─── Footer ───────────────────────────────────────────────────
  const footerHtml = `
    <div style="padding:22px 32px;border-top:1px solid ${warmBorder};background:${warmBg};">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width:32px;">
            ${customLogo
              ? '<img src="' + customLogo + '" alt="Logo" style="max-height:24px;max-width:120px;" />'
              : '<img src="https://www.sorell.fr/icone.png" alt="S." style="width:24px;height:24px;" />'
            }
          </td>
          <td align="right">
            <a href="https://sorell.fr" style="font-size:12px;color:${brandColor};text-decoration:none;font-family:'Segoe UI',Roboto,Arial,sans-serif;">sorell.fr</a>
          </td>
        </tr>
      </table>
      <p style="font-size:11px;color:${secondaryText};margin:14px 0 0;line-height:1.5;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
        G&eacute;n&eacute;r&eacute; par Sorell &middot; Votre veille sectorielle par IA<br/>
        <a href="${buildUnsubscribeUrl(recipientEmail)}" style="color:${secondaryText};">Se d&eacute;sabonner</a>
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
<body style="margin:0;padding:0;background:${warmBg};font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(preheaderText)}
    ${"&nbsp;&zwnj;".repeat(30)}
  </div>
  <div style="max-width:620px;margin:0 auto;background:${cardBg};">
    ${headerHtml}
    ${heroHtml}
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
