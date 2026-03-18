"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SorellLogo from "@/components/SorellLogo";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

type Mode = "login" | "signup" | "reset";

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ animation: "spin 0.75s linear infinite" }}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const switchMode = (m: Mode) => {
    clearMessages();
    setMode(m);
  };

  const handleGoogleLogin = async () => {
    clearMessages();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Vérifiez votre email pour confirmer votre compte.");
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Lien de réinitialisation envoyé !");
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <Spinner />
      </div>
    );
  }

  const titles: Record<Mode, { title: string; sub: string }> = {
    login: { title: "Connectez-vous", sub: "Accédez à votre espace Sorell" },
    signup: { title: "Créer un compte", sub: "Commencez gratuitement avec Sorell" },
    reset: { title: "Réinitialiser le mot de passe", sub: "Recevez un lien par email" },
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    fontSize: "0.9375rem",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "var(--font-inter, 'Inter', sans-serif)",
    transition: "border-color 0.15s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--text)",
    marginBottom: 7,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "5rem 1.5rem 2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo + heading */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <SorellLogo size="lg" />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-inter, 'Inter', sans-serif)",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.02em",
              marginBottom: 6,
            }}
          >
            {titles[mode].title}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            {titles[mode].sub}
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "28px",
          }}
        >
          {/* Google button (not on reset) */}
          {mode !== "reset" && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                  transition: "border-color 0.15s ease",
                }}
                onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
              >
                <GoogleIcon />
                Continuer avec Google
              </button>

              {/* Separator */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  margin: "20px 0",
                }}
              >
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>ou</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>
            </>
          )}

          {/* Login form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Adresse email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@entreprise.fr"
                  required
                  style={inputStyle}
                  className="input-field"
                />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Mot de passe</label>
                  <button
                    type="button"
                    onClick={() => switchMode("reset")}
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
                  style={inputStyle}
                  className="input-field"
                />
              </div>
              {error && <p style={{ fontSize: "0.875rem", color: "#ef4444", margin: 0 }}>{error}</p>}
              {success && <p style={{ fontSize: "0.875rem", color: "#22c55e", margin: 0 }}>{success}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ padding: "12px", fontSize: "0.9375rem", fontWeight: 500, justifyContent: "center", marginTop: 4, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? <Spinner /> : "Se connecter"}
              </button>
            </form>
          )}

          {/* Signup form */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Nom complet</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                  required
                  style={inputStyle}
                  className="input-field"
                />
              </div>
              <div>
                <label style={labelStyle}>Adresse email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@entreprise.fr"
                  required
                  style={inputStyle}
                  className="input-field"
                />
              </div>
              <div>
                <label style={labelStyle}>Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  required
                  minLength={6}
                  style={inputStyle}
                  className="input-field"
                />
              </div>
              {error && <p style={{ fontSize: "0.875rem", color: "#ef4444", margin: 0 }}>{error}</p>}
              {success && <p style={{ fontSize: "0.875rem", color: "#22c55e", margin: 0 }}>{success}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ padding: "12px", fontSize: "0.9375rem", fontWeight: 500, justifyContent: "center", marginTop: 4, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? <Spinner /> : "Créer mon compte"}
              </button>
            </form>
          )}

          {/* Reset form */}
          {mode === "reset" && (
            <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={labelStyle}>Adresse email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@entreprise.fr"
                  required
                  style={inputStyle}
                  className="input-field"
                />
              </div>
              {error && <p style={{ fontSize: "0.875rem", color: "#ef4444", margin: 0 }}>{error}</p>}
              {success && <p style={{ fontSize: "0.875rem", color: "#22c55e", margin: 0 }}>{success}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ padding: "12px", fontSize: "0.9375rem", fontWeight: 500, justifyContent: "center", marginTop: 4, opacity: loading ? 0.7 : 1 }}
              >
                {loading ? <Spinner /> : "Envoyer le lien"}
              </button>
              <button
                type="button"
                onClick={() => switchMode("login")}
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "center",
                }}
              >
                ← Retour à la connexion
              </button>
            </form>
          )}

          {/* Footer links */}
          {mode !== "reset" && (
            <div
              style={{
                marginTop: 20,
                paddingTop: 20,
                borderTop: "1px solid var(--border)",
                textAlign: "center",
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
              }}
            >
              {mode === "login" ? (
                <>
                  Pas encore de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    style={{ color: "var(--accent)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "inherit" }}
                  >
                    Créer un compte
                  </button>
                </>
              ) : (
                <>
                  Déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    style={{ color: "var(--accent)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "inherit" }}
                  >
                    Se connecter
                  </button>
                </>
              )}
            </div>
          )}
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
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
