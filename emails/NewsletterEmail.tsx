import * as React from "react";
import {
  Section,
  Row,
  Column,
  Link,
  Text,
} from "@react-email/components";
import { Layout } from "./components/Layout";

// ---- Types ----------------------------------------------------------------

interface Article {
  tag: string;
  title: string;
  hook?: string;
  content?: string;
  summary?: string;
  source: string;
  url?: string;
  featured?: boolean;
}

interface KeyFigure {
  value: string;
  label: string;
  context: string;
}

export interface NewsletterEmailProps {
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
  keyFigures: Array<{ value: string; label: string; context: string }>;
  featuredArticle: Article;
  otherArticles: Article[];
  plan: string;
  unsubscribeUrl: string;
}

// ---- Helpers ---------------------------------------------------------------

const fontSans = "'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const fontSerif = "Georgia,'Times New Roman',serif";

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

function trackClick(
  newsletterId: string,
  recipientEmail: string,
  articleTitle: string,
  url: string
): string {
  return `https://www.sorell.fr/api/track/click?nid=${newsletterId}&email=${encodeURIComponent(recipientEmail)}&article=${encodeURIComponent(articleTitle)}&url=${encodeURIComponent(url)}`;
}

// ---- Sub-components --------------------------------------------------------

function HeroSection({
  date,
  subject,
  brandColor,
}: {
  date: string;
  subject: string;
  brandColor: string;
}) {
  return (
    <Section style={{ background: brandColor, padding: 0 }}>
      <Row>
        <Column
          style={{
            padding: "36px 32px 32px",
            verticalAlign: "middle",
            width: "65%",
          }}
        >
          <Text
            style={{
              fontSize: "11px",
              color: "#a3b8bb",
              textTransform: "uppercase" as const,
              letterSpacing: "0.1em",
              margin: "0 0 16px",
              fontFamily: fontSans,
            }}
            dangerouslySetInnerHTML={{
              __html: `${date} &middot; ${escapeHtml(subject)}`,
            }}
          />
          <Text
            style={{
              fontSize: "26px",
              fontWeight: 700,
              color: "#FFFFFF",
              margin: 0,
              lineHeight: "1.3",
              fontFamily: fontSerif,
              letterSpacing: "-0.01em",
            }}
          >
            Ce qui change dans votre secteur cette semaine
          </Text>
        </Column>
        <Column
          style={{
            width: "35%",
            verticalAlign: "bottom",
            padding: 0,
          }}
        >
          <table cellPadding={0} cellSpacing={0} width="100%" style={{ borderCollapse: "collapse" as const }}>
            <tbody>
              <tr>
                <td style={{ height: "140px", background: "#0a5c65" }} />
              </tr>
            </tbody>
          </table>
        </Column>
      </Row>
    </Section>
  );
}

function FeaturedArticleSection({
  article,
  newsletterId,
  recipientEmail,
  brandColor,
  textColor,
  bodyTextColor,
  warmBg,
  warmBorder,
  secondaryText,
}: {
  article: Article;
  newsletterId: string;
  recipientEmail: string;
  brandColor: string;
  textColor: string;
  bodyTextColor: string;
  warmBg: string;
  warmBorder: string;
  secondaryText: string;
}) {
  const featuredUrl = article.url || "https://sorell.fr";
  const clickUrl = trackClick(newsletterId, recipientEmail, article.title, featuredUrl);
  const featuredContent = article.content || article.summary || "";

  return (
    <>
      <Section style={{ padding: "28px 32px 24px" }}>
        <Row>
          <Column>
            {/* Tags row */}
            <table cellPadding={0} cellSpacing={0} style={{ marginBottom: "14px" }}>
              <tbody>
                <tr>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: "4px",
                        background: brandColor,
                        color: "white",
                        fontSize: "10px",
                        fontWeight: 700,
                        textTransform: "uppercase" as const,
                        letterSpacing: "0.06em",
                        fontFamily: fontSans,
                      }}
                    >
                      {"\u00c0 la une"}
                    </span>
                    {article.tag && (
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          background: warmBg,
                          color: secondaryText,
                          fontSize: "10px",
                          fontWeight: 600,
                          textTransform: "uppercase" as const,
                          letterSpacing: "0.04em",
                          marginLeft: "8px",
                          fontFamily: fontSans,
                        }}
                      >
                        {escapeHtml(article.tag)}
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Title */}
            <Link href={clickUrl} style={{ textDecoration: "none", color: textColor }}>
              <Text
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: textColor,
                  margin: "0 0 10px",
                  lineHeight: "1.35",
                  fontFamily: fontSerif,
                  letterSpacing: "-0.01em",
                }}
              >
                {article.title}
              </Text>
            </Link>

            {/* Hook */}
            {article.hook && (
              <Text
                style={{
                  fontSize: "14px",
                  color: secondaryText,
                  margin: "0 0 14px",
                  fontStyle: "italic",
                  lineHeight: "1.55",
                  fontFamily: fontSerif,
                }}
              >
                {article.hook}
              </Text>
            )}

            {/* Content */}
            <Text
              style={{
                fontSize: "14px",
                color: bodyTextColor,
                lineHeight: "1.7",
                margin: "0 0 18px",
                fontFamily: fontSans,
              }}
            >
              {featuredContent}
            </Text>

            {/* CTA + source */}
            <table cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td>
                    <Link
                      href={clickUrl}
                      style={{
                        display: "inline-block",
                        padding: "10px 22px",
                        background: brandColor,
                        color: "white",
                        fontSize: "13px",
                        fontWeight: 600,
                        textDecoration: "none",
                        borderRadius: "6px",
                        fontFamily: fontSans,
                      }}
                    >
                      {"Lire l\u2019article \u2192"}
                    </Link>
                  </td>
                  <td style={{ paddingLeft: "14px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: secondaryText,
                        fontFamily: fontSans,
                      }}
                    >
                      via {escapeHtml(article.source)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </Column>
        </Row>
      </Section>
      <Section style={{ padding: "0 32px" }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse" as const }}>
          <tbody><tr><td style={{ borderTop: `1px solid ${warmBorder}`, fontSize: "1px", lineHeight: "1px", height: "1px" }}>&nbsp;</td></tr></tbody>
        </table>
      </Section>
    </>
  );
}

function EditorialSection({
  editorial,
  brandColor,
  bodyTextColor,
  warmBg,
  warmBorder,
}: {
  editorial: string;
  brandColor: string;
  bodyTextColor: string;
  warmBg: string;
  warmBorder: string;
}) {
  if (!editorial) return null;

  return (
    <>
      <Section style={{ padding: "24px 32px" }}>
        <table cellPadding={0} cellSpacing={0} width="100%" style={{ borderCollapse: "collapse" as const }}>
          <tbody>
            <tr>
              <td style={{ width: "3px", background: brandColor }} />
              <td style={{ padding: "18px 22px", background: warmBg }}>
                <Text
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: brandColor,
                    textTransform: "uppercase" as const,
                    letterSpacing: "0.08em",
                    margin: "0 0 12px",
                    fontFamily: fontSans,
                  }}
                >
                  Le point de vue
                </Text>
                <Text
                  style={{
                    fontSize: "15px",
                    color: bodyTextColor,
                    lineHeight: "1.7",
                    margin: 0,
                    fontStyle: "italic",
                    fontFamily: fontSerif,
                  }}
                >
                  {editorial}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>
      <Section style={{ padding: "0 32px" }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse" as const }}>
          <tbody><tr><td style={{ borderTop: `1px solid ${warmBorder}`, fontSize: "1px", lineHeight: "1px", height: "1px" }}>&nbsp;</td></tr></tbody>
        </table>
      </Section>
    </>
  );
}

function KeyFiguresSection({
  keyFigures,
  brandColor,
  textColor,
  warmBg,
  warmBorder,
  secondaryText,
}: {
  keyFigures: KeyFigure[];
  brandColor: string;
  textColor: string;
  warmBg: string;
  warmBorder: string;
  secondaryText: string;
}) {
  if (keyFigures.length === 0) return null;

  const colWidth = `${Math.floor(100 / keyFigures.length)}%`;

  return (
    <>
      <Section style={{ padding: "24px 32px" }}>
        <Text
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: brandColor,
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
            margin: "0 0 16px",
            fontFamily: fontSans,
          }}
        >
          {"Chiffres cl\u00e9s"}
        </Text>
        <table width="100%" cellPadding={0} cellSpacing={0}>
          <tbody>
            <tr>
              {keyFigures.map((fig, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <td style={{ width: "10px" }} />}
                  <td
                    style={{
                      padding: "16px",
                      background: warmBg,
                      border: `1px solid ${warmBorder}`,
                      borderRadius: "8px",
                      textAlign: "center" as const,
                      width: colWidth,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "26px",
                        fontWeight: 700,
                        color: brandColor,
                        marginBottom: "6px",
                        fontFamily: fontSerif,
                      }}
                    >
                      {escapeHtml(fig.value)}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: textColor,
                        fontWeight: 600,
                        marginBottom: "3px",
                        fontFamily: fontSans,
                      }}
                    >
                      {escapeHtml(fig.label)}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: secondaryText,
                        fontFamily: fontSans,
                      }}
                    >
                      {escapeHtml(fig.context)}
                    </div>
                  </td>
                </React.Fragment>
              ))}
            </tr>
          </tbody>
        </table>
      </Section>
      <Section style={{ padding: "0 32px" }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse" as const }}>
          <tbody><tr><td style={{ borderTop: `1px solid ${warmBorder}`, fontSize: "1px", lineHeight: "1px", height: "1px" }}>&nbsp;</td></tr></tbody>
        </table>
      </Section>
    </>
  );
}

function SecondaryArticlesSection({
  articles,
  newsletterId,
  recipientEmail,
  brandColor,
  textColor,
  bodyTextColor,
  cardBg,
  warmBg,
  warmBorder,
  secondaryText,
}: {
  articles: Article[];
  newsletterId: string;
  recipientEmail: string;
  brandColor: string;
  textColor: string;
  bodyTextColor: string;
  cardBg: string;
  warmBg: string;
  warmBorder: string;
  secondaryText: string;
}) {
  if (articles.length === 0) return null;

  return (
    <Section style={{ padding: "24px 32px 8px" }}>
      <Text
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: brandColor,
          textTransform: "uppercase" as const,
          letterSpacing: "0.08em",
          margin: "0 0 18px",
          fontFamily: fontSans,
        }}
      >
        {"\u00c0 lire aussi"}
      </Text>
      {articles.map((a, idx) => {
        const articleUrl = a.url || "https://sorell.fr";
        const clickUrl = trackClick(newsletterId, recipientEmail, a.title, articleUrl);
        const articleContent = truncate(a.content || a.summary || "", 180);

        return (
          <table
            key={idx}
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{
              marginBottom: "18px",
              border: `1px solid ${warmBorder}`,
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "22px", background: cardBg }}>
                  {/* Tag + source row */}
                  <table width="100%" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      <tr>
                        <td>
                          <span
                            style={{
                              display: "inline-block",
                              padding: "3px 10px",
                              borderRadius: "4px",
                              background: warmBg,
                              color: secondaryText,
                              fontSize: "9px",
                              fontWeight: 700,
                              textTransform: "uppercase" as const,
                              letterSpacing: "0.05em",
                              fontFamily: fontSans,
                            }}
                          >
                            {escapeHtml(a.tag)}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" as const }}>
                          <span
                            style={{
                              fontSize: "11px",
                              color: secondaryText,
                              fontFamily: fontSans,
                            }}
                          >
                            {escapeHtml(a.source)}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Title */}
                  <Link href={clickUrl} style={{ textDecoration: "none", color: textColor }}>
                    <Text
                      style={{
                        fontSize: "17px",
                        fontWeight: 600,
                        color: textColor,
                        margin: "12px 0 8px",
                        lineHeight: "1.35",
                        fontFamily: fontSerif,
                      }}
                    >
                      {a.title}
                    </Text>
                  </Link>

                  {/* Hook */}
                  {a.hook && (
                    <Text
                      style={{
                        fontSize: "13px",
                        color: secondaryText,
                        margin: "0 0 8px",
                        fontStyle: "italic",
                        lineHeight: "1.5",
                        fontFamily: fontSerif,
                      }}
                    >
                      {a.hook}
                    </Text>
                  )}

                  {/* Content */}
                  <Text
                    style={{
                      fontSize: "13px",
                      color: bodyTextColor,
                      lineHeight: "1.65",
                      margin: "0 0 14px",
                      fontFamily: fontSans,
                    }}
                  >
                    {articleContent}
                  </Text>

                  {/* Read more */}
                  <Link
                    href={clickUrl}
                    style={{
                      fontSize: "12px",
                      color: brandColor,
                      textDecoration: "none",
                      fontWeight: 600,
                      fontFamily: fontSans,
                    }}
                  >
                    {"Lire la suite \u2192"}
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        );
      })}
    </Section>
  );
}

function ContextualCtaSection({
  plan,
  subject,
  brandColor,
}: {
  plan: string;
  subject: string;
  brandColor: string;
}) {
  const isFreePlan = plan === "free";

  const ctaTitle = isFreePlan
    ? "Partagez cette veille avec votre \u00e9quipe"
    : "Cette newsletter vous a \u00e9t\u00e9 utile ?";

  const ctaSubtitle = isFreePlan
    ? "Passez au plan Pro pour envoyer cette veille \u00e0 vos collaborateurs."
    : "Transf\u00e9rez-la \u00e0 un coll\u00e8gue qui devrait la lire.";

  const ctaButtonText = isFreePlan
    ? "Voir les plans \u2192"
    : "Transf\u00e9rer \u2192";

  const ctaHref = isFreePlan
    ? "https://sorell.fr/tarifs"
    : `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent("D\u00e9couvre cette newsletter sectorielle : https://sorell.fr")}`;

  return (
    <Section style={{ padding: "8px 32px 28px" }}>
      <table
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{ borderRadius: "10px", overflow: "hidden" }}
      >
        <tbody>
          <tr>
            <td style={{ background: brandColor, padding: 0 }}>
              <table width="100%" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: "28px 28px 28px 32px",
                        verticalAlign: "middle",
                        width: "65%",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#FFFFFF",
                          margin: "0 0 6px",
                          fontFamily: fontSerif,
                          lineHeight: "1.4",
                        }}
                      >
                        {ctaTitle}
                      </Text>
                      <Text
                        style={{
                          fontSize: "13px",
                          color: "#a3b8bb",
                          margin: "0 0 18px",
                          lineHeight: "1.5",
                          fontFamily: fontSans,
                        }}
                      >
                        {ctaSubtitle}
                      </Text>
                      <Link
                        href={ctaHref}
                        style={{
                          display: "inline-block",
                          padding: "11px 26px",
                          background: "white",
                          color: brandColor,
                          fontSize: "13px",
                          fontWeight: 600,
                          textDecoration: "none",
                          borderRadius: "8px",
                          fontFamily: fontSans,
                        }}
                      >
                        {ctaButtonText}
                      </Link>
                    </td>
                    <td
                      style={{
                        width: "35%",
                        verticalAlign: "bottom",
                        padding: 0,
                      }}
                    >
                      <table cellPadding={0} cellSpacing={0} width="100%" style={{ borderCollapse: "collapse" as const }}>
                        <tbody>
                          <tr>
                            <td style={{ height: "120px", background: "#0a5c65" }} />
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

// ---- Main component --------------------------------------------------------

export function NewsletterEmail(props: NewsletterEmailProps) {
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
    unsubscribeUrl,
  } = props;

  const warmBorder = "#E8E0D8";
  const warmBg = "#F5F0EB";
  const secondaryText = "#7A7267";
  const cardBg = bgColor === "#FFFFFF" ? "#FFFFFF" : bgColor;

  const articleCount = otherArticles.length + 1;
  const preheaderText = `${articleCount} actualit\u00e9s cl\u00e9s de votre secteur - ${escapeHtml(subject)}`;

  const trackingPixelUrl = `https://www.sorell.fr/api/track/open?nid=${newsletterId}&email=${encodeURIComponent(recipientEmail)}`;

  return (
    <Layout
      subject={escapeHtml(subject)}
      preheaderText={preheaderText}
      brandColor={brandColor}
      warmBorder={warmBorder}
      warmBg={warmBg}
      secondaryText={secondaryText}
      cardBg={cardBg}
      customLogo={customLogo}
      date={date}
      unsubscribeUrl={unsubscribeUrl}
      trackingPixelUrl={trackingPixelUrl}
    >
      <HeroSection date={date} subject={subject} brandColor={brandColor} />

      <FeaturedArticleSection
        article={featuredArticle}
        newsletterId={newsletterId}
        recipientEmail={recipientEmail}
        brandColor={brandColor}
        textColor={textColor}
        bodyTextColor={bodyTextColor}
        warmBg={warmBg}
        warmBorder={warmBorder}
        secondaryText={secondaryText}
      />

      <EditorialSection
        editorial={editorial}
        brandColor={brandColor}
        bodyTextColor={bodyTextColor}
        warmBg={warmBg}
        warmBorder={warmBorder}
      />

      <KeyFiguresSection
        keyFigures={keyFigures}
        brandColor={brandColor}
        textColor={textColor}
        warmBg={warmBg}
        warmBorder={warmBorder}
        secondaryText={secondaryText}
      />

      <SecondaryArticlesSection
        articles={otherArticles}
        newsletterId={newsletterId}
        recipientEmail={recipientEmail}
        brandColor={brandColor}
        textColor={textColor}
        bodyTextColor={bodyTextColor}
        cardBg={cardBg}
        warmBg={warmBg}
        warmBorder={warmBorder}
        secondaryText={secondaryText}
      />

      <ContextualCtaSection
        plan={plan}
        subject={subject}
        brandColor={brandColor}
      />
    </Layout>
  );
}

export default NewsletterEmail;
