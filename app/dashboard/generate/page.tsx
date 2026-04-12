"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { getNewsletterConfig, getRecipients, getProfile, getMonthlyManualCount, addRecipient } from "@/lib/database";
import CrownBadge from "@/components/CrownBadge";
import { getPlanLimits } from "@/lib/plans";
import { authFetch } from "@/lib/api";

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
  const { t } = useLanguage();
  const [topics, setTopics] = useState<{ id: string; label: string; enabled: boolean }[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [frequency, setFrequency] = useState("weekly-1");
  const [customBrief, setCustomBrief] = useState("");
  const [recipientCount, setRecipientCount] = useState(0);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [realPlan, setRealPlan] = useState<string>("free");
  const [generatedThisMonth, setGeneratedThisMonth] = useState(0);

  const [generating, setGenerating] = useState(false);
  const [newsletter, setNewsletter] = useState<Newsletter | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [editorial, setEditorial] = useState("");
  const [keyFigures, setKeyFigures] = useState<KeyFigure[]>([]);
  const [subject, setSubject] = useState("");
  const [generateError, setGenerateError] = useState("");

  const [brandColor, setBrandColor] = useState("#005058");
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [textColor, setTextColor] = useState("#111827");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [bodyTextColor, setBodyTextColor] = useState("#4B5563");

  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[] | null>(null);
  const [sendError, setSendError] = useState("");

  const [feedbackSelected, setFeedbackSelected] = useState<string[]>([]);
  const [feedbackCustom, setFeedbackCustom] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);

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
      let finalRecipientCount = recipientsResult.data.length;
      if (finalRecipientCount === 0 && user?.email) {
        await addRecipient(user.id, { name: "", email: user.email, role: "" });
        finalRecipientCount = 1;
      }
      setRecipientCount(finalRecipientCount);
      if (profileResult.data?.plan) {
        setRealPlan(profileResult.data.plan);
      }
      setGeneratedThisMonth(countResult.count);
      setLoadingConfig(false);
    }
    loadConfig();
  }, [user]);

  const plan = realPlan;
  const planLimits = getPlanLimits(plan);
  const previewLimit = planLimits.previewsPerMonth; // -1 = illimite
  const isAtGenerationLimit = previewLimit !== -1 && generatedThisMonth >= previewLimit;

  const activeTopics = topics.filter((tp) => tp.enabled);

  const frequencyLabel =
    frequency === "daily" ? t("generate.freq_daily") : frequency === "weekly-2" ? t("generate.freq_twice_weekly") : t("generate.freq_weekly");

  async function handleGenerate(feedback?: string) {
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
      const response = await authFetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          userId: user.id, topics, sources, customBrief,
          ...(feedback ? { feedback, newsletterId: newsletter?.id } : {}),
        }),
      });
      const data = await response.json();
      if (response.status === 429) {
        setGenerateError(t("generate.error_rate_limit"));
      } else if (!response.ok) {
        setGenerateError(data.error || t("generate.error_generation"));
      } else {
        setNewsletter(data.newsletter);
        setArticles(data.articles);
        setEditorial(data.editorial || "");
        setKeyFigures(data.keyFigures || []);
        setSubject(data.newsletter.subject);
        setGeneratedThisMonth((prev) => prev + 1);
        if (feedback) {
          setFeedbackSelected([]);
          setFeedbackCustom("");
          setShowFeedback(false);
        }
      }
    } catch {
      setGenerateError(t("generate.error_network"));
    } finally {
      setGenerating(false);
    }
  }

  function handleFeedbackRegenerate() {
    const parts: string[] = [...feedbackSelected];
    if (feedbackCustom.trim()) parts.push(feedbackCustom.trim());
    if (parts.length === 0) return;
    const feedbackText = parts.join(". ");
    handleGenerate(feedbackText);
  }

  async function handleSend() {
    if (!user || !newsletter) return;
    setSending(true);
    setSendError("");
    setSendResults(null);

    try {
      const response = await authFetch("/api/send", {
        method: "POST",
        body: JSON.stringify({ newsletterId: newsletter.id, userId: user.id }),
      });
      const data = await response.json();
      if (response.status === 429) {
        setSendError(t("generate.error_rate_limit"));
      } else if (!response.ok) {
        setSendError(data.error || t("generate.error_send"));
      } else {
        setSendResults(data.results);
      }
    } catch {
      setSendError(t("generate.error_network"));
    } finally {
      setSending(false);
    }
  }

  const featuredArticle = articles.find((a) => a.featured) || articles[0];
  const otherArticles = articles.filter((a) => a !== featuredArticle);
  const successCount = sendResults?.filter((r) => r.success).length ?? 0;

  const generationLimitLabel = previewLimit === -1
    ? t("generate.previews_unlimited")
    : `${generatedThisMonth} / ${previewLimit} ${t("generate.previews_count")}${previewLimit > 1 ? "s" : ""}`;

  return (
    <div style={{ padding: "32px", maxWidth: 760 }} className="generate-page-container">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .generate-page-container {
            padding: 20px 16px !important;
          }
          .generate-actions-bar {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .generate-actions-bar > div:first-child {
            min-width: 0 !important;
          }
          .generate-actions-buttons {
            align-items: stretch !important;
            flex-direction: column !important;
          }
          .generate-actions-buttons > div {
            flex-direction: column !important;
          }
          .generate-actions-buttons > div > button {
            width: 100% !important;
            justify-content: center !important;
          }
          .generate-email-hero {
            flex-direction: column !important;
          }
          .generate-email-hero > div:first-child {
            flex: 1 1 auto !important;
            padding: 24px 20px 20px !important;
          }
          .generate-email-hero > div:last-child {
            display: none !important;
          }
          .generate-email-header {
            padding: 16px 20px !important;
          }
          .generate-email-content {
            padding: 20px 16px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
          {t("generate.title")}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {t("generate.subtitle")}
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
            {t("generate.current_config")}
          </h2>

          {loadingConfig ? (
            <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{t("common.loading")}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("generate.active_topics")}</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                  {activeTopics.length > 0 ? activeTopics.map((topic) => topic.label).join(", ") : t("generate.none")}
                </span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("generate.sources")}</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                  {sources.length > 0 ? `${sources.length} source${sources.length > 1 ? "s" : ""}` : t("generate.all")}
                </span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("generate.frequency")}</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{frequencyLabel}</span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("generate.recipients")}</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{recipientCount}</span>
              </div>
              {customBrief && (
                <>
                  <div style={{ height: 1, background: "var(--border)" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("generate.brief")}</span>
                    <span style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
                      {customBrief.length > 100 ? `${customBrief.slice(0, 100)}...` : customBrief}
                    </span>
                  </div>
                </>
              )}
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("generate.previews_this_month")}</span>
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
                {t("generate.auto_title")}
              </p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                {t("generate.auto_desc")}
              </p>
            </div>
          </div>

          {generateError && (
            <p style={{ fontSize: 14, color: "#EF4444", marginBottom: 16 }}>{generateError}</p>
          )}

          {isAtGenerationLimit ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
                {t("generate.limit_reached").replace("{limit}", String(previewLimit))}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CrownBadge tooltip={t("generate.unlimited_tooltip")} />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  <a href="/tarifs" style={{ color: "var(--accent)", textDecoration: "underline" }}>{t("generate.upgrade_pro")}</a> {t("generate.for_unlimited")}
                </span>
              </div>
            </div>
          ) : (
            <>
              <button
                className="btn-primary"
                onClick={() => handleGenerate()}
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
                    {t("generate.analyzing")}
                  </>
                ) : (
                  <>
                    <IconSparkles />
                    {t("generate.generate_preview")}
                  </>
                )}
              </button>
              {activeTopics.length === 0 && !loadingConfig && (
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
                  {t("generate.no_topics_warning")}
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
            className="generate-actions-bar"
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
                {t("generate.subject_label")}
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
            <div className="generate-actions-buttons" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button
                  className="btn-ghost"
                  onClick={() => handleGenerate()}
                  disabled={generating}
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, padding: "7px 14px" }}
                >
                  {generating ? <Spinner /> : <IconRefresh />}
                  {t("generate.regenerate")}
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
                      {t("generate.sending_to").replace("{count}", String(recipientCount))}
                    </>
                  ) : (
                    t("generate.send_to").replace("{count}", String(recipientCount))
                  )}
                </button>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, textAlign: "right" }}>
                {t("generate.manual_send_note")}
              </p>
            </div>
          </div>

          {/* Feedback section */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <span
              onClick={() => setShowFeedback(!showFeedback)}
              style={{ fontSize: 13, color: "var(--text-muted)", cursor: "pointer" }}
            >
              {t("generate.feedback_prompt")}
            </span>
          </div>

          {showFeedback && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {([
                  { key: "generate.feedback_too_long" as const, value: t("generate.feedback_too_long") },
                  { key: "generate.feedback_too_short" as const, value: t("generate.feedback_too_short") },
                  { key: "generate.feedback_not_technical" as const, value: t("generate.feedback_not_technical") },
                  { key: "generate.feedback_too_generic" as const, value: t("generate.feedback_too_generic") },
                  { key: "generate.feedback_irrelevant" as const, value: t("generate.feedback_irrelevant") },
                  { key: "generate.feedback_wrong_tone" as const, value: t("generate.feedback_wrong_tone") },
                ]).map((chip) => {
                  const isSelected = feedbackSelected.includes(chip.value);
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => {
                        setFeedbackSelected((prev) =>
                          isSelected ? prev.filter((v) => v !== chip.value) : [...prev, chip.value]
                        );
                      }}
                      style={{
                        border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border)",
                        borderRadius: 20,
                        padding: "6px 14px",
                        fontSize: 13,
                        cursor: "pointer",
                        background: isSelected ? "var(--accent)" : "transparent",
                        color: isSelected ? "white" : "var(--text-secondary)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {chip.value}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={feedbackCustom}
                onChange={(e) => setFeedbackCustom(e.target.value)}
                placeholder={t("generate.feedback_other")}
                rows={2}
                style={{
                  width: "100%",
                  fontSize: 14,
                  color: "var(--text)",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  outline: "none",
                  boxSizing: "border-box",
                  resize: "vertical",
                  marginBottom: 12,
                  fontFamily: "inherit",
                }}
              />
              <button
                className="btn-primary"
                onClick={handleFeedbackRegenerate}
                disabled={generating || (feedbackSelected.length === 0 && !feedbackCustom.trim())}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  padding: "8px 16px",
                  opacity: (feedbackSelected.length === 0 && !feedbackCustom.trim()) ? 0.5 : 1,
                }}
              >
                {generating ? (
                  <>
                    <Spinner />
                    {t("generate.feedback_regenerating")}
                  </>
                ) : (
                  t("generate.feedback_regenerate")
                )}
              </button>
            </div>
          )}

          {sendError && (
            <p style={{ fontSize: 14, color: "#EF4444", marginBottom: 16 }}>{sendError}</p>
          )}

          {/* Email preview container — V4 matching email-template.ts */}
          <div style={{ background: bgColor, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", maxWidth: 620, margin: "0 auto" }}>

            {/* Header */}
            <div className="generate-email-header" style={{ padding: "20px 32px", borderBottom: "1px solid #E8E0D8" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {customLogo ? (
                  <Image src={customLogo} alt="Logo" width={160} height={32} unoptimized style={{ maxHeight: 32, maxWidth: 160, width: "auto", height: "auto" }} />
                ) : (
                  <Image src="/icone.png" alt="S." width={32} height={32} />
                )}
                <span style={{ fontSize: 12, color: "#7A7267", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  {t("generate.week_of")} {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Hero */}
            <div className="generate-email-hero" style={{ background: brandColor, display: "flex" }}>
              <div style={{ padding: "36px 32px 32px", flex: "0 0 65%" }}>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px", fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                  {t("generate.week_of")} {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {subject}
                </p>
                <h1 style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF", margin: 0, lineHeight: 1.3, fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "-0.01em" }}>
                  Ce qui change dans votre secteur cette semaine
                </h1>
              </div>
              <div style={{ flex: "0 0 35%", display: "flex", alignItems: "flex-end" }}>
                <div style={{ height: 140, width: "100%", background: "rgba(255,255,255,0.08)", borderRadius: "8px 0 0 0" }}></div>
              </div>
            </div>

            {/* Article phare */}
            <div className="generate-email-content" style={{ padding: "28px 32px 24px" }}>
              <div style={{ marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
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
                  fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
                }}>
                  A la une
                </span>
                {featuredArticle.tag && (
                  <span style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: 4,
                    background: "#F5F0EB",
                    color: "#7A7267",
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
                  }}>
                    {featuredArticle.tag}
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: textColor, margin: "0 0 10px", lineHeight: 1.35, fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "-0.01em" }}>
                {featuredArticle.title}
              </h2>
              {featuredArticle.hook && (
                <p style={{ fontSize: 14, color: "#7A7267", margin: "0 0 14px", fontStyle: "italic", lineHeight: 1.55, fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  {featuredArticle.hook}
                </p>
              )}
              <p style={{ fontSize: 14, color: bodyTextColor, lineHeight: 1.7, margin: "0 0 18px", fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                {featuredArticle.content || featuredArticle.summary}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <a href={featuredArticle.url || "https://sorell.fr"} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-block", padding: "10px 22px", background: brandColor, color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none", borderRadius: 6, fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
                  Lire l&apos;article →
                </a>
                <span style={{ fontSize: 12, color: "#7A7267", fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
                  via {featuredArticle.source}
                </span>
              </div>
            </div>
            <div style={{ padding: "0 32px" }}><div style={{ borderTop: "1px solid #E8E0D8" }}></div></div>

            {/* Intro personnalisée */}
            <div style={{ padding: "20px 32px" }}>
              <p style={{ fontSize: 14, color: textColor, lineHeight: 1.6, margin: 0 }}>
                <span style={{ fontWeight: 600 }}>{t("generate.greeting")}</span>
                <span style={{ color: "#7A7267" }}> {t("generate.intro_text").replace("{count}", String(otherArticles.length + 1))}</span>
              </p>
            </div>

            {/* Editorial */}
            {editorial && (
              <>
                <div style={{ padding: "0 32px 24px" }}>
                  <div style={{ borderLeft: `3px solid ${brandColor}`, padding: "18px 22px", background: "#F5F0EB", borderRadius: "0 8px 8px 0" }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px", fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
                      Le point de vue
                    </p>
                    <p style={{ fontSize: 15, color: bodyTextColor, lineHeight: 1.7, margin: 0, fontStyle: "italic", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                      {editorial}
                    </p>
                  </div>
                </div>
                <div style={{ padding: "0 32px" }}><div style={{ borderTop: "1px solid #E8E0D8" }}></div></div>
              </>
            )}

            {/* Chiffres clés */}
            {keyFigures.length > 0 && (
              <>
                <div style={{ padding: "24px 32px" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px", fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
                    Chiffres cl&eacute;s
                  </p>
                  <div style={{ display: "flex", gap: 10 }}>
                    {keyFigures.map((fig, i) => (
                      <div key={i} style={{ flex: 1, background: "#F5F0EB", border: "1px solid #E8E0D8", borderRadius: 8, padding: 16, textAlign: "center" }}>
                        <p style={{ fontSize: 26, fontWeight: 700, color: brandColor, margin: "0 0 6px", fontFamily: "Georgia, 'Times New Roman', serif" }}>{fig.value}</p>
                        <p style={{ fontSize: 12, color: textColor, fontWeight: 600, margin: "0 0 3px", fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>{fig.label}</p>
                        <p style={{ fontSize: 11, color: "#7A7267", margin: 0, fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>{fig.context}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "0 32px" }}><div style={{ borderTop: "1px solid #E8E0D8" }}></div></div>
              </>
            )}

            {/* Articles secondaires */}
            {otherArticles.length > 0 && (
              <div style={{ padding: "24px 32px 8px" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 18px", fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
                  A lire aussi
                </p>

                {otherArticles.map((article, i) => (
                  <div key={i} style={{ border: "1px solid #E8E0D8", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
                    <div style={{ padding: 22, background: bgColor }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <span style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 4,
                          background: "#F5F0EB",
                          color: "#7A7267",
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontFamily: "'Segoe UI', Roboto, Arial, sans-serif",
                        }}>
                          {article.tag}
                        </span>
                        <span style={{ fontSize: 11, color: "#7A7267", fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
                          {article.source}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 600, color: textColor, margin: "0 0 8px", lineHeight: 1.35, fontFamily: "Georgia, 'Times New Roman', serif" }}>
                        {article.title}
                      </h3>
                      {article.hook && (
                        <p style={{ fontSize: 13, color: "#7A7267", margin: "0 0 8px", fontStyle: "italic", lineHeight: 1.5, fontFamily: "Georgia, 'Times New Roman', serif" }}>
                          {article.hook}
                        </p>
                      )}
                      <p style={{ fontSize: 13, color: bodyTextColor, lineHeight: 1.65, margin: "0 0 14px", fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                        {(article.content || article.summary || "").length > 180
                          ? (article.content || article.summary || "").substring(0, 180).replace(/\s+\S*$/, "") + "..."
                          : (article.content || article.summary || "")}
                      </p>
                      <a href={article.url || "https://sorell.fr"} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: brandColor, textDecoration: "none", fontWeight: 600, fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
                        Lire la suite →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div style={{ padding: "8px 32px 28px" }}>
              <div style={{ borderRadius: 10, overflow: "hidden", background: brandColor, display: "flex" }}>
                <div style={{ padding: "28px 28px 28px 32px", flex: "0 0 65%" }}>
                  <p style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", margin: "0 0 6px", fontFamily: "Georgia, 'Times New Roman', serif", lineHeight: 1.4 }}>
                    {plan === "free" ? "Partagez cette veille avec votre équipe" : "Cette newsletter vous a été utile ?"}
                  </p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "0 0 18px", lineHeight: 1.5, fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
                    {plan === "free" ? "Passez au plan Pro pour envoyer cette veille à vos collaborateurs." : "Transférez-la à un collègue qui devrait la lire."}
                  </p>
                  <a href={plan === "free" ? "https://sorell.fr/tarifs" : "#"}
                    style={{ display: "inline-block", padding: "11px 26px", background: "white", color: brandColor, fontSize: 13, fontWeight: 600, textDecoration: "none", borderRadius: 8, fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
                    {plan === "free" ? "Voir les plans →" : "Transférer →"}
                  </a>
                </div>
                <div style={{ flex: "0 0 35%", display: "flex", alignItems: "flex-end" }}>
                  <div style={{ height: 120, width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: "8px 0 0 0" }}></div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "22px 32px", borderTop: "1px solid #E8E0D8", background: "#F5F0EB" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                {customLogo ? (
                  <Image src={customLogo} alt="Logo" width={120} height={24} unoptimized style={{ maxHeight: 24, maxWidth: 120, width: "auto", height: "auto" }} />
                ) : (
                  <Image src="/icone.png" alt="S." width={24} height={24} />
                )}
                <a href="https://sorell.fr" style={{ fontSize: 12, color: brandColor, textDecoration: "none", fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>sorell.fr</a>
              </div>
              <p style={{ fontSize: 11, color: "#7A7267", margin: 0, lineHeight: 1.5, fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
                Généré par Sorell · Votre veille sectorielle par IA
              </p>
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
              {t("generate.sent_success").replace("{count}", String(successCount))}
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
                  {r.success ? t("generate.status_sent") : t("generate.status_failed")}
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
            {t("generate.generate_new")}
          </button>
        </div>
      )}
    </div>
  );
}
