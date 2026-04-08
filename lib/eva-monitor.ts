/**
 * Eva Monitor — Checks de sante du site Sorell depuis Telegram.
 * Permet a Noe de tester ses endpoints a distance sans ordinateur.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.sorell.fr";

interface CheckResult {
  name: string;
  ok: boolean;
  status?: number;
  responseTime: number;
  detail?: string;
}

/**
 * Mesure le temps de reponse d'un fetch.
 */
async function timedFetch(
  url: string,
  options?: RequestInit
): Promise<{ response: Response; time: number }> {
  const start = Date.now();
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(15000), // 15s timeout
  });
  const time = Date.now() - start;
  return { response, time };
}

/**
 * Check 1 : Le site est-il en ligne ?
 */
export async function checkSiteUp(): Promise<CheckResult> {
  try {
    const { response, time } = await timedFetch(BASE_URL);
    return {
      name: "Site en ligne",
      ok: response.ok,
      status: response.status,
      responseTime: time,
      detail: response.ok ? `${time}ms` : `Status ${response.status}`,
    };
  } catch (error) {
    return {
      name: "Site en ligne",
      ok: false,
      responseTime: 0,
      detail: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Check 2 : API Contact fonctionne ?
 * Envoie un message de test et verifie la reponse.
 */
export async function checkContactForm(): Promise<CheckResult> {
  try {
    const { response, time } = await timedFetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Eva Test Bot",
        email: "test@eva-bot.internal",
        message: "[TEST AUTO] Verification du formulaire de contact par Eva.",
      }),
    });

    const body = await response.json().catch(() => null);

    return {
      name: "Formulaire de contact",
      ok: response.ok,
      status: response.status,
      responseTime: time,
      detail: response.ok
        ? `OK (${time}ms)`
        : `Erreur ${response.status}: ${body?.error || "inconnue"}`,
    };
  } catch (error) {
    return {
      name: "Formulaire de contact",
      ok: false,
      responseTime: 0,
      detail: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Check 3 : API Chat (Soly) fonctionne ?
 */
export async function checkChatApi(): Promise<CheckResult> {
  try {
    const { response, time } = await timedFetch(`${BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "test" }],
        mode: "general",
      }),
    });

    return {
      name: "Chat Soly",
      ok: response.ok || response.status === 429, // 429 = rate limit = API fonctionne
      status: response.status,
      responseTime: time,
      detail:
        response.status === 429
          ? `Rate limited (OK, API active, ${time}ms)`
          : response.ok
            ? `OK (${time}ms)`
            : `Erreur ${response.status}`,
    };
  } catch (error) {
    return {
      name: "Chat Soly",
      ok: false,
      responseTime: 0,
      detail: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Check 4 : Pages principales accessibles ?
 */
export async function checkMainPages(): Promise<CheckResult[]> {
  const pages = [
    { path: "/", name: "Homepage" },
    { path: "/tarifs", name: "Tarifs" },
    { path: "/contact", name: "Contact" },
    { path: "/demo", name: "Demo" },
    { path: "/blog", name: "Blog" },
    { path: "/connexion", name: "Connexion" },
  ];

  const results: CheckResult[] = [];

  for (const page of pages) {
    try {
      const { response, time } = await timedFetch(`${BASE_URL}${page.path}`);
      results.push({
        name: page.name,
        ok: response.ok,
        status: response.status,
        responseTime: time,
        detail: response.ok ? `${time}ms` : `Status ${response.status}`,
      });
    } catch (error) {
      results.push({
        name: page.name,
        ok: false,
        responseTime: 0,
        detail: error instanceof Error ? error.message : "Timeout",
      });
    }
  }

  return results;
}

/**
 * Check 5 : CRON endpoint accessible ?
 */
export async function checkCronEndpoint(): Promise<CheckResult> {
  try {
    // On fait un GET sans le secret — devrait retourner 401 (pas 500 ou timeout)
    const { response, time } = await timedFetch(`${BASE_URL}/api/cron`);

    return {
      name: "CRON endpoint",
      ok: response.status === 401 || response.ok, // 401 = protege = OK
      status: response.status,
      responseTime: time,
      detail:
        response.status === 401
          ? `Protege (OK, ${time}ms)`
          : response.ok
            ? `OK (${time}ms)`
            : `Erreur ${response.status}`,
    };
  } catch (error) {
    return {
      name: "CRON endpoint",
      ok: false,
      responseTime: 0,
      detail: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Check 6 : Webhook Stripe accessible ?
 */
export async function checkStripeWebhook(): Promise<CheckResult> {
  try {
    const { response, time } = await timedFetch(
      `${BASE_URL}/api/webhooks/stripe`,
      { method: "POST", body: "{}" }
    );

    return {
      name: "Webhook Stripe",
      ok: response.status === 400 || response.status === 401, // 400/401 = protege = OK
      status: response.status,
      responseTime: time,
      detail:
        response.status === 400 || response.status === 401
          ? `Protege (OK, ${time}ms)`
          : `Erreur inattendue ${response.status}`,
    };
  } catch (error) {
    return {
      name: "Webhook Stripe",
      ok: false,
      responseTime: 0,
      detail: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Full Review — Execute tous les checks et retourne un rapport formate.
 */
export async function runFullReview(): Promise<string> {
  const startTime = Date.now();

  const [siteUp, contact, chat, pages, cron, stripe] = await Promise.all([
    checkSiteUp(),
    checkContactForm(),
    checkChatApi(),
    checkMainPages(),
    checkCronEndpoint(),
    checkStripeWebhook(),
  ]);

  const allChecks: CheckResult[] = [siteUp, contact, chat, ...pages, cron, stripe];
  const totalTime = Date.now() - startTime;
  const passed = allChecks.filter((c) => c.ok).length;
  const failed = allChecks.filter((c) => !c.ok).length;

  let report = `<b>Full Review Sorell</b>\n`;
  report += `${passed}/${allChecks.length} checks OK`;
  if (failed > 0) report += ` — ${failed} probleme(s)`;
  report += `\n\n`;

  // Groupe : Infrastructure
  report += `<b>Infrastructure</b>\n`;
  report += formatCheck(siteUp);
  report += formatCheck(cron);
  report += formatCheck(stripe);
  report += `\n`;

  // Groupe : APIs
  report += `<b>APIs</b>\n`;
  report += formatCheck(contact);
  report += formatCheck(chat);
  report += `\n`;

  // Groupe : Pages
  report += `<b>Pages</b>\n`;
  for (const page of pages) {
    report += formatCheck(page);
  }

  report += `\nTemps total : ${totalTime}ms`;

  if (failed === 0) {
    report += `\n\nTout est operationnel.`;
  }

  return report;
}

/**
 * Test specifique du formulaire de contact avec rapport detaille.
 */
export async function runContactTest(): Promise<string> {
  const result = await checkContactForm();

  if (result.ok) {
    return `Le formulaire de contact fonctionne. Reponse en ${result.responseTime}ms. Un email de test a ete envoye a noe@sorell.fr.`;
  } else {
    return `Le formulaire de contact a un probleme.\nStatus: ${result.status}\nDetail: ${result.detail}`;
  }
}

/**
 * Check rapide : le site est-il up ?
 */
export async function runQuickCheck(): Promise<string> {
  const result = await checkSiteUp();

  if (result.ok) {
    return `sorell.fr est en ligne. Temps de reponse : ${result.responseTime}ms.`;
  } else {
    return `sorell.fr semble DOWN !\nDetail: ${result.detail}`;
  }
}

function formatCheck(check: CheckResult): string {
  const icon = check.ok ? "✅" : "❌";
  return `${icon} ${check.name} — ${check.detail}\n`;
}
