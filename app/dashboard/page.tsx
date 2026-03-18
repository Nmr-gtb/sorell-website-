"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

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

const metrics = [
  {
    icon: <IconCalendar />,
    value: "Lundi 24 mars",
    sublabel: "9h00",
    label: "Prochaine newsletter",
  },
  {
    icon: <IconUsers />,
    value: "12",
    sublabel: "collaborateurs",
    label: "Destinataires",
  },
  {
    icon: <IconEye />,
    value: "68%",
    sublabel: "",
    label: "Taux d'ouverture moyen",
  },
  {
    icon: <IconDocument />,
    value: "5",
    sublabel: "sélectionnés",
    label: "Articles cette semaine",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "vous";

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
          Dernière newsletter envoyée
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Date d&apos;envoi</span>
            <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>17 mars 2026</span>
          </div>
          <div style={{ height: 1, background: "var(--border)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Sujet</span>
            <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>Briefing S12 — IA & Réglementation</span>
          </div>
          <div style={{ height: 1, background: "var(--border)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Taux d&apos;ouverture</span>
            <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>68%</span>
          </div>
          <div style={{ height: 1, background: "var(--border)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>Nombre de clics</span>
            <span style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>34</span>
          </div>
        </div>
        <button className="btn-ghost" style={{ fontSize: 14, padding: "7px 14px" }}>
          Voir le détail
        </button>
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
