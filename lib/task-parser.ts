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
  | { intent: "business_overview" }
  | { intent: "stats_signups" }
  | { intent: "stats_mrr" }
  | { intent: "stats_conversion" }
  | { intent: "stats_churn" }
  | { intent: "stats_inactive" }
  | {
      intent: "user_lookup";
      searchQuery: string;
    }
  | { intent: "emelia_push" }
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
- "business_overview" : vue d'ensemble du business. Mots-cles : "stats", "dashboard", "comment va le business", "overview", "resume business", "KPIs", "comment ca se passe", "ou on en est".
- "stats_signups" : inscriptions recentes. Mots-cles : "inscrits", "inscriptions", "nouveaux users", "combien d'inscrits", "qui s'est inscrit".
- "stats_mrr" : revenus. Mots-cles : "MRR", "revenu", "chiffre d'affaires", "combien on gagne", "argent", "revenus".
- "stats_conversion" : taux de conversion trial vers payant. Mots-cles : "conversion", "taux de conversion", "trial", "combien convertissent", "essais".
- "stats_churn" : desabonnements. Mots-cles : "churn", "desabonnements", "qui a quitte", "resiliations", "perdus".
- "stats_inactive" : utilisateurs inactifs. Mots-cles : "inactifs", "dormants", "qui n'utilise pas", "jamais genere", "pas de newsletter".
- "user_lookup" : chercher un utilisateur precis. Mots-cles : "info sur [email/nom]", "montre-moi [user]", "qui est [user]", "cherche [user]". Extrais l'email ou le nom dans searchQuery.
- "emelia_push" : pousser les contacts Notion vers Emelia. Mots-cles : "pousse les contacts", "envoie dans emelia", "push emelia", "sync emelia", "lance la campagne", "envoie les prospects", "push les prospects".
- "conversation" : si le message est une discussion generale, une question, une demande de conseil, un salut, ou tout ce qui ne concerne pas directement la gestion de taches ni les stats business. Extrais le message brut.
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
"Comment va le business ?" -> {"intent":"business_overview"}
"Stats" -> {"intent":"business_overview"}
"Dashboard" -> {"intent":"business_overview"}
"Combien de MRR ?" -> {"intent":"stats_mrr"}
"On gagne combien ?" -> {"intent":"stats_mrr"}
"Combien d'inscrits cette semaine ?" -> {"intent":"stats_signups"}
"Qui s'est inscrit ?" -> {"intent":"stats_signups"}
"Taux de conversion ?" -> {"intent":"stats_conversion"}
"Combien convertissent ?" -> {"intent":"stats_conversion"}
"Y a du churn ?" -> {"intent":"stats_churn"}
"Qui a quitte ?" -> {"intent":"stats_churn"}
"Des users inactifs ?" -> {"intent":"stats_inactive"}
"Qui n'utilise pas Sorell ?" -> {"intent":"stats_inactive"}
"Info sur jean@example.com" -> {"intent":"user_lookup","searchQuery":"jean@example.com"}
"Montre-moi le profil de Jean Dupont" -> {"intent":"user_lookup","searchQuery":"Jean Dupont"}
"Pousse les contacts dans Emelia" -> {"intent":"emelia_push"}
"Envoie les prospects" -> {"intent":"emelia_push"}
"Push Emelia" -> {"intent":"emelia_push"}
"Salut Eva" -> {"intent":"conversation","rawMessage":"Salut Eva"}
"Tu me conseilles quoi aujourd'hui ?" -> {"intent":"conversation","rawMessage":"Tu me conseilles quoi aujourd'hui ?"}
"Je suis un peu perdu, aide-moi" -> {"intent":"conversation","rawMessage":"Je suis un peu perdu, aide-moi"}
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
      "business_overview",
      "stats_signups",
      "stats_mrr",
      "stats_conversion",
      "stats_churn",
      "stats_inactive",
      "user_lookup",
      "emelia_push",
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
