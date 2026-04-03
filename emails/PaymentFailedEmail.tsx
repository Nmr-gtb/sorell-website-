import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Link,
} from "@react-email/components";
import * as React from "react";

interface PaymentFailedEmailProps {
  firstName: string;
}

export function PaymentFailedEmail({ firstName }: PaymentFailedEmailProps) {
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  return (
    <Html lang="fr">
      <Head>
        <meta charSet="UTF-8" />
      </Head>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f4f4f5",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <Container
          style={{
            backgroundColor: "#f4f4f5",
            padding: "40px 0",
          }}
        >
          <Container
            style={{
              width: "600px",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <Section
              style={{
                backgroundColor: "#005058",
                padding: "32px 40px",
                textAlign: "center" as const,
              }}
            >
              <Text
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#ffffff",
                  letterSpacing: "1px",
                  margin: 0,
                }}
              >
                Sorell
              </Text>
            </Section>

            {/* Body */}
            <Section style={{ padding: "40px" }}>
              <Text
                style={{
                  margin: "0 0 20px",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  color: "#1a1a1a",
                }}
              >
                {greeting}
              </Text>
              <Text
                style={{
                  margin: "0 0 20px",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  color: "#1a1a1a",
                }}
              >
                Nous n&apos;avons pas pu traiter votre dernier paiement pour
                votre abonnement Sorell.
              </Text>
              <Text
                style={{
                  margin: "0 0 20px",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  color: "#1a1a1a",
                }}
              >
                Votre compte a été temporairement basculé vers le plan{" "}
                <strong>Gratuit</strong>. Vos configurations sont conservées,
                mais certaines fonctionnalités ne sont plus accessibles.
              </Text>
              <Text
                style={{
                  margin: "0 0 30px",
                  fontSize: "16px",
                  lineHeight: "1.6",
                  color: "#1a1a1a",
                }}
              >
                Pour retrouver votre abonnement, il vous suffit de mettre à jour
                votre moyen de paiement :
              </Text>

              {/* CTA Button */}
              <Section style={{ textAlign: "center" as const }}>
                <Button
                  href="https://sorell.fr/dashboard/profile"
                  style={{
                    display: "inline-block",
                    backgroundColor: "#005058",
                    color: "#ffffff",
                    fontSize: "16px",
                    fontWeight: 600,
                    textDecoration: "none",
                    padding: "14px 32px",
                    borderRadius: "6px",
                  }}
                >
                  Mettre à jour mon paiement
                </Button>
              </Section>

              <Text
                style={{
                  margin: "30px 0 0",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: "#6b7280",
                }}
              >
                Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur ou si
                vous avez besoin d&apos;aide, répondez simplement à cet email.
                Nous sommes là pour vous aider.
              </Text>
            </Section>

            {/* Footer */}
            <Section
              style={{
                backgroundColor: "#f9fafb",
                padding: "24px 40px",
                textAlign: "center" as const,
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "#9ca3af",
                }}
              >
                Sorell - Votre veille sectorielle automatisée
              </Text>
              <Text
                style={{
                  margin: "8px 0 0",
                  fontSize: "12px",
                  color: "#9ca3af",
                }}
              >
                Cet email a été envoyé automatiquement suite à un problème de
                paiement.
              </Text>
            </Section>
          </Container>
        </Container>
      </Body>
    </Html>
  );
}

export default PaymentFailedEmail;
