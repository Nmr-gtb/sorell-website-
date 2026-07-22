import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { safeEqual, verifyCronSecret } from "@/lib/auth";

describe("safeEqual (comparaison à temps constant)", () => {
  it("retourne true pour deux chaînes identiques", () => {
    expect(safeEqual("secret-abc-123", "secret-abc-123")).toBe(true);
  });

  it("retourne false pour des chaînes différentes de même longueur", () => {
    expect(safeEqual("secret-abc-123", "secret-xyz-123")).toBe(false);
  });

  it("retourne false pour des chaînes de longueurs différentes (pas d'exception)", () => {
    expect(safeEqual("court", "beaucoup-plus-long")).toBe(false);
  });

  it("retourne false si l'une des chaînes est vide", () => {
    expect(safeEqual("", "secret")).toBe(false);
  });
});

describe("verifyCronSecret", () => {
  const OLD = process.env.CRON_SECRET;
  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret-value";
  });
  afterEach(() => {
    process.env.CRON_SECRET = OLD;
  });

  const req = (headers?: Record<string, string>, url = "https://sorell.fr/api/cron") =>
    new Request(url, { headers });

  it("accepte le bon secret via header Bearer", () => {
    expect(verifyCronSecret(req({ authorization: "Bearer test-cron-secret-value" }))).toBe(true);
  });

  it("accepte le bon secret via query param", () => {
    expect(verifyCronSecret(req(undefined, "https://sorell.fr/api/cron?secret=test-cron-secret-value"))).toBe(true);
  });

  it("refuse un mauvais secret", () => {
    expect(verifyCronSecret(req({ authorization: "Bearer mauvais-secret" }))).toBe(false);
  });

  it("refuse quand aucun secret n'est fourni", () => {
    expect(verifyCronSecret(req())).toBe(false);
  });

  it("refuse quand CRON_SECRET n'est pas configuré", () => {
    delete process.env.CRON_SECRET;
    expect(verifyCronSecret(req({ authorization: "Bearer test-cron-secret-value" }))).toBe(false);
  });
});
