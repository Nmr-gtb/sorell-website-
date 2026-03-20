"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const email = searchParams.get("email");

  const isSuccess = status === "success";

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 1.5rem 80px",
      }}
    >
      <div style={{ maxWidth: 500, width: "100%", textAlign: "center" }}>
        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: isSuccess ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            border: `1.5px solid ${isSuccess ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}
        >
          {isSuccess ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-inter, 'Inter', sans-serif)",
            fontSize: "1.75rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--text)",
            marginBottom: 16,
          }}
        >
          {isSuccess ? "Vous êtes désabonné" : "Une erreur est survenue"}
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: "1rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: 32,
          }}
        >
          {isSuccess ? (
            <>
              L&apos;adresse{" "}
              {email && (
                <span style={{ fontWeight: 500, color: "var(--text)" }}>{email}</span>
              )}{" "}
              a été retirée de la liste de diffusion. Vous ne recevrez plus de newsletters.
            </>
          ) : (
            <>
              Le désabonnement n&apos;a pas pu être effectué. Contactez-nous à{" "}
              <a
                href="mailto:noe@sorell.fr"
                style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 500 }}
              >
                noe@sorell.fr
              </a>{" "}
              pour être retiré manuellement.
            </>
          )}
        </p>

        {/* CTA */}
        <Link
          href={isSuccess ? "/" : "/contact"}
          className="btn-primary"
          style={{ display: "inline-flex", padding: "11px 28px", fontSize: "0.9375rem" }}
        >
          {isSuccess ? "Retour à l'accueil →" : "Nous contacter →"}
        </Link>
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />
      <Suspense fallback={<main style={{ flex: 1 }} />}>
        <UnsubscribeContent />
      </Suspense>
      <Footer />
    </div>
  );
}
