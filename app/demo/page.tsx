import DemoGenerator from "@/components/DemoGenerator";

export const metadata = {
  title: "Démo — Sorell | Essayez la génération de newsletter IA",
  description:
    "Configurez votre newsletter en 30 secondes et voyez ce que l'IA génère pour vous. Aucun compte requis.",
};

export default function DemoPage() {
  return (
    <div className="pt-24 pb-24 px-6">
      {/* Header */}
      <section className="mesh-bg text-center py-16 mb-12">
        <div className="max-w-2xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium"
            style={{
              background: "rgba(124, 58, 237, 0.08)",
              border: "1px solid rgba(124, 58, 237, 0.2)",
              color: "#a78bfa",
            }}
          >
            <span className="dot-green" />
            Live — Aucun compte requis
          </div>
          <h1
            className="font-display text-5xl md:text-6xl font-bold mb-4 leading-tight"
            style={{ color: "#f0f0f5", letterSpacing: "-0.02em" }}
          >
            Essayez Sorell{" "}
            <span className="gradient-text-italic font-display">en 30 secondes</span>
          </h1>
          <p className="text-lg" style={{ color: "#9090aa" }}>
            Configurez votre newsletter et voyez ce que l&apos;IA génère pour vous.
            <br />
            <span style={{ color: "#5a5a72" }}>Aucun compte requis. Gratuit.</span>
          </p>
        </div>
      </section>

      {/* Demo generator */}
      <DemoGenerator />
    </div>
  );
}
