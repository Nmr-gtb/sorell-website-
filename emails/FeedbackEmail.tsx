import {
  Section,
  Text,
  Heading,
} from "@react-email/components";
import * as React from "react";
import { LifecycleLayout } from "./components/LifecycleLayout";

interface FeedbackEmailProps {
  name: string;
}

export function FeedbackEmail({ name }: FeedbackEmailProps) {
  return (
    <LifecycleLayout
      preheader={`${name}, ça fait 2 semaines — votre avis compte`}
    >
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
          2 semaines de veille automatique
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
          Bonjour {name}, vous utilisez Sorell depuis 2 semaines. Avant de
          continuer, une question simple : est-ce que ça vous est utile ?
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 24px",
          }}
        >
          Pas de formulaire. Répondez directement à cet email, même en une
          phrase.
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
          Ce qui nous intéresse
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;Les sujets couverts sont-ils pertinents pour votre
          activité ?
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;La fréquence vous convient-elle ?
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0",
          }}
        >
          &middot;&nbsp;&nbsp;Qu&apos;est-ce qu&apos;on pourrait améliorer ?
        </Text>
      </Section>

      <Section style={{ padding: "0 32px 28px" }}>
        <Text
          style={{
            fontSize: "13px",
            color: "#7A7267",
            lineHeight: "1.6",
            margin: "0",
            fontStyle: "italic",
          }}
        >
          Chaque retour aide à rendre Sorell meilleur. On lit et on répond à
          chaque message.
        </Text>
      </Section>
    </LifecycleLayout>
  );
}

export default FeedbackEmail;
