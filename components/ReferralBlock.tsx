"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  const [eligible, setEligible] = useState<boolean | null>(null);

  useEffect(() => {
    authFetch("/api/referral")
      .then((res) => res.json())
      .then((d) => {
        if (d?.eligible) {
          setData(d);
          setEligible(true);
        } else {
          setEligible(false);
        }
        setLoading(false);
      })
      .catch(() => {
        setEligible(false);
        setLoading(false);
      });
  }, []);

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
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

  if (loading) return null;

  const isLocked = !eligible;

  // Placeholder values for locked state
  const displayLink = isLocked ? "https://sorell.fr/?ref=XXXXXXXX" : (data?.referralLink ?? "");
  const stats = data?.stats ?? { converted: 0, pending: 0, remainingThisMonth: 3 };

  return (
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

      {/* Copy link - blurred for Free users */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, position: "relative" }}>
        <input
          readOnly
          aria-label="Lien de parrainage"
          value={displayLink}
          tabIndex={isLocked ? -1 : 0}
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
            filter: isLocked ? "blur(5px)" : "none",
            userSelect: isLocked ? "none" : "auto",
            pointerEvents: isLocked ? "none" : "auto",
          }}
        />
        <button
          onClick={isLocked ? undefined : handleCopy}
          disabled={isLocked}
          style={{
            padding: "9px 16px",
            borderRadius: 8,
            border: "none",
            background: isLocked ? "var(--text-muted)" : copied ? "#059669" : "var(--accent)",
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            cursor: isLocked ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            transition: "background 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: isLocked ? 0.5 : 1,
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

      {/* Upgrade CTA for Free users */}
      {isLocked && (
        <div
          style={{
            background: "linear-gradient(135deg, var(--accent-subtle), transparent)",
            border: "1px solid var(--accent-border)",
            borderRadius: 8,
            padding: "14px 16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
              {t("referral.upgrade_title") !== "referral.upgrade_title"
                ? t("referral.upgrade_title")
                : "Débloquez le parrainage"}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-secondary)" }}>
              {t("referral.upgrade_desc") !== "referral.upgrade_desc"
                ? t("referral.upgrade_desc")
                : "Passez à Pro ou Business pour parrainer vos collègues et gagner des jours gratuits."}
            </p>
          </div>
          <Link
            href="/tarifs"
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              background: "var(--accent)",
              color: "white",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
              transition: "opacity 0.2s",
            }}
          >
            {t("referral.upgrade_cta") !== "referral.upgrade_cta"
              ? t("referral.upgrade_cta")
              : "Voir les offres"}
          </Link>
        </div>
      )}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          filter: isLocked ? "blur(3px)" : "none",
          pointerEvents: isLocked ? "none" : "auto",
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
          <div style={{ fontSize: 20, fontWeight: 700, color: isLocked ? "var(--text-muted)" : stats.remainingThisMonth > 0 ? "var(--accent)" : "var(--text-muted)", letterSpacing: "-0.02em" }}>
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
