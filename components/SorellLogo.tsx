import Link from "next/link";
import Image from "next/image";

const sizes = {
  sm: { icon: 24, fontSize: "1rem" },
  md: { icon: 28, fontSize: "1.375rem" },
  lg: { icon: 32, fontSize: "1.5rem" },
};

export default function SorellLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { icon, fontSize } = sizes[size];
  return (
    <Link
      href="/"
      style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}
      aria-label="Sorell - Accueil"
    >
      <Image src="/icone.png" alt="" width={icon} height={icon} style={{ display: "block", flexShrink: 0 }} />
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
