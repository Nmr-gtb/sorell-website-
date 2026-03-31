"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";

interface WaitlistFormProps {
  placeholder?: string;
  buttonText?: string;
  compact?: boolean;
}

export default function WaitlistForm({
  placeholder = "votre@email.com",
  buttonText = "Commencer gratuitement",
  compact = false,
}: WaitlistFormProps) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setLoading(true);
    setError("");

    try {
      if (!supabase) {
        setError(t("waitlist.error_config"));
        setLoading(false);
        return;
      }

      const { error: dbError } = await supabase
        .from("waitlist")
        .insert([{ email: email.trim().toLowerCase() }])
        .select();

      if (dbError) {
        if (dbError.code === "23505" || dbError.message?.includes("duplicate")) {
          setSubmitted(true);
        } else {
          setError(t("waitlist.error_generic"));
        }
      } else {
        setSubmitted(true);
      }
    } catch {
      setError(t("waitlist.error_unexpected"));
    }

    setLoading(false);
  };

  if (submitted) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 18px",
          borderRadius: 8,
          background: "var(--success-bg)",
          border: "1px solid rgba(5, 150, 105, 0.2)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
          <circle cx="10" cy="10" r="9" stroke="var(--success)" strokeWidth="1.5" />
          <path d="M6.5 10l2.5 2.5 4-4" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--success)" }}>
          {t("waitlist.success")}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: compact ? 320 : 480 }}>
      <style>{`
        @media (max-width: 520px) {
          .waitlist-form {
            flex-direction: column !important;
            gap: 10px !important;
          }
        }
      `}</style>
      <form
        onSubmit={handleSubmit}
        className="waitlist-form"
        style={{
          display: "flex",
          flexDirection: compact ? "column" : "row",
          gap: compact ? 10 : 8,
          width: "100%",
        }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          required
          className="input-field"
          style={{
            flex: 1,
            padding: "0.75rem 1rem",
            fontSize: "0.9375rem",
          }}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{
            padding: "0.75rem 1.375rem",
            fontSize: "0.9375rem",
            flexShrink: 0,
            opacity: loading ? 0.75 : 1,
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {t("waitlist.sending")}
            </span>
          ) : (
            buttonText
          )}
        </button>
      </form>
      {error && (
        <p style={{ fontSize: "0.8125rem", color: "var(--error, #dc2626)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
