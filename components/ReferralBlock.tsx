"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api";
import { useLanguage } from "@/lib/LanguageContext";

type ReferralStats = {
  eligible: boolean;
  code: string;
  referralLink: string;
  stats: {
    total: number;
    converted: number;
    pending: number;
    convertedThisMonth: number;
    remainingThisMonth: number;
  };
};

export default function ReferralBlock() {
  const { t } = useLanguage();
  const [data, setData] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    authFetch("/api/referral")
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((d) => {
        if (d?.eligible) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = data.referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Ne rien afficher si pas eligible ou en chargement
  if (loading || !data) return null;

  const { stats } = data;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "var(--accent-subtle)",
            border: "1px solid var(--accent-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: 0 }}>
            {t("referral.title") !== "referral.title" ? t("referral.title") : "Inviter un collègue"}
          </h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
            {t("referral.subtitle") !== "referral.subtitle" ? t("referral.subtitle") : "Gagnez 15 jours gratuits par filleul"}
          </p>
        </div>
      </div>

      {/* Explanation */}
      <div
        style={{
          background: "var(--bg)",
          borderRadius: 8,
          padding: "12px 14px",
          marginBottom: 16,
          fontSize: 13,
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        {t("referral.explanation") !== "referral.explanation"
          ? t("referral.explanation")
          : "Partagez votre lien. Si votre filleul s'abonne à un plan payant, vous gagnez 15 jours gratuits et il bénéficie de -20% sur son premier mois."}
      </div>

      {/* Copy link */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          readOnly
          aria-label="Lien de parrainage"
          value={data.referralLink}
          style={{
            flex: 1,
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--text)",
            fontSize: 13,
            fontFamily: "monospace",
            minWidth: 0,
          }}
        />
        <button
          onClick={handleCopy}
          style={{
            padding: "9px 16px",
            borderRadius: 8,
            border: "none",
            background: copied ? "#059669" : "var(--accent)",
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {t("referral.copied") !== "referral.copied" ? t("referral.copied") : "Copié !"}
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {t("referral.copy") !== "referral.copy" ? t("referral.copy") : "Copier"}
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "10px 8px",
            borderRadius: 8,
            background: "var(--bg)",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
            {stats.converted}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
            {t("referral.stat_converted") !== "referral.stat_converted" ? t("referral.stat_converted") : "Convertis"}
          </div>
        </div>
        <div
          style={{
            textAlign: "center",
            padding: "10px 8px",
            borderRadius: 8,
            background: "var(--bg)",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
            {stats.pending}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
            {t("referral.stat_pending") !== "referral.stat_pending" ? t("referral.stat_pending") : "En attente"}
          </div>
        </div>
        <div
          style={{
            textAlign: "center",
            padding: "10px 8px",
            borderRadius: 8,
            background: "var(--bg)",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: stats.remainingThisMonth > 0 ? "var(--accent)" : "var(--text-muted)", letterSpacing: "-0.02em" }}>
            {stats.remainingThisMonth}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
            {t("referral.stat_remaining") !== "referral.stat_remaining" ? t("referral.stat_remaining") : "Restants ce mois"}
          </div>
        </div>
      </div>
    </div>
  );
}
