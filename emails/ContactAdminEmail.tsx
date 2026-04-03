import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";

interface ContactAdminEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export function ContactAdminEmail({
  name,
  email,
  subject,
  message,
}: ContactAdminEmailProps) {
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
        <Container style={{ maxWidth: "600px", margin: "0 auto" }}>
          {/* Header */}
          <Section
            style={{
              padding: "24px 32px",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <Text style={{ margin: 0, display: "inline" }}>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                Sorel
                <span style={{ color: "#005058" }}>l</span>
              </span>
              <span
                style={{
                  fontSize: "14px",
                  color: "#6B7280",
                  marginLeft: "12px",
                }}
              >
                Nouveau message de contact
              </span>
            </Text>
          </Section>

          {/* Content */}
          <Section style={{ padding: "32px" }}>
            {/* Info table */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <tbody>
                <tr>
                  <td
                    style={{
                      padding: "8px 0",
                      color: "#6B7280",
                      width: "100px",
                    }}
                  >
                    Nom
                  </td>
                  <td
                    style={{
                      padding: "8px 0",
                      color: "#111827",
                      fontWeight: 500,
                    }}
                  >
                    {name}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 0", color: "#6B7280" }}>Email</td>
                  <td
                    style={{
                      padding: "8px 0",
                      color: "#111827",
                      fontWeight: 500,
                    }}
                  >
                    <Link
                      href={`mailto:${email}`}
                      style={{ color: "#005058" }}
                    >
                      {email}
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "8px 0", color: "#6B7280" }}>Sujet</td>
                  <td
                    style={{
                      padding: "8px 0",
                      color: "#111827",
                      fontWeight: 500,
                    }}
                  >
                    {subject || "Non spécifié"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Message box */}
            <Section
              style={{
                marginTop: "24px",
                padding: "20px",
                background: "#F9FAFB",
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
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
                Message
              </Text>
              <Text
                style={{
                  fontSize: "14px",
                  color: "#111827",
                  lineHeight: "1.6",
                  margin: "0",
                  whiteSpace: "pre-wrap" as const,
                }}
              >
                {message}
              </Text>
            </Section>

            <Text
              style={{
                fontSize: "12px",
                color: "#9CA3AF",
                marginTop: "24px",
              }}
            >
              Répondre directement à cet email enverra la réponse à {email}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ContactAdminEmail;
