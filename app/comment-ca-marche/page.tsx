"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/LanguageContext";

export default function CommentCaMarchePage() {
  const { t } = useLanguage();
  return (
    <div
      style={{
        background: "var(--bg)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              { "@type": "Question", "name": "Est-ce que Sorell utilise de vraies sources d'information ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui. Sorell utilise une technologie de recherche web intégrée qui parcourt les médias en temps réel. Chaque article cite sa source et propose un lien direct vers le contenu original. Nous utilisons des sources vérifiées comme Les Echos, Bloomberg, Reuters, TechCrunch et des dizaines d'autres médias spécialisés." } },
              { "@type": "Question", "name": "Combien de temps faut-il pour configurer Sorell ?", "acceptedAnswer": { "@type": "Answer", "text": "5 minutes suffisent. Créez votre compte gratuitement, décrivez votre activité dans le brief personnalisé, choisissez vos thématiques et votre fréquence d'envoi. Votre première newsletter peut être générée dans la minute." } },
              { "@type": "Question", "name": "Sorell est-il gratuit ?", "acceptedAnswer": { "@type": "Answer", "text": "Oui, le plan gratuit vous permet de recevoir jusqu'à 2 newsletters par mois, entièrement personnalisées. Si vous souhaitez envoyer la newsletter à votre équipe (jusqu'à 5 personnes avec le Pro, 25 avec le Business), le plan Pro est à 19€ par mois." } },
              { "@type": "Question", "name": "Puis-je personnaliser le contenu de ma newsletter ?", "acceptedAnswer": { "@type": "Answer", "text": "Absolument. Le brief personnalisé vous permet de décrire exactement ce que vous voulez surveiller : votre secteur, vos concurrents, les réglementations qui vous concernent, les tendances qui vous intéressent. L'IA s'adapte à votre demande." } }
            ]
          })
        }}
      />
      <style>{`
        @media (max-width: 768px) {
          .hiw-hero {
            padding-top: 80px !important;
          }
          .hiw-hero-title {
            font-size: 1.75rem !important;
          }
          .hiw-step-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
          .hiw-step-illustration {
            display: none !important;
          }
          .hiw-comparison-table-wrapper {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch;
          }
          .hiw-faq-grid {
            grid-template-columns: 1fr !important;
          }
          .hiw-step-grid {
            margin-bottom: 48px !important;
          }
          .hiw-step-grid > div:first-child > div:first-child {
            font-size: 48px !important;
          }
          .hiw-steps-section {
            padding-bottom: 64px !important;
          }
          .hiw-comparison-section {
            padding-top: 48px !important;
            padding-bottom: 48px !important;
          }
          .hiw-faq-section {
            padding-top: 48px !important;
            padding-bottom: 48px !important;
          }
          .hiw-cta-section {
            padding-top: 48px !important;
            padding-bottom: 48px !important;
          }
        }
      `}</style>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section
          className="hiw-hero"
          style={{
            paddingTop: 120,
            paddingBottom: 80,
            paddingLeft: "1.5rem",
            paddingRight: "1.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: "1rem",
              }}
            >
              {t("hiw.guide")}
            </p>
            <h1
              className="hiw-hero-title"
              style={{
                fontSize: "clamp(1.875rem, 4vw, 2.75rem)",
                fontWeight: 700,
                color: "var(--text)",
                lineHeight: 1.2,
                marginBottom: "1.25rem",
              }}
            >
              {t("hiw.title")}
            </h1>
            <p
              style={{
                fontSize: "1.0625rem",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
                maxWidth: 600,
                margin: "0 auto",
              }}
            >
              {t("hiw.subtitle")}
            </p>
          </div>
        </section>

        {/* Steps */}
        <section
          className="hiw-steps-section"
          style={{
            maxWidth: "72rem",
            margin: "0 auto",
            padding: "0 1.5rem 120px",
          }}
        >
          {/* Étape 1 */}
          <div
            className="hiw-step-grid"
            style={{
              marginBottom: 96,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4rem",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 700,
                  color: "var(--accent)",
                  opacity: 0.12,
                  lineHeight: 1,
                  marginBottom: "-1.5rem",
                  userSelect: "none",
                }}
              >
                01
              </div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "1.25rem",
                }}
              >
                {t("hiw.step1_title")}
              </h2>
              <div
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.75,
                  maxWidth: 560,
                }}
              >
                <p style={{ marginBottom: "1rem" }}>
                  Dès votre inscription gratuite, vous accédez à votre tableau de bord. La
                  première chose à faire : décrire ce que vous voulez surveiller. Sorell vous
                  propose des thématiques prédéfinies - intelligence artificielle,
                  réglementation, concurrence, finance, RH, cybersécurité - mais vous pouvez
                  aussi créer les vôtres.
                </p>
                <p style={{ marginBottom: "1rem" }}>
                  Le brief personnalisé est la fonctionnalité la plus puissante de Sorell. En
                  quelques lignes, décrivez votre activité, vos concurrents, les sujets qui
                  comptent pour vous. Par exemple : &laquo;&nbsp;Notre entreprise fait de la
                  surimpression de packaging cosmétique. Je veux suivre les changements
                  réglementaires européens sur les listes INCI et les innovations en packaging
                  durable.&nbsp;&raquo; Plus votre brief est précis, plus votre newsletter sera
                  pertinente.
                </p>
                <p>
                  Vous choisissez ensuite vos sources préférées parmi notre bibliothèque de
                  médias vérifiés - Les Echos, TechCrunch, Bloomberg, Reuters, et des dizaines
                  d&apos;autres - ou ajoutez les vôtres manuellement.
                </p>
              </div>
            </div>
            <div className="hiw-step-illustration" style={{ display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 20,
                  background: "var(--accent-subtle)",
                  border: "1px solid var(--accent-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <rect
                    x="12"
                    y="10"
                    width="56"
                    height="60"
                    rx="6"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                  />
                  <line
                    x1="24"
                    y1="26"
                    x2="56"
                    y2="26"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="24"
                    y1="38"
                    x2="56"
                    y2="38"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="24"
                    y1="50"
                    x2="44"
                    y2="50"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="12"
                    fill="var(--accent)"
                    fillOpacity="0.15"
                    stroke="var(--accent)"
                    strokeWidth="2"
                  />
                  <line
                    x1="56"
                    y1="60"
                    x2="64"
                    y2="60"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="60"
                    y1="56"
                    x2="60"
                    y2="64"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Étape 2 */}
          <div
            className="hiw-step-grid"
            style={{
              marginBottom: 96,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4rem",
              alignItems: "center",
            }}
          >
            <div className="hiw-step-illustration" style={{ display: "flex", justifyContent: "center", order: -1 }}>
              <div
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 20,
                  background: "var(--accent-subtle)",
                  border: "1px solid var(--accent-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle
                    cx="40"
                    cy="36"
                    r="22"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M30 30 C30 24, 50 24, 50 30 C50 36, 44 38, 40 42 C36 38, 30 36, 30 30Z"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    fill="var(--accent)"
                    fillOpacity="0.15"
                  />
                  <line
                    x1="40"
                    y1="42"
                    x2="40"
                    y2="46"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="40" cy="49" r="2" fill="var(--accent)" />
                  <line
                    x1="28"
                    y1="64"
                    x2="52"
                    y2="64"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="20"
                    y1="22"
                    x2="14"
                    y2="16"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="60"
                    y1="22"
                    x2="66"
                    y2="16"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="18"
                    y1="36"
                    x2="10"
                    y2="36"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="62"
                    y1="36"
                    x2="70"
                    y2="36"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 700,
                  color: "var(--accent)",
                  opacity: 0.12,
                  lineHeight: 1,
                  marginBottom: "-1.5rem",
                  userSelect: "none",
                }}
              >
                02
              </div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "1.25rem",
                }}
              >
                {t("hiw.step2_title")}
              </h2>
              <div
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.75,
                  maxWidth: 560,
                }}
              >
                <p style={{ marginBottom: "1rem" }}>
                  Chaque semaine (ou chaque mois, selon votre préférence), Sorell se met au
                  travail. Notre intelligence artificielle parcourt le web à la recherche
                  d&apos;actualités récentes et pertinentes pour votre secteur. Elle ne se
                  contente pas de copier des titres - elle analyse, synthétise et rédige un
                  véritable briefing éditorial.
                </p>
                <p style={{ marginBottom: "1rem" }}>Votre newsletter contient :</p>
                <p style={{ marginBottom: "0.5rem" }}>
                  Un éditorial qui résume la tendance de la semaine en 2-3 phrases.
                </p>
                <p style={{ marginBottom: "0.5rem" }}>
                  Des chiffres clés tirés des articles les plus marquants.
                </p>
                <p style={{ marginBottom: "1rem" }}>
                  5 articles détaillés avec des accroches, du contenu factuel et des liens
                  vers les sources originales.
                </p>
                <p>
                  Tout est basé sur de vraies actualités trouvées sur le web grâce à notre
                  technologie de recherche intégrée. Chaque article cite sa source et propose
                  un lien &laquo;&nbsp;Lire l&apos;article&nbsp;&raquo; vers le contenu
                  original. Pas de fake news, pas de contenu inventé.
                </p>
              </div>
            </div>
          </div>

          {/* Étape 3 */}
          <div
            className="hiw-step-grid"
            style={{
              marginBottom: 96,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4rem",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 700,
                  color: "var(--accent)",
                  opacity: 0.12,
                  lineHeight: 1,
                  marginBottom: "-1.5rem",
                  userSelect: "none",
                }}
              >
                03
              </div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "1.25rem",
                }}
              >
                {t("hiw.step3_title")}
              </h2>
              <div
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.75,
                  maxWidth: 560,
                }}
              >
                <p style={{ marginBottom: "1rem" }}>
                  Ajoutez les adresses email de vos collaborateurs - ou gardez-le juste pour
                  vous sur le plan gratuit. Le jour et l&apos;heure que vous avez choisis,
                  Sorell envoie automatiquement la newsletter. Chaque lundi à 9h, chaque
                  vendredi à 14h, chaque premier du mois - c&apos;est vous qui décidez.
                </p>
                <p style={{ marginBottom: "1rem" }}>
                  L&apos;email arrive dans la boîte de réception de vos équipes avec un design
                  professionnel et lisible. Pas de spam, pas de publicité, juste
                  l&apos;information qui compte. Et grâce aux analytics intégrés, vous savez
                  qui lit, qui clique, et quels sujets intéressent le plus vos collaborateurs.
                </p>
                <p>
                  Le résultat ? Vos équipes restent informées sans effort. Plus besoin de
                  compiler une veille manuellement chaque semaine. Plus besoin de demander à
                  un stagiaire de résumer les actualités. Sorell le fait pour vous,
                  automatiquement, à l&apos;heure que vous avez choisie.
                </p>
              </div>
            </div>
            <div className="hiw-step-illustration" style={{ display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 20,
                  background: "var(--accent-subtle)",
                  border: "1px solid var(--accent-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <rect
                    x="8"
                    y="20"
                    width="64"
                    height="44"
                    rx="6"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M8 28 L40 46 L72 28"
                    stroke="var(--accent)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="40"
                    y1="8"
                    x2="40"
                    y2="20"
                    stroke="var(--accent)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="3 3"
                  />
                  <circle cx="40" cy="6" r="3" fill="var(--accent)" fillOpacity="0.6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Étape 4 */}
          <div
            className="hiw-step-grid"
            style={{
              marginBottom: 96,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4rem",
              alignItems: "center",
            }}
          >
            <div className="hiw-step-illustration" style={{ display: "flex", justifyContent: "center", order: -1 }}>
              <div
                style={{
                  width: 220,
                  height: 220,
                  borderRadius: 20,
                  background: "var(--accent-subtle)",
                  border: "1px solid var(--accent-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <rect x="12" y="16" width="56" height="48" rx="6" stroke="var(--accent)" strokeWidth="2.5" />
                  <line x1="24" y1="30" x2="56" y2="30" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="24" y1="40" x2="56" y2="40" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="24" y1="50" x2="44" y2="50" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="62" cy="54" r="10" fill="var(--accent)" fillOpacity="0.15" stroke="var(--accent)" strokeWidth="2" />
                  <path d="M58 54 L61 57 L66 51" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 700,
                  color: "var(--accent)",
                  opacity: 0.12,
                  lineHeight: 1,
                  marginBottom: "-1.5rem",
                  userSelect: "none",
                }}
              >
                04
              </div>
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: "1.25rem",
                }}
              >
                {t("hiw.step_modify")}
              </h2>
              <p
                style={{
                  fontSize: "0.9375rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.75,
                  maxWidth: 560,
                }}
              >
                {t("hiw.step_modify_desc")}
              </p>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section
          className="hiw-comparison-section"
          style={{
            background: "var(--surface-alt)",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            padding: "80px 1.5rem",
          }}
        >
          <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "0.75rem",
                textAlign: "center",
              }}
            >
              {t("hiw.vs_title")}
            </h2>
            <p
              style={{
                fontSize: "0.9375rem",
                color: "var(--text-secondary)",
                textAlign: "center",
                marginBottom: "2.5rem",
              }}
            >
              {t("hiw.vs_subtitle")}
            </p>
            <div className="hiw-comparison-table-wrapper" style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  overflow: "hidden",
                  fontSize: "0.9rem",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "14px 20px",
                        textAlign: "left",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        background: "var(--surface-alt)",
                        borderBottom: "1px solid var(--border)",
                        fontSize: "0.8125rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Fonctionnalité
                    </th>
                    <th
                      style={{
                        padding: "14px 20px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: "var(--accent)",
                        background: "var(--accent-subtle)",
                        borderBottom: "1px solid var(--border)",
                        borderLeft: "1px solid var(--border)",
                        minWidth: 160,
                      }}
                    >
                      Sorell
                    </th>
                    <th
                      style={{
                        padding: "14px 20px",
                        textAlign: "center",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        background: "var(--surface-alt)",
                        borderBottom: "1px solid var(--border)",
                        borderLeft: "1px solid var(--border)",
                        minWidth: 160,
                      }}
                    >
                      ChatGPT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      feature: "Automatique chaque semaine",
                      sorell: "✅",
                      chatgpt: "❌ Manuel à chaque fois",
                    },
                    {
                      feature: "Envoi à toute l'équipe",
                      sorell: "✅ Jusqu'à 25 personnes",
                      chatgpt: "❌ Juste pour vous",
                    },
                    {
                      feature: "Basé sur de vraies actus web",
                      sorell: "✅ Recherche web intégrée",
                      chatgpt: "⚠️ Selon la version",
                    },
                    {
                      feature: "Liens vers les sources",
                      sorell: "✅ URL cliquables",
                      chatgpt: "❌ Pas de liens",
                    },
                    {
                      feature: "Analytics (qui lit, qui clique)",
                      sorell: "✅",
                      chatgpt: "❌",
                    },
                    {
                      feature: "Format newsletter pro",
                      sorell: "✅ Email HTML formaté",
                      chatgpt: "❌ Texte brut",
                    },
                    {
                      feature: "Configuration une seule fois",
                      sorell: "✅ 5 minutes",
                      chatgpt: "❌ Prompt à refaire chaque fois",
                    },
                  ].map((row, i, arr) => (
                    <tr key={row.feature}>
                      <td
                        style={{
                          padding: "14px 20px",
                          color: "var(--text)",
                          fontWeight: 500,
                          borderBottom:
                            i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none",
                        }}
                      >
                        {row.feature}
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          textAlign: "center",
                          color: "var(--text-secondary)",
                          background: "var(--accent-subtle)",
                          borderLeft: "1px solid var(--border)",
                          borderBottom:
                            i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none",
                        }}
                      >
                        {row.sorell}
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          textAlign: "center",
                          color: "var(--text-secondary)",
                          borderLeft: "1px solid var(--border)",
                          borderBottom:
                            i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none",
                        }}
                      >
                        {row.chatgpt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          className="hiw-faq-section"
          style={{
            maxWidth: "72rem",
            margin: "0 auto",
            padding: "80px 1.5rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "2.5rem",
              textAlign: "center",
            }}
          >
            {t("hiw.faq_title")}
          </h2>
          <div
            className="hiw-faq-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 480px), 1fr))",
              gap: "1.5rem",
              maxWidth: 1000,
              margin: "0 auto",
            }}
          >
            {[
              {
                q: "Est-ce que Sorell utilise de vraies sources d'information ?",
                a: "Oui. Sorell utilise une technologie de recherche web intégrée qui parcourt les médias en temps réel. Chaque article cite sa source et propose un lien direct vers le contenu original. Nous utilisons des sources vérifiées comme Les Echos, Bloomberg, Reuters, TechCrunch et des dizaines d'autres médias spécialisés.",
              },
              {
                q: "Combien de temps faut-il pour configurer Sorell ?",
                a: "5 minutes suffisent. Créez votre compte gratuitement, décrivez votre activité dans le brief personnalisé, choisissez vos thématiques et votre fréquence d'envoi. Votre première newsletter peut être générée dans la minute.",
              },
              {
                q: "Sorell est-il gratuit ?",
                a: "Oui, le plan gratuit vous permet de recevoir jusqu'à 2 newsletters par mois, entièrement personnalisées. Si vous souhaitez envoyer la newsletter à votre équipe (jusqu'à 5 personnes avec le Pro, 25 avec le Business), le plan Pro est à 19€ par mois.",
              },
              {
                q: "Puis-je personnaliser le contenu de ma newsletter ?",
                a: "Absolument. Le brief personnalisé vous permet de décrire exactement ce que vous voulez surveiller : votre secteur, vos concurrents, les réglementations qui vous concernent, les tendances qui vous intéressent. L'IA s'adapte à votre demande.",
              },
            ].map((item) => (
              <div
                key={item.q}
                style={{
                  padding: "1.5rem",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              >
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: "0.75rem",
                    lineHeight: 1.4,
                  }}
                >
                  {item.q}
                </h3>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section
          className="hiw-cta-section"
          style={{
            background: "var(--accent-subtle)",
            borderTop: "1px solid var(--accent-border)",
            borderBottom: "1px solid var(--accent-border)",
            padding: "80px 1.5rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: "0.75rem",
              }}
            >
              {t("hiw.cta_title")}
            </h2>
            <p
              style={{
                fontSize: "1rem",
                color: "var(--text-secondary)",
                marginBottom: "2rem",
                lineHeight: 1.6,
              }}
            >
              {t("hiw.cta_subtitle")}
            </p>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/connexion"
                className="btn-primary"
                style={{ padding: "10px 24px", fontSize: "0.9375rem" }}
              >
                {t("hiw.cta_primary")}
              </Link>
              <Link
                href="/demo"
                className="btn-ghost"
                style={{ padding: "10px 24px", fontSize: "0.9375rem" }}
              >
                {t("hiw.cta_secondary")}
              </Link>
            </div>
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: "0.8125rem",
                color: "var(--text-muted)",
              }}
            >
              {t("hiw.cta_footer")}
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
