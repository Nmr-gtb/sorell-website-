"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

type AIArticle = {
  tag: string;
  title: string;
  summary: string;
  source: string;
  featured?: boolean;
  image_url?: string | null;
};

const SECTORS = [
  {
    key: "tech",
    label: "Tech & IA",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="7" width="10" height="10" rx="1" />
        <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
      </svg>
    ),
  },
  {
    key: "finance",
    label: "Finance & Marchés",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
  {
    key: "sante",
    label: "Santé & Biotech",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    key: "rh",
    label: "RH & Management",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "immobilier",
    label: "Immobilier",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M3 9h18" />
        <path d="M9 21V9" />
      </svg>
    ),
  },
  {
    key: "energie",
    label: "Énergie & Climat",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
];

const SECTOR_LABELS: Record<string, string> = {
  tech: "Tech & IA",
  finance: "Finance & Marchés",
  sante: "Santé & Biotech",
  rh: "RH & Management",
  immobilier: "Immobilier",
  energie: "Énergie & Climat",
};

// V4 palette — premium crème/teal (matches email-template.ts)
const V4_PALETTE = {
  brandColor: "#005058",
  warmBorder: "#E8E0D8",
  warmBg: "#F5F0EB",
  secondaryText: "#7A7267",
  textColor: "#111827",
  bodyTextColor: "#4B5563",
  cardBg: "#FFFFFF",
};

const LOADING_MESSAGES = [
  "Analyse des sources sectorielles...",
  "Sélection des contenus pertinents...",
  "Personnalisation par secteur...",
  "Génération du briefing IA...",
  "Mise en forme finale...",
];

function truncate(text: string, maxLen: number): string {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).replace(/\s+\S*$/, "") + "...";
}

function DemoNewsletterResult({
  articles,
  sector,
  generationTime,
  fromCache,
  generatedAt,
}: {
  articles: AIArticle[];
  sector: string;
  generationTime: number;
  fromCache: boolean;
  generatedAt: string | null;
}) {
  const p = V4_PALETTE;
  const featured = articles.find((a) => a.featured) || articles[0];
  const otherArticles = articles.filter((a) => a !== featured);

  const minsAgo =
    fromCache && generatedAt
      ? Math.round((Date.now() - new Date(generatedAt).getTime()) / 60000)
      : null;

  const now = new Date();
  const dateLabel = `Semaine du ${now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;
  const subject = `${SECTOR_LABELS[sector]} - ${featured?.title || "Votre briefing"}`;

  return (
    <div>
      {/* Generation badge */}
      <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
        {fromCache && minsAgo !== null ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 20,
              fontSize: "0.75rem",
              fontWeight: 500,
              background: "var(--surface-alt)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B", flexShrink: 0 }} />
            Résultat en cache - généré il y a {minsAgo < 1 ? "moins d'1 min" : `${minsAgo} min`}
          </span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 20,
              fontSize: "0.75rem",
              fontWeight: 500,
              background: "rgba(16,185,129,0.08)",
              color: "#059669",
              border: "1px solid rgba(16,185,129,0.2)",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981", flexShrink: 0 }} />
            Généré par IA en {generationTime} seconde{generationTime > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Email metadata bar */}
      <div
        style={{
          background: "var(--surface-alt)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 20px",
          borderRadius: "12px 12px 0 0",
          border: "1px solid var(--border)",
          borderBottomColor: "transparent",
        }}
      >
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 4 }}>
          <span style={{ color: "var(--text-muted)" }}>De : </span>
          <span style={{ fontWeight: 500, color: "var(--text)" }}>Sorell</span>
          <span style={{ color: "var(--text-muted)" }}> &lt;newsletter@sorell.fr&gt;</span>
        </div>
        <div style={{ fontSize: "0.75rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Objet : </span>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>
            Votre briefing {SECTOR_LABELS[sector]} - {now.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Newsletter V4 card */}
      <div
        style={{
          background: p.cardBg,
          border: `1px solid ${p.warmBorder}`,
          borderRadius: "0 0 12px 12px",
          overflow: "hidden",
          fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          fontSize: "14px",
          color: p.bodyTextColor,
        }}
      >
        {/* Header — logo + date */}
        <div style={{ padding: "20px 32px", borderBottom: `1px solid ${p.warmBorder}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <img src="/icone.png" alt="S." style={{ width: 32, height: 32 }} />
            <span style={{ fontSize: "12px", color: p.secondaryText, fontFamily: "Georgia, 'Times New Roman', serif" }}>
              {dateLabel}
            </span>
          </div>
        </div>

        {/* Hero teal banner */}
        <div style={{ background: p.brandColor, padding: 0 }}>
          <div style={{ display: "flex" }}>
            <div style={{ flex: "0 0 65%", padding: "36px 32px 32px" }}>
              <p style={{
                fontSize: "11px",
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase" as const,
                letterSpacing: "0.1em",
                margin: "0 0 16px",
                lineHeight: 1.4,
              }}>
                {dateLabel.toUpperCase()} · {featured?.tag?.toUpperCase() || SECTOR_LABELS[sector].toUpperCase()} - {truncate(featured?.title || "", 50).toUpperCase()}
              </p>
              <h2 style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "#FFFFFF",
                margin: 0,
                lineHeight: 1.3,
                fontFamily: "Georgia, 'Times New Roman', serif",
                letterSpacing: "-0.01em",
              }}>
                Ce qui change dans votre secteur cette semaine
              </h2>
            </div>
            <div style={{ flex: "0 0 35%", display: "flex", alignItems: "flex-end" }}>
              <div style={{ height: 140, width: "100%", background: "rgba(255,255,255,0.08)", borderRadius: "8px 0 0 0" }} />
            </div>
          </div>
        </div>

        {/* Featured article — A LA UNE */}
        {featured && (
          <div style={{ padding: "28px 32px 24px" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" as const }}>
              <span style={{
                display: "inline-block",
                padding: "4px 12px",
                borderRadius: 4,
                background: p.brandColor,
                color: "white",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase" as const,
                letterSpacing: "0.06em",
              }}>
                A la une
              </span>
              {featured.tag && (
                <span style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 4,
                  background: p.warmBg,
                  color: p.secondaryText,
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.04em",
                }}>
                  {featured.tag}
                </span>
              )}
            </div>
            <h3 style={{
              fontSize: "20px",
              fontWeight: 700,
              color: p.brandColor,
              margin: "0 0 10px",
              lineHeight: 1.35,
              fontFamily: "Georgia, 'Times New Roman', serif",
              letterSpacing: "-0.01em",
            }}>
              {featured.title}
            </h3>
            <p style={{
              fontSize: "14px",
              color: p.bodyTextColor,
              lineHeight: 1.7,
              margin: "0 0 18px",
            }}>
              {featured.summary}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{
                display: "inline-block",
                padding: "10px 22px",
                background: p.brandColor,
                color: "white",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: 6,
                cursor: "default",
              }}>
                Lire l&apos;article &rarr;
              </span>
              <span style={{ fontSize: "12px", color: p.secondaryText }}>
                via {featured.source}
              </span>
            </div>
          </div>
        )}

        <div style={{ padding: "0 32px" }}><div style={{ borderTop: `1px solid ${p.warmBorder}` }} /></div>

        {/* Intro text */}
        <div style={{ padding: "24px 32px" }}>
          <p style={{ fontSize: "14px", color: p.bodyTextColor, lineHeight: 1.6, margin: 0 }}>
            <span style={{ fontWeight: 600, color: p.brandColor }}>Bonjour,</span>{" "}
            voici les {articles.length} actualités clés de votre secteur cette semaine, sélectionnées et résumées par Sorell.
          </p>
        </div>

        <div style={{ padding: "0 32px" }}><div style={{ borderTop: `1px solid ${p.warmBorder}` }} /></div>

        {/* Other articles — A LIRE AUSSI */}
        {otherArticles.length > 0 && (
          <div className="demo-newsletter-content" style={{ padding: "24px 32px 8px" }}>
            <p style={{
              fontSize: "11px",
              fontWeight: 600,
              color: p.brandColor,
              textTransform: "uppercase" as const,
              letterSpacing: "0.08em",
              margin: "0 0 18px",
            }}>
              A lire aussi
            </p>
            {otherArticles.map((article, idx) => (
              <div
                key={idx}
                style={{
                  border: `1px solid ${p.warmBorder}`,
                  borderRadius: 10,
                  overflow: "hidden",
                  marginBottom: 18,
                  background: p.cardBg,
                }}
              >
                <div style={{ padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 4,
                      background: p.warmBg,
                      color: p.secondaryText,
                      fontSize: "9px",
                      fontWeight: 700,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.05em",
                    }}>
                      {article.tag}
                    </span>
                    <span style={{ fontSize: "11px", color: p.secondaryText }}>
                      {article.source}
                    </span>
                  </div>
                  <h4 style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: p.textColor,
                    margin: "0 0 8px",
                    lineHeight: 1.35,
                    fontFamily: "Georgia, 'Times New Roman', serif",
                  }}>
                    {article.title}
                  </h4>
                  <p style={{
                    fontSize: "13px",
                    color: p.bodyTextColor,
                    lineHeight: 1.65,
                    margin: "0 0 14px",
                  }}>
                    {truncate(article.summary || "", 180)}
                  </p>
                  <span style={{
                    fontSize: "12px",
                    color: p.brandColor,
                    fontWeight: 600,
                    cursor: "default",
                  }}>
                    Lire la suite &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA banner */}
        <div style={{ padding: "8px 32px 28px" }}>
          <div style={{ borderRadius: 10, overflow: "hidden", background: p.brandColor }}>
            <div style={{ display: "flex" }}>
              <div style={{ flex: "0 0 65%", padding: "28px 28px 28px 32px" }}>
                <p style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#FFFFFF",
                  margin: "0 0 6px",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  lineHeight: 1.4,
                }}>
                  Cette newsletter vous a été utile ?
                </p>
                <p style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.7)",
                  margin: "0 0 18px",
                  lineHeight: 1.5,
                }}>
                  Transférez-la à un collègue qui devrait la lire.
                </p>
                <span style={{
                  display: "inline-block",
                  padding: "11px 26px",
                  background: "white",
                  color: p.brandColor,
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: 8,
                  cursor: "default",
                }}>
                  Transférer &rarr;
                </span>
              </div>
              <div style={{ flex: "0 0 35%", display: "flex", alignItems: "flex-end" }}>
                <div style={{ height: 120, width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: "8px 0 0 0" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer crème */}
        <div style={{ padding: "22px 32px", borderTop: `1px solid ${p.warmBorder}`, background: p.warmBg }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <img src="/icone.png" alt="S." style={{ width: 24, height: 24 }} />
            <span style={{ fontSize: "12px", color: p.brandColor, fontWeight: 500 }}>sorell.fr</span>
          </div>
          <p style={{ fontSize: "11px", color: p.secondaryText, margin: 0, lineHeight: 1.5 }}>
            Généré par Sorell · Votre veille sectorielle par IA
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DemoGenerator() {
  const { t, lang } = useLanguage();
  const [sector, setSector] = useState("tech");
  const [articles, setArticles] = useState<AIArticle[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [error, setError] = useState("");
  const [generationTime, setGenerationTime] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setArticles(null);
    const start = Date.now();
    let idx = 0;
    setMsgIdx(0);
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setMsgIdx(idx);
    }, 1200);

    try {
      const res = await fetch(`/api/demo?sector=${sector}&lang=${lang}`);
      const data = await res.json();
      clearInterval(interval);
      setGenerationTime(Math.round((Date.now() - start) / 1000));

      if (data.articles) {
        setArticles(data.articles);
        setFromCache(data.fromCache || false);
        setGeneratedAt(data.generatedAt || null);
      } else {
        setError(data.error || "Erreur lors de la génération. Veuillez réessayer.");
      }
    } catch {
      clearInterval(interval);
      setError("Erreur de connexion. Veuillez réessayer.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <style>{`
        @media (max-width: 520px) {
          .demo-card { padding: 20px !important; }
          .demo-grid-2col { grid-template-columns: 1fr !important; }
          .demo-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .demo-sector-grid { grid-template-columns: 1fr 1fr !important; }
          .demo-newsletter-content { padding-left: 16px !important; padding-right: 16px !important; }
          .demo-highlight-block { flex-direction: column !important; }
          .demo-highlight-block > div:first-child { width: 100% !important; height: 60px !important; }
        }
      `}</style>
      {/* Sector selector */}
      <div
        className="demo-card"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "32px",
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-inter, 'Inter', sans-serif)",
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: 6,
            letterSpacing: "-0.02em",
          }}
        >
          {t("demo.sector_title")}
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 24 }}>
          {t("demo.sector_subtitle")}
        </p>

        {/* Sector grid */}
        <div
          className="demo-sector-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {SECTORS.map((s) => {
            const isActive = sector === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSector(s.key)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "16px",
                  borderRadius: 10,
                  border: isActive ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                  background: isActive ? "rgba(0,80,88,0.06)" : "var(--surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "border-color 0.15s, background 0.15s",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                <span style={{ color: isActive ? "var(--accent)" : "var(--text-muted)" }}>
                  {s.icon}
                </span>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    color: isActive ? "var(--accent)" : "var(--text)",
                    lineHeight: 1.3,
                  }}
                >
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="btn-primary"
          style={{
            width: "100%",
            padding: "13px",
            fontSize: "0.9375rem",
            fontWeight: 500,
            justifyContent: "center",
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {t("demo.generating")}
            </span>
          ) : (
            t("demo.generate")
          )}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div
          style={{
            padding: "40px 32px",
            textAlign: "center",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              margin: "0 auto 20px",
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--border)" }} />
            <div
              className="animate-spin"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "2px solid transparent",
                borderTopColor: "var(--accent)",
              }}
            />
          </div>
          <p style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.9375rem", marginBottom: 6, letterSpacing: "-0.01em" }}>
            {LOADING_MESSAGES[msgIdx]}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: 20 }}>
            Claude analyse les sources et génère vos articles en temps réel
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
            {LOADING_MESSAGES.map((_, i) => (
              <div
                key={i}
                style={{
                  height: 3,
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  width: i === msgIdx ? 24 : 6,
                  background: i === msgIdx ? "var(--accent)" : "var(--border)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div
          style={{
            padding: "16px 20px",
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10,
            color: "#DC2626",
            fontSize: "0.875rem",
            marginBottom: 24,
          }}
        >
          {error}
        </div>
      )}

      {/* Result */}
      {articles && !loading && (
        <div>
          <DemoNewsletterResult
            articles={articles}
            sector={sector}
            generationTime={generationTime}
            fromCache={fromCache}
            generatedAt={generatedAt}
          />

          {/* CTA */}
          <div
            style={{
              marginTop: 20,
              padding: "28px 32px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              textAlign: "center",
            }}
          >
            <p style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text)", marginBottom: 6, letterSpacing: "-0.01em" }}>
              {t("demo.cta_title")}
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 20 }}>
              {t("demo.cta_subtitle")}
            </p>
            <Link
              href="/connexion"
              className="btn-primary"
              style={{ display: "inline-flex", padding: "11px 28px", fontSize: "0.9375rem" }}
            >
              {t("demo.cta_button")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
