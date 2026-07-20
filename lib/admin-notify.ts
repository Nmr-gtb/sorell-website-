import { Resend } from "resend";
import { escapeHtml } from "@/lib/utils";

const ADMIN_EMAIL = "noe@sorell.fr";

interface AdminNotification {
  subject: string;
  title: string;
  /** Paires [libellé, valeur]. La date/heure Paris est ajoutée automatiquement. */
  rows: Array<[string, string]>;
}

/**
 * Envoie une notification interne à Noé (nouvel abonnement, résiliation,
 * suppression de compte...). Best-effort : ne throw JAMAIS — un échec d'envoi
 * ne doit pas faire échouer la route appelante (webhook Stripe notamment, où
 * un throw déclencherait le rollback d'idempotence et un rejeu complet).
 */
export async function notifyAdmin({ subject, title, rows }: AdminNotification): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) return;
    const resend = new Resend(process.env.RESEND_API_KEY);

    const now = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
    const allRows: Array<[string, string]> = [...rows, ["Date", now]];

    const tableRows = allRows
      .map(
        ([label, value]) =>
          `<tr><td style="padding:8px 0;font-weight:600;width:130px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 0;">${escapeHtml(value)}</td></tr>`
      )
      .join("\n      ");

    await resend.emails.send({
      from: "Sorell <noreply@sorell.fr>",
      to: ADMIN_EMAIL,
      replyTo: ADMIN_EMAIL,
      subject,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Roboto,Arial,sans-serif;background:#F3F4F6;margin:0;padding:0;">
  <div style="max-width:480px;margin:40px auto;background:white;border-radius:10px;padding:28px;border:1px solid #E5E7EB;">
    <h2 style="font-size:18px;font-weight:700;color:#111827;margin:0 0 16px;">${escapeHtml(title)}</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;">
      ${tableRows}
    </table>
  </div>
</body>
</html>`,
      text: `${title}\n\n${allRows.map(([label, value]) => `${label} : ${value}`).join("\n")}`,
    });
  } catch {
    // silencieux : la notif interne est best-effort
  }
}
