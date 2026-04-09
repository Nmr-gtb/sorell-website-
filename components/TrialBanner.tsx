"use client";
import { useAuth } from "@/lib/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";

export default function TrialBanner() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [plan, setPlan] = useState<string | null>(null);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem("trialBannerDismissed");
    if (wasDismissed === "true") setDismissed(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("plan, trial_ends_at").eq("id", user.id).single().then(({ data }) => {
      setPlan(data?.plan || "free");
      setTrialEndsAt(data?.trial_ends_at || null);
    });
  }, [user]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("trialBannerDismissed", "true");
  };

  // Cas trial expiré : plan pro/business avec trial_ends_at dans le passé
  const isTrialExpired = (() => {
    if (!user || !trialEndsAt || !plan) return false;
    if (plan !== "pro" && plan !== "business") return false;
    const now = new Date();
    const endDate = new Date(trialEndsAt);
    return endDate.getTime() < now.getTime();
  })();

  if (isTrialExpired && !dismissed) {
    return (
      <div
        style={{
          background: "#1C1307",
          borderBottom: "1px solid rgba(245, 158, 11, 0.2)",
          color: "white",
          textAlign: "center",
          padding: "10px 16px",
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: "0.01em",
          position: "relative",
        }}
      >
        <span style={{ color: "#F59E0B", fontWeight: 600 }}>
          {t("trial.expired_title")}
        </span>
        <span style={{ margin: "0 8px", opacity: 0.5 }}>|</span>
        <span style={{ opacity: 0.9 }}>
          {t("trial.expired_message")}
        </span>
        <a
          href="/tarifs"
          style={{
            color: "#F59E0B",
            marginLeft: 12,
            textDecoration: "underline",
            fontWeight: 600,
          }}
        >
          {t("trial.expired_cta")}
        </a>
        <button
          onClick={handleDismiss}
          aria-label="Fermer la bannière"
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            fontSize: 18,
            lineHeight: 1,
            padding: "4px 8px",
            opacity: 0.6,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
        >
          &#x2715;
        </button>
      </div>
    );
  }

  // Afficher si non connecté OU si connecté en plan free
  if (user && plan !== null && plan !== "free") return null;
  if (dismissed) return null;

  const getTrialText = (): string => {
    if (!trialEndsAt) return t("trial.text");

    const now = new Date();
    const endDate = new Date(trialEndsAt);
    const diffMs = endDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) return t("trial.expired");
    if (daysLeft === 1) return t("trial.lastDay");
    return t("trial.daysLeft").replace("{days}", String(daysLeft));
  };

  return (
    <div
      style={{
        background: "#111827",
        color: "white",
        textAlign: "center",
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "0.01em",
        position: "relative",
      }}
    >
      {getTrialText()}
      <a
        href="/tarifs"
        style={{
          color: "#5EEAD4",
          marginLeft: 12,
          textDecoration: "underline",
          fontWeight: 600,
        }}
      >
        {t("trial.cta")}
      </a>
      <button
        onClick={handleDismiss}
        aria-label="Fermer la bannière"
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: "white",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          padding: "4px 8px",
          opacity: 0.6,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.6"; }}
      >
        &#x2715;
      </button>
    </div>
  );
}
