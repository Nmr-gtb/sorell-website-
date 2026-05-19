import { Section, Text, Heading, Button } from "@react-email/components";
import * as React from "react";
import { LifecycleLayout } from "./components/LifecycleLayout";

interface RetentionUnopenedEmailProps {
  name: string;
}

export function RetentionUnopenedEmail({ name }: RetentionUnopenedEmailProps) {
  return (
    <LifecycleLayout preheader="Vos 5 dernières newsletters sont restées non ouvertes - on peut ajuster">
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
          5 newsletters non ouvertes
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
          Bonjour {name}, vos 5 dernières newsletters Sorell sont arrivées dans
          votre boîte mais n&apos;ont pas été ouvertes.
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 16px",
          }}
        >
          Il y a plein de raisons possibles : vous lisez Sorell depuis une
          autre adresse, les sujets ne sont plus pertinents, la fréquence est
          trop élevée, le format ne vous parle plus. On préfère vous demander
          plutôt qu&apos;insister.
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 8px",
          }}
        >
          Si vous voulez continuer mais ajuster :
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
          Leviers d&apos;ajustement
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;Changer la fréquence (un jour différent, ou moins
          souvent)
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;Modifier vos thématiques ou votre brief
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0 0 10px",
          }}
        >
          &middot;&nbsp;&nbsp;Recevoir sur une autre adresse email
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#111827",
            lineHeight: "1.6",
            margin: "0",
          }}
        >
          &middot;&nbsp;&nbsp;Mettre en pause sans annuler l&apos;abonnement
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
          Si vous préférez arrêter complètement, le lien de désabonnement est
          en bas de chaque newsletter, ou vous pouvez répondre directement à
          cet email. Pas de processus de rétention agressif.
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
          Ajuster mes préférences
        </Button>
      </Section>
    </LifecycleLayout>
  );
}

export default RetentionUnopenedEmail;
