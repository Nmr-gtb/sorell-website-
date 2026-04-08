/**
 * Claude Haiku intent parser pour le bot Telegram.
 * Parse les messages en francais naturel en intents structures.
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// --- Types ---

export type TaskIntent =
  | {
      intent: "add_task";
      title: string;
      priority?: "Haute" | "Moyenne" | "Basse";
      notes?: string;
      dueDate?: string;
    }
  | {
      intent: "mark_done";
      searchQuery: string;
    }
  | {
      intent: "mark_in_progress";
      searchQuery: string;
    }
  | {
      intent: "list_tasks";
      filterPriority?: "Haute" | "Moyenne" | "Basse";
    }
  | {
      intent: "update_task";
      searchQuery: string;
      priority?: "Haute" | "Moyenne" | "Basse";
      notes?: string;
      dueDate?: string;
    }
  | {
      intent: "delete_task";
      searchQuery: string;
    }
  | {
      intent: "monitor_full_review";
    }
  | {
      intent: "monitor_contact";
    }
  | {
      intent: "monitor_site";
    }
  | {
      intent: "conversation";
      rawMessage: string;
    }
  | {
      intent: "unknown";
      rawMessage: string;
    };

// --- System prompt ---

const SYSTEM_PROMPT = `Tu es un parser d'intents pour un bot Telegram de gestion de taches Notion.
Tu recois un message en francais naturel et tu dois retourner un JSON structure.

Intents possibles :
- "add_task" : creer une tache. Extrais le titre, la priorite (Haute/Moyenne/Basse), les notes et la date d'echeance si mentionnee.
- "mark_done" : marquer une tache comme terminee. Extrais le nom de la tache a chercher.
- "mark_in_progress" : marquer une tache comme en cours. Extrais le nom de la tache.
- "list_tasks" : lister les taches. Si un filtre de priorite est mentionne, l'extraire.
- "update_task" : modifier une tache existante (priorite, notes, echeance). Extrais le nom et les champs a modifier.
- "delete_task" : supprimer/archiver une tache. Extrais le nom.
- "monitor_full_review" : quand Noe demande un check complet, une review, un audit, un status du site. Mots-cles : "fullreview", "full review", "review", "audit", "check tout", "status", "ca marche ?", "tout va bien ?".
- "monitor_contact" : quand Noe demande de tester le formulaire de contact. Mots-cles : "teste le contact", "formulaire de contact", "test contact", "le contact marche ?".
- "monitor_site" : quand Noe demande si le site est en ligne. Mots-cles : "le site est up ?", "sorell est en ligne ?", "le site marche ?", "check le site".
- "conversation" : si le message est une discussion generale, une question, une demande de conseil, un salut, ou tout ce qui ne concerne pas directement la gestion de taches ni le monitoring. Extrais le message brut.
- "unknown" : UNIQUEMENT si le message est totalement incomprehensible (caracteres aleatoires, etc.).

Regles :
- La priorite par defaut est "Moyenne" si non mentionnee.
- Les dates doivent etre au format ISO (YYYY-MM-DD). Aujourd'hui est ${new Date().toISOString().split("T")[0]}.
- "demain" = jour suivant, "lundi prochain" = prochain lundi, etc.
- Pour les recherches, utilise les mots-cles importants du titre, pas la phrase entiere.
- "urgent" ou "prioritaire" = priorite Haute.
- "pas urgent" ou "basse priorite" = priorite Basse.

Exemples :
"Ajoute : refaire le hero, priorite haute" -> {"intent":"add_task","title":"Refaire le hero","priority":"Haute"}
"Termine cold email" -> {"intent":"mark_done","searchQuery":"cold email"}
"Mes taches" -> {"intent":"list_tasks"}
"Liste les urgentes" -> {"intent":"list_tasks","filterPriority":"Haute"}
"Passe Product Hunt en cours" -> {"intent":"mark_in_progress","searchQuery":"Product Hunt"}
"Supprime la tache onboarding" -> {"intent":"delete_task","searchQuery":"onboarding"}
"Mets la priorite haute sur landing page" -> {"intent":"update_task","searchQuery":"landing page","priority":"Haute"}
"Ajoute une note sur SEO : checker les backlinks" -> {"intent":"update_task","searchQuery":"SEO","notes":"Checker les backlinks"}
"Ajoute : preparer demo pour vendredi" -> {"intent":"add_task","title":"Preparer demo","dueDate":"(le vendredi suivant en ISO)"}
"Salut Eva" -> {"intent":"conversation","rawMessage":"Salut Eva"}
"Comment tu vas ?" -> {"intent":"conversation","rawMessage":"Comment tu vas ?"}
"Tu me conseilles quoi aujourd'hui ?" -> {"intent":"conversation","rawMessage":"Tu me conseilles quoi aujourd'hui ?"}
"C'est quoi la priorite du moment ?" -> {"intent":"conversation","rawMessage":"C'est quoi la priorite du moment ?"}
"Je suis un peu perdu, aide-moi" -> {"intent":"conversation","rawMessage":"Je suis un peu perdu, aide-moi"}
"fullreview" -> {"intent":"monitor_full_review"}
"Fais un check complet" -> {"intent":"monitor_full_review"}
"Tout va bien sur le site ?" -> {"intent":"monitor_full_review"}
"Teste le formulaire de contact" -> {"intent":"monitor_contact"}
"Le site est up ?" -> {"intent":"monitor_site"}
"Le site marche ?" -> {"intent":"monitor_site"}

Reponds UNIQUEMENT avec le JSON, sans markdown, sans explication.`;

// --- Parser ---

/**
 * Parse un message en francais naturel en intent structure via Claude Haiku.
 */
export async function parseTaskIntent(message: string): Promise<TaskIntent> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";

    // Nettoyage : enlever les backticks markdown si Claude en ajoute malgre la consigne
    const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const parsed = JSON.parse(cleaned) as TaskIntent;

    // Validation basique de l'intent
    const validIntents = [
      "add_task",
      "mark_done",
      "mark_in_progress",
      "list_tasks",
      "update_task",
      "delete_task",
      "monitor_full_review",
      "monitor_contact",
      "monitor_site",
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
