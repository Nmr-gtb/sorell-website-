import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const displayName = name || email.split("@")[0];

    await resend.emails.send({
      from: "Sorell <newsletter@sorell.fr>",
      to: email,
      replyTo: "murnoe@outlook.fr",
      subject: "Bienvenue sur Sorell ! Votre première newsletter en 3 étapes",
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#FFFFFF;">

    <!-- Header -->
    <div style="padding:28px 32px;border-bottom:2px solid #2563EB;">
      <span style="font-size:20px;font-weight:700;color:#111827;letter-spacing:-0.02em;">Sorel<span style="color:#2563EB;">l</span></span>
    </div>

    <!-- Welcome -->
    <div style="padding:40px 32px 24px;">
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 12px;letter-spacing:-0.02em;">Bienvenue ${displayName} !</h1>
      <p style="font-size:15px;color:#4B5563;line-height:1.65;margin:0 0 24px;">
        Votre compte Sorell est créé. Vous êtes à 3 étapes de recevoir votre première newsletter sectorielle générée par IA.
      </p>
    </div>

    <!-- Step 1 -->
    <div style="padding:0 32px 20px;">
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <div style="width:32px;height:32px;border-radius:50%;background:#2563EB;color:white;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div>
        <div>
          <h3 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 4px;">Décrivez votre activité</h3>
          <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0;">
            Rédigez votre brief personnalisé : votre secteur, vos concurrents, ce que vous voulez surveiller. Plus c'est précis, plus votre newsletter sera pertinente.
          </p>
        </div>
      </div>
    </div>

    <!-- Step 2 -->
    <div style="padding:0 32px 20px;">
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <div style="width:32px;height:32px;border-radius:50%;background:#2563EB;color:white;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div>
        <div>
          <h3 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 4px;">Choisissez vos thématiques et sources</h3>
          <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0;">
            Sélectionnez parmi nos thématiques prédéfinies ou créez les vôtres. Ajoutez vos sources préférées parmi notre bibliothèque de médias vérifiés.
          </p>
        </div>
      </div>
    </div>

    <!-- Step 3 -->
    <div style="padding:0 32px 28px;">
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <div style="width:32px;height:32px;border-radius:50%;background:#2563EB;color:white;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div>
        <div>
          <h3 style="font-size:16px;font-weight:600;color:#111827;margin:0 0 4px;">Générez votre première newsletter</h3>
          <p style="font-size:14px;color:#6B7280;line-height:1.6;margin:0;">
            Cliquez sur "Générer" et découvrez en quelques secondes votre newsletter personnalisée, basée sur de vraies actualités trouvées sur le web.
          </p>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="padding:0 32px 32px;text-align:center;">
      <a href="https://sorell.fr/dashboard/config" style="display:inline-block;padding:14px 32px;background:#2563EB;color:white;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
        Configurer ma newsletter →
      </a>
    </div>

    <!-- Info -->
    <div style="padding:0 32px 28px;">
      <div style="background:#F8FAFC;border-radius:8px;padding:20px;border:1px solid #E5E7EB;">
        <p style="font-size:13px;color:#6B7280;line-height:1.6;margin:0;">
          <strong style="color:#111827;">Votre plan Free inclut :</strong> 4 newsletters par mois, brief 100% personnalisable, thématiques et sources au choix, web search IA. Passez au plan Pro (19€/mois) pour envoyer à toute votre équipe.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:24px 32px;border-top:2px solid #E5E7EB;background:#F9FAFB;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <span style="font-size:14px;font-weight:700;color:#111827;letter-spacing:-0.01em;">Sorel<span style="color:#2563EB;">l</span></span>
          </td>
          <td align="right">
            <a href="https://sorell.fr" style="font-size:12px;color:#2563EB;text-decoration:none;">sorell.fr</a>
          </td>
        </tr>
      </table>
      <p style="font-size:11px;color:#9CA3AF;margin:12px 0 0;line-height:1.5;">
        Vous recevez cet email car vous venez de créer un compte sur Sorell.<br/>
        <a href="mailto:murnoe@outlook.fr" style="color:#9CA3AF;">Besoin d'aide ? Contactez-nous</a>
      </p>
    </div>

  </div>
</body>
</html>`,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Welcome email error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
