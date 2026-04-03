import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Link,
} from "@react-email/components";
import * as React from "react";

interface ContactUserEmailProps {
  name: string;
  subject: string;
  message: string;
}

export function ContactUserEmail({
  name,
  subject,
  message,
}: ContactUserEmailProps) {
  const truncatedMessage =
    message.length > 300 ? message.slice(0, 300) + "\u2026" : message;

  return (
    <Html>
      <Head>
        <meta charSet="utf-8" />
      </Head>
      <Body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "'Segoe UI', Roboto, sans-serif",
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            background: "#ffffff",
          }}
        >
          {/* Header */}
          <Section
            style={{
              padding: "24px 32px",
              borderBottom: "2px solid #005058",
            }}
          >
            <Text style={{ margin: 0 }}>
              <span
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Sorel
                <span style={{ color: "#005058" }}>l</span>
              </span>
            </Text>
          </Section>

          {/* Content */}
          <Section style={{ padding: "40px 32px" }}>
            <Heading
              as="h1"
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 12px",
              }}
            >
              Merci pour votre message, {name} !
            </Heading>
            <Text
              style={{
                fontSize: "15px",
                color: "#374151",
                lineHeight: "1.6",
                margin: "0 0 28px",
              }}
            >
              Nous avons bien reçu votre demande et nous vous répondrons dans
              les plus brefs délais.
            </Text>

            {/* Message recap */}
            <Section
              style={{
                background: "#F9FAFB",
                border: "1px solid #E5E7EB",
                borderLeft: "4px solid #005058",
                borderRadius: "6px",
                padding: "20px",
              }}
            >
              <Text
                style={{
                  fontSize: "12px",
                  color: "#6B7280",
                  margin: "0 0 8px",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                }}
              >
                Récapitulatif de votre message
              </Text>
              <Text
                style={{
                  fontSize: "13px",
                  color: "#6B7280",
                  margin: "0 0 4px",
                }}
              >
                <strong style={{ color: "#374151" }}>Sujet :</strong>{" "}
                {subject || "Non spécifié"}
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  lineHeight: "1.6",
                  margin: "8px 0 0",
                  whiteSpace: "pre-wrap" as const,
                }}
              >
                {truncatedMessage}
              </Text>
            </Section>

            <Text
              style={{
                fontSize: "14px",
                color: "#6B7280",
                lineHeight: "1.6",
                margin: "28px 0 0",
              }}
            >
              Pour toute urgence, vous pouvez nous contacter directement à{" "}
              <Link
                href="mailto:noe@sorell.fr"
                style={{
                  color: "#005058",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                noe@sorell.fr
              </Link>
              .
            </Text>
          </Section>

          {/* Footer */}
          <Section
            style={{
              padding: "20px 32px",
              borderTop: "1px solid #E5E7EB",
              background: "#F9FAFB",
            }}
          >
            <Text
              style={{
                fontSize: "12px",
                color: "#9CA3AF",
                margin: "0",
              }}
            >
              Cet email a été envoyé automatiquement suite à votre demande de
              contact sur sorell.fr.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ContactUserEmail;
