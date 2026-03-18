"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import SorellLogo from "@/components/SorellLogo";

function Spinner() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth="2.5"
        strokeLinecap="round"
        style={{ animation: "spin 0.75s linear infinite" }}
      >
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return <Spinner />;

  const displayName = user.user_metadata?.full_name || user.email;
  const joinDate = new Date(user.created_at).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "0 1.5rem",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <SorellLogo />
        <button
          onClick={handleSignOut}
          className="btn-ghost"
          style={{ padding: "7px 14px", fontSize: "0.875rem" }}
        >
          Se déconnecter
        </button>
      </header>

      {/* Content */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 1.5rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: 520 }}>
          <h1
            style={{
              fontFamily: "var(--font-inter, 'Inter', sans-serif)",
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Bienvenue, {displayName} !
          </h1>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: 28 }}>
            Votre espace Sorell est en cours de préparation.
          </p>

          {/* Account card */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "24px",
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 16,
              }}
            >
              Informations du compte
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Email</span>
                <span style={{ fontSize: "0.875rem", color: "var(--text)", fontWeight: 500 }}>{user.email}</span>
              </div>
              <div style={{ height: 1, background: "var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Membre depuis</span>
                <span style={{ fontSize: "0.875rem", color: "var(--text)", fontWeight: 500 }}>{joinDate}</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/"
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
