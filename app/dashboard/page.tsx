"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { getRecipients, getNewsletterConfig } from "@/lib/database";
import { supabase } from "@/lib/supabase";

function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M1 20c0-3.3 3.6-6 8-6" />
      <circle cx="17" cy="9" r="3" />
      <path d="M23 20c0-2.7-2.7-5-6-5" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

const DAYS_FR = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const DAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function getNextDate(frequency: string, sendDay: string, sendHour: number): { date: string; time: string } {
  const now = new Date();
  const today = now.getDay();
  const timeStr = `${sendHour}h00`;

  if (frequency === "monthly") {
    const targetDate = sendDay === "1st" ? 1 : 15;
    const next = new Date(now.getFullYear(), now.getMonth(), targetDate);
    if (next <= now) next.setMonth(next.getMonth() + 1);
    return {
      date: `${next.getDate()} ${MONTHS_FR[next.getMonth()]} ${next.getFullYear()}`,
      time: timeStr,
    };
  }

  // weekly
  const targetDay = DAY_INDEX[sendDay] ?? 1;
  let diff = (targetDay - today + 7) % 7;
  if (diff === 0) diff = 7;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  const day = DAYS_FR[next.getDay()];
  return {
    date: `${day.charAt(0).toUpperCase() + day.slice(1)} ${next.getDate()} ${MONTHS_FR[next.getMonth()]}`,
    time: timeStr,
  };
}

type Newsletter = {
  id: string;
  subject: string;
  sent_at: string | null;
  generated_at: string | null;
  status: string;
  open_count: number;
  click_count: number;
  recipient_count: number;
  content: unknown;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function countArticles(content: unknown): number | null {
  if (!content) return null;
  if (Array.isArray(content)) return content.length;
  const c = content as Record<string, unknown>;
  if (Array.isArray(c.articles)) return (c.articles as unknown[]).length;
  return null;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [nextNewsletter, setNextNewsletter] = useState<{ date: string; time: string } | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [lastNewsletter, setLastNewsletter] = useState<Newsletter | null>(null);
  const [loadingNewsletter, setLoadingNewsletter] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      const [recipientsResult, configResult] = await Promise.all([
        getRecipients(user!.id),
        getNewsletterConfig(user!.id),
      ]);

      setRecipientCount(recipientsResult.data.length);

      const freq = configResult.data?.frequency ?? "weekly";
      const day = configResult.data?.send_day ?? "monday";
      const hour = configResult.data?.send_hour ?? 9;
      setNextNewsletter(getNextDate(freq, day, hour));

      setLoadingData(false);
    }

    loadData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("newsletters")
      .select("*")
      .eq("user_id", user.id)
      .order("generated_at", { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLastNewsletter(data[0] as Newsletter);
        }
        setLoadingNewsletter(false);
      });
  }, [user]);

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "vous";

  const lastOpenRate =
    lastNewsletter && lastNewsletter.recipient_count > 0
      ? Math.round((lastNewsletter.open_count / lastNewsletter.recipient_count) * 100)
      : null;

  const lastArticleCount = lastNewsletter ? countArticles(lastNewsletter.content) : null;

  const metrics = [
    {
      icon: <IconCalendar />,
      value: loadingData ? "..." : (nextNewsletter?.date ?? "—"),
      sublabel: loadingData ? "" : (nextNewsletter?.time ?? ""),
      label: "Prochaine newsletter",
    },
    {
      icon: <IconUsers />,
      value: loadingData ? "..." : String(recipientCount ?? 0),
      sublabel: "collaborateurs",
      label: "Destinataires",
    },
    {
      icon: <IconEye />,
      value: loadingNewsletter ? "..." : lastOpenRate !== null ? `${lastOpenRate}%` : "—",
      sublabel: "",
      label: "Taux d'ouverture (dernière)",
    },
    {
      icon: <IconDocument />,
      value: loadingNewsletter ? "..." : lastArticleCount !== null ? String(lastArticleCount) : "—",
      sublabel: lastArticleCount !== null ? "articles" : "",
      label: "Articles (dernière newsletter)",
    },
  ];

  return (
    <div style={{ padding: "32px", maxWidth: 900 }}>
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
          Bonjour, {firstName} 👋
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Voici un résumé de votre activité
        </p>
      </div>

      {/* Metric cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
        className="dashboard-metrics-grid"
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div style={{ color: "var(--text-muted)", marginBottom: 12, display: "flex" }}>
              {m.icon}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                {m.value}
              </span>
              {m.sublabel && (
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>{m.sublabel}</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Last newsletter */}
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
          Dernière newsletter
        </h2>
        {loadingNewsletter ? (
          <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>Chargement…</p>
        ) : lastNewsletter === null ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
              Aucune newsletter envoyée
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
              Configurez vos thématiques et générez votre première newsletter.
            </p>
            <Link href="/dashboard/generate" className="btn-primary" style={{ padding: "10px 20px", fontSize: 14 }}>
              Générer ma première newsletter →
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  {lastNewsletter.status === "sent" ? "Date d'envoi" : "Générée le"}
                </span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                  {lastNewsletter.sent_at
                    ? formatDate(lastNewsletter.sent_at)
                    : lastNewsletter.generated_at
                    ? formatDate(lastNewsletter.generated_at)
                    : "—"}
                </span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Sujet</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>
                  {lastNewsletter.subject || "—"}
                </span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Statut</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                  {lastNewsletter.status === "sent" ? "Envoyée" : "Brouillon"}
                </span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Taux d&apos;ouverture</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                  {lastOpenRate !== null ? `${lastOpenRate}%` : "—"}
                </span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Nombre de clics</span>
                <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>
                  {lastNewsletter.click_count ?? "—"}
                </span>
              </div>
            </div>
            <Link href="/dashboard/generate" className="btn-ghost" style={{ fontSize: 13, padding: "6px 14px" }}>
              Générer une nouvelle →
            </Link>
          </>
        )}
      </div>

      {/* Quick actions */}
      <h2
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 12,
        }}
      >
        Actions rapides
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="dashboard-actions-grid">
        <Link
          href="/dashboard/generate"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--accent)",
            border: "1px solid var(--accent)",
            borderRadius: 12,
            padding: "16px 20px",
            textDecoration: "none",
            gridColumn: "1 / -1",
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "0.88";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>
            Générer ma newsletter →
          </span>
        </Link>
        <Link
          href="/dashboard/config"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "16px 20px",
            textDecoration: "none",
            transition: "border-color 0.15s ease, background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-hover)";
            (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface)";
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
            Configurer ma newsletter
          </span>
          <span style={{ color: "var(--text-muted)" }}>
            <IconArrow />
          </span>
        </Link>
        <Link
          href="/dashboard/analytics"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "16px 20px",
            textDecoration: "none",
            transition: "border-color 0.15s ease, background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-hover)";
            (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface)";
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>
            Voir les analytics
          </span>
          <span style={{ color: "var(--text-muted)" }}>
            <IconArrow />
          </span>
        </Link>
      </div>

      <style>{`
        @media (max-width: 600px) {
          .dashboard-metrics-grid {
            grid-template-columns: 1fr !important;
          }
          .dashboard-actions-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
