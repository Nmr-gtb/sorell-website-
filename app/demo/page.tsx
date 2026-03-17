import DemoGenerator from "@/components/DemoGenerator";

export const metadata = {
  title: "Démo — Sorell | Essayez la génération de newsletter IA",
  description: "Configurez votre newsletter en 30 secondes et voyez ce que l'IA génère pour vous. Aucun compte requis.",
};

export default function DemoPage() {
  return (
    <div style={{ paddingTop: "5rem", paddingBottom: "5rem" }}>
      {/* Header */}
      <section
        className="hero-bg"
        style={{ padding: "3.5rem 1.5rem 3rem", textAlign: "center", marginBottom: "2.5rem" }}
      >
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div className="badge" style={{ marginBottom: 20, display: "inline-flex" }}>
            <span className="dot-live" />
            Live — Aucun compte requis
          </div>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              color: "var(--text)",
              marginBottom: 14,
            }}
          >
            Essayez Sorell{" "}
            <span className="text-accent-italic font-display">en 30 secondes</span>
          </h1>
          <p style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            Configurez votre newsletter et voyez ce que l&apos;IA génère pour vous.{" "}
            <span style={{ color: "var(--text-muted)" }}>Aucun compte requis. Gratuit.</span>
          </p>
        </div>
      </section>

      {/* Generator */}
      <div style={{ padding: "0 1.5rem" }}>
        <DemoGenerator />
      </div>
    </div>
  );
}
