"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";
import NewsletterPreview from "@/components/NewsletterPreview";
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
    { icon: <IconEdit />, title: t("home.feature_flexible"), description: t("home.feature_flexible_desc") },
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

  const testimonials = [
    {
      quote: t("social.testimonial1"),
      name: t("social.testimonial1_name"),
      title: t("social.testimonial1_role"),
      initials: "MT",
    },
    {
      quote: t("social.testimonial2"),
      name: t("social.testimonial2_name"),
      title: t("social.testimonial2_role"),
      initials: "AD",
    },
    {
      quote: t("social.testimonial3"),
      name: t("social.testimonial3_name"),
      title: t("social.testimonial3_role"),
      initials: "LM",
    },
  ];

  const metrics = [
    { value: "30+", label: t("social.metric_newsletters") },
    { value: "98%", label: t("social.metric_satisfaction") },
    { value: "12 sec", label: t("social.metric_generation") },
    { value: "24/7", label: t("social.metric_auto") },
  ];

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
            {t("hero.title")}
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
            {t("hero.subtitle")}
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
              href="/connexion"
              className="btn-primary"
              style={{ padding: "14px 28px", fontSize: "0.9375rem", fontWeight: 500 }}
            >
              {t("hero.cta_primary")}
            </a>
            <Link
              href="/demo"
              className="btn-ghost"
              style={{ padding: "14px 28px", fontSize: "0.9375rem", fontWeight: 500 }}
            >
              {t("hero.cta_secondary")}
            </Link>
          </div>

          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            {t("hero.no_card")} ·{" "}
            <Link href="/comment-ca-marche" className="link-accent">
              {t("nav.how_it_works")} ?
            </Link>
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
                {t("home.preview_title")}
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
                {t("home.preview_subtitle")}
              </p>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll delay={100}>
            <NewsletterPreview />
          </AnimateOnScroll>
        </div>
      </section>

      {/* ─── FONCTIONNALITÉS ──────────────────────────────────── */}
      <section id="fonctionnalites" style={{ background: "var(--bg)", padding: "120px 1.5rem" }}>
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
                {t("home.steps_title")}
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
                  <div style={{ height: 1, background: "var(--border)", marginBottom: 24 }} />
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

      {/* ─── MÉTRIQUES DE CONFIANCE ───────────────────────────── */}
      <section style={{ background: "var(--surface-alt)", padding: "48px 1.5rem" }}>
        <div
          style={{
            maxWidth: "72rem",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
            gap: 32,
            textAlign: "center",
          }}
        >
          {metrics.map((metric) => (
            <div key={metric.label}>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 700,
                  color: "var(--accent)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.2,
                  marginBottom: 6,
                }}
              >
                {metric.value}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                {metric.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TÉMOIGNAGES ──────────────────────────────────────── */}
      <section style={{ background: "var(--bg)", padding: "120px 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
              gap: 16,
            }}
          >
            {testimonials.map((item) => (
              <div
                key={item.name}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
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
                  {item.quote}
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
                    {item.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      {item.title}
                    </div>
                  </div>
                </div>
              </div>
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
                {t("home.pricing_title")}
              </h2>
            </div>
          </AnimateOnScroll>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: 20,
              maxWidth: 960,
              margin: "0 auto 32px",
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
              {t("home.cta_title")}
            </h2>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.7 }}>
              {t("home.cta_subtitle")}
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: 36 }}>
              {t("home.cta_note")}
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
