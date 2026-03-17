"use client";

import { useState } from "react";
import PricingCard from "@/components/PricingCard";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const FAQ = [
  { q: "Puis-je changer de plan à tout moment ?", a: "Oui, sans engagement. Passez d'un plan à l'autre en un clic depuis votre dashboard. Le changement prend effet immédiatement et est proratisé." },
  { q: "Comment fonctionne l'essai gratuit ?", a: "Recevez un échantillon de newsletter généré par IA gratuitement, sans carte bancaire. Vous pouvez ensuite décider de souscrire à un plan payant." },
  { q: "Combien de temps pour configurer ?", a: "10 minutes maximum. Notre wizard de configuration vous guide étape par étape. Pas besoin de compétences techniques." },
  { q: "Mes données sont-elles sécurisées ?", a: "Absolument. Sorell est 100% RGPD compliant. Vos données sont chiffrées en AES-256, hébergées en Europe, et ne sont jamais revendues à des tiers." },
  { q: "Puis-je personnaliser le design de la newsletter ?", a: "Oui, le white-label complet est disponible sur le plan Enterprise : vos couleurs, votre logo, votre domaine d'envoi personnalisé." },
];

const starterFeatures = ["1 newsletter par semaine", "1 thématique de veille", "Jusqu'à 500 destinataires", "Synthèses IA", "Templates responsive", "Support email"];
const businessFeatures = ["2 newsletters par semaine", "3 thématiques de veille", "Jusqu'à 2 000 destinataires", "Personnalisation par rôle", "Veille concurrentielle", "Dashboard analytics complet", "Support prioritaire 24/7", "Intégrations Slack & Teams"];
const enterpriseFeatures = ["Newsletters illimitées", "Thématiques illimitées", "Destinataires illimités", "White-label complet", "API & intégration CRM", "Analytics avancés & export", "SSO / SAML", "Account manager dédié", "SLA 99,9%"];

export default function PricingPage() {
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ paddingTop: "5rem" }}>
      {/* Header */}
      <section
        className="hero-bg"
        style={{ padding: "4rem 1.5rem", textAlign: "center" }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <p className="section-label" style={{ marginBottom: 14 }}>Tarifs</p>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              color: "var(--text)",
              marginBottom: 14,
            }}
          >
            Simple, transparent,{" "}
            <span className="text-accent-italic font-display">sans engagement</span>
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Choisissez le plan adapté à votre équipe. Changez ou annulez à tout moment.
          </p>

          {/* Toggle */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginTop: 28,
              padding: "6px 6px 6px 14px",
              borderRadius: 999,
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setPeriod("monthly")}
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                padding: "4px 10px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: period === "monthly" ? "var(--surface-alt)" : "transparent",
                color: period === "monthly" ? "var(--text)" : "var(--text-secondary)",
                transition: "all 0.18s ease",
              }}
            >
              Mensuel
            </button>
            <button
              onClick={() => setPeriod("annual")}
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                padding: "4px 10px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: period === "annual" ? "var(--accent)" : "transparent",
                color: period === "annual" ? "white" : "var(--text-secondary)",
                transition: "all 0.18s ease",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Annuel
              <span
                className="font-mono"
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: period === "annual" ? "rgba(255,255,255,0.2)" : "var(--success-bg)",
                  color: period === "annual" ? "white" : "var(--success)",
                }}
              >
                −20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section style={{ padding: "3.5rem 1.5rem" }}>
        <div
          style={{ maxWidth: 900, margin: "0 auto" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
              gap: 20,
            }}
          >
            <PricingCard name="Starter" price={49} annualPrice={39} period={period} tagline="Pour les petites équipes" features={starterFeatures} cta="Commencer" ctaHref="/" />
            <PricingCard name="Business" price={199} annualPrice={159} period={period} tagline="Pour les PME ambitieuses" features={businessFeatures} cta="Commencer" ctaHref="/" popular />
            <PricingCard name="Enterprise" price={499} annualPrice={399} period={period} tagline="Pour les grandes organisations" features={enterpriseFeatures} cta="Nous contacter" ctaHref="mailto:contact@sorell.fr" enterprise />
          </div>
        </div>
      </section>

      {/* Included note */}
      <section style={{ padding: "0 1.5rem 3rem" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "18px 22px",
              borderRadius: 14,
              background: "var(--surface-alt)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ fontSize: "1.125rem", flexShrink: 0, marginTop: 1 }}>💡</span>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Tous les plans incluent</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Hébergement sur serveurs européens · Chiffrement AES-256 · RGPD compliant ·
                Mises à jour automatiques · Onboarding guidé
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-alt" style={{ padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <AnimateOnScroll>
            <h2
              className="font-display"
              style={{
                fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text)",
                textAlign: "center",
                marginBottom: "2.5rem",
              }}
            >
              Questions fréquentes
            </h2>
          </AnimateOnScroll>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQ.map((item, i) => (
              <AnimateOnScroll key={i} delay={i * 50}>
                <div
                  style={{
                    borderRadius: 12,
                    border: "1px solid",
                    borderColor: openFaq === i ? "var(--accent-border)" : "var(--border)",
                    background: openFaq === i ? "var(--surface)" : "var(--surface)",
                    overflow: "hidden",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 20px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: "0.9375rem", fontWeight: 500, color: "var(--text)", flex: 1 }}>
                      {item.q}
                    </span>
                    <svg
                      width="14" height="14" viewBox="0 0 16 16" fill="none"
                      style={{
                        color: "var(--text-muted)", flexShrink: 0,
                        transform: openFaq === i ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: "0 20px 16px" }}>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
        <AnimateOnScroll>
          <h2 className="font-display" style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text)", marginBottom: 10 }}>
            Toujours des questions ?
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: 24 }}>
            Notre équipe répond sous 24h. Ou testez directement avec une démo gratuite.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <a href="mailto:contact@sorell.fr" className="btn-ghost" style={{ padding: "10px 20px", fontSize: "0.875rem" }}>
              Nous contacter
            </a>
            <a href="/demo" className="btn-accent" style={{ padding: "10px 20px", fontSize: "0.875rem" }}>
              Essayer la démo →
            </a>
          </div>
        </AnimateOnScroll>
      </section>
    </div>
  );
}
