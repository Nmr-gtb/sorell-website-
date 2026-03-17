import Link from "next/link";
import SorellLogo from "./SorellLogo";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--surface-alt)",
      }}
    >
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "4rem 1.5rem",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {/* Top row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "2.5rem",
            }}
          >
            {/* Brand */}
            <div style={{ maxWidth: 260 }}>
              <SorellLogo size="md" />
              <p
                style={{
                  marginTop: "0.875rem",
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                }}
              >
                Newsletter IA personnalisée pour vos équipes.
              </p>
            </div>

            {/* Links */}
            <div style={{ display: "flex", gap: "3rem", flexWrap: "wrap" }}>
              <div>
                <p
                  className="section-label"
                  style={{ marginBottom: "0.875rem", display: "block" }}
                >
                  Produit
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  <Link href="/#features" className="footer-link">Fonctionnalités</Link>
                  <Link href="/pricing" className="footer-link">Tarifs</Link>
                  <Link href="/demo" className="footer-link">Démo</Link>
                </div>
              </div>

              <div>
                <p
                  className="section-label"
                  style={{ marginBottom: "0.875rem", display: "block" }}
                >
                  Légal
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                  <Link href="#" className="footer-link">Mentions légales</Link>
                  <Link href="#" className="footer-link">Confidentialité</Link>
                  <Link href="mailto:contact@sorell.fr" className="footer-link">Contact</Link>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border)" }} />

          {/* Bottom row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              © 2026 Sorell · Tous droits réservés
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
