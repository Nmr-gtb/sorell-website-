"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/database";
import { getPlanLimits } from "@/lib/plans";
import { useLanguage } from "@/lib/LanguageContext";
import Skeleton from "@/components/Skeleton";

// La liste ne charge JAMAIS le contenu des newsletters (plusieurs Ko par
// entrée) : colonnes minimales + limite, le contenu est chargé au clic.
interface NewsletterListItem {
  id: string;
  generated_at: string;
  sent_at: string | null;
  subject: string;
  status: string;
}

interface NewsletterDetail extends NewsletterListItem {
  content: string | null;
}

type HistoryFilter = "all" | "sent" | "draft";

const LIST_LIMIT = 50;

// Date de référence d'une newsletter : la date d'ENVOI quand elle est partie
// (cohérent avec Analytics), la date de génération pour un brouillon.
function displayDate(nl: NewsletterListItem): string {
  return (nl.status === "sent" && nl.sent_at) || nl.generated_at
    ? (nl.status === "sent" && nl.sent_at ? nl.sent_at : nl.generated_at)
    : nl.generated_at;
}

export default function HistoriquePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();
  const dateLocale = lang === "en" ? "en-US" : "fr-FR";
  const [newsletters, setNewsletters] = useState<NewsletterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [realPlan, setRealPlan] = useState<string>("free");
  const [selectedNewsletter, setSelectedNewsletter] = useState<NewsletterDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  // Une erreur de chargement ne doit JAMAIS s'afficher comme un historique
  // vide (règle maison : distinguer error et empty).
  const [listError, setListError] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  const plan = realPlan;
  const limits = getPlanLimits(plan);

  const openDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(false);
    const { data, error } = await supabase
      .from("newsletters")
      .select("id, generated_at, sent_at, subject, status, content")
      .eq("id", id)
      .maybeSingle();
    if (error || !data) {
      // Lien obsolète, newsletter supprimée ou échec réseau : message clair
      // au lieu d'un retour muet à la liste, et on nettoie ?id= de l'URL.
      setDetailError(true);
      router.replace("/dashboard/historique");
    } else {
      setSelectedNewsletter(data as NewsletterDetail);
    }
    setDetailLoading(false);
  }, [router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setListError(false);
    Promise.all([
      getProfile(user.id),
      supabase
        .from("newsletters")
        .select("id, generated_at, sent_at, subject, status")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })
        .limit(LIST_LIMIT),
    ]).then(([profileResult, listResult]) => {
      if (profileResult.data?.plan) setRealPlan(profileResult.data.plan);
      setPlanLoaded(true);
      if (listResult.error) {
        setListError(true);
      } else {
        setNewsletters((listResult.data as NewsletterListItem[]) || []);
      }
      setLoading(false);
    });
  }, [user, retryTick]);

  // Lien profond depuis le dashboard : /dashboard/historique?id=xxx ouvre
  // directement le détail de la newsletter.
  const deepLinkId = searchParams.get("id");
  useEffect(() => {
    if (deepLinkId && user) {
      openDetail(deepLinkId);
    }
  }, [deepLinkId, user, openDetail]);

  // Gate plan
  if (!planLoaded) {
    return (
      <div style={{ padding: 32, maxWidth: 800 }} className="historique-page-container">
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{t("history.title")}</h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>{t("history.subtitle")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={68} radius={10} />
          ))}
        </div>
      </div>
    );
  }

  if (!limits.historique) {
    return (
      <div style={{ padding: 32, maxWidth: 800 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 24 }}>{t("history.title")}</h1>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 48,
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 10 }}>
            {t("history.locked_title")}
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 420, margin: "0 auto 24px" }}>
            {t("history.locked_desc")}
          </p>
          <button
            onClick={() => router.push("/tarifs")}
            style={{
              display: "inline-block",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            {t("dash.see_plans")} →
          </button>
        </div>
      </div>
    );
  }

  // Vue détail d'une newsletter (contenu chargé à la demande)
  if (detailLoading) {
    return (
      <div style={{ padding: 32, maxWidth: 800 }} className="historique-page-container">
        <Skeleton width={120} height={14} style={{ marginBottom: 24 }} />
        <Skeleton width="75%" height={24} style={{ marginBottom: 10 }} />
        <Skeleton width={200} height={13} style={{ marginBottom: 24 }} />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={110} radius={10} style={{ marginBottom: 16 }} />
        ))}
      </div>
    );
  }

  if (selectedNewsletter) {
    interface NewsletterArticle {
      tag?: string;
      title?: string;
      hook?: string;
      content?: string;
      summary?: string;
      source?: string;
    }
    interface KeyFigure {
      value?: string;
      label?: string;
      context?: string;
    }
    interface ParsedNewsletter {
      editorial?: string;
      featuredArticle?: {
        title?: string;
        hook?: string;
        content?: string;
        summary?: string;
        source?: string;
      };
      articles?: NewsletterArticle[];
      keyFigures?: KeyFigure[];
    }
    let parsedContent: ParsedNewsletter | null = null;
    try {
      parsedContent = typeof selectedNewsletter.content === "string"
        ? JSON.parse(selectedNewsletter.content)
        : (selectedNewsletter.content as ParsedNewsletter | null);
    } catch {
      // ignore
    }

    return (
      <div style={{ padding: 32, maxWidth: 800 }} className="historique-page-container">
        <button
          onClick={() => {
            setSelectedNewsletter(null);
            if (deepLinkId) router.replace("/dashboard/historique");
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent)",
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 24,
            padding: 0,
          }}
        >
          {t("history.back")}
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
          {selectedNewsletter.subject || "Newsletter"}
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
          {new Date(displayDate(selectedNewsletter)).toLocaleDateString(dateLocale, {
            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
          })}
        </p>

        {parsedContent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Éditorial */}
            {parsedContent.editorial && (
              <div style={{
                padding: 16,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                borderLeft: "3px solid var(--accent)",
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>{t("history.editorial")}</p>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>{parsedContent.editorial}</p>
              </div>
            )}

            {/* Article phare */}
            {parsedContent.featuredArticle && (
              <div style={{
                padding: 16,
                background: "#1F2937",
                borderRadius: 10,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "white", background: "var(--accent)", padding: "3px 8px", borderRadius: 4, textTransform: "uppercase" }}>{t("history.featured")}</span>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: "white", margin: "10px 0 6px" }}>{parsedContent.featuredArticle.title}</h2>
                {parsedContent.featuredArticle.hook && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontStyle: "italic", margin: "0 0 8px" }}>{parsedContent.featuredArticle.hook}</p>}
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: "0 0 8px" }}>{parsedContent.featuredArticle.content || parsedContent.featuredArticle.summary}</p>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{t("common.source")} : {parsedContent.featuredArticle.source}</span>
              </div>
            )}

            {/* Autres articles */}
            {parsedContent.articles?.map((article: NewsletterArticle, i: number) => (
              <div key={i} style={{
                padding: 16,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
              }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{article.tag}</span>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "6px 0" }}>{article.title}</h3>
                {article.hook && <p style={{ fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic", margin: "0 0 6px" }}>{article.hook}</p>}
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 8px" }}>{article.content || article.summary}</p>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{t("common.source")} : {article.source}</span>
              </div>
            ))}

            {/* Chiffres clés */}
            {(parsedContent.keyFigures?.length ?? 0) > 0 && (
              <div className="historique-keyfigures" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {parsedContent.keyFigures!.map((fig: KeyFigure, i: number) => (
                  <div key={i} style={{
                    flex: 1,
                    padding: 12,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{fig.value}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{fig.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{fig.context}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>{t("history.unavailable")}</p>
        )}
      </div>
    );
  }

  // Vue liste : filtres + regroupement par mois. Le tri ET le regroupement se
  // font sur la date AFFICHÉE (envoi pour les envoyées, génération pour les
  // brouillons) — sinon un brouillon validé le mois suivant éclaterait le même
  // mois en deux groupes.
  const filtered = newsletters
    .filter((nl) =>
      filter === "all" ? true : filter === "sent" ? nl.status === "sent" : nl.status !== "sent"
    )
    .slice()
    .sort((a, b) => new Date(displayDate(b)).getTime() - new Date(displayDate(a)).getTime());

  const groupMap = new Map<string, { label: string; items: NewsletterListItem[] }>();
  for (const nl of filtered) {
    const date = new Date(displayDate(nl));
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const existing = groupMap.get(key);
    if (existing) {
      existing.items.push(nl);
    } else {
      const rawLabel = date.toLocaleDateString(dateLocale, { month: "long", year: "numeric" });
      groupMap.set(key, { label: rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1), items: [nl] });
    }
  }
  const groups = [...groupMap.entries()].map(([key, group]) => ({ key, ...group }));

  const filterOptions: Array<{ value: HistoryFilter; label: string }> = [
    { value: "all", label: t("history.filter_all") },
    { value: "sent", label: t("history.filter_sent") },
    { value: "draft", label: t("history.filter_drafts") },
  ];

  return (
    <div style={{ padding: 32, maxWidth: 800 }} className="historique-page-container">
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{t("history.title")}</h1>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 20 }}>{t("history.subtitle")}</p>

      {!loading && newsletters.length > 0 && (
        <div
          role="group"
          aria-label={t("history.filter_label")}
          style={{
            display: "inline-flex",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 3,
            gap: 2,
            marginBottom: 24,
          }}
        >
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: filter === option.value ? 600 : 500,
                cursor: "pointer",
                background: filter === option.value ? "var(--accent)" : "transparent",
                color: filter === option.value ? "#fff" : "var(--text-secondary)",
                transition: "background 0.2s ease, color 0.2s ease",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {detailError && (
        <div style={{
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 16,
          fontSize: 13,
          color: "var(--text)",
        }}>
          {t("history.detail_error")}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} height={68} radius={10} />
          ))}
        </div>
      ) : listError ? (
        <div style={{
          padding: 32,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>{t("history.load_error")}</p>
          <button
            onClick={() => setRetryTick((tick) => tick + 1)}
            style={{
              display: "inline-block",
              padding: "8px 20px",
              background: "var(--accent)",
              color: "white",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            {t("history.retry")}
          </button>
        </div>
      ) : newsletters.length === 0 ? (
        <div style={{
          padding: 32,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{t("history.empty_title")}</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>{t("history.empty_desc")}</p>
          <a href="/dashboard/generate" style={{
            display: "inline-block",
            padding: "8px 20px",
            background: "var(--accent)",
            color: "white",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}>{t("history.generate_first")}</a>
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{t("history.filter_empty")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {groups.map((group) => (
            <div key={group.key}>
              <h2 style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                margin: "0 0 10px",
              }}>
                {group.label}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {group.items.map((nl) => (
                  <button
                    key={nl.id}
                    onClick={() => openDetail(nl.id)}
                    style={{
                      padding: "16px 20px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      transition: "border-color 0.2s ease, background 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                      (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)";
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {nl.subject || "Newsletter"}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                        {new Date(displayDate(nl)).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <span style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: nl.status === "sent" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                      color: nl.status === "sent" ? "#059669" : "#D97706",
                      fontWeight: 500,
                      flexShrink: 0,
                    }}>
                      {nl.status === "sent" ? t("history.sent") : t("history.draft")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .historique-page-container {
            padding: 20px 16px !important;
          }
          .historique-keyfigures {
            flex-direction: column !important;
          }
          .historique-keyfigures > div {
            flex: 1 1 auto !important;
          }
        }
      `}</style>
    </div>
  );
}
