"use client";

import Link from "next/link";
import { useState } from "react";
import SorellLogo from "@/components/SorellLogo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowOverlay(true);
  };

  return (
    <div
      className="hero-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "5rem 1.5rem 2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo + heading */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <SorellLogo size="lg" />
          </div>
          <h1
            className="font-display"
            style={{
              fontSize: "1.625rem",
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.02em",
              marginBottom: 5,
            }}
          >
            Connectez-vous
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Accédez à votre espace Sorell
          </p>
        </div>

        {/* Form card */}
        <div
          className="card"
          style={{ padding: "28px" }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text)", marginBottom: 7 }}
              >
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.fr"
                required
                className="input-field"
                style={{ padding: "10px 14px", fontSize: "0.875rem" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}>
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowOverlay(true)}
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--accent)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-field"
                style={{ padding: "10px 14px", fontSize: "0.875rem" }}
              />
            </div>

            <button
              type="submit"
              className="btn-accent"
              style={{ padding: "11px", fontSize: "0.9375rem", fontWeight: 600, marginTop: 4 }}
            >
              Se connecter
            </button>
          </form>

          <div
            style={{
              marginTop: 18,
              paddingTop: 18,
              borderTop: "1px solid var(--border-subtle)",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
            }}
          >
            Pas encore de compte ?{" "}
            <Link
              href="/"
              style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}
            >
              Rejoindre la waitlist
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Link
            href="/"
            style={{
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>

      {/* Overlay "bientôt disponible" */}
      {showOverlay && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1.5rem",
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(10px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowOverlay(false); }}
        >
          <div
            style={{
              width: "100%", maxWidth: 420,
              padding: "40px 36px",
              borderRadius: 20,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-xl)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56, height: 56, borderRadius: 14,
                background: "var(--accent-subtle)", border: "1px solid var(--accent-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem", margin: "0 auto 20px",
              }}
            >
              🚀
            </div>
            <h2
              className="font-display"
              style={{
                fontSize: "1.5rem", fontWeight: 700,
                color: "var(--text)", letterSpacing: "-0.02em",
                marginBottom: 10,
              }}
            >
              Bientôt disponible
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
              Sorell est en cours de développement. Rejoignez la waitlist pour être parmi les
              premiers à y accéder et bénéficier de l&apos;offre fondateur{" "}
              <span style={{ color: "var(--text)", fontWeight: 600 }}>−50% à vie</span>.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link
                href="/"
                className="btn-accent"
                onClick={() => setShowOverlay(false)}
                style={{ padding: "12px", fontSize: "0.9375rem", fontWeight: 600 }}
              >
                Rejoindre la waitlist →
              </Link>
              <button
                onClick={() => setShowOverlay(false)}
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-muted)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-muted)")}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
