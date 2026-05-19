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
    return "·  Newsletters illimitées  ·  10 destinataires  ·  Analytics  ·  Historique + aperçu";
  }
  return "·  Newsletters illimitées  ·  50 destinataires  ·  Analytics  ·  Logo personnalisé";
}

export function TrialReminderEmail({
  name,
  plan,
  daysLeft,
}: TrialReminderEmailProps) {
  if (daysLeft === 3) {
    return (
      <LifecycleLayout preheader="Aucune action requise - votre abonnement démarre automatiquement">
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
            3 jours avant la conversion
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
            Bonjour {name}, votre essai gratuit du plan {plan} se termine dans
            3 jours.
          </Text>
          <Text
            style={{
              fontSize: "15px",
              color: "#4B5563",
              lineHeight: "1.7",
              margin: "0 0 24px",
            }}
          >
            Aucune action de votre part n&apos;est nécessaire : votre
            abonnement {plan} démarrera automatiquement à la fin de
            l&apos;essai.
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
            Pour annuler avant le premier prélèvement, c&apos;est dans votre{" "}
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
            Voir mon abonnement
          </Button>
        </Section>
      </LifecycleLayout>
    );
  }

  if (daysLeft === 1) {
    return (
      <LifecycleLayout preheader="Dernière journée gratuite avant le démarrage de l'abonnement">
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
            Demain, votre abonnement commence
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
            abonnement {plan} commencera automatiquement, sans interruption de
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
            Pour annuler avant le premier prélèvement, c&apos;est dans votre{" "}
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

  // daysLeft === 0 - conversion day
  const proActions = [
    "Ajouter jusqu'à 10 destinataires",
    "Affiner vos thématiques",
    "Suivre l'engagement dans les analytics",
    "Customiser la fréquence d'envoi",
  ];
  const businessActions = [
    "Ajouter jusqu'à 50 destinataires",
    "Activer la fréquence quotidienne",
    "Ajouter votre logo personnalisé",
    "Suivre l'engagement dans les analytics",
  ];
  const actions = plan === "Pro" ? proActions : businessActions;

  return (
    <LifecycleLayout preheader={`Votre abonnement ${plan} est actif - voici comment en tirer le maximum`}>
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

      <Section style={{ padding: "0 32px 20px" }}>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 16px",
          }}
        >
          {name}, votre période d&apos;essai est terminée et votre abonnement{" "}
          {plan} est désormais actif. Merci de continuer avec Sorell.
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 8px",
          }}
        >
          Quelques pistes pour exploiter pleinement votre plan :
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
          Pour bien démarrer
        </Text>
        {actions.map((action, idx) => (
          <Text
            key={action}
            style={{
              fontSize: "14px",
              color: "#111827",
              lineHeight: "1.6",
              margin: idx === actions.length - 1 ? "0" : "0 0 10px",
            }}
          >
            &middot;&nbsp;&nbsp;{action}
          </Text>
        ))}
      </Section>

      <Section style={{ padding: "0 32px 32px", textAlign: "center" as const }}>
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
