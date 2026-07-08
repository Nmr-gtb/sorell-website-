"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { supabase } from "@/lib/supabase";
import { getNewsletterConfig, getProfile, getRecipients } from "@/lib/database";
import { canUseEditor } from "@/lib/plans";
import { authFetch } from "@/lib/api";
import CrownBadge from "@/components/CrownBadge";

type Article = {
  tag: string;
  title: string;
  hook?: string;
  content?: string;
  summary?: string;
  source: string;
  url?: string;
  featured: boolean;
  published_at?: string;
};

type KeyFigure = {
  value: string;
  label: string;
  context: string;
};

type SendResult = {
  email: string;
  success: boolean;
  id?: string;
  error?: string;
};

/** Garantit un seul article "à la une", placé en tête de liste. */
function normalizeArticles(list: Article[]): Article[] {
  if (!list.length) return list;
  const idx = list.findIndex((a) => a.featured);
  const f = idx === -1 ? 0 : idx;
  const featured = { ...list[f], featured: true };
  const others = list.filter((_, i) => i !== f).map((a) => ({ ...a, featured: false }));
  return [featured, ...others];
}

/** Objet d'email dérivé de l'article à la une (même règle que le moteur). */
function subjectFromFeatured(article: Article | undefined, fallback: string): string {
  if (!article) return fallback;
  let subject = article.tag ? `${article.tag} - ${article.title}` : article.title;
  if (subject.length > 65) subject = subject.substring(0, 62) + "...";
  return subject;
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 14,
        height: 14,
        border: "2px solid currentColor",
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
  );
}

function IconRefresh() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function IconArrowUp() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function IconArrowDown() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function IconPenLarge() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default function EditorPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [loadingPage, setLoadingPage] = useState(true);
  const [plan, setPlan] = useState("free");
  const [editMode, setEditMode] = useState<"auto" | "editor">("auto");
  const [recipientCount, setRecipientCount] = useState(0);

  const [newsletterId, setNewsletterId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [editorial, setEditorial] = useState("");
  const [keyFigures, setKeyFigures] = useState<KeyFigure[]>([]);

  const [brandColor, setBrandColor] = useState("#005058");
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [textColor, setTextColor] = useState("#111827");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [bodyTextColor, setBodyTextColor] = useState("#4B5563");

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [regenTarget, setRegenTarget] = useState<string | null>(null);
  const [regenError, setRegenError] = useState("");

  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftHook, setDraftHook] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftTag, setDraftTag] = useState("");
  const [draftEditorial, setDraftEditorial] = useState("");
  const [draftFigures, setDraftFigures] = useState<KeyFigure[]>([]);

  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState<SendResult[] | null>(null);
  const [sendError, setSendError] = useState("");

  const [hasOriginal, setHasOriginal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      try {
        const [profileResult, configResult, recipientsResult] = await Promise.all([
          getProfile(user!.id),
          getNewsletterConfig(user!.id),
          getRecipients(user!.id),
        ]);

        if (profileResult.data?.plan) setPlan(profileResult.data.plan);
        setRecipientCount(recipientsResult.data.length);

        const cfg = configResult.data;
        if (cfg) {
          if (cfg.edit_mode === "editor" || cfg.edit_mode === "auto") setEditMode(cfg.edit_mode);
          if (cfg.brand_color) setBrandColor(cfg.brand_color);
          if (cfg.custom_logo_url) setCustomLogo(cfg.custom_logo_url);
          if (cfg.text_color) setTextColor(cfg.text_color);
          if (cfg.bg_color) setBgColor(cfg.bg_color);
          if (cfg.body_text_color) setBodyTextColor(cfg.body_text_color);

          if (cfg.pending_draft_id) {
            const { data: nl } = await supabase
              .from("newsletters")
              .select("id, subject, content, status, original_content")
              .eq("id", cfg.pending_draft_id)
              .single();

            if (nl && nl.status === "draft") {
              const raw = typeof nl.content === "string" ? JSON.parse(nl.content) : nl.content;
              const content = Array.isArray(raw)
                ? { editorial: "", key_figures: [], articles: raw }
                : raw || { editorial: "", key_figures: [], articles: [] };
              setNewsletterId(nl.id);
              setSubject(nl.subject || "");
              setArticles(normalizeArticles(content.articles || []));
              setEditorial(content.editorial || "");
              setKeyFigures(content.key_figures || []);
              setHasOriginal(Boolean(nl.original_content));
            }
          }
        }
      } catch {
        // L'état vide couvre les erreurs de chargement : le brouillon reste introuvable.
      } finally {
        setLoadingPage(false);
      }
    }
    loadData();
  }, [user]);

  const isEligible = canUseEditor(plan);

  /* ─── Sauvegarde du brouillon ─── */
  const saveDraft = useCallback(
    async (nextArticles: Article[], nextEditorial: string, nextFigures: KeyFigure[], nextSubject: string) => {
      if (!newsletterId) return false;
      setSaveState("saving");
      try {
        const response = await authFetch("/api/newsletters/draft", {
          method: "POST",
          body: JSON.stringify({
            newsletterId,
            subject: nextSubject,
            content: {
              editorial: nextEditorial,
              key_figures: nextFigures,
              articles: nextArticles,
            },
          }),
        });
        if (!response.ok) {
          setSaveState("error");
          return false;
        }
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
        return true;
      } catch {
        setSaveState("error");
        return false;
      }
    },
    [newsletterId]
  );

  /* ─── Actions sur les articles ─── */
  function applyArticles(next: Article[], nextSubject?: string) {
    const normalized = normalizeArticles(next);
    // Les index changent : une édition inline en cours pointerait sur le mauvais bloc
    setEditingBlock((prev) => (prev?.startsWith("article-") ? null : prev));
    setArticles(normalized);
    const finalSubject = nextSubject ?? subject;
    if (nextSubject !== undefined) setSubject(nextSubject);
    saveDraft(normalized, editorial, keyFigures, finalSubject);
  }

  function moveArticle(index: number, direction: -1 | 1) {
    const target = index + direction;
    // Les articles secondaires vivent aux index 1..n (l'index 0 est l'article à la une)
    if (index < 1 || target < 1 || target >= articles.length) return;
    const next = [...articles];
    [next[index], next[target]] = [next[target], next[index]];
    applyArticles(next);
  }

  function makeFeatured(index: number) {
    if (index <= 0 || index >= articles.length) return;
    const next = articles.map((a, i) => ({ ...a, featured: i === index }));
    const promoted = next[index];
    applyArticles(next, subjectFromFeatured(promoted, subject));
  }

  function deleteArticle(index: number) {
    if (articles.length <= 1) return;
    const next = articles.filter((_, i) => i !== index);
    const normalized = normalizeArticles(next);
    // Si l'article à la une a été supprimé, l'objet suit le nouvel article à la une
    const nextSubject = index === 0 ? subjectFromFeatured(normalized[0], subject) : undefined;
    applyArticles(normalized, nextSubject);
  }

  /* ─── Régénération (article / édito / chiffres) ─── */
  async function regenerate(target: "article" | "editorial" | "key_figures", articleIndex?: number) {
    if (!newsletterId) return;
    const key = target === "article" ? `article-${articleIndex}` : target;
    setRegenTarget(key);
    setRegenError("");
    try {
      const response = await authFetch("/api/generate/article", {
        method: "POST",
        body: JSON.stringify({ newsletterId, target, articleIndex }),
      });
      const data = await response.json();
      if (!response.ok) {
        setRegenError(data.error || t("editor.regen_error"));
      } else {
        setArticles(normalizeArticles(data.articles || []));
        setEditorial(data.editorial || "");
        setKeyFigures(data.keyFigures || []);
        if (data.subject) setSubject(data.subject);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      }
    } catch {
      setRegenError(t("editor.regen_error"));
    } finally {
      setRegenTarget(null);
    }
  }

  /* ─── Édition inline ─── */
  function startEditArticle(index: number) {
    const a = articles[index];
    if (!a) return;
    setDraftTitle(a.title);
    setDraftHook(a.hook || "");
    setDraftContent(a.content || a.summary || "");
    setDraftTag(a.tag || "");
    setEditingBlock(`article-${index}`);
  }

  function saveEditArticle(index: number) {
    if (!draftTitle.trim()) return;
    const next = articles.map((a, i) =>
      i === index ? { ...a, title: draftTitle.trim(), hook: draftHook, content: draftContent, tag: draftTag } : a
    );
    const nextSubject = index === 0 ? subjectFromFeatured({ ...next[0] }, subject) : undefined;
    setEditingBlock(null);
    applyArticles(next, nextSubject);
  }

  function startEditEditorial() {
    setDraftEditorial(editorial);
    setEditingBlock("editorial");
  }

  function saveEditEditorial() {
    setEditorial(draftEditorial);
    setEditingBlock(null);
    saveDraft(articles, draftEditorial, keyFigures, subject);
  }

  function startEditFigures() {
    setDraftFigures(keyFigures.map((f) => ({ ...f })));
    setEditingBlock("figures");
  }

  function saveEditFigures() {
    const cleaned = draftFigures.filter((f) => f.value.trim());
    setKeyFigures(cleaned);
    setEditingBlock(null);
    saveDraft(articles, editorial, cleaned, subject);
  }

  /* ─── Réinitialisation : retour à la version générée d'origine ─── */
  async function handleReset() {
    if (!newsletterId) return;
    setResetting(true);
    setRegenError("");
    try {
      const response = await authFetch("/api/newsletters/draft", {
        method: "POST",
        body: JSON.stringify({ newsletterId, reset: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        setRegenError(data.error || t("editor.reset_error"));
      } else {
        const raw = data.newsletter?.content;
        const restored = Array.isArray(raw)
          ? { editorial: "", key_figures: [], articles: raw }
          : raw || { editorial: "", key_figures: [], articles: [] };
        setArticles(normalizeArticles(restored.articles || []));
        setEditorial(restored.editorial || "");
        setKeyFigures(restored.key_figures || []);
        if (data.newsletter?.subject) setSubject(data.newsletter.subject);
        setEditingBlock(null);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      }
    } catch {
      setRegenError(t("editor.reset_error"));
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  }

  /* ─── Envoi ─── */
  async function handleSend() {
    if (!user || !newsletterId) return;
    setSending(true);
    setSendError("");
    try {
      const response = await authFetch("/api/send", {
        method: "POST",
        body: JSON.stringify({ newsletterId, userId: user.id }),
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

  /* ─── Petits composants de la barre d'actions ─── */
  function ActionButton({
    onClick,
    disabled,
    label,
    icon,
    busy,
    danger,
  }: {
    onClick: () => void;
    disabled?: boolean;
    label: string;
    icon: React.ReactNode;
    busy?: boolean;
    danger?: boolean;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || busy}
        title={label}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 10px",
          borderRadius: 6,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: danger ? "#EF4444" : "var(--text-secondary)",
          fontSize: 12,
          fontWeight: 500,
          cursor: disabled || busy ? "not-allowed" : "pointer",
          opacity: disabled ? 0.45 : 1,
          transition: "all 0.15s ease",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          if (disabled || busy) return;
          (e.currentTarget as HTMLButtonElement).style.borderColor = danger ? "#EF4444" : "var(--accent)";
          (e.currentTarget as HTMLButtonElement).style.color = danger ? "#EF4444" : "var(--accent)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLButtonElement).style.color = danger ? "#EF4444" : "var(--text-secondary)";
        }}
      >
        {busy ? <Spinner /> : icon}
        {label}
      </button>
    );
  }

  function inlineInputStyle(): React.CSSProperties {
    return {
      width: "100%",
      fontSize: 14,
      color: "var(--text)",
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 6,
      padding: "7px 10px",
      outline: "none",
      boxSizing: "border-box",
      fontFamily: "inherit",
    };
  }

  function EditFormButtons({ onSave, onCancel, saveDisabled }: { onSave: () => void; onCancel: () => void; saveDisabled?: boolean }) {
    return (
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button
          type="button"
          className="btn-primary"
          onClick={onSave}
          disabled={saveDisabled}
          style={{ fontSize: 13, padding: "7px 16px", opacity: saveDisabled ? 0.5 : 1 }}
        >
          {t("editor.save")}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={onCancel}
          style={{ fontSize: 13, padding: "7px 14px" }}
        >
          {t("editor.cancel")}
        </button>
      </div>
    );
  }

  /* ═══════════ RENDU ═══════════ */

  const featuredArticle = articles[0];
  const otherArticles = articles.slice(1);
  const successCount = sendResults?.filter((r) => r.success).length ?? 0;
  const hasDraft = Boolean(newsletterId && articles.length > 0);

  return (
    <div style={{ padding: "32px", maxWidth: 760 }} className="editor-page-container">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .editor-page-container { padding: 20px 16px !important; }
          .editor-actions-bar { flex-direction: column !important; align-items: stretch !important; }
          .editor-actions-bar > div:first-child { min-width: 0 !important; }
          .editor-send-button { width: 100% !important; justify-content: center !important; }
          .editor-block-toolbar { flex-wrap: wrap !important; }
          .editor-email-header { padding: 16px 20px !important; }
          .editor-email-content { padding: 20px 16px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
          {t("editor.title")}
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {t("editor.subtitle")}
        </p>
      </div>

      {loadingPage ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>{t("common.loading")}</p>
        </div>
      ) : !isEligible ? (
        /* ─── Plan non éligible : upsell ─── */
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 48,
          textAlign: "center",
        }}>
          <div style={{ marginBottom: 16, color: "var(--text-muted)", display: "flex", justifyContent: "center" }}>
            <IconPenLarge />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
            <CrownBadge tooltip={t("editor.not_available_title")} />
            <span style={{ fontSize: 18, fontWeight: 600, color: "var(--text)" }}>
              {t("editor.not_available_title")}
            </span>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 460, margin: "0 auto 24px", lineHeight: 1.6 }}>
            {t("editor.not_available_desc")}
          </p>
          <Link
            href="/tarifs"
            style={{
              display: "inline-block",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              padding: "10px 20px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            {t("dash.upgrade_btn")}
          </Link>
        </div>
      ) : sendResults ? (
        /* ─── Résultats d'envoi ─── */
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
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
                <span style={{ fontSize: 13, fontWeight: 500, color: r.success ? "#16A34A" : "#EF4444" }}>
                  {r.success ? t("generate.status_sent") : t("generate.status_failed")}
                </span>
              </div>
            ))}
          </div>
          <Link href="/dashboard" style={{ fontSize: 14, fontWeight: 500, color: "var(--accent)", textDecoration: "none" }}>
            {t("editor.back_to_dashboard")} →
          </Link>
        </div>
      ) : !hasDraft ? (
        /* ─── Aucun brouillon en attente ─── */
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 48,
          textAlign: "center",
        }}>
          <div style={{ marginBottom: 16, color: "var(--text-muted)", display: "flex", justifyContent: "center" }}>
            <IconPenLarge />
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
            {t("editor.empty_title")}
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 460, margin: "0 auto 24px", lineHeight: 1.6 }}>
            {editMode === "editor" ? t("editor.empty_desc_editor") : t("editor.empty_desc_auto")}
          </p>
          <Link
            href="/dashboard/config"
            style={{
              display: "inline-block",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              padding: "10px 20px",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            {t("editor.go_config")}
          </Link>
        </div>
      ) : (
        /* ─── Éditeur du brouillon ─── */
        <>
          {/* Objet + envoi */}
          <div
            className="editor-actions-bar"
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
                onBlur={() => saveDraft(articles, editorial, keyFigures, subject)}
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
              <button
                className="btn-primary editor-send-button"
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
              <span style={{ fontSize: 12, color: saveState === "error" ? "#EF4444" : "var(--text-muted)", minHeight: 16 }}>
                {saveState === "saving"
                  ? t("editor.saving")
                  : saveState === "saved"
                  ? t("editor.saved")
                  : saveState === "error"
                  ? t("editor.save_error")
                  : t("editor.autosave_note")}
              </span>
            </div>
          </div>

          {/* Réinitialiser : retour à la version générée d'origine */}
          {hasOriginal && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 10,
              marginBottom: 16,
              minHeight: 30,
              flexWrap: "wrap",
            }}>
              {confirmReset ? (
                <>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {t("editor.reset_confirm")}
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={resetting}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 14px",
                      borderRadius: 6,
                      border: "1px solid #EF4444",
                      background: "rgba(239,68,68,0.06)",
                      color: "#EF4444",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: resetting ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {resetting ? <Spinner /> : null}
                    {resetting ? t("editor.resetting") : t("editor.reset_yes")}
                  </button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setConfirmReset(false)}
                    disabled={resetting}
                    style={{ fontSize: 13, padding: "6px 12px" }}
                  >
                    {t("editor.cancel")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  disabled={resetting || sending || regenTarget !== null}
                  title={t("editor.reset_tooltip")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    background: "transparent",
                    color: "var(--text-muted)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--accent)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                  }}
                >
                  <IconRefresh />
                  {t("editor.reset")}
                </button>
              )}
            </div>
          )}

          {sendError && (
            <p style={{ fontSize: 14, color: "#EF4444", marginBottom: 16 }}>{sendError}</p>
          )}
          {regenError && (
            <p style={{ fontSize: 14, color: "#EF4444", marginBottom: 16 }}>{regenError}</p>
          )}

          {/* Aperçu email éditable */}
          <div style={{ background: bgColor, border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", maxWidth: 620, margin: "0 auto" }}>

            {/* Header */}
            <div className="editor-email-header" style={{ padding: "20px 32px", borderBottom: "1px solid #E8E0D8" }}>
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
            <div style={{ background: brandColor, padding: "36px 32px 32px" }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px", fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                {t("generate.week_of")} {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {subject}
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: "#FFFFFF", margin: 0, lineHeight: 1.3, fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "-0.01em" }}>
                Ce qui change dans votre secteur cette semaine
              </h1>
            </div>

            {/* Article à la une */}
            {featuredArticle && (
              <div className="editor-email-content" style={{ padding: "28px 32px 24px" }}>
                <div className="editor-block-toolbar" style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginBottom: 12 }}>
                  <ActionButton
                    onClick={() => regenerate("article", 0)}
                    busy={regenTarget === "article-0"}
                    disabled={regenTarget !== null && regenTarget !== "article-0"}
                    label={t("editor.regenerate")}
                    icon={<IconRefresh />}
                  />
                  <ActionButton onClick={() => startEditArticle(0)} label={t("editor.edit")} icon={<IconEdit />} />
                  <ActionButton
                    onClick={() => deleteArticle(0)}
                    disabled={articles.length <= 1}
                    label={t("editor.delete")}
                    icon={<IconTrash />}
                    danger
                  />
                </div>
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
                  {featuredArticle.tag && editingBlock !== "article-0" && (
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
                {editingBlock === "article-0" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input value={draftTag} onChange={(e) => setDraftTag(e.target.value)} placeholder={t("editor.field_tag")} style={inlineInputStyle()} />
                    <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder={t("editor.field_title")} style={inlineInputStyle()} />
                    <input value={draftHook} onChange={(e) => setDraftHook(e.target.value)} placeholder={t("editor.field_hook")} style={inlineInputStyle()} />
                    <textarea value={draftContent} onChange={(e) => setDraftContent(e.target.value)} placeholder={t("editor.field_content")} rows={4} style={{ ...inlineInputStyle(), resize: "vertical" }} />
                    <EditFormButtons onSave={() => saveEditArticle(0)} onCancel={() => setEditingBlock(null)} saveDisabled={!draftTitle.trim()} />
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}
            <div style={{ padding: "0 32px" }}><div style={{ borderTop: "1px solid #E8E0D8" }}></div></div>

            {/* Éditorial */}
            <div style={{ padding: "20px 32px 24px" }}>
              <div className="editor-block-toolbar" style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginBottom: 12 }}>
                <ActionButton
                  onClick={() => regenerate("editorial")}
                  busy={regenTarget === "editorial"}
                  disabled={regenTarget !== null && regenTarget !== "editorial"}
                  label={t("editor.regenerate")}
                  icon={<IconRefresh />}
                />
                <ActionButton onClick={startEditEditorial} label={t("editor.edit")} icon={<IconEdit />} />
              </div>
              <div style={{ borderLeft: `3px solid ${brandColor}`, padding: "18px 22px", background: "#F5F0EB", borderRadius: "0 8px 8px 0" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px", fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
                  Le point de vue
                </p>
                {editingBlock === "editorial" ? (
                  <div>
                    <textarea
                      value={draftEditorial}
                      onChange={(e) => setDraftEditorial(e.target.value)}
                      rows={4}
                      style={{ ...inlineInputStyle(), resize: "vertical", background: "#FFFFFF" }}
                    />
                    <EditFormButtons onSave={saveEditEditorial} onCancel={() => setEditingBlock(null)} />
                  </div>
                ) : (
                  <p style={{ fontSize: 15, color: bodyTextColor, lineHeight: 1.7, margin: 0, fontStyle: "italic", fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    {editorial || t("editor.empty_editorial")}
                  </p>
                )}
              </div>
            </div>
            <div style={{ padding: "0 32px" }}><div style={{ borderTop: "1px solid #E8E0D8" }}></div></div>

            {/* Chiffres clés */}
            <div style={{ padding: "24px 32px" }}>
              <div className="editor-block-toolbar" style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginBottom: 12 }}>
                <ActionButton
                  onClick={() => regenerate("key_figures")}
                  busy={regenTarget === "key_figures"}
                  disabled={regenTarget !== null && regenTarget !== "key_figures"}
                  label={t("editor.regenerate")}
                  icon={<IconRefresh />}
                />
                <ActionButton onClick={startEditFigures} label={t("editor.edit")} icon={<IconEdit />} />
              </div>
              <p style={{ fontSize: 11, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px", fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
                Chiffres cl&eacute;s
              </p>
              {editingBlock === "figures" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {draftFigures.length === 0 && (
                    <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>{t("editor.empty_figures")}</p>
                  )}
                  {draftFigures.map((fig, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <input
                        value={fig.value}
                        onChange={(e) => setDraftFigures((prev) => prev.map((f, j) => (j === i ? { ...f, value: e.target.value } : f)))}
                        placeholder={t("editor.field_value")}
                        style={{ ...inlineInputStyle(), flex: "1 1 90px", width: "auto" }}
                      />
                      <input
                        value={fig.label}
                        onChange={(e) => setDraftFigures((prev) => prev.map((f, j) => (j === i ? { ...f, label: e.target.value } : f)))}
                        placeholder={t("editor.field_label")}
                        style={{ ...inlineInputStyle(), flex: "2 1 140px", width: "auto" }}
                      />
                      <input
                        value={fig.context}
                        onChange={(e) => setDraftFigures((prev) => prev.map((f, j) => (j === i ? { ...f, context: e.target.value } : f)))}
                        placeholder={t("editor.field_context")}
                        style={{ ...inlineInputStyle(), flex: "1 1 110px", width: "auto" }}
                      />
                    </div>
                  ))}
                  <EditFormButtons onSave={saveEditFigures} onCancel={() => setEditingBlock(null)} />
                </div>
              ) : keyFigures.length > 0 ? (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {keyFigures.map((fig, i) => (
                    <div key={i} style={{ flex: 1, minWidth: 120, background: "#F5F0EB", border: "1px solid #E8E0D8", borderRadius: 8, padding: 16, textAlign: "center" }}>
                      <p style={{ fontSize: 26, fontWeight: 700, color: brandColor, margin: "0 0 6px", fontFamily: "Georgia, 'Times New Roman', serif" }}>{fig.value}</p>
                      <p style={{ fontSize: 12, color: textColor, fontWeight: 600, margin: "0 0 3px", fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>{fig.label}</p>
                      <p style={{ fontSize: 11, color: "#7A7267", margin: 0, fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>{fig.context}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>{t("editor.empty_figures")}</p>
              )}
            </div>
            <div style={{ padding: "0 32px" }}><div style={{ borderTop: "1px solid #E8E0D8" }}></div></div>

            {/* Articles secondaires */}
            {otherArticles.length > 0 && (
              <div style={{ padding: "24px 32px 8px" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: brandColor, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 18px", fontFamily: "'Segoe UI', Roboto, Arial, sans-serif" }}>
                  A lire aussi
                </p>

                {otherArticles.map((article, i) => {
                  const index = i + 1; // index réel dans le tableau articles (0 = à la une)
                  const blockKey = `article-${index}`;
                  return (
                    <div key={`${article.url || article.title}-${index}`} style={{ border: "1px solid #E8E0D8", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
                      <div style={{ padding: 22, background: bgColor }}>
                        <div className="editor-block-toolbar" style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginBottom: 12 }}>
                          <ActionButton
                            onClick={() => regenerate("article", index)}
                            busy={regenTarget === blockKey}
                            disabled={regenTarget !== null && regenTarget !== blockKey}
                            label={t("editor.regenerate")}
                            icon={<IconRefresh />}
                          />
                          <ActionButton onClick={() => startEditArticle(index)} label={t("editor.edit")} icon={<IconEdit />} />
                          <ActionButton onClick={() => makeFeatured(index)} label={t("editor.make_featured")} icon={<IconStar />} />
                          <ActionButton onClick={() => moveArticle(index, -1)} disabled={index <= 1} label={t("editor.move_up")} icon={<IconArrowUp />} />
                          <ActionButton onClick={() => moveArticle(index, 1)} disabled={index >= articles.length - 1} label={t("editor.move_down")} icon={<IconArrowDown />} />
                          <ActionButton onClick={() => deleteArticle(index)} disabled={articles.length <= 1} label={t("editor.delete")} icon={<IconTrash />} danger />
                        </div>
                        {editingBlock === blockKey ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <input value={draftTag} onChange={(e) => setDraftTag(e.target.value)} placeholder={t("editor.field_tag")} style={inlineInputStyle()} />
                            <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder={t("editor.field_title")} style={inlineInputStyle()} />
                            <input value={draftHook} onChange={(e) => setDraftHook(e.target.value)} placeholder={t("editor.field_hook")} style={inlineInputStyle()} />
                            <textarea value={draftContent} onChange={(e) => setDraftContent(e.target.value)} placeholder={t("editor.field_content")} rows={4} style={{ ...inlineInputStyle(), resize: "vertical" }} />
                            <EditFormButtons onSave={() => saveEditArticle(index)} onCancel={() => setEditingBlock(null)} saveDisabled={!draftTitle.trim()} />
                          </div>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
    </div>
  );
}
