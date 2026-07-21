"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getProfile } from "@/lib/database";
import { getPlanLimits } from "@/lib/plans";
import CrownBadge from "@/components/CrownBadge";
import { authFetch } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";
import Skeleton from "@/components/Skeleton";

type AnalyticsData = {
  openRate: number | null;
  clickRate: number | null;
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  activeRecipients: number;
  newsletters: Array<{
    id: string;
    date: string | null;
    subject: string | null;
    recipients: number | null;
    openRate: number | null;
    clickRate: number | null;
  }>;
  topArticles: Array<{ title: string; clicks: number }>;
  trend: Array<{ date: string | null; value: number }>;
};

type Period = "30" | "90" | "all";

// Un taux inconnu (dénominateur historique absent) s'affiche « — », jamais un
// pourcentage inventé.
function formatRate(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function IconChart() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function formatDateLocale(dateStr: string, lang: string) {
  const date = new Date(dateStr);
  const locale = lang === "en" ? "en-US" : "fr-FR";
  return date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState<Period>("all");
  const [retryTick, setRetryTick] = useState(0);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [realPlan, setRealPlan] = useState<string>("free");

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((profileResult) => {
      setRealPlan(profileResult.data?.plan || "free");
      setPlanLoaded(true);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setLoading(true);
    setError(false);

    authFetch(`/api/analytics?userId=${user.id}&period=${period}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("analytics fetch failed");
        const json = await res.json();
        if (json?.error) throw new Error("analytics returned error");
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user, period, retryTick]);

  const plan = realPlan;
  const limits = getPlanLimits(plan);

  if (!planLoaded) {
    return (
      <div style={{ padding: 32, maxWidth: 900 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Analytics
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (limits.analytics === "none") {
    const fakeMetrics = [
      { label: t("analytics.open_rate"), value: "68%", color: "var(--success)" },
      { label: t("analytics.click_rate"), value: "24%", color: "var(--text)" },
      { label: t("analytics.sent"), value: "47", color: "var(--text)" },
      { label: t("analytics.recipients"), value: "12", color: "var(--text)" },
    ];
    const fakeWeekly = [52, 68, 45, 72, 61, 78, 55];
    const fakeArticles = [
      { title: "IA generative : les 5 tendances a suivre en 2026", clicks: 34 },
      { title: "PME et transformation digitale : ou en est-on ?", clicks: 28 },
      { title: "Les outils de veille sectorielle les plus utilises", clicks: 21 },
      { title: "Comment automatiser sa newsletter d'entreprise", clicks: 17 },
      { title: "Le marche du SaaS B2B en France : etat des lieux", clicks: 14 },
    ];
    const fakeNewsletters = [
      { id: "1", date: "2026-03-28", subject: "Veille Tech & IA - Semaine 13", recipients: 12, openRate: 72, clickRate: 28 },
      { id: "2", date: "2026-03-21", subject: "Veille Tech & IA - Semaine 12", recipients: 11, openRate: 65, clickRate: 22 },
      { id: "3", date: "2026-03-14", subject: "Veille Tech & IA - Semaine 11", recipients: 10, openRate: 70, clickRate: 25 },
    ];
    const fakeMaxClicks = 34;

    return (
      <div style={{ padding: 32, maxWidth: 900, position: "relative" }}>
        {/* Page header - NOT blurred */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Analytics
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {t("analytics.subtitle")}
          </p>
        </div>

        {/* Blurred content */}
        <div style={{ position: "relative" }}>
          <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none" }}>
            {/* Metric cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }} className="analytics-metrics-grid">
              {fakeMetrics.map((m) => (
                <div key={m.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.color, letterSpacing: "-0.02em", marginBottom: 6 }}>{m.value}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 24 }}>
                {t("analytics.open_evolution")}
              </h2>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
                {fakeWeekly.map((v, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{v}%</span>
                    <div style={{ width: "100%", height: `${(v / 78) * 80}px`, background: "var(--accent)", borderRadius: "4px 4px 0 0", opacity: 0.85, minHeight: 8 }} />
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>S{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top articles */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
                {t("analytics.top_articles")}
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {fakeArticles.map((article, i) => (
                  <div key={article.title} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 20, fontSize: 13, fontWeight: 600, color: "var(--text-muted)", flexShrink: 0, textAlign: "right" }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: "var(--text)", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{article.title}</div>
                      <div style={{ height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(article.clicks / fakeMaxClicks) * 100}%`, background: "var(--accent)", borderRadius: 2, opacity: 0.7 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", flexShrink: 0, width: 52, textAlign: "right" }}>{article.clicks} {t("analytics.clicks")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last sends table */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, overflowX: "auto" }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
                {t("analytics.last_sends")}
              </h2>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr>
                    {[t("analytics.col_date"), t("analytics.col_subject"), t("analytics.col_recipients"), t("analytics.col_open_rate"), t("analytics.col_click_rate")].map((col) => (
                      <th key={col} style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fakeNewsletters.map((row, i) => (
                    <tr key={row.id}>
                      <td style={{ padding: "12px", color: "var(--text-secondary)", borderBottom: i < fakeNewsletters.length - 1 ? "1px solid var(--border)" : "none", whiteSpace: "nowrap" }}>{formatDateLocale(row.date, lang)}</td>
                      <td style={{ padding: "12px", color: "var(--text)", fontWeight: 500, borderBottom: i < fakeNewsletters.length - 1 ? "1px solid var(--border)" : "none" }}>{row.subject}</td>
                      <td style={{ padding: "12px", color: "var(--text-secondary)", borderBottom: i < fakeNewsletters.length - 1 ? "1px solid var(--border)" : "none", textAlign: "center" }}>{row.recipients}</td>
                      <td style={{ padding: "12px", color: "var(--success)", fontWeight: 600, borderBottom: i < fakeNewsletters.length - 1 ? "1px solid var(--border)" : "none", textAlign: "center" }}>{row.openRate}%</td>
                      <td style={{ padding: "12px", color: "var(--text-secondary)", borderBottom: i < fakeNewsletters.length - 1 ? "1px solid var(--border)" : "none", textAlign: "center" }}>{row.clickRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upgrade overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            background: "rgba(var(--surface-rgb, 255,255,255), 0.3)",
            borderRadius: 12,
          }}>
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              padding: "36px 40px",
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              maxWidth: 420,
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "linear-gradient(135deg, #FEF3C7, #FDE68A)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#D97706" stroke="#D97706" strokeWidth="1.5">
                  <path d="M2 20h20L19 9l-5 4-2-6-2 6-5-4z" />
                </svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>
                {t("analytics.locked_title")}
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>
                {t("analytics.locked_desc")}
              </p>
              <button
                onClick={() => router.push("/tarifs")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 600,
                  padding: "12px 28px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  transition: "opacity 0.15s ease",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              >
                {t("dash.see_plans")} →
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .analytics-page-container {
              padding: 20px 16px !important;
            }
          }
          @media (max-width: 700px) {
            .analytics-metrics-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 420px) {
            .analytics-metrics-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    );
  }

  // Skeleton pleine page UNIQUEMENT au premier chargement : lors d'un
  // changement de période, la page (et le sélecteur qu'on vient de cliquer)
  // reste montée, le contenu s'estompe le temps du refetch.
  if (loading && !data) {
    return (
      <div style={{ padding: 32, maxWidth: 900 }} className="analytics-page-container">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Analytics
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("analytics.subtitle")}</p>
        </div>
        {/* Skeleton qui reproduit le layout réel : 4 cartes, un graphe, un tableau */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }} className="analytics-metrics-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
              <Skeleton width={64} height={26} style={{ marginBottom: 10 }} />
              <Skeleton width="80%" height={13} />
            </div>
          ))}
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <Skeleton width={220} height={13} style={{ marginBottom: 24 }} />
          <Skeleton height={120} radius={8} />
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 24 }}>
          <Skeleton width={140} height={13} style={{ marginBottom: 16 }} />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={40} style={{ marginBottom: i < 2 ? 10 : 0 }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, maxWidth: 900 }} className="analytics-page-container">
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Analytics
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("analytics.subtitle")}</p>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 48, textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
            {t("analytics.load_error")}
          </p>
          <button
            onClick={() => setRetryTick((tick) => tick + 1)}
            style={{
              marginTop: 8,
              background: "var(--accent)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            {t("analytics.retry")}
          </button>
        </div>
      </div>
    );
  }

  // L'empty state global ne vaut que pour « aucun envoi, jamais » : sur une
  // période filtrée sans envoi, on garde la page (sélecteur visible) avec les
  // sous-états vides de chaque bloc.
  const isEmpty = !data || (data.totalSent === 0 && period === "all");

  if (isEmpty) {
    return (
      <div style={{ padding: 32, maxWidth: 900 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Analytics
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("analytics.subtitle")}</p>
        </div>
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
            <IconChart />
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
            {t("analytics.no_data")}
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
            {t("analytics.no_data_desc")}
          </p>
          <Link
            href="/dashboard/generate"
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
            {t("analytics.generate")}
          </Link>
        </div>
      </div>
    );
  }

  const maxBar = data.trend.length > 0 ? Math.max(...data.trend.map((d) => d.value), 1) : 1;
  const maxClicks = data.topArticles.length > 0 ? Math.max(...data.topArticles.map((a) => a.clicks), 1) : 1;
  const refreshing = loading && data !== null;

  const periodOptions: Array<{ value: Period; label: string }> = [
    { value: "30", label: t("analytics.period_30") },
    { value: "90", label: t("analytics.period_90") },
    { value: "all", label: t("analytics.period_all") },
  ];
  const scopeLabel =
    period === "30"
      ? t("analytics.scope_30")
      : period === "90"
      ? t("analytics.scope_90")
      : t("analytics.scope_all");

  return (
    <div style={{ padding: 32, maxWidth: 900 }} className="analytics-page-container">
      {/* Page header + sélecteur de période */}
      <div style={{ marginBottom: 32, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--text)",
              letterSpacing: "-0.02em",
              marginBottom: 6,
            }}
          >
            Analytics
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {t("analytics.subtitle")}
          </p>
        </div>
        <div
          role="group"
          aria-label={t("analytics.period_label")}
          style={{
            display: "inline-flex",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 3,
            gap: 2,
          }}
        >
          {periodOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              aria-pressed={period === option.value}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 13,
                fontWeight: period === option.value ? 600 : 500,
                cursor: "pointer",
                background: period === option.value ? "var(--accent)" : "transparent",
                color: period === option.value ? "#fff" : "var(--text-secondary)",
                transition: "background 0.2s ease, color 0.2s ease",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div
        aria-busy={refreshing}
        style={{ opacity: refreshing ? 0.55 : 1, transition: "opacity 0.2s ease", pointerEvents: refreshing ? "none" : undefined }}
      >
      {/* Metric cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 8,
        }}
        className="analytics-metrics-grid"
      >
        {[
          {
            label: t("analytics.open_rate"),
            value: formatRate(data.openRate),
            color: data.openRate !== null && data.openRate > 50 ? "var(--success)" : "var(--text)",
          },
          { label: t("analytics.click_rate"), value: formatRate(data.clickRate), color: "var(--text)" },
          { label: t("analytics.sent"), value: String(data.totalSent), color: "var(--text)" },
          { label: t("analytics.recipients"), value: String(data.activeRecipients), color: "var(--text)" },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: m.color,
                letterSpacing: "-0.02em",
                marginBottom: 6,
              }}
            >
              {m.value}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Portée des chiffres — répond à « 72 % ... depuis quand ? » */}
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "0 0 24px" }}>
        {t("analytics.scope_prefix")} {scopeLabel.toLowerCase()}
      </p>

      {/* Chart section */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {t("analytics.open_evolution")}
          {limits.analytics === "basic" && <CrownBadge tooltip={t("analytics.available_pro")} />}
        </h2>

        {limits.analytics === "basic" ? (
          <div style={{ position: "relative" }}>
            {/* Blurred fake chart */}
            <div
              style={{
                height: 120,
                display: "flex",
                alignItems: "flex-end",
                gap: 10,
                filter: "blur(4px)",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {[40, 65, 30, 80, 55, 70, 45].map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{v}%</span>
                  <div style={{ width: "100%", height: `${(v / 80) * 80}px`, background: "var(--accent)", borderRadius: "4px 4px 0 0", opacity: 0.85, minHeight: 8 }} />
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>S{i + 1}</span>
                </div>
              ))}
            </div>
            {/* Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                background: "rgba(var(--surface-rgb, 255,255,255), 0.7)",
              }}
            >
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>{t("analytics.available_pro")}</p>
              <CrownBadge tooltip={t("analytics.unlock_open_evolution")} />
            </div>
          </div>
        ) : data.trend.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
            {t("analytics.no_data")}
          </p>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 130 }}>
            {data.trend.map((d, i) => (
              <div
                key={d.date ?? i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                  {d.value}%
                </span>
                <div
                  style={{
                    width: "100%",
                    height: `${(d.value / maxBar) * 80}px`,
                    background: "var(--accent)",
                    borderRadius: "4px 4px 0 0",
                    opacity: 0.85,
                    minHeight: 8,
                  }}
                />
                {/* Vraie date de l'envoi (un point = une newsletter, pas une semaine) */}
                <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {d.date
                    ? new Date(d.date).toLocaleDateString(lang === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "short" })
                    : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top articles */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {t("analytics.top_articles")}
          {limits.analytics === "basic" && <CrownBadge tooltip={t("analytics.available_pro")} />}
        </h2>
        {limits.analytics === "basic" ? (
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
            {t("analytics.full_analytics_pro")}{" "}
            <button
              onClick={() => router.push("/tarifs")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: 14, padding: 0, textDecoration: "underline" }}
            >
              {t("dash.upgrade_btn")}
            </button>
          </p>
        ) : data.topArticles.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{t("analytics.no_clicks")}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.topArticles.map((article, i) => (
              <div key={article.title} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    flexShrink: 0,
                    textAlign: "right",
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--text)",
                      marginBottom: 5,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {article.title}
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 2,
                      background: "var(--border)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(article.clicks / maxClicks) * 100}%`,
                        background: "var(--accent)",
                        borderRadius: 2,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    flexShrink: 0,
                    width: 52,
                    textAlign: "right",
                  }}
                >
                  {article.clicks} {t("analytics.clicks")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last sends table */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
          overflowX: "auto",
        }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 16,
          }}
        >
          {t("analytics.last_sends")}
        </h2>
        {data.newsletters.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>{t("analytics.no_newsletter_sent")}</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                {[
                  t("analytics.col_date"),
                  t("analytics.col_subject"),
                  t("analytics.col_recipients"),
                  t("analytics.col_open_rate"),
                  t("analytics.col_click_rate"),
                ].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "8px 12px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      borderBottom: "1px solid var(--border)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.newsletters.map((row, i) => (
                <tr
                  key={row.id}
                  style={{ transition: "background 0.1s ease" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "var(--surface-hover)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
                >
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--text-secondary)",
                      borderBottom: i < data.newsletters.length - 1 ? "1px solid var(--border)" : "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.date ? formatDateLocale(row.date, lang) : "-"}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--text)",
                      fontWeight: 500,
                      borderBottom: i < data.newsletters.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    {row.subject}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--text-secondary)",
                      borderBottom: i < data.newsletters.length - 1 ? "1px solid var(--border)" : "none",
                      textAlign: "center",
                    }}
                  >
                    {row.recipients ?? "—"}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: row.openRate !== null ? "var(--success)" : "var(--text-muted)",
                      fontWeight: 600,
                      borderBottom: i < data.newsletters.length - 1 ? "1px solid var(--border)" : "none",
                      textAlign: "center",
                    }}
                  >
                    {formatRate(row.openRate)}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--text-secondary)",
                      borderBottom: i < data.newsletters.length - 1 ? "1px solid var(--border)" : "none",
                      textAlign: "center",
                    }}
                  >
                    {formatRate(row.clickRate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .analytics-metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 420px) {
          .analytics-metrics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
