"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";

type ConsentChoice = "accepted" | "refused";

const STORAGE_KEY = "cookie_consent";

export default function CookieBanner() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== "accepted" && stored !== "refused") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleChoice = (choice: ConsentChoice) => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // localStorage indisponible
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: "#0f2b31",
        borderTop: "1px solid rgba(94, 234, 212, 0.15)",
        padding: "16px 20px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        fontFamily: "var(--font-inter), Inter, sans-serif",
      }}
    >
      <p
        style={{
          color: "rgba(255, 255, 255, 0.85)",
          fontSize: "14px",
          lineHeight: "1.5",
          margin: 0,
          textAlign: "center",
          maxWidth: "600px",
        }}
      >
        {t("cookies.text")}{" "}
        <a
          href="/confidentialite"
          style={{
            color: "#5EEAD4",
            textDecoration: "underline",
            textUnderlineOffset: "2px",
          }}
        >
          {t("cookies.link")}
        </a>
      </p>
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => handleChoice("refused")}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            backgroundColor: "transparent",
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "background-color 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
          }}
          aria-label={t("cookies.refuse")}
        >
          {t("cookies.refuse")}
        </button>
        <button
          onClick={() => handleChoice("accepted")}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#005058",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#006670";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#005058";
          }}
          aria-label={t("cookies.accept")}
        >
          {t("cookies.accept")}
        </button>
      </div>
    </div>
  );
}
