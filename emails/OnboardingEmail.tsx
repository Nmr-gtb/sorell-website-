import {
  Section,
  Text,
  Heading,
  Button,
} from "@react-email/components";
import * as React from "react";
import { LifecycleLayout } from "./components/LifecycleLayout";

interface OnboardingEmailProps {
  name: string;
}

export function OnboardingEmail({ name }: OnboardingEmailProps) {
  return (
    <LifecycleLayout preheader={`${name}, configurez votre newsletter IA en 5 minutes`}>
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
          Votre veille sectorielle vous attend
        </Heading>
      </Section>

      <Section style={{ padding: "0 32px 24px" }}>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 16px",
          }}
        >
          Bonjour {name}, votre compte a été créé hier, mais votre première
          newsletter n&apos;est pas encore configurée.
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 24px",
          }}
        >
          En 5 minutes, Sorell peut vous envoyer automatiquement une veille
          sectorielle personnalisée, générée par IA à partir de vraies
          actualités du web.
        </Text>
      </Section>

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
          3 étapes rapides
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;Décrivez votre activité (votre brief)
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;Choisissez vos thématiques
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0",
          }}
        >
          &middot;&nbsp;&nbsp;Cliquez sur &quot;Générer&quot;
        </Text>
      </Section>

      <Section style={{ padding: "0 32px 32px", textAlign: "center" as const }}>
        <Button
          href="https://sorell.fr/dashboard/config"
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

export default OnboardingEmail;
