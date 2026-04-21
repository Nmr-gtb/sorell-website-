"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

// Reuse existing i18n keys used by the demo so we don't introduce new strings.
const LOADING_MESSAGE_KEYS = [
  "demo.loading_1",
  "demo.loading_2",
  "demo.loading_3",
  "demo.loading_4",
  "demo.loading_5",
] as const;

interface NewsletterLoaderProps {
  /**
   * When false, the component renders nothing. Use this to toggle the loader
   * without manually wrapping it in a conditional.
   */
  active?: boolean;
  /**
   * Show the subtitle line under the evolving message.
   * Defaults to true.
   */
  showSubtitle?: boolean;
  /**
   * Optional style override for the outer container (e.g. to tweak margins).
   */
  style?: React.CSSProperties;
  /**
   * Delay between message rotations in ms. Defaults to 1200ms — matches the
   * rhythm already used on the public demo.
   */
  intervalMs?: number;
}

/**
 * Newsletter generation loader — shows a spinner, an evolving status message
 * and a progress indicator while a newsletter is being generated.
 *
 * Used across the three places where we kick off a generation:
 * - Public demo (/demo)
 * - Onboarding last step (/dashboard)
 * - Manual generation (/dashboard/generate) and instant first send (/dashboard/config)
 */
export default function NewsletterLoader({
  active = true,
  showSubtitle = true,
  style,
  intervalMs = 1200,
}: NewsletterLoaderProps) {
  const { t } = useLanguage();
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (!active) {
      setMsgIdx(0);
      return;
    }
    let idx = 0;
    setMsgIdx(0);
    const id = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGE_KEYS.length;
      setMsgIdx(idx);
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);

  if (!active) return null;

  return (
    <div
      style={{
        padding: "32px 24px",
        textAlign: "center",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        ...style,
      }}
    >
      <style>{`@keyframes nl-loader-spin { to { transform: rotate(360deg); } }`}</style>

      {/* Ring spinner tinted with the brand accent (#005058) */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          margin: "0 auto 18px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid var(--border)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "var(--accent)",
            animation: "nl-loader-spin 0.9s linear infinite",
          }}
        />
      </div>

      {/* Evolving status line */}
      <p
        style={{
          fontWeight: 600,
          color: "var(--text)",
          fontSize: 15,
          marginBottom: 6,
          letterSpacing: "-0.01em",
          lineHeight: 1.4,
        }}
      >
        {t(LOADING_MESSAGE_KEYS[msgIdx])}
      </p>

      {showSubtitle && (
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            marginBottom: 18,
            lineHeight: 1.5,
          }}
        >
          {t("demo.loading_subtitle")}
        </p>
      )}

      {/* Step indicator — keeps the user oriented on where we are in the flow */}
      <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
        {LOADING_MESSAGE_KEYS.map((_, i) => (
          <div
            key={i}
            style={{
              height: 3,
              borderRadius: 2,
              transition: "all 0.3s ease",
              width: i === msgIdx ? 24 : 6,
              background: i === msgIdx ? "var(--accent)" : "var(--border)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
