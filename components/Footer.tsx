import Link from "next/link";
import SorellLogo from "./SorellLogo";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--surface-alt)",
        marginTop: "6rem",
      }}
    >
      <div
        className="max-w-6xl mx-auto px-6"
        style={{ paddingTop: "3rem", paddingBottom: "3rem" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Top row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "2rem",
            }}
          >
            {/* Brand */}
            <div style={{ maxWidth: 280 }}>
              <SorellLogo size="md" />
              <p
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.65,
                }}
              >
                Newsletter IA personnalisée pour vos équipes. Veille sectorielle, concurrents, tendances —
                livrée chaque semaine.
              </p>
            </div>

            {/* Links */}
            <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
              <div>
                <p
                  className="section-label"
                  style={{ marginBottom: "0.75rem", display: "block" }}
                >
                  Produit
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <Link href="/#features" className="footer-link">Fonctionnalités</Link>
                  <Link href="/pricing" className="footer-link">Tarifs</Link>
                  <Link href="/demo" className="footer-link">Démo</Link>
                </div>
              </div>

              <div>
                <p
                  className="section-label"
                  style={{ marginBottom: "0.75rem", display: "block" }}
                >
                  Légal
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <Link href="#" className="footer-link">Mentions légales</Link>
                  <Link href="#" className="footer-link">Confidentialité</Link>
                  <Link href="mailto:contact@sorell.fr" className="footer-link">Contact</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div
            style={{
              paddingTop: "1.5rem",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              © 2026 Sorell. Tous droits réservés.
            </p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              Hébergé en Europe · RGPD compliant
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
