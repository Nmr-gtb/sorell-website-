import { Section, Text, Heading, Button } from "@react-email/components";
import * as React from "react";
import { LifecycleLayout } from "./components/LifecycleLayout";

interface VerifyReminderEmailProps {
  name: string;
}

export function VerifyReminderEmail({ name }: VerifyReminderEmailProps) {
  return (
    <LifecycleLayout preheader="Sans confirmation, votre compte reste bloqué - un clic suffit">
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
          Plus qu&apos;une étape avant votre première newsletter
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
          Bonjour {name}, vous vous êtes inscrit hier sur Sorell mais votre
          email n&apos;a pas encore été confirmé.
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 16px",
          }}
        >
          Sans cette confirmation, vous ne pouvez pas accéder à votre dashboard
          ni configurer votre première newsletter. C&apos;est une protection
          contre les inscriptions automatisées.
        </Text>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.7",
            margin: "0 0 24px",
          }}
        >
          Le lien de confirmation que nous vous avons envoyé hier est toujours
          valide. Si vous ne le retrouvez pas, vous pouvez en demander un
          nouveau depuis la page de connexion.
        </Text>
      </Section>

      <Section style={{ padding: "0 32px 32px", textAlign: "center" as const }}>
        <Button
          href="https://sorell.fr/auth/login"
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
          Me connecter et confirmer
        </Button>
      </Section>
    </LifecycleLayout>
  );
}

export default VerifyReminderEmail;
