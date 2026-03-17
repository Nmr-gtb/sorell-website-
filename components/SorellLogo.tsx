import Link from "next/link";

interface SorellLogoProps {
  size?: "sm" | "md" | "lg";
}

export default function SorellLogo({ size = "md" }: SorellLogoProps) {
  const sizes = { sm: "1rem", md: "1.25rem", lg: "1.5rem" };

  return (
    <Link
      href="/"
      className="logo-wordmark"
      style={{ fontSize: sizes[size] }}
      aria-label="Sorell — Accueil"
    >
      <span>Sor</span>
      <span className="logo-rell">ell</span>
    </Link>
  );
}
