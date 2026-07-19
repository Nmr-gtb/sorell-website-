import { describe, it, expect, beforeEach } from "vitest";
import { buildNewsletterHtml } from "@/lib/email-template";

// ---------------------------------------------------------------------------
// Non-régression : double échappement HTML dans l'email.
// Le composant appelait escapeHtml() dans des nœuds texte JSX alors que React
// échappe déjà -> les abonnés voyaient "Réglementation &amp; conformité"
// littéralement à côté de "À la une". Ce test rend le VRAI template et vérifie
// qu'un & n'est échappé qu'une seule fois.
// ---------------------------------------------------------------------------

describe("NewsletterEmail - échappement HTML", () => {
  beforeEach(() => {
    process.env.UNSUBSCRIBE_SECRET = "test-unsubscribe-secret";
  });

  async function renderWithAmpersands(): Promise<string> {
    return buildNewsletterHtml({
      newsletterId: "nl-escape-test",
      recipientEmail: "reader@test.com",
      subject: "Réglementation & conformité - Le point de la semaine",
      brandColor: "#005058",
      textColor: "#111827",
      bgColor: "#FFFFFF",
      bodyTextColor: "#4B5563",
      customLogo: null,
      date: "Semaine du 19 juillet 2026",
      editorial: "Recherche & développement : la semaine en bref.",
      keyFigures: [{ value: "3,4 Md€", label: "budget R&D", context: "Les Echos" }],
      featuredArticle: {
        tag: "Réglementation & conformité",
        title: "Normes & sanctions : ce qui change",
        hook: "Une accroche.",
        content: "Le contenu de l'article.",
        source: "AT&T Insights",
        url: "https://example.com/a",
        featured: true,
      },
      otherArticles: [
        {
          tag: "Marché & tendances",
          title: "Second article",
          hook: "",
          content: "Contenu secondaire.",
          source: "S&P Global",
          url: "https://example.com/b",
          featured: false,
        },
      ],
      plan: "pro",
    });
  }

  it("n'échappe les & qu'une seule fois (jamais de &amp;amp;)", async () => {
    const html = await renderWithAmpersands();
    // Le symptôme exact du bug : un double échappement quelque part.
    expect(html).not.toContain("&amp;amp;");
  });

  it("rend le tag, la source et les chiffres clés avec un échappement simple", async () => {
    const html = await renderWithAmpersands();
    // Dans le HTML final, "&" doit apparaître comme "&amp;" (une fois) :
    // le client mail l'affichera "Réglementation & conformité".
    expect(html).toContain("Réglementation &amp; conformité");
    expect(html).toContain("AT&amp;T Insights");
    expect(html).toContain("Marché &amp; tendances");
    expect(html).toContain("S&amp;P Global");
    expect(html).toContain("budget R&amp;D");
  });

  it("préserve le sujet dans le header et le préheader sans double échappement", async () => {
    const html = await renderWithAmpersands();
    expect(html).toContain("Réglementation &amp; conformité - Le point de la semaine");
    expect(html).not.toContain("&amp;amp; conformité");
  });
});
