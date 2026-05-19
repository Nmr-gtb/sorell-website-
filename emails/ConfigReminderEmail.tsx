import { Section, Text, Heading, Button } from "@react-email/components";
import * as React from "react";
import { LifecycleLayout } from "./components/LifecycleLayout";

interface ConfigReminderEmailProps {
  name: string;
}

export function ConfigReminderEmail({ name }: ConfigReminderEmailProps) {
  return (
    <LifecycleLayout preheader="Trois étapes pour configurer votre veille sectorielle">
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
          On configure votre première newsletter ?
        </Heading>
      </Section>

      <Section style={{ padding: "0 32px 20px" }}>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 16px",
          }}
        >
          Bonjour {name}, votre compte Sorell est actif depuis 2 jours mais
          votre newsletter n&apos;est pas encore configurée. Sans
          configuration, aucune newsletter ne peut partir.
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 8px",
          }}
        >
          Pour recevoir votre première veille sectorielle, il vous suffit de :
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
          Trois étapes rapides
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;Décrire votre activité en une phrase (le brief)
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;Choisir vos thématiques
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0",
          }}
        >
          &middot;&nbsp;&nbsp;Lancer la première génération
        </Text>
      </Section>

      <Section style={{ padding: "0 32px 24px" }}>
        <Text
          style={{
            fontSize: "14px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0",
          }}
        >
          Comptez 5 minutes. La première newsletter arrive ensuite selon la
          fréquence choisie : mensuelle pour le plan Free, hebdomadaire ou
          quotidienne pour Pro et Business.
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

export default ConfigReminderEmail;
