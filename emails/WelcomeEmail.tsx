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
}

export function WelcomeEmail({ name, email }: WelcomeEmailProps) {
  const displayName = name || email.split("@")[0];

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
          Bonjour {displayName}, merci de nous avoir rejoints. Vous avez
          désormais accès à une veille sectorielle automatique, générée par IA à
          partir de vraies actualités du web, et livrée dans votre boîte mail
          chaque semaine.
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 24px",
          }}
        >
          Il ne reste que 5 minutes de configuration pour que Sorell comprenne
          votre métier et commence à travailler pour vous.
        </Text>
      </Section>

      {/* Steps */}
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
          Ce qu&apos;on configure ensemble
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;Votre brief : décrivez votre activité en quelques
          lignes
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;Vos thématiques et sources préférées
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0",
          }}
        >
          &middot;&nbsp;&nbsp;Votre créneau d&apos;envoi et vos destinataires
        </Text>
      </Section>

      {/* CTA */}
      <Section
        style={{ padding: "0 32px 32px", textAlign: "center" as const }}
      >
        <Button
          href="https://sorell.fr/dashboard"
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
          Configurer ma newsletter
        </Button>
      </Section>
    </LifecycleLayout>
  );
}

export default WelcomeEmail;
