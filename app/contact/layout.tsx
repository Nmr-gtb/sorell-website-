import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'équipe Sorell. Question sur la newsletter IA, les tarifs ou une demande entreprise ? Nous répondons sous 24h.",
  openGraph: {
    title: "Contact | Sorell",
    description: "Contactez l'équipe Sorell. Nous répondons sous 24h.",
    url: "https://sorell.fr/contact",
  },
  alternates: { canonical: "https://sorell.fr/contact" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
