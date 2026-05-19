import { Section, Text, Heading, Button } from "@react-email/components";
import * as React from "react";
import { LifecycleLayout } from "./components/LifecycleLayout";

interface RetentionInactiveEmailProps {
  name: string;
}

export function RetentionInactiveEmail({ name }: RetentionInactiveEmailProps) {
  return (
    <LifecycleLayout preheader="Aucune newsletter envoyée depuis 30 jours - tout va bien ?">
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
          30 jours sans newsletter
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
          Bonjour {name}, Sorell n&apos;a envoyé aucune newsletter sur votre
          compte depuis 30 jours.
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 16px",
          }}
        >
          Ça peut être normal (vous avez désactivé l&apos;envoi automatique,
          vous êtes en pause volontaire) ou un signe que quelque chose ne va
          pas (config cassée après modification, fréquence trop basse, sujets
          qui ne sont plus pertinents).
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 8px",
          }}
        >
          Quelques actions possibles selon ce qui s&apos;est passé :
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
          Pistes à explorer
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;Vérifier votre fréquence et vos thématiques dans
          la config
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;Forcer la génération d&apos;une newsletter
          manuellement
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0",
          }}
        >
          &middot;&nbsp;&nbsp;Nous écrire si quelque chose ne fonctionne pas
          comme prévu
        </Text>
      </Section>

      <Section style={{ padding: "0 32px 20px" }}>
        <Text
          style={{
            fontSize: "13px",
            color: "#7A7267",
            lineHeight: "1.6",
            margin: "0",
            fontStyle: "italic",
          }}
        >
          Si vous avez fait une pause volontaire, ignorez cet email. On ne vous
          relancera pas avant 30 jours supplémentaires.
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
          Vérifier ma configuration
        </Button>
      </Section>
    </LifecycleLayout>
  );
}

export default RetentionInactiveEmail;
