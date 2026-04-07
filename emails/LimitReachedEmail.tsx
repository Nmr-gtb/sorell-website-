import {
  Section,
  Text,
  Heading,
  Button,
} from "@react-email/components";
import * as React from "react";
import { LifecycleLayout } from "./components/LifecycleLayout";

interface LimitReachedEmailProps {
  name: string;
  plan: string;
  limit: number;
}

export function LimitReachedEmail({
  name,
  plan,
  limit,
}: LimitReachedEmailProps) {
  const nextPlan = plan === "Free" ? "Pro" : "Business";
  const nextPrice = plan === "Free" ? "19" : "49";
  const nextBenefits =
    plan === "Free"
      ? "Newsletters illimitées, 10 destinataires, thématiques et sources au choix, analytics"
      : "Newsletters illimitées, 50 destinataires, logo personnalisé, fréquence quotidienne";

  return (
    <LifecycleLayout
      preheader={`Vous avez utilisé vos ${limit} newsletters du mois`}
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
          Limite de newsletters atteinte
        </Heading>
      </Section>

      <Section style={{ padding: "0 32px 24px" }}>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 24px",
          }}
        >
          {name}, vous avez utilisé vos {limit} newsletters du mois sur le plan{" "}
          {plan}. Votre prochaine newsletter sera disponible le mois prochain.
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
          Besoin de plus ?
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.7",
            margin: "0 0 20px",
          }}
        >
          Le plan {nextPlan} à {nextPrice}&euro;/mois inclut : {nextBenefits}.
        </Text>
      </Section>

      <Section
        style={{ padding: "0 32px 32px", textAlign: "center" as const }}
      >
        <Button
          href="https://sorell.fr/tarifs"
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
          Voir les plans
        </Button>
      </Section>
    </LifecycleLayout>
  );
}

export default LimitReachedEmail;
