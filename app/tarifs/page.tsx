"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingCard from "@/components/PricingCard";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { authFetch } from "@/lib/api";

// Features arrays and FAQ are built inside the component to use t()

const PRICE_MAP: Record<string, string> = {
  "pro-monthly": "price_1TE3pa7A2mOEJEeWltqInvgW",
  "pro-annual": "price_1TE3ps7A2mOEJEeW4m1wm00z",
  "business-monthly": "price_1TE3qf7A2mOEJEeWiTAz8oWd",
  "business-annual": "price_1TE3qv7A2mOEJEeWEB04fuCE",
};

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const FAQ = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
    { q: t("faq.q7"), a: t("faq.a7") },
    { q: t("faq.q8"), a: t("faq.a8") },
    { q: t("faq.q9"), a: t("faq.a9") },
    { q: t("faq.q10"), a: t("faq.a10") },
    { q: t("faq.q11"), a: t("faq.a11") },
    { q: t("faq.q12"), a: t("faq.a12") },
  ];

  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");

  const freeFeatures = [
    t("pricing.free_f1"),
    t("pricing.free_f2"),
    t("pricing.free_f3"),
    t("pricing.free_f4"),
    t("pricing.free_f5"),
    t("pricing.free_f6"),
  ];

  const proFeatures = [
    t("pricing.pro_f1"),
    t("pricing.pro_f2"),
    t("pricing.pro_f3"),
    t("pricing.pro_f4"),
    t("pricing.pro_f5"),
    t("pricing.pro_f6"),
  ];

  const businessFeatures = [
    t("pricing.biz_f1"),
    t("pricing.biz_f2"),
    t("pricing.biz_f3"),
    t("pricing.biz_f4"),
    t("pricing.biz_f5"),
    t("pricing.biz_f6"),
  ];

  const enterpriseFeatures = [
    t("pricing.ent_f1"),
    t("pricing.ent_f2"),
    t("pricing.ent_f3"),
    t("pricing.ent_f4"),
    t("pricing.ent_f5"),
    t("pricing.ent_f6"),
  ];
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: "pro" | "business") => {
    if (!user) {
      router.push("/connexion");
      return;
    }

    const priceId = PRICE_MAP[`${plan}-${period}`];
    if (!priceId) return;

    setCheckoutLoading(plan);

    const res = await authFetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({ priceId }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setCheckoutLoading(null);
    }
  };

  return (
    <div style={{ background: "var(--bg)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              { "@type": "Question", "name": "Quelle est la différence avec ChatGPT ?", "acceptedAnswer": { "@type": "Answer", "text": "ChatGPT est un outil généraliste que vous devez relancer chaque semaine avec un prompt. Sorell est automatique : vous configurez une fois, et chaque semaine votre newsletter arrive toute seule dans votre boîte mail. En plus, Sorell utilise de vraies sources web (Les Echos, Bloomberg, Reuters...) avec des liens cliquables, là où ChatGPT peut inventer des informations. Enfin, Sorell envoie à toute votre équipe et vous montre qui lit quoi - impossible avec ChatGPT." } },
              { "@type": "Question", "name": "Quelle est la différence avec Google Alerts ?", "acceptedAnswer": { "@type": "Answer", "text": "Google Alerts vous envoie des liens bruts sans résumé - vous devez tout lire vous-même. Sorell analyse les articles, les résume et vous livre un briefing éditorial prêt à lire en 5 minutes. C'est la différence entre recevoir 30 liens et recevoir un résumé clair de ce qui compte vraiment." } },
              { "@type": "Question", "name": "Est-ce que les informations sont fiables ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui. Chaque article de votre newsletter est basé sur une vraie source trouvée sur le web (presse, médias spécialisés, rapports). Chaque article contient un lien direct vers la source originale pour que vous puissiez vérifier. Sorell ne génère pas de fausses informations." } },
              { "@type": "Question", "name": "Le plan gratuit est-il vraiment gratuit ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, sans carte bancaire et sans engagement. Vous recevez 2 newsletters par mois, entièrement personnalisées avec la recherche web. Aucune fonctionnalité n'est dégradée - c'est la même qualité que le plan Pro." } },
              { "@type": "Question", "name": "Combien de temps faut-il pour configurer Sorell ?", "acceptedAnswer": { "@type": "Answer", "text": "5 minutes. Vous décrivez votre activité en quelques lignes, vous choisissez vos thématiques, et c'est tout. Votre première newsletter peut être générée immédiatement." } },
              { "@type": "Question", "name": "Pourquoi payer 19€/mois alors que le plan gratuit existe ?", "acceptedAnswer": { "@type": "Answer", "text": "Le plan gratuit est limité à 1 destinataire et 2 newsletters par mois. Le plan Pro permet d'envoyer la newsletter à votre équipe (jusqu'à 5 personnes), 4 newsletters par mois, avec analytics complets et personnalisation couleur." } },
              { "@type": "Question", "name": "Mon stagiaire peut faire la même chose, non ?", "acceptedAnswer": { "@type": "Answer", "text": "Un stagiaire passe en moyenne 2 à 4 heures par semaine pour compiler une veille sectorielle. Sorell le fait en 12 secondes, chaque semaine, sans oubli, sans absence, sans formation. Et le coût est de 19€/mois contre un salaire de stagiaire." } },
              { "@type": "Question", "name": "Puis-je annuler à tout moment ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, en un clic depuis votre profil. Pas de préavis, pas de frais. L'accès est maintenu jusqu'à la fin de la période en cours." } },
              { "@type": "Question", "name": "Mes données sont-elles sécurisées ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui. Hébergement sur serveurs européens, chiffrement AES-256, conforme RGPD. Nous ne revendons jamais vos données. Les paiements sont sécurisés par Stripe." } },
              { "@type": "Question", "name": "L'IA peut-elle se tromper ?", "acceptedAnswer": { "@type": "Answer", "text": "Comme tout outil, l'IA peut parfois manquer de précision. C'est pourquoi chaque article contient un lien vers la source originale - vous pouvez toujours vérifier. Le contenu ne constitue pas un conseil professionnel." } },
              { "@type": "Question", "name": "Puis-je modifier ma newsletter après l'avoir configurée ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, à tout moment. Vous pouvez changer vos thématiques, vos sources, votre brief et votre fréquence d'envoi quand vous le souhaitez. Les modifications sont prises en compte dès la prochaine newsletter. Aucun engagement, aucune limite de modifications." } },
              { "@type": "Question", "name": "Comment fonctionne l'essai gratuit ?", "acceptedAnswer": { "@type": "Answer", "text": "Vous avez 15 jours pour tester toutes les fonctionnalités du plan choisi. Votre carte bancaire est demandée mais vous n'êtes pas débité pendant la période d'essai. Vous pouvez annuler à tout moment avant la fin des 15 jours sans aucun frais." } }
            ]
          })
        }}
      />
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
            {t("pricing.title")}
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
            {t("pricing.subtitle")}
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
              {t("pricing.monthly")}
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
              {t("pricing.annual")}
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
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
              gap: 20,
              maxWidth: 1160,
              margin: "0 auto",
            }}
          >
            <PricingCard
              name={t("pricing.free")}
              price={0}
              annualPrice={0}
              period={period}
              tagline={t("pricing.free_desc")}
              features={freeFeatures}
              cta={t("pricing.cta_free")}
              ctaHref="/connexion"
              free
            />
            <PricingCard
              name={t("pricing.pro")}
              price={19}
              annualPrice={190}
              period={period}
              tagline={t("pricing.pro_desc")}
              features={proFeatures}
              cta={t("pricing.cta_pro")}
              onClick={() => handleCheckout("pro")}
              loading={checkoutLoading === "pro"}
              trialBadge={t("pricing.trial_badge")}
            />
            <PricingCard
              name={t("pricing.business")}
              price={49}
              annualPrice={490}
              period={period}
              tagline={t("pricing.biz_desc")}
              features={businessFeatures}
              cta={t("pricing.cta_pro")}
              onClick={() => handleCheckout("business")}
              loading={checkoutLoading === "business"}
              popular
              trialBadge={t("pricing.trial_badge")}
            />
            <PricingCard
              name={t("pricing.enterprise")}
              price={null}
              annualPrice={null}
              period={period}
              tagline={t("pricing.ent_desc")}
              features={enterpriseFeatures}
              cta={t("pricing.cta_enterprise")}
              ctaHref="mailto:noe@sorell.fr"
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
            <span style={{ fontWeight: 600, color: "var(--text)" }}>{t("pricing.included_label")}</span>{" "}
            Hébergement sur serveurs européens · Chiffrement AES-256 · RGPD compliant · Mises à jour automatiques · Onboarding guidé
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
              {t("pricing.faq_title")}
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
            {t("pricing.still_questions")}
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: 28 }}>
            {t("pricing.team_responds")}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <a href="/contact" className="btn-ghost" style={{ padding: "10px 22px", fontSize: "0.875rem" }}>
              {t("pricing.contact_us_btn")}
            </a>
            <a href="/demo" className="btn-primary" style={{ padding: "10px 22px", fontSize: "0.875rem" }}>
              {t("pricing.try_demo")}
            </a>
          </div>
        </AnimateOnScroll>
      </section>

      <Footer />
    </div>
  );
}
