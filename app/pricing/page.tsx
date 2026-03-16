"use client";

import { useState } from "react";
import PricingCard from "@/components/PricingCard";

const FAQ = [
  {
    q: "Puis-je changer de plan à tout moment ?",
    a: "Oui, sans engagement. Passez d'un plan à l'autre en un clic depuis votre dashboard. Le changement prend effet immédiatement et est proratisé.",
  },
  {
    q: "Comment fonctionne l'essai gratuit ?",
    a: "Recevez un échantillon de newsletter généré par IA gratuitement, sans carte bancaire. Vous pouvez ensuite décider de souscrire à un plan payant.",
  },
  {
    q: "Combien de temps pour configurer ?",
    a: "10 minutes maximum. Notre wizard de configuration vous guide étape par étape. Pas besoin de compétences techniques.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Absolument. Sorell est 100% RGPD compliant. Vos données sont chiffrées en AES-256, hébergées en Europe, et ne sont jamais revendues à des tiers.",
  },
  {
    q: "Puis-je personnaliser le design de la newsletter ?",
    a: "Oui, le white-label complet est disponible sur le plan Enterprise : vos couleurs, votre logo, votre domaine d'envoi.",
  },
];

const starterFeatures = [
  "1 newsletter par semaine",
  "1 thématique de veille",
  "Jusqu'à 500 destinataires",
  "Synthèses IA",
  "Templates d'emails responsive",
  "Support email",
];

const businessFeatures = [
  "2 newsletters par semaine",
  "3 thématiques de veille",
  "Jusqu'à 2 000 destinataires",
  "Personnalisation par rôle",
  "Veille concurrentielle",
  "Dashboard analytics complet",
  "Support prioritaire 24/7",
  "Intégrations Slack & Teams",
];

const enterpriseFeatures = [
  "Newsletters illimitées",
  "Thématiques illimitées",
  "Destinataires illimités",
  "White-label complet",
  "API & intégration CRM",
  "Analytics avancés & export",
  "SSO / SAML",
  "Account manager dédié",
  "SLA 99,9%",
];

export default function PricingPage() {
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="pt-24">
      {/* Header */}
      <section className="mesh-bg text-center py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div
            className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full mb-5"
            style={{
              background: "rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.2)",
              color: "#a78bfa",
            }}
          >
            Tarifs
          </div>
          <h1
            className="font-display text-5xl md:text-6xl font-bold mb-4 leading-tight"
            style={{ color: "#f0f0f5", letterSpacing: "-0.02em" }}
          >
            Simple, transparent,{" "}
            <span className="gradient-text-italic font-display">sans engagement</span>
          </h1>
          <p className="text-lg" style={{ color: "#9090aa" }}>
            Choisissez le plan adapté à votre équipe. Changez ou annulez à tout moment.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span
              className="text-sm font-medium cursor-pointer"
              style={{ color: period === "monthly" ? "#f0f0f5" : "#9090aa" }}
              onClick={() => setPeriod("monthly")}
            >
              Mensuel
            </span>
            <button
              onClick={() => setPeriod(period === "monthly" ? "annual" : "monthly")}
              className="relative w-12 h-6 rounded-full transition-all duration-200"
              style={{ background: period === "annual" ? "#7c3aed" : "#2a2a3a" }}
            >
              <span
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200"
                style={{ left: period === "annual" ? "28px" : "4px" }}
              />
            </button>
            <span
              className="text-sm font-medium cursor-pointer flex items-center gap-2"
              style={{ color: period === "annual" ? "#f0f0f5" : "#9090aa" }}
              onClick={() => setPeriod("annual")}
            >
              Annuel
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
              >
                −20%
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-5">
            <PricingCard
              name="Starter"
              price={49}
              annualPrice={39}
              period={period}
              tagline="Pour les petites équipes"
              features={starterFeatures}
              cta="Commencer"
              ctaHref="/"
            />
            <PricingCard
              name="Business"
              price={199}
              annualPrice={159}
              period={period}
              tagline="Pour les PME ambitieuses"
              features={businessFeatures}
              cta="Commencer"
              ctaHref="/"
              popular
            />
            <PricingCard
              name="Enterprise"
              price={499}
              annualPrice={399}
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

      {/* Feature comparison note */}
      <section className="py-8 px-6">
        <div className="max-w-3xl mx-auto">
          <div
            className="flex items-start gap-4 p-5 rounded-2xl border"
            style={{ background: "#16161f", borderColor: "#1e1e2a" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
              style={{ background: "rgba(124,58,237,0.1)" }}
            >
              💡
            </div>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#f0f0f5" }}>
                Tous les plans incluent
              </p>
              <p className="text-sm" style={{ color: "#9090aa" }}>
                Hébergement sur serveurs européens · Chiffrement AES-256 · RGPD compliant ·
                Mises à jour automatiques · Onboarding guidé
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6" style={{ background: "#0d0d14" }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="font-display text-4xl font-bold"
              style={{ color: "#f0f0f5", letterSpacing: "-0.02em" }}
            >
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="rounded-2xl border overflow-hidden transition-all duration-200"
                style={{
                  background: openFaq === i ? "#1c1c28" : "#16161f",
                  borderColor: openFaq === i ? "rgba(124,58,237,0.25)" : "#1e1e2a",
                }}
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-medium pr-4" style={{ color: "#f0f0f5" }}>
                    {item.q}
                  </span>
                  <svg
                    className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{
                      color: "#5a5a72",
                      transform: openFaq === i ? "rotate(180deg)" : "none",
                    }}
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-sm leading-relaxed" style={{ color: "#9090aa" }}>
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h2
            className="font-display text-3xl font-bold mb-3"
            style={{ color: "#f0f0f5", letterSpacing: "-0.02em" }}
          >
            Toujours des questions ?
          </h2>
          <p className="text-base mb-8" style={{ color: "#9090aa" }}>
            Notre équipe répond sous 24h. Ou testez directement avec une démo gratuite.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="mailto:contact@sorell.fr"
              className="btn-ghost px-6 py-3 text-sm font-medium"
            >
              Nous contacter
            </a>
            <a href="/demo" className="btn-accent px-6 py-3 text-sm font-semibold">
              Essayer la démo →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
