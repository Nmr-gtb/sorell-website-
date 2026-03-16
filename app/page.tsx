import Link from "next/link";
import FeatureCard from "@/components/FeatureCard";
import NewsletterPreview from "@/components/NewsletterPreview";
import WaitlistForm from "@/components/WaitlistForm";

const features = [
  {
    icon: "⚡",
    title: "100% automatisé",
    description: "Configurez une fois, recevez chaque semaine. Aucune intervention manuelle requise.",
  },
  {
    icon: "🎯",
    title: "Personnalisé par profil",
    description: "Contenu adapté au rôle et aux centres d'intérêt de chaque collaborateur.",
  },
  {
    icon: "🤖",
    title: "Synthèses IA",
    description: "Résumés intelligents et contextualisés, pas du simple copier-coller d'articles.",
  },
  {
    icon: "🔍",
    title: "Veille concurrentielle",
    description: "Surveillez vos concurrents automatiquement et recevez leurs mouvements stratégiques.",
  },
  {
    icon: "📊",
    title: "Dashboard analytics",
    description: "Taux d'ouverture, clics, sujets populaires — mesurez l'impact de vos newsletters.",
  },
  {
    icon: "🏷️",
    title: "White-label",
    description: "Vos couleurs, votre logo, votre domaine. Une expérience 100% à votre marque.",
  },
];

const steps = [
  {
    num: "01",
    title: "Choisissez vos sujets",
    description:
      "Définissez les thématiques clés de votre secteur : concurrents, tendances, réglementation, levées de fonds...",
  },
  {
    num: "02",
    title: "Ajoutez vos collaborateurs",
    description:
      "Importez votre équipe et définissez les profils. Chacun reçoit un contenu adapté à son rôle.",
  },
  {
    num: "03",
    title: "L'IA fait le reste",
    description:
      "Chaque semaine, Sorell analyse des centaines de sources et génère une newsletter sur-mesure pour chaque destinataire.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section
        className="mesh-bg px-6 text-center flex flex-col items-center justify-center"
        style={{ minHeight: "92vh", paddingTop: "6rem", paddingBottom: "6rem" }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
            style={{
              background: "rgba(124, 58, 237, 0.08)",
              border: "1px solid rgba(124, 58, 237, 0.2)",
              color: "#a78bfa",
            }}
          >
            <span className="dot-green" />
            Accès anticipé — Places limitées
          </div>

          {/* Title */}
          <h1
            className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            style={{ color: "#f0f0f5", letterSpacing: "-0.02em" }}
          >
            L&apos;intelligence de votre marché,{" "}
            <span className="gradient-text-italic font-display">
              livrée chaque lundi matin
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
            style={{ color: "#9090aa" }}
          >
            Sorell génère par IA une newsletter personnalisée pour chaque collaborateur. Veille sectorielle,
            concurrents, tendances —{" "}
            <span style={{ color: "#f0f0f5" }}>zéro effort, 100% pertinence.</span>
          </p>

          {/* Waitlist form */}
          <div className="flex flex-col items-center gap-3">
            <WaitlistForm size="large" buttonText="Rejoindre la waitlist" />
            <p className="text-sm" style={{ color: "#5a5a72" }}>
              Gratuit. Pas de spam. Recevez un échantillon dès votre inscription.
            </p>
          </div>

          {/* Proof points */}
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-10">
            {["Contenu généré par IA", "Personnalisé par collaborateur", "RGPD compliant"].map((point) => (
              <div key={point} className="flex items-center gap-2 text-sm" style={{ color: "#9090aa" }}>
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#10b981" strokeWidth="1.5" opacity="0.4" />
                  <path
                    d="M5 8l2 2 4-4"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APERÇU */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: text */}
            <div>
              <div
                className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full mb-5"
                style={{
                  background: "rgba(124,58,237,0.1)",
                  border: "1px solid rgba(124,58,237,0.2)",
                  color: "#a78bfa",
                }}
              >
                Aperçu produit
              </div>
              <h2
                className="font-display text-4xl md:text-5xl font-bold mb-5 leading-tight"
                style={{ color: "#f0f0f5", letterSpacing: "-0.02em" }}
              >
                Une newsletter que vos équipes attendent avec impatience
              </h2>
              <p className="text-base leading-relaxed mb-8" style={{ color: "#9090aa" }}>
                Fini les newsletters génériques que personne ne lit. Sorell analyse les sources les plus pertinentes
                pour chaque profil et génère un briefing synthétique, avec l&apos;essentiel et rien que l&apos;essentiel.
              </p>

              <div className="space-y-4">
                {[
                  { icon: "📬", text: "Livraison chaque lundi matin à 8h00" },
                  { icon: "✦", text: "Synthèses en 3 phrases maximum par article" },
                  { icon: "🔗", text: "Sources vérifiées et liens vers l'article original" },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-3 text-sm"
                    style={{ color: "#9090aa" }}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>

              <Link
                href="/demo"
                className="btn-accent inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold mt-8"
              >
                Essayer la démo en live
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            {/* Right: email preview */}
            <div>
              <NewsletterPreview />
            </div>
          </div>
        </div>
      </section>

      {/* FONCTIONNALITÉS */}
      <section id="features" className="py-24 px-6" style={{ background: "#0d0d14" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full mb-5"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.2)",
                color: "#a78bfa",
              }}
            >
              Fonctionnalités
            </div>
            <h2
              className="font-display text-4xl md:text-5xl font-bold mb-4"
              style={{ color: "#f0f0f5", letterSpacing: "-0.02em" }}
            >
              Tout ce dont votre équipe a besoin
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "#9090aa" }}>
              De la collecte à la livraison, Sorell gère l&apos;intégralité du processus de veille pour vous.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div
              className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full mb-5"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.2)",
                color: "#a78bfa",
              }}
            >
              Comment ça marche
            </div>
            <h2
              className="font-display text-4xl md:text-5xl font-bold"
              style={{ color: "#f0f0f5", letterSpacing: "-0.02em" }}
            >
              Configuré en 10 minutes
            </h2>
          </div>

          <div className="space-y-4">
            {steps.map((step) => (
              <div
                key={step.num}
                className="flex gap-6 p-7 rounded-2xl border"
                style={{ background: "#16161f", borderColor: "#1e1e2a" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
                  style={{
                    background: "rgba(124, 58, 237, 0.1)",
                    border: "1px solid rgba(124, 58, 237, 0.2)",
                    color: "#a78bfa",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {step.num}
                </div>
                <div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: "#f0f0f5" }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#9090aa" }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING RÉSUMÉ */}
      <section className="py-24 px-6" style={{ background: "#0d0d14" }}>
        <div className="max-w-5xl mx-auto text-center">
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
          <h2
            className="font-display text-4xl md:text-5xl font-bold mb-4"
            style={{ color: "#f0f0f5", letterSpacing: "-0.02em" }}
          >
            Simple et transparent
          </h2>
          <p className="text-base mb-12" style={{ color: "#9090aa" }}>
            Sans engagement. Changez ou annulez à tout moment.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              {
                name: "Starter",
                price: "49€",
                desc: "Pour les petites équipes",
                features: ["1 newsletter/semaine", "500 destinataires", "Synthèses IA"],
                popular: false,
              },
              {
                name: "Business",
                price: "199€",
                desc: "Pour les PME ambitieuses",
                features: ["2 newsletters/semaine", "2 000 destinataires", "Veille concurrentielle", "Dashboard analytics"],
                popular: true,
              },
              {
                name: "Enterprise",
                price: "499€+",
                desc: "Pour les grandes orgs",
                features: ["Illimité", "White-label complet", "API & CRM", "Account manager"],
                popular: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className="p-6 rounded-2xl text-left"
                style={{
                  background: plan.popular ? "rgba(124,58,237,0.05)" : "#16161f",
                  border: plan.popular
                    ? "1px solid rgba(124,58,237,0.35)"
                    : "1px solid #1e1e2a",
                }}
              >
                {plan.popular && (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full mb-3 inline-block"
                    style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}
                  >
                    ✦ Populaire
                  </span>
                )}
                <div className="text-2xl font-bold mb-0.5" style={{ color: "#f0f0f5" }}>
                  {plan.price}
                  <span className="text-sm font-normal ml-1" style={{ color: "#9090aa" }}>
                    /mois
                  </span>
                </div>
                <div className="text-sm font-semibold mb-1" style={{ color: "#f0f0f5" }}>
                  {plan.name}
                </div>
                <div className="text-xs mb-4" style={{ color: "#5a5a72" }}>
                  {plan.desc}
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs flex items-center gap-2" style={{ color: "#9090aa" }}>
                      <span style={{ color: plan.popular ? "#8b5cf6" : "#10b981" }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <Link
            href="/pricing"
            className="btn-ghost inline-flex items-center gap-2 px-6 py-3 text-sm font-medium"
          >
            Voir tous les détails
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="p-10 rounded-3xl border"
            style={{
              background: "rgba(124,58,237,0.04)",
              borderColor: "rgba(124,58,237,0.2)",
              boxShadow: "0 0 60px rgba(124,58,237,0.06)",
            }}
          >
            <div
              className="inline-block text-xs font-semibold px-3 py-1.5 rounded-full mb-5"
              style={{
                background: "rgba(124,58,237,0.1)",
                border: "1px solid rgba(124,58,237,0.2)",
                color: "#a78bfa",
              }}
            >
              🎁 Offre fondateur — 50 places
            </div>

            <h2
              className="font-display text-3xl md:text-4xl font-bold mb-3"
              style={{ color: "#f0f0f5", letterSpacing: "-0.02em" }}
            >
              Recevez votre premier briefing gratuitement
            </h2>
            <p className="text-base mb-2" style={{ color: "#9090aa" }}>
              Offre fondateur : −50% à vie pour les 50 premiers inscrits.
            </p>
            <p className="text-sm mb-8" style={{ color: "#5a5a72" }}>
              Gratuit. Pas de carte bancaire. Pas de spam.
            </p>

            <div className="flex justify-center">
              <WaitlistForm size="large" buttonText="Rejoindre maintenant →" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
