"use client";

import { useLanguage } from "@/lib/LanguageContext";

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "fr" ? "en" : "fr")}
      aria-label={lang === "fr" ? "Switch to English" : "Passer en francais"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        padding: 0,
        border: "1px solid var(--border)",
        borderRadius: 6,
        background: "transparent",
        cursor: "pointer",
        overflow: "hidden",
        fontSize: 12,
        fontWeight: 600,
        height: 28,
      }}
    >
      <span
        style={{
          padding: "4px 8px",
          background: lang === "fr" ? "var(--accent)" : "transparent",
          color: lang === "fr" ? "white" : "var(--text-muted)",
          transition: "background 0.15s ease, color 0.15s ease",
        }}
      >
        FR
      </span>
      <span
        style={{
          padding: "4px 8px",
          background: lang === "en" ? "var(--accent)" : "transparent",
          color: lang === "en" ? "white" : "var(--text-muted)",
          transition: "background 0.15s ease, color 0.15s ease",
        }}
      >
        EN
      </span>
    </button>
  );
}
