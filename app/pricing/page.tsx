"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingCard from "@/components/PricingCard";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const FAQ = [
  {
    q: "Le plan gratuit est-il vraiment gratuit ?",
    a: "Oui, totalement. Pas de carte bancaire requise. Vous recevez une newsletter générique par semaine pour tester le produit. Passez à Solo ou Pro quand vous êtes prêt.",
  },
  {
    q: "Comment fonctionne la génération de contenu ?",
    a: "Sorell utilise des modèles de langage de dernière génération pour analyser des centaines de sources d'actualité chaque semaine. L'IA sélectionne, synthétise et formate les contenus les plus pertinents selon les thématiques et profils configurés.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Absolument. Sorell est 100% conforme au RGPD. Vos données sont hébergées exclusivement sur des serveurs européens, chiffrées en transit et au repos (AES-256). Nous ne revendons jamais vos données.",
  },
  {
    q: "Puis-je annuler à tout moment ?",
    a: "Oui, sans engagement et sans frais de résiliation. Vous pouvez annuler votre abonnement en un clic depuis votre dashboard. L'accès reste actif jusqu'à la fin de la période payée.",
  },
  {
    q: "L'IA peut-elle se tromper ?",
    a: "Nos algorithmes sélectionnent uniquement des sources vérifiées (presse reconnue, sites officiels, publications académiques). Chaque article inclut un lien vers la source originale.",
  },
  {
    q: "Proposez-vous une période d'essai ?",
    a: "Oui, 14 jours d'essai gratuit sur tous les plans payants, sans carte bancaire requise. L'offre fondateur (−50% à vie) est disponible pour les 50 premiers inscrits.",
  },
];

const freeFeatures = [
  "1 newsletter à l'inscription + 1 par mois",
  "1 thématique au choix",
  "Aperçu du produit",
  "Contenu non personnalisé",
];

const soloFeatures = [
  "1 newsletter personnalisée / semaine",
  "Livrée sur votre boîte mail",
  "3 thématiques au choix",
  "Synthèses IA avancées",
];

const proFeatures = [
  "Envoi depuis votre domaine (Gmail/Outlook)",
  "Jusqu'à 10 destinataires",
  "5 thématiques",
  "Analytics de base",
];

const enterpriseFeatures = [
  "Utilisateurs illimités",
  "API & intégration CRM",
  "CSM dédié",
  "SLA 99,9%",
];

export default function PricingPage() {
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ background: "var(--bg)" }}>
      <Navbar />

      {/* Header */}
      <section
        style={{
          paddingTop: "120px",
          padding: "120px 1.5rem 80px",
          textAlign: "center",
          background: "var(--bg)",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h1
            style={{
              fontFamily: "var(--font-inter, 'Inter', sans-serif)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            Tarifs simples, sans engagement
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            Choisissez le plan adapté à votre équipe. Changez ou annulez à tout moment.
          </p>

          {/* Toggle mensuel / annuel */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              marginTop: 32,
              padding: "4px",
              borderRadius: 999,
              background: "var(--surface-alt)",
              border: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setPeriod("monthly")}
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                padding: "6px 18px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: period === "monthly" ? "var(--bg)" : "transparent",
                color: period === "monthly" ? "var(--text)" : "var(--text-secondary)",
                transition: "all 0.15s ease",
                boxShadow: period === "monthly" ? "var(--shadow-sm)" : "none",
              }}
            >
              Mensuel
            </button>
            <button
              onClick={() => setPeriod("annual")}
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                padding: "6px 18px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: period === "annual" ? "var(--accent)" : "transparent",
                color: period === "annual" ? "white" : "var(--text-secondary)",
                transition: "all 0.15s ease",
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
      <section style={{ padding: "0 1.5rem 80px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
              gap: 20,
            }}
          >
            <PricingCard
              name="Free"
              price={0}
              annualPrice={0}
              period={period}
              tagline="Pour découvrir Sorell"
              features={freeFeatures}
              cta="Commencer gratuitement"
              ctaHref="/#waitlist"
              free
            />
            <PricingCard
              name="Solo"
              price={10}
              annualPrice={8}
              period={period}
              tagline="Pour les indépendants"
              features={soloFeatures}
              cta="Commencer gratuitement"
              ctaHref="/#waitlist"
            />
            <PricingCard
              name="Pro"
              price={50}
              annualPrice={40}
              period={period}
              tagline="Pour les petites équipes"
              features={proFeatures}
              cta="Commencer gratuitement"
              ctaHref="/#waitlist"
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
      <section style={{ padding: "0 1.5rem 80px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 8,
              background: "var(--surface-alt)",
              border: "1px solid var(--border)",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              lineHeight: 1.65,
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--text)" }}>Tous les plans incluent :</span>{" "}
            Hébergement sur serveurs européens · Chiffrement AES-256 · RGPD compliant · Mises à jour automatiques · Onboarding guidé · 14 jours d&apos;essai gratuit
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: "var(--surface-alt)", padding: "80px 1.5rem" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <AnimateOnScroll>
            <h2
              style={{
                fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
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
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    overflow: "hidden",
                    transition: "border-color 0.15s ease",
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
                        fontSize: "0.9375rem",
                        fontWeight: 500,
                        color: "var(--text)",
                        flex: 1,
                        letterSpacing: "-0.01em",
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
      <section style={{ padding: "80px 1.5rem", textAlign: "center", background: "var(--bg)" }}>
        <AnimateOnScroll>
          <h2
            style={{
              fontFamily: "var(--font-inter, 'Inter', sans-serif)",
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text)",
              marginBottom: 12,
            }}
          >
            Toujours des questions ?
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: 28 }}>
            Notre équipe répond sous 24h.
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
