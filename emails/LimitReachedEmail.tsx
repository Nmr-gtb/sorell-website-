import { Section, Text, Heading, Button } from "@react-email/components";
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
  const isFree = plan === "Free";
  const nextPlan = isFree ? "Pro" : "Business";
  const nextMonthlyPrice = isFree ? "19" : "49";
  const nextYearlyPrice = isFree ? "190" : "490";
  const nextBenefits = isFree
    ? "newsletters illimitées, jusqu'à 10 destinataires, thématiques et sources personnalisées, analytics d'engagement"
    : "50 destinataires, fréquence quotidienne, logo personnalisé, support prioritaire";

  return (
    <LifecycleLayout preheader={`Prochaine newsletter le mois prochain - ou maintenant en passant au plan ${nextPlan}`}>
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
          Limite mensuelle atteinte
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
          {name}, vous avez utilisé{" "}
          {limit === 1
            ? "votre newsletter du mois"
            : `vos ${limit} newsletters du mois`}{" "}
          sur le plan {plan}. La prochaine sera disponible automatiquement au
          début du mois prochain.
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0",
          }}
        >
          {isFree
            ? "Si vous voulez en recevoir plus dès maintenant, le plan Pro retire la limite : "
            : "Si votre usage justifie de monter d'un cran, le plan Business débloque : "}
          {nextBenefits}.
        </Text>
      </Section>

      <Section style={{ padding: "0 32px 24px" }}>
        <Text
          style={{
            fontSize: "11px",
            color: "#7A7267",
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
            margin: "0 0 10px",
          }}
        >
          Plan {nextPlan}
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.7",
            margin: "0",
          }}
        >
          {nextMonthlyPrice}&euro;/mois &nbsp;ou&nbsp; {nextYearlyPrice}&euro;/an
        </Text>
      </Section>

      <Section style={{ padding: "0 32px 32px", textAlign: "center" as const }}>
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
          Voir le plan {nextPlan}
        </Button>
      </Section>
    </LifecycleLayout>
  );
}

export default LimitReachedEmail;
