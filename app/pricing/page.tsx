"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingCard from "@/components/PricingCard";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const FAQ = [
  {
    q: "Comment fonctionne la génération de contenu ?",
    a: "Sorell utilise des modèles de langage de dernière génération pour analyser des centaines de sources d'actualité chaque semaine. L'IA sélectionne, synthétise et formate les contenus les plus pertinents selon les thématiques et profils configurés. Chaque synthèse est relue par nos algorithmes de fiabilité avant envoi.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Absolument. Sorell est 100% conforme au RGPD. Vos données sont hébergées exclusivement sur des serveurs européens, chiffrées en transit et au repos (AES-256). Nous ne revendons jamais vos données et votre liste de collaborateurs reste strictement privée.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui, sans engagement et sans frais de résiliation. Vous pouvez annuler votre abonnement en un clic depuis votre dashboard. L'accès reste actif jusqu'à la fin de la période payée.",
  },
  {
    q: "L'IA peut-elle se tromper ?",
    a: "Nos algorithmes sélectionnent uniquement des sources vérifiées (presse reconnue, sites officiels, publications académiques). Chaque article inclut un lien vers la source originale. Sur les plans Business et Enterprise, vous pouvez activer une étape de relecture manuelle avant l'envoi.",
  },
  {
    q: "Proposez-vous une période d'essai ?",
    a: "Oui, 14 jours d'essai gratuit sur tous les plans, sans carte bancaire requise. Vous recevez un échantillon de newsletter dès votre inscription. L'offre fondateur (−50% à vie) est disponible pour les 50 premiers inscrits.",
  },
];

const starterFeatures = [
  "Jusqu'à 10 utilisateurs",
  "1 thématique de veille",
  "Envoi hebdomadaire",
  "Synthèses IA incluses",
  "Templates responsive",
  "Support email",
];

const businessFeatures = [
  "Jusqu'à 50 utilisateurs",
  "Thématiques illimitées",
  "2 envois par semaine",
  "Personnalisation par rôle",
  "Veille concurrentielle",
  "Dashboard analytics complet",
  "White-label inclus",
  "Support prioritaire 24/7",
];

const enterpriseFeatures = [
  "Utilisateurs illimités",
  "Thématiques illimitées",
  "Fréquence personnalisée",
  "API & intégration CRM",
  "Analytics avancés & export",
  "SSO / SAML",
  "CSM dédié",
  "SLA 99,9%",
];

export default function PricingPage() {
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div>
      <Navbar />

      {/* Header */}
      <section
        className="hero-bg"
        style={{ paddingTop: "7rem", padding: "7rem 1.5rem 4rem", textAlign: "center" }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <p className="section-label" style={{ marginBottom: 16 }}>Tarifs</p>
          <h1
            style={{
              fontFamily: "var(--font-display, Georgia, serif)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              lineHeight: 1.12,
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            Tarification simple
            <br />
            <em style={{ color: "var(--accent)", fontStyle: "italic" }}>et transparente</em>
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
            Choisissez le plan adapté à votre équipe. Changez ou annulez à tout moment.
          </p>

          {/* Toggle mensuel / annuel */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginTop: 28,
              padding: "4px",
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
                padding: "6px 16px",
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
                padding: "6px 16px",
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
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
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

      {/* Pricing cards */}
      <section style={{ padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
              gap: 20,
            }}
          >
            <PricingCard
              name="Starter"
              price={49}
              annualPrice={39}
              period={period}
              tagline="Pour les petites équipes"
              features={starterFeatures}
              cta="Commencer gratuitement"
              ctaHref="/"
            />
            <PricingCard
              name="Business"
              price={199}
              annualPrice={159}
              period={period}
              tagline="Pour les PME ambitieuses"
              features={businessFeatures}
              cta="Commencer gratuitement"
              ctaHref="/"
              popular
            />
            <PricingCard
              name="Enterprise"
              price={null}
              annualPrice={null}
              period={period}
              tagline="Pour les grandes organisations"
              features={enterpriseFeatures}
              cta="Nous contacter"
              ctaHref="mailto:contact@sorell.fr"
              enterprise
            />
          </div>
        </div>
      </section>

      {/* Included note */}
      <section style={{ padding: "0 1.5rem 3.5rem" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 14,
              padding: "18px 22px",
              borderRadius: 12,
              background: "var(--surface-alt)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "var(--accent-subtle)",
                border: "1px solid var(--accent-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>
                Tous les plans incluent
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                Hébergement sur serveurs européens · Chiffrement AES-256 · RGPD compliant ·
                Mises à jour automatiques · Onboarding guidé · 14 jours d&apos;essai gratuit
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: "var(--surface-alt)", padding: "4.5rem 1.5rem" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <AnimateOnScroll>
            <h2
              style={{
                fontFamily: "var(--font-display, Georgia, serif)",
                fontSize: "clamp(1.625rem, 3.5vw, 2.5rem)",
                fontWeight: 600,
                letterSpacing: "-0.01em",
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
                    background: "var(--surface)",
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
                    <span
                      style={{
                        fontFamily: "var(--font-body, sans-serif)",
                        fontSize: "0.9375rem",
                        fontWeight: 500,
                        color: "var(--text)",
                        flex: 1,
                      }}
                    >
                      {item.q}
                    </span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 16 16"
                      fill="none"
                      style={{
                        color: "var(--text-muted)",
                        flexShrink: 0,
                        transform: openFaq === i ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: "0 20px 18px" }}>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--text-secondary)",
                          lineHeight: 1.7,
                        }}
                      >
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
      <section style={{ padding: "4.5rem 1.5rem", textAlign: "center" }}>
        <AnimateOnScroll>
          <h2
            style={{
              fontFamily: "var(--font-display, Georgia, serif)",
              fontSize: "clamp(1.625rem, 3vw, 2.25rem)",
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 12,
            }}
          >
            Toujours des questions&nbsp;?
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: 28 }}>
            Notre équipe répond sous 24h. Ou testez directement avec une démo gratuite.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <a href="mailto:contact@sorell.fr" className="btn-ghost" style={{ padding: "10px 22px", fontSize: "0.875rem" }}>
              Nous contacter
            </a>
            <a href="/demo" className="btn-primary" style={{ padding: "10px 22px", fontSize: "0.875rem" }}>
              Essayer la démo →
            </a>
          </div>
        </AnimateOnScroll>
      </section>

      <Footer />
    </div>
  );
}
