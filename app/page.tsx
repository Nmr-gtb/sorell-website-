import Link from "next/link";
import FeatureCard from "@/components/FeatureCard";
import NewsletterPreview from "@/components/NewsletterPreview";
import WaitlistForm from "@/components/WaitlistForm";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const features = [
  { icon: "⚡", title: "100% automatisé", description: "Configurez une fois, recevez chaque semaine. Aucune intervention manuelle requise, jamais." },
  { icon: "🎯", title: "Personnalisé par profil", description: "Contenu adapté au rôle et aux centres d'intérêt de chaque collaborateur. Pas une newsletter générique." },
  { icon: "✦", title: "Synthèses IA", description: "Résumés intelligents et contextualisés, rédigés par IA. Pas du copier-coller d'articles." },
  { icon: "🔍", title: "Veille concurrentielle", description: "Surveillez vos concurrents automatiquement et recevez leurs mouvements stratégiques chaque semaine." },
  { icon: "📊", title: "Dashboard analytics", description: "Taux d'ouverture, clics, sujets populaires — mesurez précisément l'impact de vos newsletters." },
  { icon: "🏷️", title: "White-label", description: "Vos couleurs, votre logo, votre domaine d'envoi. Une expérience 100% à votre image." },
];

const steps = [
  { num: "01", title: "Choisissez vos sujets", description: "Définissez les thématiques clés : concurrents, tendances, réglementation, levées de fonds, innovations sectorielles..." },
  { num: "02", title: "Ajoutez vos collaborateurs", description: "Importez votre équipe et définissez les profils. Chacun reçoit un contenu adapté à son rôle et ses centres d'intérêt." },
  { num: "03", title: "L'IA fait le reste", description: "Chaque semaine, Sorell analyse des centaines de sources et génère une newsletter sur-mesure pour chaque destinataire." },
];

export default function HomePage() {
  return (
    <>
      {/* ─── HERO ─────────────────────────────────────────── */}
      <section
        className="hero-bg"
        style={{
          minHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "5rem 1.5rem 4rem",
        }}
      >
        <div style={{ maxWidth: 680, width: "100%" }}>
          {/* Badge */}
          <div
            className="badge"
            style={{ marginBottom: 28, display: "inline-flex" }}
          >
            <span className="dot-live" />
            Newsletter IA pour entreprises
          </div>

          {/* Title */}
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: "-0.025em",
              color: "var(--text)",
              marginBottom: 20,
            }}
          >
            Vos équipes méritent une newsletter{" "}
            <span className="text-accent-italic font-display">intelligente</span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.125rem)",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: 32,
              maxWidth: 560,
              margin: "0 auto 32px",
            }}
          >
            Sorell génère automatiquement une newsletter personnalisée pour chaque collaborateur.
            Actualités sectorielles, concurrents, tendances —{" "}
            <span style={{ color: "var(--text)", fontWeight: 500 }}>
              livrée chaque semaine dans leur boîte mail.
            </span>
          </p>

          {/* Form */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <WaitlistForm size="large" buttonText="Rejoindre la waitlist" />
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Gratuit. Pas de spam. Recevez un échantillon dès votre inscription.
            </p>
          </div>

          {/* Mini email preview */}
          <div
            style={{
              marginTop: 36,
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              borderRadius: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-md)",
              maxWidth: 420,
              width: "100%",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-playfair, serif)",
                fontWeight: 600, fontSize: "0.9375rem", color: "white",
                flexShrink: 0,
              }}
            >
              S
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>
                Votre briefing du lundi 17 mars
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.4,
                  marginTop: 2,
                }}
              >
                Bonjour Marie, voici vos 5 actualités clés...
              </div>
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: "0.6875rem",
                color: "var(--text-muted)",
                flexShrink: 0,
                marginLeft: "auto",
              }}
            >
              8h00
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                }}
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

      {/* ─── APERÇU ───────────────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div className="max-w-6xl mx-auto">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))",
              gap: "3.5rem",
              alignItems: "center",
            }}
          >
            {/* Text */}
            <AnimateOnScroll>
              <p className="section-label" style={{ marginBottom: 14 }}>Aperçu produit</p>
              <h2
                className="font-display"
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                  fontWeight: 700,
                  lineHeight: 1.2,
                  letterSpacing: "-0.02em",
                  color: "var(--text)",
                  marginBottom: 18,
                }}
              >
                Une newsletter que vos équipes{" "}
                <span className="text-accent-italic font-display">attendent avec impatience</span>
              </h2>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 24 }}>
                Fini les newsletters génériques que personne ne lit. Sorell analyse les sources
                les plus pertinentes pour chaque profil et génère un briefing synthétique —
                l&apos;essentiel et rien que l&apos;essentiel.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {[
                  { icon: "📬", text: "Livraison chaque lundi matin à 8h00" },
                  { icon: "✦", text: "Synthèses en 3 phrases maximum par article" },
                  { icon: "🔗", text: "Sources vérifiées avec lien vers l'article original" },
                ].map((item) => (
                  <div key={item.text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: "var(--surface-alt)", border: "1px solid var(--border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.875rem",
                      }}
                    >
                      {item.icon}
                    </span>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{item.text}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/demo"
                className="btn-accent"
                style={{ padding: "11px 22px", fontSize: "0.9375rem", fontWeight: 600, gap: 6 }}
              >
                Essayer la démo en live
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </AnimateOnScroll>

            {/* Preview */}
            <AnimateOnScroll delay={100}>
              <NewsletterPreview />
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ─── FONCTIONNALITÉS ──────────────────────────────── */}
      <section
        id="features"
        className="section-alt"
        style={{ padding: "5rem 1.5rem" }}
      >
        <div className="max-w-6xl mx-auto">
          <AnimateOnScroll>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <p className="section-label" style={{ marginBottom: 14 }}>Fonctionnalités</p>
              <h2
                className="font-display"
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--text)",
                  marginBottom: 12,
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

      {/* ─── COMMENT ÇA MARCHE ────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <AnimateOnScroll>
            <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
              <p className="section-label" style={{ marginBottom: 14 }}>Comment ça marche</p>
              <h2
                className="font-display"
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--text)",
                }}
              >
                Configuré en{" "}
                <span className="text-accent-italic font-display">10 minutes</span>
              </h2>
            </div>
          </AnimateOnScroll>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {steps.map((step, i) => (
              <AnimateOnScroll key={step.num} delay={i * 80}>
                <div
                  className="card"
                  style={{ padding: "24px 28px", display: "flex", gap: 20, alignItems: "flex-start" }}
                >
                  <div
                    className="font-display"
                    style={{
                      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                      background: "var(--accent-subtle)", border: "1px solid var(--accent-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1rem", fontWeight: 600, color: "var(--accent)",
                    }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>
                      {step.title}
                    </h3>
                    <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING RÉSUMÉ ───────────────────────────────── */}
      <section className="section-alt" style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <AnimateOnScroll>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <p className="section-label" style={{ marginBottom: 14 }}>Tarifs</p>
              <h2
                className="font-display"
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--text)",
                  marginBottom: 10,
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
              marginBottom: 28,
            }}
          >
            {[
              { name: "Starter", price: "49€", desc: "Pour les petites équipes", features: ["1 newsletter/semaine", "500 destinataires", "Synthèses IA"], popular: false },
              { name: "Business", price: "199€", desc: "Pour les PME ambitieuses", features: ["2 newsletters/semaine", "2 000 destinataires", "Veille concurrentielle", "Dashboard analytics"], popular: true },
              { name: "Enterprise", price: "499€+", desc: "Pour les grandes organisations", features: ["Newsletters illimitées", "White-label complet", "API & CRM", "Account manager dédié"], popular: false },
            ].map((plan) => (
              <AnimateOnScroll key={plan.name}>
                <div
                  style={{
                    padding: "24px",
                    borderRadius: 14,
                    background: "var(--surface)",
                    border: plan.popular ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                    boxShadow: plan.popular ? "var(--shadow-md)" : "var(--shadow-sm)",
                    position: "relative",
                  }}
                >
                  {plan.popular && (
                    <span
                      className="font-mono"
                      style={{
                        position: "absolute", top: -11, left: 16,
                        padding: "2px 10px", borderRadius: 999,
                        fontSize: "0.6875rem", fontWeight: 600,
                        background: "var(--accent)", color: "white",
                      }}
                    >
                      Recommandé
                    </span>
                  )}
                  <div
                    className="font-display"
                    style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text)", marginBottom: 2 }}
                  >
                    {plan.price}
                    <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--text-secondary)", marginLeft: 3 }}>/mois</span>
                  </div>
                  <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{plan.name}</div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: 14 }}>{plan.desc}</div>
                  <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        <span style={{ color: plan.popular ? "var(--accent)" : "var(--success)", fontWeight: 600 }}>✓</span> {f}
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
              style={{ padding: "10px 22px", fontSize: "0.875rem", gap: 6 }}
            >
              Voir tous les détails et options
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <AnimateOnScroll>
          <div
            style={{
              maxWidth: 600,
              margin: "0 auto",
              textAlign: "center",
              padding: "48px 40px",
              borderRadius: 24,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div className="badge" style={{ marginBottom: 20, display: "inline-flex" }}>
              🎁 Offre fondateur — 50 places
            </div>
            <h2
              className="font-display"
              style={{
                fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text)",
                marginBottom: 12,
                lineHeight: 1.2,
              }}
            >
              Recevez votre premier briefing gratuitement
            </h2>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", marginBottom: 6 }}>
              Offre fondateur : <strong style={{ color: "var(--text)" }}>−50% à vie</strong> pour les 50 premiers inscrits.
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: 28 }}>
              Gratuit. Pas de carte bancaire. Pas de spam.
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <WaitlistForm size="large" buttonText="Rejoindre maintenant →" />
            </div>
          </div>
        </AnimateOnScroll>
      </section>
    </>
  );
}
