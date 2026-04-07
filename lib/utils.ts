/**
 * Echappe les caracteres HTML dangereux pour prevenir les XSS.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Validation basique du format email (RFC 5321 simplifie).
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 320) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Suggere une correction pour les fautes de frappe courantes dans les domaines email.
 * Retourne le domaine corrige ou null si aucune correction necessaire.
 */
export function suggestEmailCorrection(email: string): string | null {
  if (!email || !email.includes("@")) return null;

  const [local, domain] = email.toLowerCase().trim().split("@");
  if (!local || !domain) return null;

  const corrections: Record<string, string> = {
    // Gmail
    "gmial.com": "gmail.com",
    "gmal.com": "gmail.com",
    "gmaill.com": "gmail.com",
    "gamil.com": "gmail.com",
    "gnail.com": "gmail.com",
    "gmail.fr": "gmail.com",
    "gmail.co": "gmail.com",
    "gmai.com": "gmail.com",
    "gmil.com": "gmail.com",
    "gimail.com": "gmail.com",
    "gemail.com": "gmail.com",
    // Hotmail
    "hotmial.com": "hotmail.com",
    "hotmal.com": "hotmail.com",
    "hotmaill.com": "hotmail.com",
    "hotamil.com": "hotmail.com",
    "hotmai.com": "hotmail.com",
    "hotmil.com": "hotmail.com",
    "hotmail.fr": "hotmail.com",
    // Outlook
    "outloo.com": "outlook.com",
    "outlok.com": "outlook.com",
    "outllook.com": "outlook.com",
    "outlook.fr": "outlook.com",
    "oulook.com": "outlook.com",
    // Yahoo
    "yahooo.com": "yahoo.com",
    "yaho.com": "yahoo.com",
    "yaoo.com": "yahoo.com",
    "yhoo.com": "yahoo.com",
    "yahoo.fr": "yahoo.com",
    // Orange / Free / SFR (FR)
    "oragne.fr": "orange.fr",
    "oraneg.fr": "orange.fr",
    "ornage.fr": "orange.fr",
    "fre.fr": "free.fr",
    "freee.fr": "free.fr",
    "sfr.com": "sfr.fr",
    // Wanadoo / LaPoste
    "wanadoo.com": "wanadoo.fr",
    "lapost.net": "laposte.net",
    "laposte.fr": "laposte.net",
    "lapste.net": "laposte.net",
  };

  const corrected = corrections[domain];
  if (corrected && corrected !== domain) {
    return `${local}@${corrected}`;
  }

  return null;
}

/**
 * Verifie si un domaine email est un service d'adresses jetables (temporaires).
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.toLowerCase().trim().split("@")[1];
  if (!domain) return false;

  const disposableDomains = new Set([
    "yopmail.com", "yopmail.fr", "yopmail.net",
    "tempmail.com", "temp-mail.org", "temp-mail.io",
    "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamail.de",
    "guerrillamailblock.com", "grr.la", "sharklasers.com",
    "mailinator.com", "mailinator.net",
    "throwaway.email", "throwaway.com",
    "trashmail.com", "trashmail.net", "trashmail.me",
    "tempail.com", "tempr.email",
    "dispostable.com",
    "mailnesia.com",
    "maildrop.cc",
    "fakeinbox.com", "fakemail.net",
    "10minutemail.com", "10minutemail.net",
    "minutemail.com",
    "emailondeck.com",
    "getnada.com", "nada.email",
    "mohmal.com",
    "tempinbox.com",
    "burnermail.io",
    "mailcatch.com",
    "mytemp.email",
    "harakirimail.com",
    "jetable.org", "jetable.com", "jetable.net",
    "crazymailing.com",
    "tempmailaddress.com",
    "tmpmail.net", "tmpmail.org",
    "disposableemailaddresses.emailmiser.com",
    "mailexpire.com",
    "incognitomail.org", "incognitomail.com",
    "spamgourmet.com",
    "getairmail.com",
    "discard.email",
    "mailsac.com",
    "guerrillamail.info",
  ]);

  return disposableDomains.has(domain);
}

/**
 * Tronque une chaine a la longueur maximale specifiee.
 */
export function truncateInput(str: string, maxLength: number): string {
  if (!str) return "";
  return str.length > maxLength ? str.slice(0, maxLength) : str;
}
