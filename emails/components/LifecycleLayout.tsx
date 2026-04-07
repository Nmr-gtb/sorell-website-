import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Img,
  Link,
  Text,
  Preview,
} from "@react-email/components";
import * as React from "react";

const WARM_BORDER = "#E8E0D8";
const WARM_BG = "#F5F0EB";
const SECONDARY_TEXT = "#7A7267";
const ACCENT = "#005058";

interface LifecycleLayoutProps {
  preheader?: string;
  children: React.ReactNode;
}

export function LifecycleLayout({ preheader, children }: LifecycleLayoutProps) {
  return (
    <Html>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Body
        style={{
          margin: 0,
          padding: 0,
          background: WARM_BG,
          fontFamily:
            "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          WebkitTextSizeAdjust: "100%",
        }}
      >
        {preheader && <Preview>{preheader}</Preview>}
        <Container
          style={{
            maxWidth: "620px",
            margin: "0 auto",
            background: "#FFFFFF",
          }}
        >
          {/* Header */}
          <Section
            style={{
              padding: "20px 32px",
              borderBottom: `1px solid ${WARM_BORDER}`,
            }}
          >
            <Row>
              <Column>
                <Img
                  src="https://www.sorell.fr/Sorell%20logo.png"
                  alt="Sorell"
                  width="40"
                  height="40"
                  style={{ display: "block" }}
                />
              </Column>
              <Column align="right">
                <Link
                  href="https://sorell.fr"
                  style={{
                    fontSize: "12px",
                    color: ACCENT,
                    textDecoration: "none",
                  }}
                >
                  sorell.fr
                </Link>
              </Column>
            </Row>
          </Section>

          {/* Content */}
          {children}

          {/* Footer */}
          <Section
            style={{
              padding: "22px 32px",
              borderTop: `1px solid ${WARM_BORDER}`,
              background: WARM_BG,
            }}
          >
            <Row>
              <Column>
                <Img
                  src="https://www.sorell.fr/Sorell%20logo.png"
                  alt="Sorell"
                  width="30"
                  height="30"
                  style={{ display: "block" }}
                />
              </Column>
              <Column align="right">
                <Link
                  href="https://sorell.fr"
                  style={{
                    fontSize: "12px",
                    color: ACCENT,
                    textDecoration: "none",
                  }}
                >
                  sorell.fr
                </Link>
              </Column>
            </Row>
            <Text
              style={{
                fontSize: "11px",
                color: SECONDARY_TEXT,
                margin: "14px 0 0",
                lineHeight: "1.5",
              }}
            >
              Vous recevez cet email car vous avez un compte sur Sorell.
              <br />
              Sorell · France
              <br />
              <Link
                href="mailto:noe@sorell.fr"
                style={{ color: SECONDARY_TEXT }}
              >
                Besoin d&apos;aide ? Répondez à cet email
              </Link>
              {" · "}
              <Link
                href="https://sorell.fr/confidentialite"
                style={{ color: SECONDARY_TEXT }}
              >
                Politique de confidentialité
              </Link>
              {" · "}
              <Link
                href="https://sorell.fr/dashboard/profile"
                style={{ color: SECONDARY_TEXT }}
              >
                Gérer mes préférences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
