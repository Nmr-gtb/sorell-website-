"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

function getInitials(user: { user_metadata?: { full_name?: string }; email?: string }) {
  const name = user.user_metadata?.full_name;
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }
  return (user.email?.[0] ?? "?").toUpperCase();
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [newsletter, setNewsletter] = useState(true);

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.email || "";
  const joinDate = new Date(user.created_at).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ padding: 32, maxWidth: 700 }}>
      {/* Page header */}
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: "var(--text)",
          letterSpacing: "-0.02em",
          marginBottom: 32,
        }}
      >
        Mon profil
      </h1>

      {/* Profile card */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--accent)",
              color: "var(--accent-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {getInitials(user)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Membre depuis le {joinDate}
            </div>
          </div>
          <button
            className="btn-ghost"
            disabled
            style={{ fontSize: 14, padding: "6px 14px", opacity: 0.5, cursor: "not-allowed" }}
          >
            Modifier
          </button>
        </div>
      </div>

      {/* Subscription card */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 16,
          }}
        >
          Mon abonnement
        </h2>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text)",
                }}
              >
                Free
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 100,
                  background: "var(--accent-subtle)",
                  color: "var(--accent)",
                  border: "1px solid var(--accent-border)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                Actif
              </span>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Accès aux fonctionnalités de base. Jusqu&apos;à 3 destinataires, 1 newsletter par semaine.
            </p>
          </div>
        </div>
        <Link href="/pricing" className="btn-ghost" style={{ fontSize: 14, padding: "7px 14px" }}>
          Changer de plan →
        </Link>
      </div>

      {/* Account settings card */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 20,
          }}
        >
          Paramètres du compte
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Name field */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
            >
              Nom complet
            </label>
            <input
              className="input-field"
              value={user.user_metadata?.full_name || ""}
              disabled
              style={{ opacity: 0.7, cursor: "not-allowed" }}
            />
          </div>

          {/* Email field */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 6,
              }}
            >
              Adresse email
            </label>
            <input
              className="input-field"
              value={user.email || ""}
              disabled
              style={{ opacity: 0.7, cursor: "not-allowed" }}
            />
          </div>

          {/* Newsletter toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 4,
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>
                Newsletter Sorell
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Recevez nos actualités et annonces produit
              </div>
            </div>
            <button
              onClick={() => setNewsletter((v) => !v)}
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: newsletter ? "var(--accent)" : "var(--border)",
                border: "none",
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s ease",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 3,
                  left: newsletter ? 21 : 3,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "white",
                  transition: "left 0.2s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border)", marginTop: 8 }} />

          {/* Delete account */}
          <button
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              color: "var(--error)",
              opacity: 0.7,
              textAlign: "left",
              padding: 0,
            }}
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>
  );
}
