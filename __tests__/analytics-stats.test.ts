import { describe, it, expect } from "vitest";
import { computeAnalytics, type AnalyticsEventRow, type AnalyticsNewsletterRow } from "@/lib/analytics-stats";

function nl(id: string, recipientCount: number | null, sentAt = "2026-07-01T08:00:00Z"): AnalyticsNewsletterRow {
  return { id, subject: `NL ${id}`, sent_at: sentAt, recipient_count: recipientCount, content: [1, 2, 3] };
}

function ev(newsletterId: string, email: string, type: "open" | "click", article?: string): AnalyticsEventRow {
  return {
    newsletter_id: newsletterId,
    recipient_email: email,
    event_type: type,
    metadata: article !== undefined ? { article } : {},
  };
}

describe("computeAnalytics", () => {
  it("déduplique les clics par destinataire : plus jamais de 350 %", () => {
    // Cas réel de prod : 2 destinataires, 7 clics du même lecteur → l'ancien
    // calcul affichait 350 %.
    const newsletters = [nl("a", 2)];
    const events = [
      ...Array.from({ length: 7 }, () => ev("a", "lecteur@x.fr", "click", "Wandercraft")),
    ];
    const result = computeAnalytics(newsletters, events, 2);
    expect(result.clickRate).toBe(50); // 1 cliqueur unique sur 2 destinataires
    expect(result.newsletters[0].clickRate).toBe(50);
    expect(result.totalClicks).toBe(7); // le volume brut reste visible
    expect(result.topArticles).toEqual([{ title: "Wandercraft", clicks: 7 }]);
  });

  it("plafonne les taux à 100 % même avec des événements excédentaires", () => {
    const newsletters = [nl("a", 1)];
    const events = [
      ev("a", "x@x.fr", "open"),
      ev("a", "y@y.fr", "open"), // plus d'ouvreurs que de destinataires déclarés
    ];
    const result = computeAnalytics(newsletters, events, 1);
    expect(result.openRate).toBe(100);
    expect(result.newsletters[0].openRate).toBe(100);
  });

  it("renvoie null (jamais un dénominateur inventé) quand recipient_count manque", () => {
    const newsletters = [nl("a", null), nl("b", 0)];
    const events = [ev("a", "x@x.fr", "open"), ev("b", "y@y.fr", "click", "T")];
    const result = computeAnalytics(newsletters, events, 5);
    expect(result.newsletters[0].openRate).toBeNull();
    expect(result.newsletters[0].recipients).toBeNull();
    expect(result.newsletters[1].clickRate).toBeNull();
    // Aucune newsletter au dénominateur connu → taux globaux inconnus
    expect(result.openRate).toBeNull();
    expect(result.clickRate).toBeNull();
    // Les volumes bruts restent comptés
    expect(result.totalOpens).toBe(1);
    expect(result.totalClicks).toBe(1);
  });

  it("calcule les taux globaux uniquement sur les envois au dénominateur connu", () => {
    const newsletters = [nl("known", 4), nl("unknown", null)];
    const events = [
      ev("known", "a@x.fr", "open"),
      ev("known", "b@x.fr", "open"),
      ev("unknown", "c@x.fr", "open"), // ne doit pas polluer le taux global
    ];
    const result = computeAnalytics(newsletters, events, 4);
    expect(result.openRate).toBe(50); // 2 ouvreurs / 4 destinataires connus
  });

  it("construit la tendance avec les vraies dates, du plus ancien au plus récent", () => {
    const newsletters = [
      nl("recent", 2, "2026-07-15T08:00:00Z"),
      nl("old", 2, "2026-07-01T08:00:00Z"),
      nl("sans-denominateur", null, "2026-06-20T08:00:00Z"),
    ];
    const events = [ev("recent", "a@x.fr", "open"), ev("old", "a@x.fr", "open"), ev("old", "b@x.fr", "open")];
    const result = computeAnalytics(newsletters, events, 2);
    expect(result.trend).toEqual([
      { date: "2026-07-01T08:00:00Z", value: 100 },
      { date: "2026-07-15T08:00:00Z", value: 50 },
    ]);
  });

  it("exclut les clics sans titre d'article du Top articles", () => {
    const newsletters = [nl("a", 3)];
    const events = [
      ev("a", "x@x.fr", "click", ""),
      ev("a", "y@y.fr", "click", "Titre réel"),
      ev("a", "z@z.fr", "click"),
    ];
    const result = computeAnalytics(newsletters, events, 3);
    expect(result.topArticles).toEqual([{ title: "Titre réel", clicks: 1 }]);
    expect(result.totalClicks).toBe(3); // les clics anonymes restent comptés en volume
  });
});
