/**
 * Emelia Sync — Synchronisation des contacts Emelia vers la database Notion "Prospection".
 *
 * Pour chaque contact ayant répondu dans Emelia :
 * - S'il n'existe pas dans Notion -> création avec statut "Répondu"
 * - S'il existe et n'est pas encore "Répondu" -> mise à jour du statut + date réponse
 *
 * Utilise l'API REST Notion directement (même pattern que eva-planning.ts).
 */

import { fetchRepliedContacts, getAllowedCampaignIds, type EmeliaContact } from "./emelia";

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const PROSPECTION_DB_ID = "65fe2a40a809498187ea017bbfe1c70f";

// --- Types internes ---

interface NotionPage {
  id: string;
  properties: {
    Statut?: {
      select?: { name: string } | null;
    };
  };
}

interface NotionQueryResponse {
  results: NotionPage[];
}

// --- Helpers ---

function getNotionHeaders(): Record<string, string> {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error("NOTION_API_KEY manquant");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
  };
}

/**
 * Cherche un contact dans la database Notion par email.
 */
async function findContactByEmail(
  email: string
): Promise<NotionPage | null> {
  const response = await fetch(
    `${NOTION_API_BASE}/databases/${PROSPECTION_DB_ID}/query`,
    {
      method: "POST",
      headers: getNotionHeaders(),
      body: JSON.stringify({
        filter: {
          property: "Email",
          email: { equals: email },
        },
        page_size: 1,
      }),
    }
  );

  if (!response.ok) return null;

  const data = (await response.json()) as NotionQueryResponse;
  return data.results.length > 0 ? data.results[0] : null;
}

/**
 * Convertit un timestamp Emelia (ms string) en date ISO.
 */
function emeliaTimestampToISO(timestamp: string | null): string | null {
  if (!timestamp) return null;
  const ms = parseInt(timestamp, 10);
  if (isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

/**
 * Construit le nom complet à partir du contact Emelia.
 */
function buildFullName(contact: EmeliaContact): string {
  const parts = [contact.firstName, contact.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : contact.email;
}

/**
 * Crée une nouvelle page dans la database Prospection Notion.
 */
async function createProspectPage(
  contact: EmeliaContact
): Promise<boolean> {
  const dateReponse = emeliaTimestampToISO(contact.lastReplied);

  const properties: Record<string, unknown> = {
    Nom: {
      title: [{ text: { content: buildFullName(contact) } }],
    },
    Email: {
      email: contact.email,
    },
    Statut: {
      select: { name: "Répondu" },
    },
    "Emelia ID": {
      rich_text: [{ text: { content: contact._id } }],
    },
  };

  if (dateReponse) {
    properties["Date réponse"] = {
      date: { start: dateReponse },
    };
  }

  if (contact.campaigns && contact.campaigns.length > 0) {
    properties["Campagne"] = {
      select: { name: contact.campaigns[0] },
    };
  }

  const response = await fetch(`${NOTION_API_BASE}/pages`, {
    method: "POST",
    headers: getNotionHeaders(),
    body: JSON.stringify({
      parent: { database_id: PROSPECTION_DB_ID },
      properties,
    }),
  });

  return response.ok;
}

/**
 * Met à jour une page existante dans Notion (statut + date réponse).
 */
async function updateProspectPage(
  pageId: string,
  contact: EmeliaContact
): Promise<boolean> {
  const dateReponse = emeliaTimestampToISO(contact.lastReplied);

  const properties: Record<string, unknown> = {
    Statut: {
      select: { name: "Répondu" },
    },
  };

  if (dateReponse) {
    properties["Date réponse"] = {
      date: { start: dateReponse },
    };
  }

  const response = await fetch(`${NOTION_API_BASE}/pages/${pageId}`, {
    method: "PATCH",
    headers: getNotionHeaders(),
    body: JSON.stringify({ properties }),
  });

  return response.ok;
}

// --- Fonction principale ---

export interface SyncResult {
  newReplies: number;
  updated: number;
}

/**
 * Synchronise les contacts REPLIED d'Emelia vers la database Notion Prospection.
 *
 * - Contacts absents de Notion -> création (comptés dans newReplies)
 * - Contacts présents mais pas encore "Répondu" -> mise à jour (comptés dans updated)
 * - Contacts déjà "Répondu" -> ignorés
 */
export async function syncEmeliaToNotion(): Promise<SyncResult> {
  // Sécurité : ne rien sync si aucune campagne autorisée
  const allowedIds = getAllowedCampaignIds();
  if (allowedIds.length === 0) {
    return { newReplies: 0, updated: 0 };
  }

  const repliedContacts = await fetchRepliedContacts();

  let newReplies = 0;
  let updated = 0;

  for (const contact of repliedContacts) {
    try {
      const existingPage = await findContactByEmail(contact.email);

      if (!existingPage) {
        // Contact absent de Notion -> créer
        const created = await createProspectPage(contact);
        if (created) newReplies++;
      } else {
        // Contact existant -> vérifier le statut
        const currentStatus =
          existingPage.properties.Statut?.select?.name ?? "";

        if (currentStatus !== "Répondu") {
          const updatedOk = await updateProspectPage(
            existingPage.id,
            contact
          );
          if (updatedOk) updated++;
        }
        // Si déjà "Répondu", on skip
      }
    } catch {
      // Erreur sur un contact individuel -> on continue avec les autres
      continue;
    }
  }

  return { newReplies, updated };
}
