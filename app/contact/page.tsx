"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, subject, message }),
    });

    if (res.ok) {
      setSuccess(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } else {
      setError(t("contact.error"));
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`
        @media (max-width: 767px) {
          .contact-main {
            padding-top: 48px !important;
            padding-bottom: 48px !important;
          }
          .contact-main > div:first-child {
            padding-top: 24px !important;
          }
          .contact-form-card {
            padding: 20px !important;
          }
        }
      `}</style>
      <Navbar />

      <main
        className="contact-main"
        style={{
          flex: 1,
          paddingTop: 80,
          paddingBottom: 80,
          padding: "80px 1.5rem",
          maxWidth: 600,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 32, paddingTop: 40 }}>
          <h1
            style={{
              fontFamily: "var(--font-inter, 'Inter', sans-serif)",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              marginBottom: 10,
            }}
          >
            {t("contact.title")}
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {t("contact.subtitle")}
          </p>
        </div>

        {/* Direct email card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "var(--surface-alt)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M2 7l10 7 10-7" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 2 }}>
              {t("contact.email_direct")}
            </p>
            <a
              href="mailto:noe@sorell.fr"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--accent)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.textDecoration = "none";
              }}
            >
              noe@sorell.fr
            </a>
          </div>
        </div>

        {/* Calendly card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 20,
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "var(--surface-alt)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 2 }}>
              {t("contact.calendly_label") !== "contact.calendly_label" ? t("contact.calendly_label") : "Planifier un appel de 30 min"}
            </p>
            <a
              href="https://calendly.com/mur-noe-celony/30min"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--accent)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.textDecoration = "none";
              }}
            >
              Réserver un créneau
            </a>
          </div>
        </div>

        {/* Form card */}
        <div
          className="contact-form-card"
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 28,
            background: "var(--bg)",
          }}
        >
          {success && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "var(--success-bg)",
                border: "1px solid var(--success)",
                color: "var(--success)",
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 20,
              }}
            >
              {t("contact.success")}
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "var(--error-bg, #FEF2F2)",
                border: "1px solid var(--error, #EF4444)",
                color: "var(--error, #EF4444)",
                fontSize: 14,
                marginBottom: 20,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Nom */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="contact-name" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                {t("login.name_label")}
              </label>
              <input
                id="contact-name"
                type="text"
                className="input-field"
                placeholder={t("contact.name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="contact-email" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                {t("login.email")}
              </label>
              <input
                id="contact-email"
                type="email"
                className="input-field"
                placeholder={t("contact.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Sujet */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="contact-subject" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                {t("contact.subject")}
              </label>
              <select
                id="contact-subject"
                className="select-field"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value={t("contact.subject_general")}>{t("contact.subject_general")}</option>
                <option value={t("contact.subject_quote")}>{t("contact.subject_quote")}</option>
                <option value={t("contact.subject_tech")}>{t("contact.subject_tech")}</option>
                <option value={t("contact.subject_billing")}>{t("contact.subject_billing")}</option>
                <option value={t("contact.subject_partner")}>{t("contact.subject_partner")}</option>
                <option value={t("contact.subject_other")}>{t("contact.subject_other")}</option>
              </select>
            </div>

            {/* Message */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label htmlFor="contact-message" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
                Message
              </label>
              <textarea
                id="contact-message"
                className="input-field"
                placeholder={t("contact.message")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{ minHeight: 140, resize: "vertical" }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "11px 20px",
                fontSize: "0.9375rem",
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? t("contact.sending") : t("contact.send")}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
