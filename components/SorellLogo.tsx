import Link from "next/link";

export default function SorellLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const fontSize = size === "sm" ? "1rem" : size === "lg" ? "1.5rem" : "1.375rem";
  return (
    <Link
      href="/"
      style={{ textDecoration: "none", display: "inline-block" }}
      aria-label="Sorell - Accueil"
    >
      <span
        style={{
          fontFamily: "var(--font-inter, 'Inter', sans-serif)",
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "var(--text)",
          lineHeight: 1,
        }}
      >
        Sorel<span style={{ color: "var(--accent)" }}>l</span>
      </span>
    </Link>
  );
}
