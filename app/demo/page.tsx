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
    <div>
      <Navbar />

      {/* Hero */}
      <section
        className="hero-bg"
        style={{
          paddingTop: "7rem",
          padding: "7rem 1.5rem 4rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div className="badge" style={{ marginBottom: 24, display: "inline-flex" }}>
            <span className="dot-live" />
            Live — Aucun compte requis
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display, Georgia, serif)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              lineHeight: 1.12,
              color: "var(--text)",
              marginBottom: 16,
            }}
          >
            Générez votre briefing{" "}
            <em style={{ color: "var(--accent)", fontStyle: "italic" }}>en direct</em>
          </h1>
          <p
            style={{
              fontSize: "1rem",
              color: "var(--text-secondary)",
              lineHeight: 1.65,
            }}
          >
            Choisissez votre secteur et voyez ce que Sorell génère pour vous.{" "}
            <span style={{ color: "var(--text-muted)" }}>Aucun compte requis. Gratuit.</span>
          </p>
        </div>
      </section>

      {/* Generator */}
      <section style={{ padding: "0 1.5rem 5rem" }}>
        <DemoGenerator />
      </section>

      <Footer />
    </div>
  );
}
