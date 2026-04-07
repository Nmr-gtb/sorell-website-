import {
  Section,
  Text,
  Heading,
  Button,
  Link,
} from "@react-email/components";
import * as React from "react";
import { LifecycleLayout } from "./components/LifecycleLayout";

interface TrialReminderEmailProps {
  name: string;
  plan: string;
  daysLeft: 3 | 1 | 0;
}

function getPlanBenefits(plan: string): string {
  if (plan === "Pro") {
    return "\u00B7\u00A0\u00A0Newsletters illimitées\u00A0\u00A0\u00B7\u00A0\u00A010 destinataires\u00A0\u00A0\u00B7\u00A0\u00A0Analytics\u00A0\u00A0\u00B7\u00A0\u00A0Historique + aperçu";
  }
  return "\u00B7\u00A0\u00A0Newsletters illimitées\u00A0\u00A0\u00B7\u00A0\u00A050 destinataires\u00A0\u00A0\u00B7\u00A0\u00A0Analytics\u00A0\u00A0\u00B7\u00A0\u00A0Logo personnalisé";
}

export function TrialReminderEmail({
  name,
  plan,
  daysLeft,
}: TrialReminderEmailProps) {
  if (daysLeft === 3) {
    return (
      <LifecycleLayout preheader={`Plus que 3 jours d'essai ${plan}`}>
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
            Plus que 3 jours d&apos;essai
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
            Bonjour {name}, votre essai gratuit du plan {plan} se termine dans 3
            jours. Pour continuer, aucune action requise — votre abonnement
            démarrera automatiquement.
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
            Ce que vous gardez avec {plan}
          </Text>
          <Text
            style={{
              fontSize: "14px",
              color: "#111827",
              lineHeight: "1.7",
              margin: "0",
            }}
          >
            {getPlanBenefits(plan)}
          </Text>
        </Section>

        <Section style={{ padding: "0 32px 8px" }}>
          <Text
            style={{
              fontSize: "13px",
              color: "#7A7267",
              lineHeight: "1.6",
              margin: "0",
              fontStyle: "italic",
            }}
          >
            Pour annuler avant le premier paiement, rendez-vous sur votre{" "}
            <Link
              href="https://sorell.fr/dashboard/profile"
              style={{ color: "#005058", textDecoration: "underline" }}
            >
              profil
            </Link>
            .
          </Text>
        </Section>

        <Section
          style={{ padding: "16px 32px 32px", textAlign: "center" as const }}
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
            Mon dashboard
          </Button>
        </Section>
      </LifecycleLayout>
    );
  }

  if (daysLeft === 1) {
    return (
      <LifecycleLayout
        preheader={`Dernier jour d'essai ${plan} - ${name}`}
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
            Dernier jour d&apos;essai demain
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
            Bonjour {name}, votre essai du plan {plan} se termine demain. Votre
            abonnement commencera automatiquement — aucune interruption de
            service.
          </Text>
          <Text
            style={{
              fontSize: "13px",
              color: "#7A7267",
              lineHeight: "1.6",
              margin: "0",
              fontStyle: "italic",
            }}
          >
            Pour annuler avant le premier paiement, rendez-vous sur votre{" "}
            <Link
              href="https://sorell.fr/dashboard/profile"
              style={{ color: "#005058", textDecoration: "underline" }}
            >
              profil
            </Link>
            .
          </Text>
        </Section>

        <Section
          style={{ padding: "0 32px 32px", textAlign: "center" as const }}
        >
          <Button
            href="https://sorell.fr/dashboard/profile"
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
            Gérer mon abonnement
          </Button>
        </Section>
      </LifecycleLayout>
    );
  }

  // daysLeft === 0
  return (
    <LifecycleLayout preheader={`Votre abonnement ${plan} est actif`}>
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
          Votre abonnement {plan} est actif
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
          Bonjour {name}, votre période d&apos;essai est terminée et votre
          abonnement {plan} est désormais actif. Configurez vos sources, ajoutez
          des destinataires et explorez vos analytics depuis votre dashboard.
        </Text>
      </Section>

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
          Mon dashboard
        </Button>
      </Section>
    </LifecycleLayout>
  );
}

export default TrialReminderEmail;
