"use client";

import Link from "next/link";
import { useState } from "react";

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
      className="min-h-screen flex items-center justify-center px-6"
      style={{ paddingTop: "80px" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold mb-4"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
              fontFamily: "Georgia, serif",
              boxShadow: "0 8px 24px rgba(124,58,237,0.3)",
            }}
          >
            S
          </div>
          <h1
            className="text-2xl font-semibold mb-1"
            style={{ color: "#f0f0f5", letterSpacing: "-0.01em" }}
          >
            Connectez-vous
          </h1>
          <p className="text-sm text-center" style={{ color: "#9090aa" }}>
            Accédez à votre espace Sorell
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-7 border"
          style={{ background: "#16161f", borderColor: "#1e1e2a" }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "#9090aa" }}
              >
                Adresse email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@entreprise.fr"
                required
                className="input-field w-full px-4 py-3 text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium" style={{ color: "#9090aa" }}>
                  Mot de passe
                </label>
                <button
                  type="button"
                  className="text-xs transition-colors"
                  style={{ color: "#7c3aed" }}
                  onClick={() => setShowOverlay(true)}
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
                className="input-field w-full px-4 py-3 text-sm"
              />
            </div>

            <button
              type="submit"
              className="btn-accent w-full py-3 text-sm font-semibold mt-2"
            >
              Se connecter
            </button>
          </form>

          <div
            className="mt-5 pt-5 text-center text-sm border-t"
            style={{ borderColor: "#1e1e2a" }}
          >
            <span style={{ color: "#5a5a72" }}>Pas encore de compte ?</span>{" "}
            <Link
              href="/"
              className="font-medium transition-colors"
              style={{ color: "#8b5cf6" }}
            >
              Rejoindre la waitlist
            </Link>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-5">
          <Link
            href="/"
            className="text-sm flex items-center justify-center gap-1.5 transition-colors"
            style={{ color: "#5a5a72" }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 4l-4 4 4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>

      {/* Overlay */}
      {showOverlay && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-6"
          style={{ background: "rgba(10, 10, 15, 0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowOverlay(false);
          }}
        >
          <div
            className="w-full max-w-md p-8 rounded-3xl border text-center"
            style={{
              background: "#16161f",
              borderColor: "rgba(124,58,237,0.25)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1)",
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 mx-auto"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.2)",
              }}
            >
              🚀
            </div>
            <h2
              className="font-display text-2xl font-bold mb-3"
              style={{ color: "#f0f0f5", letterSpacing: "-0.02em" }}
            >
              Bientôt disponible
            </h2>
            <p className="text-sm leading-relaxed mb-7" style={{ color: "#9090aa" }}>
              Sorell est en cours de développement. Rejoignez la waitlist pour être parmi
              les premiers à y accéder et bénéficier de l&apos;offre fondateur −50% à vie.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="btn-accent py-3 text-sm font-semibold text-center"
                onClick={() => setShowOverlay(false)}
              >
                Rejoindre la waitlist →
              </Link>
              <button
                onClick={() => setShowOverlay(false)}
                className="text-sm py-2 transition-colors"
                style={{ color: "#5a5a72" }}
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
