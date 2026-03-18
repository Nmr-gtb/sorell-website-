"use client";

import { useState } from "react";
import Link from "next/link";

type AIArticle = {
  tag: string;
  title: string;
  summary: string;
  source: string;
  featured?: boolean;
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

const SECTOR_COLORS: Record<string, { hero: string; grid1: string; grid2: string; highlight: string }> = {
  tech:       { hero: "#1E293B", grid1: "#0F172A", grid2: "#1E3A5F", highlight: "#334155" },
  finance:    { hero: "#1A2744", grid1: "#162032", grid2: "#1B3A4B", highlight: "#1E2D47" },
  sante:      { hero: "#0F2E1C", grid1: "#162E2E", grid2: "#1A2744", highlight: "#143524" },
  rh:         { hero: "#2D1B35", grid1: "#1F1135", grid2: "#2D1B22", highlight: "#28162A" },
  immobilier: { hero: "#1A2112", grid1: "#0F1A10", grid2: "#1A2744", highlight: "#1A2112" },
  energie:    { hero: "#0F1A20", grid1: "#0A1520", grid2: "#0F2A18", highlight: "#0F1A20" },
};

const LOADING_MESSAGES = [
  "Analyse des sources sectorielles...",
  "Sélection des contenus pertinents...",
  "Personnalisation par secteur...",
  "Génération du briefing IA...",
  "Mise en forme finale...",
];

function getTagStyle(tag: string): React.CSSProperties {
  const t = tag.toLowerCase();
  if (t.includes("réglem") || t.includes("loi") || t.includes("norme") || t.includes("légis") || t.includes("compliance"))
    return { background: "#ECFDF5", color: "#065F46" };
  if (t.includes("concurrent") || t.includes("marché") || t.includes("business") || t.includes("levée") || t.includes("financement"))
    return { background: "#EFF6FF", color: "#1E40AF" };
  return { background: "rgba(37,99,235,0.08)", color: "var(--accent)" };
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
  const colors = SECTOR_COLORS[sector] || SECTOR_COLORS["tech"];
  const featured = articles.find((a) => a.featured) || articles[0];
  const rest = articles.filter((a) => !a.featured).slice(0, 4);
  const gridArticle1 = rest[0] || articles[1];
  const gridArticle2 = rest[1] || articles[2];
  const highlight = rest[2] || articles[3];

  const diagonalPattern =
    "repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 16px)";

  const minsAgo =
    fromCache && generatedAt
      ? Math.round((Date.now() - new Date(generatedAt).getTime()) / 60000)
      : null;

  const now = new Date();
  const dateLabel = now.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#F59E0B",
                flexShrink: 0,
              }}
            />
            Résultat en cache — généré il y a {minsAgo < 1 ? "moins d'1 min" : `${minsAgo} min`}
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
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10B981",
                flexShrink: 0,
              }}
            />
            Généré par IA en {generationTime} seconde{generationTime > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Newsletter card */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          fontFamily: "var(--font-inter, 'Inter', sans-serif)",
          fontSize: "0.8125rem",
        }}
      >
        {/* Email metadata bar */}
        <div
          style={{
            background: "var(--surface-alt)",
            borderBottom: "1px solid var(--border)",
            padding: "12px 20px",
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
              Votre briefing {SECTOR_LABELS[sector]} — {dateLabel}
            </span>
          </div>
        </div>

        {/* Magazine header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: "0.9375rem", letterSpacing: "-0.02em", color: "var(--text)" }}>
              Sorel<span style={{ color: "var(--accent)" }}>l</span>
            </span>
            <span style={{ color: "var(--border-hover)", fontSize: "0.875rem" }}>·</span>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              {SECTOR_LABELS[sector]}
            </span>
          </div>
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            {dateLabel} · 8h00
          </span>
        </div>

        {/* Hero image */}
        <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: colors.hero,
              backgroundImage: diagonalPattern,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.72) 100%)",
            }}
          />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px" }}>
            <span
              style={{
                display: "inline-block",
                marginBottom: 8,
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: "0.5625rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                background: "rgba(37,99,235,0.9)",
                color: "white",
              }}
            >
              ARTICLE PHARE
            </span>
            <p
              style={{
                fontWeight: 700,
                fontSize: "1.0625rem",
                color: "white",
                lineHeight: 1.35,
                marginBottom: 6,
                letterSpacing: "-0.01em",
              }}
            >
              {featured?.title}
            </p>
            <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.7)" }}>
              {featured?.source}
            </span>
          </div>
        </div>

        {/* Intro */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.8125rem", color: "var(--text)", lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600 }}>Bonjour,</span>{" "}
            <span style={{ color: "var(--text-secondary)" }}>
              voici les {articles.length} actualités clés de votre secteur ({SECTOR_LABELS[sector]}) cette semaine, sélectionnées par Sorell.
            </span>
          </p>
        </div>

        {/* 2-column grid */}
        {gridArticle1 && gridArticle2 && (
          <div
            style={{
              padding: "16px 24px 0",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            {[
              { article: gridArticle1, bg: colors.grid1 },
              { article: gridArticle2, bg: colors.grid2 },
            ].map(({ article, bg }, idx) => (
              <div
                key={idx}
                style={{ border: "0.5px solid var(--border)", borderRadius: 8, overflow: "hidden" }}
              >
                <div
                  style={{
                    height: 90,
                    background: bg,
                    backgroundImage: diagonalPattern,
                  }}
                />
                <div style={{ padding: "12px 14px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      marginBottom: 6,
                      padding: "2px 7px",
                      borderRadius: 4,
                      fontSize: "0.5625rem",
                      fontWeight: 600,
                      ...getTagStyle(article.tag),
                    }}
                  >
                    {article.tag.toUpperCase()}
                  </span>
                  <p
                    style={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--text)",
                      lineHeight: 1.35,
                      marginBottom: 5,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {article.title}
                  </p>
                  <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                    {article.source}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Highlight block */}
        {highlight && (
          <div style={{ padding: "14px 24px 0" }}>
            <div
              style={{
                display: "flex",
                gap: 14,
                padding: 16,
                borderRadius: 8,
                background: "var(--surface-alt)",
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 6,
                  flexShrink: 0,
                  background: colors.highlight,
                  backgroundImage: diagonalPattern,
                }}
              />
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    display: "inline-block",
                    marginBottom: 6,
                    padding: "2px 7px",
                    borderRadius: 4,
                    fontSize: "0.5625rem",
                    fontWeight: 600,
                    ...getTagStyle(highlight.tag),
                  }}
                >
                  {highlight.tag.toUpperCase()}
                </span>
                <p
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--text)",
                    lineHeight: 1.35,
                    marginBottom: 4,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {highlight.title}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    marginBottom: 4,
                  }}
                >
                  {highlight.summary}
                </p>
                <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                  Source : {highlight.source}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Stats bar */}
        <div
          style={{
            padding: "14px 24px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
          }}
        >
          {[
            { value: "147", label: "Sources analysées" },
            { value: String(articles.length), label: "Articles retenus" },
            { value: "3min", label: "Temps de lecture" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--surface-alt)",
                borderRadius: 8,
                padding: 12,
                textAlign: "center" as const,
              }}
            >
              <div
                style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent)", marginBottom: 2 }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: "0.625rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            padding: "14px 24px",
            textAlign: "center" as const,
          }}
        >
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            Généré automatiquement par Sorel<span style={{ color: "var(--accent)" }}>l</span>
            {" · "}Propulsé par IA
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DemoGenerator() {
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
      const res = await fetch(`/api/demo?sector=${sector}`);
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
      {/* Sector selector */}
      <div
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
          Choisissez votre secteur
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 24 }}>
          Sélectionnez un domaine pour voir la newsletter générée par l&apos;IA.
        </p>

        {/* Sector grid */}
        <div
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
                  background: isActive ? "rgba(37,99,235,0.06)" : "var(--surface)",
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
              Génération IA en cours...
            </span>
          ) : (
            "Générer ma newsletter démo →"
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
              Envie de recevoir ça chaque semaine ?
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 20 }}>
              Créez votre compte gratuitement et personnalisez votre newsletter sectorielle.
            </p>
            <Link
              href="/login"
              className="btn-primary"
              style={{ display: "inline-flex", padding: "11px 28px", fontSize: "0.9375rem" }}
            >
              Créer mon compte gratuitement →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
