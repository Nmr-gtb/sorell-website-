// Vérification des mots de passe compromis via HaveIBeenPwned (modèle k-anonymity).
// Le mot de passe ne quitte JAMAIS le navigateur : on calcule son empreinte SHA-1
// localement et on n'envoie que les 5 premiers caractères à l'API publique.
// Celle-ci renvoie tous les suffixes connus pour ce préfixe ; la comparaison
// finale se fait localement. https://haveibeenpwned.com/API/v3#PwnedPasswords

const HIBP_RANGE_URL = "https://api.pwnedpasswords.com/range/";

/** Empreinte SHA-1 hexadécimale majuscule (Web Crypto, dispo navigateur et Node). */
export async function sha1Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/**
 * Cherche un suffixe d'empreinte dans une réponse HIBP ("SUFFIXE:COMPTE" par ligne).
 * Retourne le nombre de fuites connues, 0 si absent.
 */
export function countInRangeResponse(body: string, suffix: string): number {
  const target = suffix.toUpperCase();
  for (const line of body.split("\n")) {
    const [lineSuffix, count] = line.trim().split(":");
    if (lineSuffix === target) {
      const parsed = parseInt(count, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
  }
  return 0;
}

/**
 * true si le mot de passe apparaît dans des fuites connues.
 * Fail-open : en cas d'erreur réseau ou de timeout, retourne false pour ne
 * jamais bloquer une inscription à cause d'un service tiers indisponible.
 */
export async function isPasswordPwned(password: string, timeoutMs = 2500): Promise<boolean> {
  try {
    const hash = await sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${HIBP_RANGE_URL}${prefix}`, { signal: controller.signal });
      if (!res.ok) return false;
      const body = await res.text();
      return countInRangeResponse(body, suffix) > 0;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}
