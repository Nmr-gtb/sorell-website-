import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";
import NewsletterPreview from "@/components/NewsletterPreview";
import WaitlistForm from "@/components/WaitlistForm";
import AnimateOnScroll from "@/components/AnimateOnScroll";

// SVG icons for feature cards
const IconBolt = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconSparkles = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
    <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z" />
    <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z" />
  </svg>
);
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);
const IconShield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
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

export default function HomePage() {
  return (
    <main>
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section
        className="hero-bg"
        style={{
          paddingTop: "8rem",
          paddingBottom: "6rem",
          padding: "8rem 1.5rem 6rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "90vh",
        }}
      >
        <div style={{ maxWidth: 680, width: "100%" }}>
          {/* Badge */}
          <div className="badge" style={{ marginBottom: 32, display: "inline-flex" }}>
            <span className="dot-live" />
            Newsletter IA pour entreprises
          </div>

          {/* H1 */}
          <h1
            style={{
              fontFamily: "var(--font-display, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "clamp(2.75rem, 7vw, 4.5rem)",
              fontWeight: 600,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              color: "var(--text)",
              marginBottom: 24,
            }}
          >
            Vos équipes méritent
            <br />
            une newsletter{" "}
            <em
              style={{
                color: "var(--accent)",
                fontStyle: "italic",
              }}
            >
              intelligente
            </em>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
              fontSize: "clamp(1rem, 2.5vw, 1.125rem)",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: 36,
              maxWidth: 540,
              margin: "0 auto 36px",
            }}
          >
            Sorell génère automatiquement une newsletter personnalisée pour chaque collaborateur.
            Actualités sectorielles, concurrents, tendances —{" "}
            <span style={{ color: "var(--text)", fontWeight: 500 }}>livrée chaque semaine.</span>
          </p>

          {/* Waitlist form */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <WaitlistForm buttonText="Rejoindre la waitlist" />
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Gratuit · Pas de carte bancaire · Offre fondateur −50%
            </p>
          </div>

          {/* Mini email preview */}
          <div
            style={{
              marginTop: 48,
              display: "inline-block",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "var(--shadow-md)",
              padding: "14px 16px",
              maxWidth: 380,
              width: "100%",
              textAlign: "left",
            }}
          >
            {/* Top row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-display, Georgia, serif)",
                    fontStyle: "italic",
                    fontWeight: 600,
                    fontSize: "0.6875rem",
                    color: "white",
                    flexShrink: 0,
                  }}
                >
                  S
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-display, Georgia, serif)",
                    fontStyle: "italic",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  Sorell
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>NovaTech</span>
            </div>

            {/* Subject line */}
            <p
              style={{
                fontFamily: "var(--font-display, Georgia, serif)",
                fontSize: "0.875rem",
                fontWeight: 500,
                fontStyle: "italic",
                color: "var(--text)",
                marginBottom: 10,
                lineHeight: 1.3,
              }}
            >
              Votre briefing de la semaine
            </p>

            {/* Bullets */}
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {["Claude 4.6 · Réglementation IA", "Mistral levée 600M€", "IA Act : conformité août"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                marginTop: 10,
                paddingTop: 8,
                borderTop: "1px solid var(--border-subtle)",
                fontSize: "0.625rem",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              Généré automatiquement · Sorell
            </div>
          </div>

          {/* Proof points */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "8px 28px",
              marginTop: 28,
            }}
          >
            {["Contenu généré par IA", "Personnalisé par collaborateur", "RGPD compliant"].map((p) => (
              <div
                key={p}
                style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: "var(--text-secondary)" }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="var(--success)" strokeWidth="1.3" opacity="0.5" />
                  <path d="M5 8l2 2 4-4" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── APERÇU PRODUIT ───────────────────────────────────── */}
      <section
        id="features"
        style={{
          background: "var(--surface-alt)",
          padding: "5rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))",
              gap: "4rem",
              alignItems: "center",
            }}
          >
            {/* Text */}
            <AnimateOnScroll>
              <p className="section-label" style={{ marginBottom: 14 }}>Aperçu produit</p>
              <h2
                style={{
                  fontFamily: "var(--font-display, Georgia, serif)",
                  fontSize: "clamp(1.875rem, 4vw, 3rem)",
                  fontWeight: 600,
                  lineHeight: 1.15,
                  letterSpacing: "-0.01em",
                  color: "var(--text)",
                  marginBottom: 20,
                }}
              >
                Une newsletter que vos équipes{" "}
                <em style={{ color: "var(--accent)", fontStyle: "italic" }}>
                  attendent avec impatience
                </em>
              </h2>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                  marginBottom: 28,
                }}
              >
                Fini les newsletters génériques que personne ne lit. Sorell analyse les sources
                les plus pertinentes pour chaque profil et génère un briefing synthétique —
                l&apos;essentiel et rien que l&apos;essentiel.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {[
                  "Livraison chaque lundi matin à 8h00",
                  "Synthèses en 3 phrases maximum par article",
                  "Sources vérifiées avec lien vers l'article original",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{item}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/demo"
                className="btn-primary"
                style={{ padding: "11px 24px", fontSize: "0.9375rem", fontWeight: 600, gap: 6 }}
              >
                Essayer la démo en live
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </AnimateOnScroll>

            {/* Email preview */}
            <AnimateOnScroll delay={100}>
              <NewsletterPreview />
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ─── FONCTIONNALITÉS ──────────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <AnimateOnScroll>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <p className="section-label" style={{ marginBottom: 14 }}>Fonctionnalités</p>
              <h2
                style={{
                  fontFamily: "var(--font-display, Georgia, serif)",
                  fontSize: "clamp(1.875rem, 4vw, 3rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "var(--text)",
                  marginBottom: 14,
                }}
              >
                Tout ce dont votre équipe a besoin
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", maxWidth: 520, margin: "0 auto" }}>
                De la collecte à la livraison, Sorell gère l&apos;intégralité du processus de veille pour vous.
              </p>
            </div>
          </AnimateOnScroll>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 290px), 1fr))",
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
      <section style={{ background: "var(--surface-alt)", padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <AnimateOnScroll>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <p className="section-label" style={{ marginBottom: 14 }}>Comment ça marche</p>
              <h2
                style={{
                  fontFamily: "var(--font-display, Georgia, serif)",
                  fontSize: "clamp(1.875rem, 4vw, 3rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "var(--text)",
                }}
              >
                Configuré en{" "}
                <em style={{ color: "var(--accent)", fontStyle: "italic" }}>10 minutes</em>
              </h2>
            </div>
          </AnimateOnScroll>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {steps.map((step, i) => (
              <AnimateOnScroll key={step.num} delay={i * 80}>
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    boxShadow: "var(--shadow-sm)",
                    padding: "24px 28px",
                    display: "flex",
                    gap: 20,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-display, Georgia, serif)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      fontStyle: "italic",
                      color: "var(--accent)",
                      flexShrink: 0,
                      lineHeight: 1,
                      opacity: 0.7,
                      minWidth: 36,
                    }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <h3
                      style={{
                        fontFamily: "var(--font-body, sans-serif)",
                        fontSize: "0.9375rem",
                        fontWeight: 600,
                        color: "var(--text)",
                        marginBottom: 6,
                      }}
                    >
                      {step.title}
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TARIFS (teaser) ──────────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <AnimateOnScroll>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <p className="section-label" style={{ marginBottom: 14 }}>Tarifs</p>
              <h2
                style={{
                  fontFamily: "var(--font-display, Georgia, serif)",
                  fontSize: "clamp(1.875rem, 4vw, 3rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                  color: "var(--text)",
                  marginBottom: 12,
                }}
              >
                Simple et transparent
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)" }}>
                Sans engagement. Changez ou annulez à tout moment.
              </p>
            </div>
          </AnimateOnScroll>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            {[
              {
                name: "Starter",
                price: "49€",
                desc: "Pour les petites équipes",
                features: ["Jusqu'à 10 utilisateurs", "1 thématique de veille", "Envoi hebdomadaire", "Support email"],
                popular: false,
              },
              {
                name: "Business",
                price: "199€",
                desc: "Pour les PME ambitieuses",
                features: ["Jusqu'à 50 utilisateurs", "Thématiques illimitées", "2 envois par semaine", "Analytics + White-label"],
                popular: true,
              },
              {
                name: "Enterprise",
                price: "Sur devis",
                desc: "Pour les grandes organisations",
                features: ["Utilisateurs illimités", "API & intégration CRM", "CSM dédié", "SLA 99,9%"],
                popular: false,
              },
            ].map((plan) => (
              <AnimateOnScroll key={plan.name}>
                <div
                  style={{
                    padding: "24px",
                    borderRadius: 12,
                    background: "var(--surface)",
                    border: plan.popular ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                    boxShadow: plan.popular ? "var(--shadow-md)" : "var(--shadow-sm)",
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
                        fontFamily: "var(--font-body, sans-serif)",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        background: "var(--accent)",
                        color: "white",
                      }}
                    >
                      Recommandé
                    </span>
                  )}
                  <div
                    style={{
                      fontFamily: "var(--font-display, Georgia, serif)",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--text)",
                      marginBottom: 2,
                    }}
                  >
                    {plan.price}
                    {plan.price !== "Sur devis" && (
                      <span
                        style={{
                          fontFamily: "var(--font-body, sans-serif)",
                          fontSize: "0.875rem",
                          fontWeight: 400,
                          color: "var(--text-secondary)",
                          marginLeft: 3,
                        }}
                      >
                        /mois
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display, Georgia, serif)",
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "var(--text)",
                      marginBottom: 3,
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
                          gap: 7,
                          fontSize: "0.8125rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span
                          style={{
                            color: plan.popular ? "var(--accent)" : "var(--success)",
                            fontWeight: 700,
                          }}
                        >
                          ✓
                        </span>
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
              className="btn-ghost"
              style={{ padding: "10px 24px", fontSize: "0.875rem", gap: 6 }}
            >
              Voir tous les détails et options
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────── */}
      <section style={{ background: "var(--surface-alt)", padding: "5rem 1.5rem" }}>
        <AnimateOnScroll>
          <div
            style={{
              maxWidth: 600,
              margin: "0 auto",
              textAlign: "center",
              padding: "52px 40px",
              borderRadius: 20,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div className="badge" style={{ marginBottom: 24, display: "inline-flex" }}>
              Offre fondateur — 50 places
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display, Georgia, serif)",
                fontSize: "clamp(1.625rem, 3.5vw, 2.375rem)",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "var(--text)",
                marginBottom: 14,
                lineHeight: 1.2,
              }}
            >
              Recevez votre premier briefing gratuitement
            </h2>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: 6 }}>
              Offre fondateur :{" "}
              <strong style={{ color: "var(--text)" }}>−50% à vie</strong> pour les 50 premiers inscrits.
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: 32 }}>
              Gratuit · Pas de carte bancaire · Pas de spam.
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <WaitlistForm buttonText="Rejoindre maintenant →" />
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      <Footer />
    </main>
  );
}
