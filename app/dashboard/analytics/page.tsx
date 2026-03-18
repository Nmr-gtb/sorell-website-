"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getProfile } from "@/lib/database";
import { getPlanLimits } from "@/lib/plans";
import CrownBadge from "@/components/CrownBadge";
import { useDevMode } from "@/lib/DevModeContext";

type AnalyticsData = {
  openRate: number;
  clickRate: number;
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  activeRecipients: number;
  newsletters: Array<{
    id: string;
    date: string;
    subject: string;
    recipients: number;
    openRate: number;
    clickRate: number;
  }>;
  topArticles: Array<{ title: string; clicks: number }>;
  weeklyData: Array<{ label: string; value: number }>;
};

function IconChart() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function formatDateFr(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [realPlan, setRealPlan] = useState<string>("free");
  const { getEffectivePlan } = useDevMode();

  useEffect(() => {
    if (!user) return;

    async function loadAll() {
      const profileResult = await getProfile(user!.id);
      const userPlan = profileResult.data?.plan || "free";
      setRealPlan(userPlan);

      const limits = getPlanLimits(userPlan);
      if (limits.analytics === "none") {
        setLoading(false);
        return;
      }

      fetch(`/api/analytics?userId=${user!.id}`)
        .then((res) => res.json())
        .then((json) => {
          setData(json);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }

    loadAll();
  }, [user]);

  const plan = getEffectivePlan(realPlan);
  const limits = getPlanLimits(plan);

  if (loading) {
    return (
      <div style={{ padding: 32, maxWidth: 900 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Analytics
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Chargement…</p>
        </div>
      </div>
    );
  }

  // Plan free : analytics verrouillées
  if (limits.analytics === "none") {
    return (
      <div style={{ padding: 32, maxWidth: 900 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Analytics
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Suivez les performances de vos newsletters</p>
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
            Analytics verrouillées
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
            Les analytics sont disponibles avec le plan Pro
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <CrownBadge tooltip="Débloquer les analytics" />
            <button
              onClick={() => router.push("/pricing")}
              style={{
                display: "inline-flex",
                alignItems: "center",
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
              Voir les plans →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !data || data.totalSent === 0;

  if (isEmpty) {
    return (
      <div style={{ padding: 32, maxWidth: 900 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 6 }}>
            Analytics
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Suivez les performances de vos newsletters</p>
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
            Pas encore de données
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>
            Envoyez votre première newsletter pour voir les analytics apparaître ici.
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
            Générer ma newsletter →
          </Link>
        </div>
      </div>
    );
  }

  const maxBar = data.weeklyData.length > 0 ? Math.max(...data.weeklyData.map((d) => d.value), 1) : 1;
  const maxClicks = data.topArticles.length > 0 ? Math.max(...data.topArticles.map((a) => a.clicks), 1) : 1;

  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
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
          Suivez les performances de vos newsletters
        </p>
      </div>

      {/* Metric cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
        className="analytics-metrics-grid"
      >
        {[
          {
            label: "Taux d'ouverture",
            value: `${data.openRate}%`,
            color: data.openRate > 50 ? "var(--success)" : "var(--text)",
          },
          { label: "Taux de clic", value: `${data.clickRate}%`, color: "var(--text)" },
          { label: "Newsletters envoyées", value: String(data.totalSent), color: "var(--text)" },
          { label: "Destinataires actifs", value: String(data.activeRecipients), color: "var(--text)" },
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

      {/* Chart section — verrouillé pour solo */}
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
          Évolution du taux d&apos;ouverture
          {limits.analytics === "basic" && <CrownBadge tooltip="Disponible avec le plan Pro" />}
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
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>Disponible avec le plan Pro</p>
              <CrownBadge tooltip="Débloquer l'évolution du taux d'ouverture" />
            </div>
          </div>
        ) : data.weeklyData.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-muted)", textAlign: "center", padding: "24px 0" }}>
            Pas encore de données
          </p>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
            {data.weeklyData.map((d) => (
              <div
                key={d.label}
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
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.label}</span>
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
          }}
        >
          Top articles
        </h2>
        {data.topArticles.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucun clic enregistré pour le moment.</p>
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
                  {article.clicks} clics
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
          Derniers envois
        </h2>
        {data.newsletters.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Aucune newsletter envoyée.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr>
                {["Date", "Sujet", "Destinataires", "Taux ouverture", "Taux clic"].map((col) => (
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
                    {row.date ? formatDateFr(row.date) : "—"}
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
                    {row.recipients}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--success)",
                      fontWeight: 600,
                      borderBottom: i < data.newsletters.length - 1 ? "1px solid var(--border)" : "none",
                      textAlign: "center",
                    }}
                  >
                    {row.openRate}%
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      color: "var(--text-secondary)",
                      borderBottom: i < data.newsletters.length - 1 ? "1px solid var(--border)" : "none",
                      textAlign: "center",
                    }}
                  >
                    {row.clickRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
