import {
  Section,
  Text,
  Heading,
  Button,
} from "@react-email/components";
import * as React from "react";
import { LifecycleLayout } from "./components/LifecycleLayout";

interface WelcomeEmailProps {
  name: string;
  email: string;
  verifyUrl?: string;
}

export function WelcomeEmail({ name, email, verifyUrl }: WelcomeEmailProps) {
  const displayName = name || email.split("@")[0];
  const ctaHref = verifyUrl || "https://sorell.fr/dashboard";

  return (
    <LifecycleLayout preheader="Votre veille sectorielle IA est prête">
      {/* Title */}
      <Section style={{ padding: "36px 32px 0" }}>
        <Heading
          as="h1"
          style={{
            fontSize: "22px",
            fontWeight: 600,
            color: "#111827",
            margin: "0 0 24px",
          }}
        >
          Bienvenue sur Sorell
        </Heading>
      </Section>

      {/* Content */}
      <Section style={{ padding: "0 32px 24px" }}>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 16px",
          }}
        >
          Bonjour {displayName}, merci de nous avoir rejoints. Votre newsletter
          de veille sectorielle est configurée et prête à fonctionner.
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 24px",
          }}
        >
          Sorell va analyser le web pour vous et vous envoyer une synthèse
          personnalisée directement dans votre boîte mail, au créneau que vous
          avez choisi.
        </Text>
      </Section>

      {/* What's ready */}
      <Section style={{ padding: "0 32px 24px" }}>
        <Text
          style={{
            fontSize: "11px",
            color: "#7A7267",
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
            margin: "0 0 14px",
          }}
        >
          Ce qui est en place
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;Votre brief et vos thématiques sont enregistrés
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;Vos sources et destinataires sont configurés
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0",
          }}
        >
          &middot;&nbsp;&nbsp;Votre première newsletter est en route
        </Text>
      </Section>

      {/* CTA */}
      <Section
        style={{ padding: "0 32px 24px", textAlign: "center" as const }}
      >
        <Button
          href={ctaHref}
          style={{
            display: "inline-block",
            padding: "14px 32px",
            background: "#005058",
            color: "white",
            fontSize: "14px",
            fontWeight: 500,
            textDecoration: "none",
            borderRadius: "8px",
          }}
        >
          {verifyUrl ? "Confirmer mon adresse email" : "Accéder à mon tableau de bord"}
        </Button>
      </Section>

      {/* Anti-spam tip */}
      <Section style={{ padding: "0 32px 32px", textAlign: "center" as const }}>
        <Text
          style={{
            fontSize: "12px",
            color: "#9CA3AF",
            lineHeight: "1.5",
            margin: "0",
          }}
        >
          Pour ne rien manquer, ajoutez{" "}
          <span style={{ color: "#6B7280" }}>newsletters@sorell.fr</span>{" "}
          à vos contacts.{" "}
          <a
            href="https://www.sorell.fr/blog/ajouter-contact-email-eviter-spams"
            style={{ color: "#6B7280", textDecoration: "underline" }}
          >
            Comment faire ?
          </a>
        </Text>
      </Section>
    </LifecycleLayout>
  );
}

export default WelcomeEmail;
