import { describe, it, expect, vi, afterEach } from "vitest";
import { sha1Hex, countInRangeResponse, isPasswordPwned } from "@/lib/password-check";

// Empreinte SHA-1 connue de "password" (vecteur de test public HIBP)
const PASSWORD_SHA1 = "5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("sha1Hex", () => {
  it("calcule l'empreinte SHA-1 en hexadécimal majuscule", async () => {
    expect(await sha1Hex("password")).toBe(PASSWORD_SHA1);
  });
});

describe("countInRangeResponse", () => {
  it("trouve le suffixe et retourne le compte", () => {
    const body = "AAAAA1:3\r\n1E4C9B93F3F0682250B6CF8331B7EE68FD8:424242\nBBBBB2:7";
    expect(countInRangeResponse(body, "1E4C9B93F3F0682250B6CF8331B7EE68FD8")).toBe(424242);
  });

  it("est insensible à la casse du suffixe cherché", () => {
    const body = "1E4C9B93F3F0682250B6CF8331B7EE68FD8:10";
    expect(countInRangeResponse(body, "1e4c9b93f3f0682250b6cf8331b7ee68fd8")).toBe(10);
  });

  it("retourne 0 si le suffixe est absent", () => {
    expect(countInRangeResponse("AAAAA1:3\nBBBBB2:7", "CCCCC3")).toBe(0);
  });
});

describe("isPasswordPwned", () => {
  it("retourne true quand le suffixe est dans la réponse HIBP", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: async () => `${PASSWORD_SHA1.slice(5)}:123456`,
    }));
    expect(await isPasswordPwned("password")).toBe(true);
    // Le préfixe envoyé est bien les 5 premiers caractères du hash, jamais plus
    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toBe(`https://api.pwnedpasswords.com/range/${PASSWORD_SHA1.slice(0, 5)}`);
  });

  it("retourne false quand le suffixe est absent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "AAAAA1:3\nBBBBB2:7",
    }));
    expect(await isPasswordPwned("password")).toBe(false);
  });

  it("fail-open : retourne false si le réseau échoue", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    expect(await isPasswordPwned("password")).toBe(false);
  });

  it("fail-open : retourne false si l'API répond en erreur", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, text: async () => "" }));
    expect(await isPasswordPwned("password")).toBe(false);
  });
});
