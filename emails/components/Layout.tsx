import * as React from "react";
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
  Hr,
} from "@react-email/components";

interface LayoutProps {
  subject: string;
  preheaderText: string;
  brandColor: string;
  warmBorder?: string;
  warmBg?: string;
  secondaryText?: string;
  cardBg: string;
  customLogo: string | null;
  date: string;
  unsubscribeUrl: string;
  trackingPixelUrl?: string;
  children: React.ReactNode;
}

const fontSans =
  "'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const fontSerif = "Georgia,'Times New Roman',serif";

export function Layout({
  subject,
  preheaderText,
  brandColor,
  warmBorder = "#E8E0D8",
  warmBg = "#F5F0EB",
  secondaryText = "#7A7267",
  cardBg,
  customLogo,
  date,
  unsubscribeUrl,
  trackingPixelUrl,
  children,
}: LayoutProps) {
  const invisiblePadding = "\u00A0\u200B".repeat(30);

  return (
    <Html>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <title>{subject}</title>
      </Head>
      <Body
        style={{
          margin: 0,
          padding: 0,
          background: warmBg,
          fontFamily: fontSans,
          WebkitTextSizeAdjust: "100%",
        }}
      >
        {/* Preheader */}
        <div
          style={{
            display: "none",
            maxHeight: 0,
            overflow: "hidden",
          }}
          dangerouslySetInnerHTML={{
            __html: `${preheaderText}${invisiblePadding}`,
          }}
        />

        <Container
          style={{
            maxWidth: "620px",
            margin: "0 auto",
            background: cardBg,
          }}
        >
          {/* Header */}
          <Section
            style={{
              padding: "20px 32px",
              borderBottom: `1px solid ${warmBorder}`,
            }}
          >
            <Row>
              <Column style={{ width: "36px" }}>
                <Img
                  src={customLogo || "https://www.sorell.fr/icone.png"}
                  alt={customLogo ? "Logo" : "S."}
                  style={
                    customLogo
                      ? { maxHeight: "32px", maxWidth: "160px" }
                      : { width: "32px", height: "32px" }
                  }
                />
              </Column>
              <Column align="right">
                <Text
                  style={{
                    fontSize: "12px",
                    color: secondaryText,
                    fontFamily: fontSerif,
                    margin: 0,
                  }}
                >
                  {date}
                </Text>
              </Column>
            </Row>
          </Section>

          {children}

          {/* Footer */}
          <Section
            style={{
              padding: "22px 32px",
              borderTop: `1px solid ${warmBorder}`,
              background: warmBg,
            }}
          >
            <Row>
              <Column style={{ width: "32px" }}>
                <Img
                  src={customLogo || "https://www.sorell.fr/icone.png"}
                  alt={customLogo ? "Logo" : "S."}
                  style={
                    customLogo
                      ? { maxHeight: "24px", maxWidth: "120px" }
                      : { width: "24px", height: "24px" }
                  }
                />
              </Column>
              <Column align="right">
                <Link
                  href="https://sorell.fr"
                  style={{
                    fontSize: "12px",
                    color: brandColor,
                    textDecoration: "none",
                    fontFamily: fontSans,
                  }}
                >
                  sorell.fr
                </Link>
              </Column>
            </Row>
            <Text
              style={{
                fontSize: "11px",
                color: secondaryText,
                margin: "14px 0 0",
                lineHeight: "1.5",
                fontFamily: fontSans,
              }}
            >
              {"G\u00e9n\u00e9r\u00e9 par Sorell \u00b7 Votre veille sectorielle par IA"}
              <br />
              {"Sorell \u00b7 France"}
              <br />
              <Link href={unsubscribeUrl} style={{ color: secondaryText }}>
                {"Se d\u00e9sabonner"}
              </Link>
              {" \u00b7 "}
              <Link href="https://sorell.fr/confidentialite" style={{ color: secondaryText }}>
                {"Politique de confidentialit\u00e9"}
              </Link>
            </Text>
          </Section>
        </Container>

        {/* Tracking pixel */}
        {trackingPixelUrl && (
          <Img
            src={trackingPixelUrl}
            width="1"
            height="1"
            style={{ display: "none" }}
            alt=""
          />
        )}
      </Body>
    </Html>
  );
}
