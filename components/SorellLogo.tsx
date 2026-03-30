import Link from "next/link";

const sizes = {
  sm: { fontSize: "1rem" },
  md: { fontSize: "1.375rem" },
  lg: { fontSize: "1.5rem" },
};

export default function SorellLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { fontSize } = sizes[size];
  return (
    <Link
      href="/"
      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
      aria-label="Sorell - Accueil"
    >
      <span
        style={{
          fontFamily: "'Quiglet', sans-serif",
          fontSize,
          fontWeight: "normal",
          color: "var(--text)",
          lineHeight: 1,
        }}
      >
        Sorell
      </span>
    </Link>
  );
}
