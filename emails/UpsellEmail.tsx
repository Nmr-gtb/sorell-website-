import {
  Section,
  Text,
  Heading,
  Button,
} from "@react-email/components";
import * as React from "react";
import { LifecycleLayout } from "./components/LifecycleLayout";

interface UpsellEmailProps {
  name: string;
  currentPlan: string;
}

export function UpsellEmail({ name, currentPlan }: UpsellEmailProps) {
  const isPro = currentPlan === "pro";
  const nextPlan = isPro ? "Business" : "Pro";
  const nextPrice = isPro ? "49" : "19";
  const nextBenefits = isPro
    ? "Newsletters illimitées, 25 destinataires, logo personnalisé"
    : "4 newsletters/mois, 5 destinataires, sources custom, analytics, historique";

  return (
    <LifecycleLayout preheader={`${name}, découvrez le plan ${nextPlan}`}>
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
          1 mois avec Sorell
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
          {name}, ça fait 4 semaines que Sorell fait votre veille sectorielle.
          Si vous souhaitez aller plus loin, le plan {nextPlan} débloque de
          nouvelles possibilités.
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
          Plan {nextPlan} - {nextPrice}&euro;/mois
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.7",
            margin: "0 0 20px",
          }}
        >
          {nextBenefits}
        </Text>
      </Section>

      <Section
        style={{ padding: "0 32px 12px", textAlign: "center" as const }}
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

      <Section
        style={{ padding: "4px 32px 28px", textAlign: "center" as const }}
      >
        <Text style={{ fontSize: "13px", color: "#7A7267", margin: "0" }}>
          Pas de pression — votre plan actuel reste actif.
        </Text>
      </Section>
    </LifecycleLayout>
  );
}

export default UpsellEmail;
