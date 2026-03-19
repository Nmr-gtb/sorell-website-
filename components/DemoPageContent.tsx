"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DemoGenerator from "@/components/DemoGenerator";
import { useLanguage } from "@/lib/LanguageContext";

export default function DemoPageContent() {
  const { t } = useLanguage();

  return (
    <div style={{ background: "var(--bg)" }}>
      <Navbar />

      {/* Hero */}
      <section
        style={{
          paddingTop: "120px",
          padding: "120px 1.5rem 64px",
          textAlign: "center",
          background: "var(--bg)",
        }}
      >
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
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
            {t("demo.title")}
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
            }}
          >
            {t("demo.subtitle")}{" "}
            <span style={{ color: "var(--text-muted)" }}>{t("demo.no_account")}</span>
          </p>
        </div>
      </section>

      {/* Generator */}
      <section style={{ padding: "0 1.5rem 120px", background: "var(--bg)" }}>
        <DemoGenerator />
      </section>

      <Footer />
    </div>
  );
}
