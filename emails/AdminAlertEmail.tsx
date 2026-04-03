import {
  Section,
  Text,
  Heading,
} from "@react-email/components";
import * as React from "react";
import { LifecycleLayout } from "./components/LifecycleLayout";

interface AdminAlertEmailProps {
  count: number;
  ids: string[];
}

export function AdminAlertEmail({ count, ids }: AdminAlertEmailProps) {
  return (
    <LifecycleLayout>
      <Section style={{ padding: "40px 32px 24px" }}>
        <Heading
          as="h1"
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#DC2626",
            margin: "0 0 12px",
          }}
        >
          Alerte : échecs de génération
        </Heading>
        <Text
          style={{
            fontSize: "15px",
            color: "#4B5563",
            lineHeight: "1.65",
            margin: "0 0 24px",
          }}
        >
          <strong>{count} newsletters</strong> ont été créées dans la dernière
          heure mais n&apos;ont pas été envoyées. Cela peut indiquer un problème
          avec l&apos;API Claude, Resend, ou le CRON principal.
        </Text>
        <Text
          style={{
            fontSize: "14px",
            color: "#6B7280",
            lineHeight: "1.6",
            margin: "0",
          }}
        >
          IDs concernés : {ids.slice(0, 10).join(", ")}
        </Text>
      </Section>
    </LifecycleLayout>
  );
}

export default AdminAlertEmail;
