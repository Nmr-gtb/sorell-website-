"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getNewsletterConfig, getRecipients, getProfile, getMonthlyNewsletterCount } from "@/lib/database";
import { getPlanLimits } from "@/lib/plans";
import CrownBadge from "@/components/CrownBadge";
import { useDevMode } from "@/lib/DevModeContext";

type Article = {
  tag: string;
  title: string;
  hook?: string;
  content?: string;
  summary?: string; // ancien format, backward compat
  source: string;
  url?: string;
  featured: boolean;
};

type KeyFigure = {
  value: string;
  label: string;
  context: string;
};

type Newsletter = {
  id: string;
  subject: string;
  content: { editorial: string; key_figures: KeyFigure[]; articles: Article[] } | Article[];
  status: string;
};

type SendResult = {
  email: string;
  success: boolean;
  id?: string;
  error?: string;
};

function IconSparkles() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        border: "2px solid currentColor",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

export default function GeneratePage() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<{ id: string; label: string; enabled: boolean }[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("weekly-1");
  const [customBrief, setCustomBrief] = useState("");
  const [recipientCount, setRecipientCount] = useState(0);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [realPlan, setRealPlan] = useState<string>("free");
  const { getEffectivePlan } = useDevMode();
  const [generatedThisMonth, setGeneratedThisMonth] = useState(0);

  const [generating, setGenerating] = useState(false);
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [editorial, setEditorial] = useState("");
  const [keyFigures, setKeyFigures] = useState<KeyFigure[]>([]);
  const [subject, setSubject] = useState("");
  const [generateError, setGenerateError] = useState("");

  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[] | null>(null);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    if (!user) return;
    async function loadConfig() {
      const [configResult, recipientsResult, profileResult, countResult] = await Promise.all([
        getNewsletterConfig(user!.id),
        getRecipients(user!.id),
        getProfile(user!.id),
        getMonthlyNewsletterCount(user!.id),
      ]);
      if (configResult.data) {
        setTopics(configResult.data.topics ?? []);
        setSources(configResult.data.sources ?? []);
        setFrequency(configResult.data.frequency ?? "weekly-1");
        if (configResult.data.custom_brief) {
          setCustomBrief(configResult.data.custom_brief);
        }
      }
      setRecipientCount(recipientsResult.data.length);
      if (profileResult.data?.plan) {
        setRealPlan(profileResult.data.plan);
      }
      setGeneratedThisMonth(countResult.count);
      setLoadingConfig(false);
    }
    loadConfig();
  }, [user]);

  const plan = getEffectivePlan(realPlan);
  const limits = getPlanLimits(plan);
  const isAtGenerationLimit = limits.generationsPerMonth !== -1 && generatedThisMonth >= limits.generationsPerMonth;

  const activeTopics = topics.filter((t) => t.enabled);

  const frequencyLabel =
    frequency === "daily" ? "Quotidienne" : frequency === "weekly-2" ? "2x par semaine" : "Hebdomadaire";

  async function handleGenerate() {
    if (!user) return;
    setGenerating(true);
    setGenerateError("");
    setNewsletter(null);
    setArticles([]);
    setEditorial("");
    setKeyFigures([]);
    setSendResults(null);
    setSendError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, topics, sources, customBrief }),
      });
      const data = await response.json();
      if (!response.ok) {
        setGenerateError(data.error || "Erreur lors de la génération");
      } else {
        setNewsletter(data.newsletter);
        setArticles(data.articles);
        setEditorial(data.editorial || "");
        setKeyFigures(data.keyFigures || []);
        setSubject(data.newsletter.subject);
        setGeneratedThisMonth((prev) => prev + 1);
      }
    } catch {
      setGenerateError("Erreur réseau");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    if (!user || !newsletter) return;
    setSending(true);
    setSendError("");
    setSendResults(null);

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsletterId: newsletter.id, userId: user.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        setSendError(data.error || "Erreur lors de l'envoi");
      } else {
        setSendResults(data.results);
      }
    } catch {
      setSendError("Erreur réseau");
    } finally {
      setSending(false);
    }
  }

  const featuredArticle = articles.find((a) => a.featured) || articles[0];
  const otherArticles = articles.filter((a) => a !== featuredArticle);
  const successCount = sendResults?.filter((r) => r.success).length ?? 0;

  const generationLimitLabel = limits.generationsPerMonth === -1
    ? "Illimité"
    : `${generatedThisMonth} / ${limits.generationsPerMonth} génération${limits.generationsPerMonth > 1 ? "s" : ""} ce mois`;

  return (
    <div style={{ padding: "32px", maxWidth: 760 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
          Générer une newsletter
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          L&apos;IA analyse vos sources et génère votre briefing
        </p>
      </div>

      {/* Step 1 - Config summary + Generate button */}
      {!newsletter && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
            Configuration actuelle
          </h2>

          {loadingConfig ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Chargement...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Thématiques actives</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                  {activeTopics.length > 0 ? activeTopics.map((t) => t.label).join(", ") : "Aucune"}
                </span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Sources</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                  {sources.length > 0 ? `${sources.length} source${sources.length > 1 ? "s" : ""}` : "Toutes"}
                </span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Fréquence</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{frequencyLabel}</span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Destinataires</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{recipientCount}</span>
              </div>
              {customBrief && (
                <>
                  <div style={{ height: 1, background: "var(--border)" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Brief</span>
                    <span style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
                      {customBrief.length > 100 ? `${customBrief.slice(0, 100)}...` : customBrief}
                    </span>
                  </div>
                </>
              )}
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Générations ce mois</span>
                <span style={{ fontSize: 14, color: isAtGenerationLimit ? "var(--error)" : "var(--text)", fontWeight: 500 }}>
                  {generationLimitLabel}
                </span>
              </div>
            </div>
          )}

          {/* Automation info */}
          <div style={{
            background: "rgba(37,99,235,0.04)",
            border: "1px solid rgba(37,99,235,0.12)",
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 24,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>
                Vos newsletters sont envoyées automatiquement
              </p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                Une fois configuré, Sorell génère et envoie votre newsletter au jour et à l&apos;heure choisis dans l&apos;onglet Newsletter. Vous pouvez aussi en générer une manuellement ici.
              </p>
            </div>
          </div>

          {generateError && (
            <p style={{ fontSize: 14, color: "#EF4444", marginBottom: 16 }}>{generateError}</p>
          )}

          {isAtGenerationLimit ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                Vous avez atteint votre limite de {limits.generationsPerMonth} génération(s) ce mois-ci.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CrownBadge tooltip="Générations illimitées avec le plan Pro" />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Passez au plan supérieur pour des générations illimitées
                </span>
              </div>
            </div>
          ) : (
            <>
              <button
                className="btn-primary"
                onClick={handleGenerate}
                disabled={generating || activeTopics.length === 0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 15,
                  padding: "10px 20px",
                  opacity: activeTopics.length === 0 ? 0.5 : 1,
                }}
              >
                {generating ? (
                  <>
                    <Spinner />
                    Analyse de vos sources en cours...
                  </>
                ) : (
                  <>
                    <IconSparkles />
                    Générer ma newsletter
                  </>
                )}
              </button>
              {activeTopics.length === 0 && !loadingConfig && (
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
                  Activez au moins une thématique dans la configuration pour générer.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Step 2 - Preview */}
      {newsletter && articles.length > 0 && !sendResults && (
        <>
          {/* Subject + actions */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, display: "block", marginBottom: 6 }}>
                SUJET
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--text)",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
              <button
                className="btn-ghost"
                onClick={handleGenerate}
                disabled={generating}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, padding: "7px 14px" }}
              >
                {generating ? <Spinner /> : <IconRefresh />}
                Régénérer
              </button>
              <button
                className="btn-primary"
                onClick={handleSend}
                disabled={sending || recipientCount === 0}
                style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, padding: "8px 16px" }}
              >
                {sending ? (
                  <>
                    <Spinner />
                    Envoi en cours à {recipientCount} destinataire{recipientCount > 1 ? "s" : ""}...
                  </>
                ) : (
                  `Envoyer à ${recipientCount} destinataire${recipientCount > 1 ? "s" : ""}`
                )}
              </button>
            </div>
          </div>

          {sendError && (
            <p style={{ fontSize: 14, color: "#EF4444", marginBottom: 16 }}>{sendError}</p>
          )}

          {/* Editorial */}
          {editorial && (
            <div
              style={{
                background: "var(--surface-alt)",
                borderLeft: "3px solid var(--accent)",
                borderRadius: 8,
                padding: "16px 20px",
                marginBottom: 12,
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
                Éditorial
              </p>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6, fontStyle: "italic" }}>
                {editorial}
              </p>
            </div>
          )}

          {/* Chiffres clés */}
          {keyFigures.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 8px" }}>
                Chiffres clés
              </p>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(keyFigures.length, 3)}, 1fr)`, gap: 8 }}>
                {keyFigures.map((fig, i) => (
                  <div
                    key={i}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <p style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)", margin: "0 0 4px" }}>{fig.value}</p>
                    <p style={{ fontSize: 13, color: "var(--text)", margin: "0 0 4px" }}>{fig.label}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{fig.context}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Featured article */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
              marginBottom: 12,
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 4,
                background: "rgba(37,99,235,0.08)",
                color: "var(--accent)",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 10,
              }}
            >
              Article phare · {featuredArticle.tag}
            </span>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "var(--text)", margin: "8px 0 6px", lineHeight: 1.35 }}>
              {featuredArticle.title}
            </h2>
            {featuredArticle.hook && (
              <p style={{ fontSize: 14, color: "var(--text)", margin: "0 0 6px", lineHeight: 1.5, fontStyle: "italic" }}>
                {featuredArticle.hook}
              </p>
            )}
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 6px", lineHeight: 1.5 }}>
              {featuredArticle.content || featuredArticle.summary}
            </p>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Source : {featuredArticle.source}</span>
            {featuredArticle.url && (
              <a
                href={featuredArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", fontSize: 12, color: "#2563EB", textDecoration: "none", fontWeight: 500, marginTop: 4 }}
              >
                Lire l&apos;article →
              </a>
            )}
          </div>

          {/* Other articles */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {otherArticles.map((article, i) => (
              <div
                key={i}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "var(--surface-alt)",
                    color: "var(--text-secondary)",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 6,
                  }}
                >
                  {article.tag}
                </span>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "4px 0", lineHeight: 1.35 }}>
                  {article.title}
                </h3>
                {article.hook && (
                  <p style={{ fontSize: 13, color: "var(--text)", margin: "0 0 4px", lineHeight: 1.5, fontStyle: "italic" }}>
                    {article.hook}
                  </p>
                )}
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 4px", lineHeight: 1.5 }}>
                  {article.content || article.summary}
                </p>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Source : {article.source}</span>
                {article.url && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "block", fontSize: 11, color: "#2563EB", textDecoration: "none", fontWeight: 500, marginTop: 4 }}
                  >
                    Lire l&apos;article →
                  </a>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Step 3 - Send results */}
      {sendResults && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 20 }}>✓</span>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#16A34A", margin: 0 }}>
              Newsletter envoyée à {successCount} destinataire{successCount > 1 ? "s" : ""}
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {sendResults.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: r.success ? "rgba(22,163,74,0.06)" : "rgba(239,68,68,0.06)",
                  border: `1px solid ${r.success ? "rgba(22,163,74,0.2)" : "rgba(239,68,68,0.2)"}`,
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 14, color: "var(--text)" }}>{r.email}</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: r.success ? "#16A34A" : "#EF4444",
                  }}
                >
                  {r.success ? "Envoyé ✓" : "Échec ✗"}
                </span>
              </div>
            ))}
          </div>
          <button
            className="btn-ghost"
            onClick={() => {
              setNewsletter(null);
              setArticles([]);
              setEditorial("");
              setKeyFigures([]);
              setSendResults(null);
            }}
            style={{ fontSize: 14, padding: "7px 14px" }}
          >
            Générer une nouvelle newsletter
          </button>
        </div>
      )}
    </div>
  );
}
