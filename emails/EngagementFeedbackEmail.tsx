import { Section, Text, Heading } from "@react-email/components";
import * as React from "react";
import { LifecycleLayout } from "./components/LifecycleLayout";

interface EngagementFeedbackEmailProps {
  name: string;
}

export function EngagementFeedbackEmail({
  name,
}: EngagementFeedbackEmailProps) {
  return (
    <LifecycleLayout preheader="Une question courte sur votre expérience Sorell">
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
          Vous avez reçu vos 3 premières newsletters
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
          Bonjour {name}, Sorell vous a livré 3 newsletters jusqu&apos;ici.
          C&apos;est assez pour vous faire une idée concrète, et pas trop pour
          que vous nous donniez un retour à chaud.
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 16px",
          }}
        >
          Une question simple : est-ce que ces newsletters vous sont utiles ?
          Pas de formulaire, pas d&apos;échelle de notation. Répondez
          directement à cet email, même en une phrase.
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 8px",
          }}
        >
          Ce qui nous aide vraiment, ce sont les retours sur :
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
          Les sujets qui nous intéressent
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;La pertinence des sujets couverts pour votre
          activité
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;La densité d&apos;information (trop, pas assez,
          juste)
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0",
          }}
        >
          &middot;&nbsp;&nbsp;Ce que vous aimeriez voir en plus ou en moins
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
          On lit et on répond à chaque message, y compris les critiques. Ce
          sont elles qui font avancer le produit.
        </Text>
      </Section>
    </LifecycleLayout>
  );
}

export default EngagementFeedbackEmail;
