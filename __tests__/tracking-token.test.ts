import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  generateOpenToken,
  verifyOpenToken,
  generateClickToken,
  verifyClickToken,
} from "@/lib/tracking-token";

const NID = "11111111-1111-1111-1111-111111111111";
const EMAIL = "dirigeant@exemple.fr";
const URL_OK = "https://www.lesechos.fr/article-de-presse";

describe("tracking-token — ouverture", () => {
  const OLD = process.env.UNSUBSCRIBE_SECRET;
  beforeEach(() => { process.env.UNSUBSCRIBE_SECRET = "secret-test-tracking-32-caracteres!!"; });
  afterEach(() => { process.env.UNSUBSCRIBE_SECRET = OLD; });

  it("valide un token d'ouverture généré pour ce (nid, email)", () => {
    const token = generateOpenToken(NID, EMAIL);
    expect(verifyOpenToken(NID, EMAIL, token)).toBe(true);
  });

  it("est insensible à la casse de l'email", () => {
    const token = generateOpenToken(NID, "Dirigeant@Exemple.fr");
    expect(verifyOpenToken(NID, EMAIL, token)).toBe(true);
  });

  it("refuse un token forgé (mauvaise signature)", () => {
    expect(verifyOpenToken(NID, EMAIL, "0000000000000000")).toBe(false);
  });

  it("refuse un token valide réutilisé pour un autre destinataire", () => {
    const token = generateOpenToken(NID, EMAIL);
    expect(verifyOpenToken(NID, "autre@exemple.fr", token)).toBe(false);
  });

  it("refuse un token absent", () => {
    expect(verifyOpenToken(NID, EMAIL, null)).toBe(false);
  });
});

describe("tracking-token — clic", () => {
  const OLD = process.env.UNSUBSCRIBE_SECRET;
  beforeEach(() => { process.env.UNSUBSCRIBE_SECRET = "secret-test-tracking-32-caracteres!!"; });
  afterEach(() => { process.env.UNSUBSCRIBE_SECRET = OLD; });

  it("valide un token de clic généré pour ce (nid, email, url)", () => {
    const token = generateClickToken(NID, EMAIL, URL_OK);
    expect(verifyClickToken(NID, EMAIL, URL_OK, token)).toBe(true);
  });

  it("refuse si l'url change (protection open redirect)", () => {
    const token = generateClickToken(NID, EMAIL, URL_OK);
    expect(verifyClickToken(NID, EMAIL, "https://site-malveillant.com", token)).toBe(false);
  });

  it("refuse un token forgé", () => {
    expect(verifyClickToken(NID, EMAIL, URL_OK, "deadbeefdeadbeef")).toBe(false);
  });

  it("refuse un token absent", () => {
    expect(verifyClickToken(NID, EMAIL, URL_OK, null)).toBe(false);
  });
});
