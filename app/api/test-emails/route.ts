import { NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/components";
import React from "react";
import { NewsletterEmail } from "@/emails/NewsletterEmail";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { PaymentFailedEmail } from "@/emails/PaymentFailedEmail";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const template = searchParams.get("template") || "newsletter";
  const to = searchParams.get("to") || "mur.noe.celony@gmail.com";

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    let html = "";
    let subject = "";

    if (template === "newsletter") {
      subject = "🧪 [TEST] Cosmétique & Innovation — Semaine du 3 avril 2026";
      const element = React.createElement(NewsletterEmail, {
        newsletterId: "test-001",
        recipientEmail: to,
        subject: "Cosmétique & Innovation — Semaine du 3 avril 2026",
        brandColor: "#005058",
        textColor: "#111827",
        bgColor: "#FFFFFF",
        bodyTextColor: "#4B5563",
        customLogo: null,
        date: "3 avril 2026",
        editorial: "Le secteur cosmétique accélère sa transformation digitale. Entre les nouvelles réglementations européennes sur les emballages et l'essor du clean beauty, les PME doivent s'adapter rapidement pour rester compétitives.",
        keyFigures: [
          { value: "+12%", label: "Croissance clean beauty", context: "En France, premier trimestre 2026" },
          { value: "2027", label: "Directive PPWR", context: "Date limite de conformité emballages" },
          { value: "89%", label: "Consommateurs", context: "Attentifs à la composition des produits" },
        ],
        featuredArticle: {
          tag: "Réglementation",
          title: "Directive PPWR : ce qui change pour les cosmétiques en 2026",
          hook: "Les nouvelles règles européennes sur les emballages entrent en vigueur progressivement.",
          content: "La directive PPWR impose des objectifs ambitieux de réduction des emballages plastiques. Pour les marques cosmétiques, cela signifie repenser le packaging dès maintenant. Les recharges, le vrac et les matériaux recyclés deviennent incontournables.",
          source: "Cosmétique Magazine",
          url: "https://example.com/ppwr-cosmetiques",
          featured: true,
        },
        otherArticles: [
          {
            tag: "Innovation",
            title: "L'IA générative révolutionne la formulation cosmétique",
            hook: "Des algorithmes capables de créer des formules sur mesure en quelques heures.",
            summary: "Plusieurs laboratoires français testent l'intelligence artificielle pour accélérer le développement de nouvelles formules. Les résultats sont prometteurs : temps de R&D divisé par 3 et coûts réduits de 40%.",
            source: "Les Échos",
            url: "https://example.com/ia-formulation",
          },
          {
            tag: "Tendance",
            title: "Le marché du soin masculin explose en France",
            summary: "Le segment des soins pour hommes connaît une croissance de 18% en 2026. Les marques françaises se positionnent avec des gammes minimalistes et naturelles qui séduisent une clientèle de plus en plus exigeante.",
            source: "Premium Beauty News",
            url: "https://example.com/soin-masculin",
          },
          {
            tag: "Distribution",
            title: "Sephora mise tout sur le digital et les expériences personnalisées",
            summary: "Le géant de la distribution cosmétique investit massivement dans l'IA et la réalité augmentée pour offrir des recommandations personnalisées en magasin et en ligne.",
            source: "LSA",
            url: "https://example.com/sephora-digital",
          },
        ],
        plan: "pro",
        unsubscribeUrl: "https://sorell.fr/api/unsubscribe?token=test",
      });
      html = await render(element);
    } else if (template === "welcome") {
      subject = "🧪 [TEST] Bienvenue sur Sorell";
      const element = React.createElement(WelcomeEmail, {
        name: "Noé",
        email: to,
      });
      html = await render(element);
    } else if (template === "payment-failed") {
      subject = "🧪 [TEST] Problème de paiement — Action requise";
      const element = React.createElement(PaymentFailedEmail, {
        firstName: "Noé",
      });
      html = await render(element);
    } else {
      return NextResponse.json({ error: "Template invalide. Choix : newsletter, welcome, payment-failed" }, { status: 400 });
    }

    const result = await resend.emails.send({
      from: "Sorell <noe@sorell.fr>",
      to,
      subject,
      html,
    });

    return NextResponse.json({ success: true, template, to, result });
  } catch (e) {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
