"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { getNewsletterConfig, getRecipients, getProfile, getMonthlyManualCount } from "@/lib/database";
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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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

  const [brandColor, setBrandColor] = useState("#2563EB");
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [textColor, setTextColor] = useState("#111827");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [bodyTextColor, setBodyTextColor] = useState("#4B5563");

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
        getMonthlyManualCount(user!.id),
      ]);
      if (configResult.data) {
        setTopics(configResult.data.topics ?? []);
        setSources(configResult.data.sources ?? []);
        setFrequency(configResult.data.frequency ?? "weekly-1");
        if (configResult.data.custom_brief) {
          setCustomBrief(configResult.data.custom_brief);
        }
        if (configResult.data.brand_color) setBrandColor(configResult.data.brand_color);
        if (configResult.data.custom_logo_url) setCustomLogo(configResult.data.custom_logo_url);
        if (configResult.data.text_color) setTextColor(configResult.data.text_color);
        if (configResult.data.bg_color) setBgColor(configResult.data.bg_color);
        if (configResult.data.body_text_color) setBodyTextColor(configResult.data.body_text_color);
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
  const isAtGenerationLimit = plan === "free" && generatedThisMonth >= 4;

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

  const generationLimitLabel = plan === "free"
    ? `${generatedThisMonth} / 4 aperçus ce mois`
    : "Aperçus : Illimité";

  return (
    <div style={{ padding: "32px", maxWidth: 760 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
          Aperçu de votre newsletter
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Prévisualisez votre prochaine newsletter ou générez-en une manuellement
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
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Aperçus ce mois</span>
                <span style={{ fontSize: 14, color: isAtGenerationLimit ? "var(--error)" : "var(--text)", fontWeight: 500 }}>
                  {generationLimitLabel}
                </span>
              </div>
            </div>
          )}

          {/* Automation info */}
          <div style={{
            background: hexToRgba(brandColor, 0.04),
            border: `1px solid ${hexToRgba(brandColor, 0.12)}`,
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
                Tout est automatique
              </p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                Votre newsletter est envoyée automatiquement chaque semaine selon votre configuration. Cette page vous permet de prévisualiser le résultat ou d&apos;en générer une manuellement si besoin.
              </p>
            </div>
          </div>

          {generateError && (
            <p style={{ fontSize: 14, color: "#EF4444", marginBottom: 16 }}>{generateError}</p>
          )}

          {isAtGenerationLimit ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                Vous avez atteint votre limite de 4 aperçus ce mois-ci.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CrownBadge tooltip="Aperçus illimités avec le plan Pro" />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  <a href="/tarifs" style={{ color: "var(--accent)", textDecoration: "underline" }}>Passer au Pro</a> pour des aperçus illimités
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
                    Générer un aperçu
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, textAlign: "right" }}>
                Cet envoi est en plus de l&apos;envoi automatique programmé.
              </p>
            </div>
          </div>

          {sendError && (
            <p style={{ fontSize: 14, color: "#EF4444", marginBottom: 16 }}>{sendError}</p>
          )}

          {/* Email preview container */}
          <div style={{ background: bgColor, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>

            {/* Header */}
            <div style={{ padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {customLogo ? (
                <img src={customLogo} alt="Logo" style={{ maxHeight: 36, maxWidth: 180 }} />
              ) : (
                <span style={{ fontSize: 20, fontWeight: 700, color: textColor, letterSpacing: "-0.02em" }}>
                  Sorel<span style={{ color: brandColor }}>l</span>
                </span>
              )}
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                Semaine du {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>

            {/* Article phare avec bandeau décoratif */}
            <div style={{ padding: "0 32px 24px" }}>
              <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ background: "#1F2937", height: 120 }}></div>
                <div style={{ padding: "20px 24px", background: bgColor }}>
                  <span style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: 4,
                    background: brandColor,
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}>
                    Article phare
                  </span>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: textColor, margin: "12px 0 8px", lineHeight: 1.35, letterSpacing: "-0.01em" }}>
                    {featuredArticle.title}
                  </h2>
                  {featuredArticle.hook && (
                    <p style={{ fontSize: 14, color: bodyTextColor, margin: "0 0 10px", fontStyle: "italic", lineHeight: 1.5 }}>
                      {featuredArticle.hook}
                    </p>
                  )}
                  <p style={{ fontSize: 14, color: bodyTextColor, lineHeight: 1.65, margin: "0 0 12px" }}>
                    {featuredArticle.content || featuredArticle.summary}
                  </p>
                  <a href={featuredArticle.url || "https://sorell.fr"} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: brandColor, textDecoration: "none", fontWeight: 500 }}>
                    {featuredArticle.source} →
                  </a>
                </div>
              </div>
            </div>

            {/* Intro personnalisée */}
            <div style={{ padding: "0 32px 20px" }}>
              <p style={{ fontSize: 14, color: textColor, lineHeight: 1.6, margin: 0 }}>
                <span style={{ fontWeight: 600 }}>Bonjour,</span>
                <span style={{ color: "#6B7280" }}> voici les {otherArticles.length + 1} actualités clés de votre secteur cette semaine, sélectionnées et résumées par Sorell.</span>
              </p>
            </div>

            {/* Editorial */}
            {editorial && (
              <div style={{ padding: "0 32px 24px" }}>
                <div style={{ borderLeft: `3px solid ${brandColor}`, padding: "16px 20px", background: "#F8FAFC" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
                    Éditorial
                  </p>
                  <p style={{ fontSize: 14, color: bodyTextColor, lineHeight: 1.65, margin: 0, fontStyle: "italic" }}>
                    {editorial}
                  </p>
                </div>
              </div>
            )}

            {/* Chiffres clés */}
            {keyFigures.length > 0 && (
              <div style={{ padding: "0 32px 24px" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
                  Chiffres clés
                </p>
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(keyFigures.length, 3)}, 1fr)`, gap: 8 }}>
                  {keyFigures.map((fig, i) => (
                    <div key={i} style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16, textAlign: "center" }}>
                      <p style={{ fontSize: 20, fontWeight: 700, color: brandColor, margin: "0 0 4px", letterSpacing: "-0.02em" }}>{fig.value}</p>
                      <p style={{ fontSize: 12, color: "#111827", fontWeight: 500, margin: "0 0 2px" }}>{fig.label}</p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{fig.context}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Articles secondaires */}
            <div style={{ padding: "0 32px 16px" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
                Les actus de la semaine
              </p>

              {/* 2 premiers articles en grille */}
              {otherArticles.length >= 2 && (
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  {otherArticles.slice(0, 2).map((article, i) => (
                    <div key={i} style={{ flex: 1, border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ background: "#374151", height: 80 }}></div>
                      <div style={{ padding: 14, background: bgColor }}>
                        <span style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: 4,
                          background: "#F3F4F6",
                          color: "#374151",
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}>
                          {article.tag}
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: textColor, margin: "8px 0", lineHeight: 1.35 }}>
                          {article.title}
                        </h3>
                        <p style={{ fontSize: 12, color: bodyTextColor, lineHeight: 1.5, margin: "0 0 8px" }}>
                          {(article.content || article.summary || "").length > 120
                            ? (article.content || article.summary || "").substring(0, 120) + "..."
                            : (article.content || article.summary || "")}
                        </p>
                        <a href={article.url || "https://sorell.fr"} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, color: brandColor, textDecoration: "none", fontWeight: 500 }}>
                          {article.source} →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Articles restants */}
              {otherArticles.slice(2).map((article, i) => (
                <div key={i} style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ background: "#374151", height: 60 }}></div>
                  <div style={{ padding: "16px 20px", background: bgColor }}>
                    <span style={{
                      display: "inline-block",
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: "#F3F4F6",
                      color: "#374151",
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}>
                      {article.tag}
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: textColor, margin: "8px 0", lineHeight: 1.35 }}>
                      {article.title}
                    </h3>
                    {article.hook && (
                      <p style={{ fontSize: 13, color: bodyTextColor, margin: "0 0 8px", fontStyle: "italic" }}>
                        {article.hook}
                      </p>
                    )}
                    <p style={{ fontSize: 13, color: bodyTextColor, lineHeight: 1.6, margin: "0 0 10px" }}>
                      {article.content || article.summary}
                    </p>
                    <a href={article.url || "https://sorell.fr"} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: brandColor, textDecoration: "none", fontWeight: 500 }}>
                      {article.source} →
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Statistiques */}
            <div style={{ padding: "8px 32px 24px" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, textAlign: "center", padding: 12, border: "1px solid #E5E7EB", borderRadius: 8 }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: brandColor, margin: "0 0 4px" }}>147</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>Sources analysées</p>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: 12, border: "1px solid #E5E7EB", borderRadius: 8 }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: brandColor, margin: "0 0 4px" }}>{otherArticles.length + 1}</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>Articles retenus</p>
                </div>
                <div style={{ flex: 1, textAlign: "center", padding: 12, border: "1px solid #E5E7EB", borderRadius: 8 }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: brandColor, margin: "0 0 4px" }}>3min</p>
                  <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>Temps de lecture</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div style={{ padding: "0 32px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 12px" }}>Cette newsletter vous a été utile ?</p>
              <a href="https://sorell.fr/tarifs"
                style={{ display: "inline-block", padding: "10px 24px", background: brandColor, color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none", borderRadius: 6 }}>
                Partager avec votre équipe
              </a>
            </div>

            {/* Footer */}
            <div style={{ padding: "20px 32px", borderTop: "1px solid #E5E7EB", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {customLogo ? (
                <img src={customLogo} alt="Logo" style={{ maxHeight: 28, maxWidth: 140 }} />
              ) : (
                <span style={{ fontSize: 14, fontWeight: 700, color: textColor, letterSpacing: "-0.01em" }}>
                  Sorel<span style={{ color: brandColor }}>l</span>
                </span>
              )}
              <span style={{ fontSize: 12, color: brandColor }}>sorell.fr</span>
            </div>

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
