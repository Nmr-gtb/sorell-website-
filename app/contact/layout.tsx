import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'equipe Sorell. Question sur la newsletter IA, les tarifs ou une demande entreprise ? Nous repondons sous 24h.",
  openGraph: {
    title: "Contact - Sorell",
    description: "Contactez l'equipe Sorell. Nous repondons sous 24h.",
    url: "https://sorell.fr/contact",
  },
  alternates: { canonical: "https://sorell.fr/contact" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
