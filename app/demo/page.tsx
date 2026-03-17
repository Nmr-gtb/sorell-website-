import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DemoGenerator from "@/components/DemoGenerator";

export const metadata = {
  title: "Démo — Sorell | Générez votre briefing IA en direct",
  description:
    "Configurez votre newsletter en 30 secondes et voyez ce que l'IA génère pour vous. Aucun compte requis.",
};

export default function DemoPage() {
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
            Essayez Sorell en 30 secondes
          </h1>
          <p
            style={{
              fontSize: "1rem",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
            }}
          >
            Choisissez votre secteur et voyez ce que Sorell génère pour vous.{" "}
            <span style={{ color: "var(--text-muted)" }}>Aucun compte requis.</span>
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
