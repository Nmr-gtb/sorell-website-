import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";
import NewsletterPreview from "@/components/NewsletterPreview";
import WaitlistForm from "@/components/WaitlistForm";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const IconBolt = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconSparkles = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
    <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z" />
    <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z" />
  </svg>
);
const IconEye = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);
const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const features = [
  {
    icon: <IconBolt />,
    title: "100% automatisé",
    description: "Votre newsletter se génère chaque semaine sans intervention humaine.",
  },
  {
    icon: <IconUser />,
    title: "Personnalisé par profil",
    description: "Chaque collaborateur reçoit un briefing adapté à son rôle et ses centres d'intérêt.",
  },
  {
    icon: <IconSparkles />,
    title: "Synthèses IA",
    description: "Des résumés précis et actionnables, pas de contenu générique ou de copier-coller.",
  },
  {
    icon: <IconEye />,
    title: "Veille concurrentielle",
    description: "Suivez vos concurrents, leurs levées de fonds, recrutements et annonces produits.",
  },
  {
    icon: <IconChart />,
    title: "Dashboard analytics",
    description: "Suivez les taux d'ouverture et les sujets les plus consultés par vos équipes.",
  },
  {
    icon: <IconShield />,
    title: "White-label",
    description: "Votre logo, vos couleurs, votre domaine d'envoi. Vos équipes reçoivent une newsletter qui vient de vous.",
  },
];

const steps = [
  {
    num: "01",
    title: "Choisissez vos sujets",
    description: "Sélectionnez les thèmes qui intéressent vos équipes : secteur, concurrents, technologies, tendances.",
  },
  {
    num: "02",
    title: "Ajoutez vos collaborateurs",
    description: "Importez votre liste ou invitez individuellement. Chaque profil peut avoir ses propres préférences.",
  },
  {
    num: "03",
    title: "L'IA fait le reste",
    description: "Chaque vendredi, Sorell analyse l'actualité, sélectionne les contenus pertinents et envoie la newsletter.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "Gratuit",
    desc: "Pour découvrir Sorell",
    features: ["1 newsletter générique / sem.", "1 thématique au choix", "Aperçu du produit"],
    popular: false,
  },
  {
    name: "Solo",
    price: "10€",
    desc: "Pour les indépendants",
    features: ["1 newsletter / semaine", "Livrée sur votre boîte mail", "3 thématiques au choix"],
    popular: false,
  },
  {
    name: "Pro",
    price: "50€",
    desc: "Pour les petites équipes",
    features: ["Envoi depuis votre domaine", "Jusqu'à 10 destinataires", "5 thématiques"],
    popular: true,
  },
  {
    name: "Business",
    price: "200€",
    desc: "Pour les PME ambitieuses",
    features: ["Jusqu'à 50 destinataires", "Thématiques illimitées", "Analytics + white-label"],
    popular: false,
  },
  {
    name: "Enterprise",
    price: "Sur devis",
    desc: "Pour les grandes organisations",
    features: ["Utilisateurs illimités", "API & intégration CRM", "CSM dédié"],
    popular: false,
  },
];

export default function HomePage() {
  return (
    <main style={{ background: "var(--bg)" }}>
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section
        style={{
          paddingTop: "140px",
          paddingBottom: "120px",
          padding: "140px 1.5rem 120px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          background: "var(--bg)",
        }}
      >
        <div style={{ maxWidth: 720, width: "100%" }}>
          <h1
            style={{
              fontFamily: "var(--font-inter, 'Inter', sans-serif)",
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "var(--text)",
              marginBottom: 24,
            }}
          >
            La newsletter IA que vos équipes vont vraiment lire
          </h1>

          <p
            style={{
              fontFamily: "var(--font-inter, 'Inter', sans-serif)",
              fontSize: "1.125rem",
              fontWeight: 400,
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: 40,
              maxWidth: 560,
              margin: "0 auto 40px",
            }}
          >
            Sorell génère chaque semaine une newsletter personnalisée pour chaque collaborateur. Veille sectorielle, concurrents, tendances — automatiquement.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <a
              href="#waitlist"
              className="btn-primary"
              style={{ padding: "14px 28px", fontSize: "0.9375rem", fontWeight: 500 }}
            >
              Commencer gratuitement
            </a>
            <Link
              href="/demo"
              className="btn-ghost"
              style={{ padding: "14px 28px", fontSize: "0.9375rem", fontWeight: 500 }}
            >
              Voir la démo
            </Link>
          </div>

          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            Pas de carte bancaire · Annulable à tout moment
          </p>
        </div>
      </section>

      {/* ─── APERÇU NEWSLETTER ────────────────────────────────── */}
      <section
        style={{
          background: "var(--surface-alt)",
          padding: "120px 1.5rem",
        }}
      >
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <AnimateOnScroll>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h2
                style={{
                  fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--text)",
                  marginBottom: 16,
                }}
              >
                Chaque email est personnalisé et pertinent
              </h2>
              <p
                style={{
                  fontSize: "1rem",
                  color: "var(--text-secondary)",
                  maxWidth: 520,
                  margin: "0 auto",
                  lineHeight: 1.7,
                }}
              >
                L'IA analyse vos sources, filtre le bruit, et livre l'essentiel — adapté au rôle de chaque destinataire.
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll delay={100}>
            <NewsletterPreview />
          </AnimateOnScroll>
        </div>
      </section>

      {/* ─── FONCTIONNALITÉS ──────────────────────────────────── */}
      <section id="features" style={{ background: "var(--bg)", padding: "120px 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <AnimateOnScroll>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <h2
                style={{
                  fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--text)",
                  marginBottom: 16,
                }}
              >
                Tout ce qu'il faut, rien de superflu
              </h2>
              <p style={{ fontSize: "1rem", color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
                De la collecte à la livraison, Sorell gère l'intégralité du processus de veille pour vous.
              </p>
            </div>
          </AnimateOnScroll>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
              gap: 16,
            }}
          >
            {features.map((f, i) => (
              <AnimateOnScroll key={f.title} delay={i * 60}>
                <FeatureCard {...f} />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMMENT ÇA MARCHE ────────────────────────────────── */}
      <section style={{ background: "var(--surface-alt)", padding: "120px 1.5rem" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          <AnimateOnScroll>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <h2
                style={{
                  fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--text)",
                }}
              >
                En ligne en 10 minutes
              </h2>
            </div>
          </AnimateOnScroll>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
              gap: 32,
            }}
          >
            {steps.map((step, i) => (
              <AnimateOnScroll key={step.num} delay={i * 80}>
                <div>
                  <div
                    style={{
                      height: 1,
                      background: "var(--border)",
                      marginBottom: 24,
                    }}
                  />
                  <p
                    style={{
                      fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      marginBottom: 10,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {step.num}
                  </p>
                  <h3
                    style={{
                      fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "var(--text)",
                      marginBottom: 8,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {step.title}
                  </h3>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                    {step.description}
                  </p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING TEASER ───────────────────────────────────── */}
      <section style={{ background: "var(--bg)", padding: "120px 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <AnimateOnScroll>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2
                style={{
                  fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--text)",
                  marginBottom: 16,
                }}
              >
                Tarifs simples, sans engagement
              </h2>
            </div>
          </AnimateOnScroll>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {pricingPlans.map((plan) => (
              <AnimateOnScroll key={plan.name}>
                <div
                  style={{
                    padding: "24px",
                    borderRadius: 12,
                    background: "var(--surface)",
                    border: plan.popular ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                    position: "relative",
                  }}
                >
                  {plan.popular && (
                    <span
                      style={{
                        position: "absolute",
                        top: -11,
                        left: 16,
                        padding: "2px 10px",
                        borderRadius: 999,
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        background: "var(--accent)",
                        color: "white",
                      }}
                    >
                      Populaire
                    </span>
                  )}
                  <div
                    style={{
                      fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text)",
                      letterSpacing: "-0.03em",
                      marginBottom: 2,
                    }}
                  >
                    {plan.price}
                    {plan.price !== "Sur devis" && plan.price !== "Gratuit" && (
                      <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--text-secondary)", marginLeft: 3 }}>
                        /mois
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      color: "var(--text)",
                      marginBottom: 3,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {plan.name}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: 16 }}>
                    {plan.desc}
                  </div>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: "0.8125rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: plan.popular ? "var(--accent)" : "var(--success)" }}>
                          <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          <div style={{ textAlign: "center" }}>
            <Link
              href="/pricing"
              className="link-accent"
              style={{ fontSize: "0.9375rem" }}
            >
              Voir tous les détails →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────── */}
      <section
        id="waitlist"
        style={{ background: "var(--surface-alt)", padding: "100px 1.5rem" }}
      >
        <AnimateOnScroll>
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <h2
              style={{
                fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--text)",
                marginBottom: 16,
              }}
            >
              Prêt à transformer la veille de vos équipes ?
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.7 }}>
              Commencez gratuitement. Votre premier briefing en 48h.
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: 36 }}>
              Offre fondateur : −50% à vie pour les 50 premiers inscrits
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <WaitlistForm buttonText="Commencer gratuitement" />
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      <Footer />
    </main>
  );
}
