import Link from "next/link";

export default function SorellLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const fontSize = size === "sm" ? "1rem" : size === "lg" ? "1.5rem" : "1.25rem";
  return (
    <Link
      href="/"
      style={{ textDecoration: "none", display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 0 }}
      aria-label="Sorell — Accueil"
    >
      <span style={{
        fontFamily: "var(--font-display, 'Cormorant Garamond', Georgia, serif)",
        fontSize,
        fontWeight: 600,
        fontStyle: "italic",
        letterSpacing: "0.05em",
        color: "var(--text)",
        lineHeight: 1,
      }}>
        Sorell
      </span>
      <span style={{
        display: "block",
        width: 40,
        height: 1.5,
        background: "var(--accent)",
        borderRadius: 2,
        marginTop: 4,
      }} />
    </Link>
  );
}
