/**
 * Intent parser pour Jade — Bot QA/Monitoring Telegram.
 * Parse les messages en francais naturel en intents de monitoring.
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// --- Types ---

export type JadeIntent =
  | { intent: "full_review" }
  | { intent: "check_site" }
  | { intent: "check_contact" }
  | { intent: "check_chat" }
  | { intent: "check_pages" }
  | { intent: "check_cron" }
  | { intent: "check_stripe" }
  | {
      intent: "conversation";
      rawMessage: string;
    }
  | {
      intent: "unknown";
      rawMessage: string;
    };

// --- System prompt ---

const SYSTEM_PROMPT = `Tu es un parser d'intents pour Jade, un bot Telegram de QA et monitoring du site sorell.fr.
Tu recois un message en francais naturel et tu dois retourner un JSON structure.

Intents possibles :
- "full_review" : check complet de tout le site. Mots-cles : "fullreview", "full review", "review", "audit", "check tout", "status", "ca marche ?", "tout va bien ?", "rapport complet", "check all".
- "check_site" : verifier si le site est en ligne. Mots-cles : "le site est up ?", "sorell est en ligne ?", "le site marche ?", "check le site", "ping", "up ?".
- "check_contact" : tester le formulaire de contact. Mots-cles : "teste le contact", "formulaire de contact", "test contact", "le contact marche ?", "envoie un test contact".
- "check_chat" : tester l'API chat (Soly). Mots-cles : "teste le chat", "soly marche ?", "check soly", "test chat".
- "check_pages" : verifier les pages principales. Mots-cles : "check les pages", "toutes les pages", "les pages marchent ?", "test pages".
- "check_cron" : verifier le CRON endpoint. Mots-cles : "check le cron", "le cron marche ?", "test cron".
- "check_stripe" : verifier le webhook Stripe. Mots-cles : "check stripe", "stripe marche ?", "test stripe", "paiement".
- "conversation" : si le message est une discussion, une question sur le QA, un salut, ou autre chose qui ne correspond pas a un check precis.
- "unknown" : UNIQUEMENT si le message est totalement incomprehensible.

Regles :
- En cas de doute entre un check specifique et full_review, choisis full_review.
- Si Noe demande "tout" ou un "rapport", c'est full_review.
- Pour les questions generales sur l'etat du site sans precision, c'est full_review.

Exemples :
"fullreview" -> {"intent":"full_review"}
"Fais un check complet" -> {"intent":"full_review"}
"Tout va bien ?" -> {"intent":"full_review"}
"Le site est up ?" -> {"intent":"check_site"}
"Teste le formulaire de contact" -> {"intent":"check_contact"}
"Soly marche ?" -> {"intent":"check_chat"}
"Check les pages" -> {"intent":"check_pages"}
"Le cron tourne ?" -> {"intent":"check_cron"}
"Stripe ok ?" -> {"intent":"check_stripe"}
"Salut Jade" -> {"intent":"conversation","rawMessage":"Salut Jade"}
"C'est quoi ton role ?" -> {"intent":"conversation","rawMessage":"C'est quoi ton role ?"}

Reponds UNIQUEMENT avec le JSON, sans markdown, sans explication.`;

// --- Parser ---

/**
 * Parse un message en intent de monitoring via Claude Haiku.
 */
export async function parseJadeIntent(message: string): Promise<JadeIntent> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned) as JadeIntent;

    const validIntents = [
      "full_review",
      "check_site",
      "check_contact",
      "check_chat",
      "check_pages",
      "check_cron",
      "check_stripe",
      "conversation",
      "unknown",
    ];

    if (!validIntents.includes(parsed.intent)) {
      return { intent: "unknown", rawMessage: message };
    }

    return parsed;
  } catch {
    return { intent: "unknown", rawMessage: message };
  }
}
