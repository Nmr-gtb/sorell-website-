import Link from "next/link";
import SorellLogo from "./SorellLogo";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border)",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          padding: "2rem 1.5rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <SorellLogo size="sm" />

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem" }}>
          <Link href="/pricing" className="footer-link">Tarifs</Link>
          <Link href="/demo" className="footer-link">Démo</Link>
          <Link href="mailto:murnoe@outlook.com" className="footer-link">Contact</Link>
          <Link href="/legal" className="footer-link">Mentions légales</Link>
          <Link href="/cgv" className="footer-link">CGV</Link>
          <Link href="/privacy" className="footer-link">Confidentialité</Link>
        </div>

        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          © 2026 Sorell
        </p>
      </div>
    </footer>
  );
}
