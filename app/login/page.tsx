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
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <SorellLogo size="lg" />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display, Georgia, serif)",
              fontSize: "1.75rem",
              fontWeight: 600,
              color: "var(--text)",
              letterSpacing: "-0.01em",
              marginBottom: 6,
            }}
          >
            Connexion
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Accédez à votre espace Sorell
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "var(--shadow-sm)",
            padding: "28px",
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 18 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--text)",
                  marginBottom: 7,
                }}
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
              />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 7,
                }}
              >
                <label
                  style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text)" }}
                >
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
                  Mot de passe oublié&nbsp;?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-field"
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: "12px",
                fontSize: "0.9375rem",
                fontWeight: 600,
                marginTop: 4,
                justifyContent: "center",
              }}
            >
              Se connecter
            </button>
          </form>

          <div
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: "1px solid var(--border-subtle)",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
            }}
          >
            Pas encore de compte&nbsp;?{" "}
            <Link
              href="/"
              style={{ color: "var(--accent)", fontWeight: 500, textDecoration: "none" }}
            >
              Rejoindre la waitlist
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
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

      {/* "Bientôt disponible" overlay */}
      {showOverlay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            background: "rgba(28,25,21,0.60)",
            backdropFilter: "blur(12px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOverlay(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              padding: "44px 40px",
              borderRadius: 20,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-xl)",
              textAlign: "center",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: "var(--accent-subtle)",
                border: "1px solid var(--accent-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>

            <h2
              style={{
                fontFamily: "var(--font-display, Georgia, serif)",
                fontSize: "1.625rem",
                fontWeight: 600,
                color: "var(--text)",
                letterSpacing: "-0.01em",
                marginBottom: 12,
              }}
            >
              Bientôt disponible
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                marginBottom: 8,
              }}
            >
              Sorell est en cours de développement. Rejoignez la waitlist pour être parmi les
              premiers à y accéder.
            </p>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                marginBottom: 28,
              }}
            >
              Offre fondateur :{" "}
              <span style={{ color: "var(--text)", fontWeight: 600 }}>−50% à vie</span> pour
              les 50 premiers inscrits.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link
                href="/"
                className="btn-primary"
                onClick={() => setShowOverlay(false)}
                style={{
                  padding: "12px",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  justifyContent: "center",
                }}
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
