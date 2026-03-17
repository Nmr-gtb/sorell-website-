"use client";

import { useState } from "react";

interface WaitlistFormProps {
  size?: "default" | "large";
  placeholder?: string;
  buttonText?: string;
}

export default function WaitlistForm({
  size = "default",
  placeholder = "votre@email.com",
  buttonText = "Rejoindre la waitlist",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 650));
    console.log("[Waitlist] Email enregistré:", email);
    setSubmitted(true);
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
          borderRadius: 10,
          background: "var(--success-bg)",
          border: "1px solid rgba(5, 150, 105, 0.2)",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 20 20"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <circle cx="10" cy="10" r="9" stroke="var(--success)" strokeWidth="1.5" />
          <path
            d="M6.5 10l2.5 2.5 4-4"
            stroke="var(--success)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--success)" }}>
          Parfait ! Vous recevrez un échantillon sous peu.
        </p>
      </div>
    );
  }

  const isLarge = size === "large";

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        gap: 8,
        width: "100%",
        maxWidth: isLarge ? 480 : 400,
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
          padding: isLarge ? "12px 16px" : "10px 14px",
          fontSize: isLarge ? "0.9375rem" : "0.875rem",
        }}
      />
      <button
        type="submit"
        disabled={loading}
        className="btn-accent"
        style={{
          padding: isLarge ? "12px 20px" : "10px 18px",
          fontSize: isLarge ? "0.9375rem" : "0.875rem",
          flexShrink: 0,
          opacity: loading ? 0.75 : 1,
        }}
      >
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg
              className="animate-spin"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Envoi...
          </span>
        ) : (
          buttonText
        )}
      </button>
    </form>
  );
}
