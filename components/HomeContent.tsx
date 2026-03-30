"use client";

import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";
import WaitlistForm from "@/components/WaitlistForm";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { useLanguage } from "@/lib/LanguageContext";

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
const IconEdit = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export default function HomeContent() {
  const { t } = useLanguage();

  const features = [
    { icon: <IconBolt />, title: t("home.feat1_title"), description: t("home.feat1_desc") },
    { icon: <IconUser />, title: t("home.feat2_title"), description: t("home.feat2_desc") },
    { icon: <IconSparkles />, title: t("home.feat3_title"), description: t("home.feat3_desc") },
    { icon: <IconEye />, title: t("home.feat4_title"), description: t("home.feat4_desc") },
    { icon: <IconChart />, title: t("home.feat5_title"), description: t("home.feat5_desc") },
    { icon: <IconShield />, title: t("home.feat6_title"), description: t("home.feat6_desc") },
  ];

  const steps = [
    { num: "01", title: t("home.step1_title"), description: t("home.step1_desc") },
    { num: "02", title: t("home.step2_title"), description: t("home.step2_desc") },
    { num: "03", title: t("home.step3_title"), description: t("home.step3_desc") },
  ];

  const pricingPlans = [
    {
      name: t("pricing.free"),
      price: t("pricing.free_price"),
      desc: t("pricing.free_desc"),
      features: [t("pricing.free_f1"), t("pricing.free_f2"), t("pricing.free_f6")],
      popular: false,
      isFree: true,
      isEnterprise: false,
    },
    {
      name: t("pricing.pro"),
      price: "19€",
      desc: t("pricing.pro_desc"),
      features: [t("pricing.pro_f1"), t("pricing.pro_f2"), t("pricing.pro_f5")],
      popular: false,
      isFree: false,
      isEnterprise: false,
    },
    {
      name: t("pricing.business"),
      price: "49€",
      desc: t("pricing.biz_desc"),
      features: [t("pricing.biz_f1"), t("pricing.biz_f2"), t("pricing.biz_f5")],
      popular: true,
      isFree: false,
      isEnterprise: false,
    },
    {
      name: t("pricing.enterprise"),
      price: t("pricing.enterprise_price"),
      desc: t("pricing.ent_desc"),
      features: [t("pricing.ent_f1"), t("pricing.ent_f2"), t("pricing.ent_f6")],
      popular: false,
      isFree: false,
      isEnterprise: true,
    },
  ];

  const testimonial = {
    quote: t("social.testimonial3"),
    name: t("social.testimonial3_name"),
    title: t("social.testimonial3_role"),
    initials: "LM",
  };

  const metrics = [
    { value: t("home.stat1_value"), label: t("home.stat1_label") },
    { value: t("home.stat2_value"), label: t("home.stat2_label") },
    { value: t("home.stat3_value"), label: t("home.stat3_label") },
    { value: t("home.stat4_value"), label: t("home.stat4_label") },
  ];

  return (
    <main style={{ background: "var(--bg)" }}>
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--bg)",
          padding: "120px 16px 80px",
        }}
      >
        <div
          style={{
            background: "#0f2b31",
            borderRadius: 20,
            maxWidth: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            minHeight: 520,
          }}
          className="hero-split"
        >
          {/* Left: text */}
          <div
            style={{
              flex: "1 1 50%",
              padding: "64px 48px 64px 56px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 0,
            }}
            className="hero-text-col"
          >
            {/* Badge pill */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.07)",
                marginBottom: 32,
                alignSelf: "flex-start",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#5EEAD4",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                {t("hero.badge")}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
                marginBottom: 24,
              }}
            >
              <span style={{ display: "block", color: "#FFFFFF" }}>{t("hero.title_line1")}</span>
              <span style={{ display: "block", color: "#5EEAD4" }}>{t("hero.title_line2")}</span>
            </h1>

            <p
              style={{
                fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                fontSize: "1.0625rem",
                fontWeight: 400,
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.65,
                marginBottom: 36,
                maxWidth: 420,
              }}
            >
              {t("hero.subtitle")}
            </p>

            {/* CTAs */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <a
                href="/connexion"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "13px 26px",
                  borderRadius: 8,
                  background: "#FFFFFF",
                  color: "#005058",
                  fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                  transition: "opacity 0.15s ease",
                  flexShrink: 0,
                }}
              >
                {t("hero.cta_primary")}
              </a>
              <Link
                href="/demo"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "13px 26px",
                  borderRadius: 8,
                  background: "transparent",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.35)",
                  fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                  fontWeight: 500,
                  fontSize: "0.9375rem",
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                  transition: "border-color 0.15s ease",
                  flexShrink: 0,
                }}
              >
                {t("hero.cta_secondary")}
              </Link>
            </div>

            <p
              style={{
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-inter, 'Inter', sans-serif)",
              }}
            >
              {t("hero.no_card")}
            </p>
          </div>

          {/* Right: image */}
          <div
            style={{
              flex: "0 0 47%",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              padding: "0 0 0 0",
              overflow: "hidden",
            }}
            className="hero-image-col"
          >
            <Image
              src="/hero-visual.png"
              alt="Sorell newsletter preview"
              width={620}
              height={520}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "top center",
                display: "block",
              }}
              priority
            />
          </div>
        </div>

        <style>{`
          @media (max-width: 767px) {
            .hero-split {
              flex-direction: column !important;
            }
            .hero-text-col {
              padding: 40px 28px 36px !important;
            }
            .hero-image-col {
              flex: 0 0 auto !important;
              max-height: 280px;
            }
            .hero-image-col img {
              object-position: top center !important;
            }
          }
        `}</style>
      </section>

      {/* ─── FONCTIONNALITES ──────────────────────────────────── */}
      <section id="fonctionnalites" style={{ background: "var(--bg)", padding: "160px 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <AnimateOnScroll>
            <div style={{ textAlign: "center", marginBottom: 80 }}>
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
                {t("home.features_title")}
              </h2>
              <p style={{ fontSize: "1rem", color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
                {t("home.features_subtitle")}
              </p>
            </div>
          </AnimateOnScroll>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
              gap: 24,
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

      {/* ─── DEFINITION GEO ───────────────────────────────────── */}
      <div style={{ background: "var(--bg)", paddingBottom: 80 }}>
        <p style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "0 1.5rem",
          fontSize: "0.875rem",
          color: "var(--text-muted)",
          lineHeight: 1.7,
          textAlign: "center",
        }}>
          {t("home.definition")}
        </p>
      </div>

      {/* ─── COMMENT CA MARCHE ────────────────────────────────── */}
      <section style={{ background: "var(--surface-alt)", padding: "160px 1.5rem" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          <AnimateOnScroll>
            <div style={{ textAlign: "center", marginBottom: 96 }}>
              <h2
                style={{
                  fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                  fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--text)",
                }}
              >
                {t("home.steps_title")}
              </h2>
            </div>
          </AnimateOnScroll>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 240px), 1fr))",
              gap: 24,
            }}
          >
            {steps.map((step, i) => (
              <AnimateOnScroll key={step.num} delay={i * 80}>
                <div className="step-card">
                  <p
                    style={{
                      fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#005058",
                      marginBottom: 14,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {step.num}
                  </p>
                  <h3
                    style={{
                      fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                      fontSize: "1rem",
                      fontWeight: 700,
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
          <style>{`
            .step-card {
              background: var(--surface);
              border: 1px solid var(--border);
              border-radius: 12px;
              padding: 24px;
              transition: box-shadow 0.2s ease, border-color 0.2s ease;
              height: 100%;
            }
            .step-card:hover {
              border-color: #005058;
              box-shadow: 0 4px 16px rgba(0, 80, 88, 0.08);
            }
          `}</style>
        </div>
      </section>

      {/* ─── METRIQUES DE CONFIANCE ───────────────────────────── */}
      <section style={{ background: "var(--bg)", padding: "96px 1.5rem" }}>
        <style>{`
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            max-width: 900px;
            margin: 0 auto;
          }
          .metric-item {
            padding: 0 2.5rem;
            border-left: 1px solid var(--border);
          }
          .metric-item:first-child {
            border-left: none;
            padding-left: 0;
          }
          .metric-item:last-child {
            padding-right: 0;
          }
          @media (max-width: 640px) {
            .metrics-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .metric-item {
              padding: 2rem 1rem;
              border-left: none;
              border-top: 1px solid var(--border);
            }
            .metric-item:first-child {
              border-top: none;
              padding-left: 1rem;
            }
            .metric-item:nth-child(2) {
              border-top: none;
            }
          }
        `}</style>
        <div className="metrics-grid">
          {metrics.map((metric) => (
            <div key={metric.label} className="metric-item">
              <div
                style={{
                  fontSize: "clamp(2.5rem, 4vw, 3.5rem)",
                  fontWeight: 700,
                  color: "#005058",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                {metric.value}
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TEMOIGNAGES ──────────────────────────────────────── */}
      <section style={{ background: "var(--bg)", padding: "160px 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <h2
              style={{
                fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                fontSize: "clamp(1.75rem, 3vw, 1.75rem)",
                fontWeight: 700,
                color: "var(--text)",
                letterSpacing: "-0.02em",
                marginBottom: 12,
              }}
            >
              {t("social.title")}
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {t("social.subtitle")}
            </p>
          </div>

          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 20,
              }}
            >
              <p
                style={{
                  fontStyle: "italic",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                {testimonial.quote}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: "white",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
                    {testimonial.name}
                  </div>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {testimonial.title}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING TEASER ───────────────────────────────────── */}
      <section style={{ background: "var(--bg)", padding: "160px 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <AnimateOnScroll>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
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
                {t("home.pricing_title")}
              </h2>
            </div>
          </AnimateOnScroll>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: 28,
              maxWidth: 960,
              margin: "0 auto 56px",
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
                      {t("pricing.popular")}
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
                    {!plan.isFree && !plan.isEnterprise && (
                      <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "var(--text-secondary)", marginLeft: 3 }}>
                        {t("pricing.per_month")}
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
            <Link href="/tarifs" className="link-accent" style={{ fontSize: "0.9375rem" }}>
              {t("home.pricing_link")}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────── */}
      <section
        id="waitlist"
        style={{ background: "var(--surface-alt)", padding: "160px 1.5rem" }}
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
                marginBottom: 24,
              }}
            >
              {t("home.cta_title")}
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: 32, lineHeight: 1.7 }}>
              {t("home.cta_subtitle")}
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <WaitlistForm buttonText={t("hero.cta_primary")} />
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      <Footer />
    </main>
  );
}
