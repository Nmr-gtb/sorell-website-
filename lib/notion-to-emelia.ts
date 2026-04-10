/**
 * Notion → Emelia — Push les contacts "À envoyer" depuis Notion vers une campagne Emelia.
 *
 * Flow :
 * 1. Lit la database Notion "Prospection Cold Email"
 * 2. Filtre les contacts avec Statut = "À envoyer" et sans Emelia ID
 * 3. Les pousse dans la campagne Emelia autorisée via addContactToCampaignHook
 * 4. Met à jour la page Notion avec l'Emelia ID + Statut "Envoyé"
 *
 * SÉCURITÉ : ne pousse que vers les campagnes listées dans EMELIA_CAMPAIGN_IDS.
 */

import { getAllowedCampaignIds } from "./emelia";

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const PROSPECTION_DB_ID = "65fe2a40a809498187ea017bbfe1c70f";
const EMELIA_GRAPHQL_URL = "https://graphql.emelia.io/graphql";

// --- Types ---

interface NotionProspect {
  pageId: string;
  nom: string;
  email: string;
  entreprise: string;
  poste: string;
  campagne: string | null;
}

interface NotionPropertyValue {
  title?: Array<{ plain_text: string }>;
  email?: string;
  rich_text?: Array<{ plain_text: string }>;
  select?: { name: string } | null;
}

interface NotionPage {
  id: string;
  properties: Record<string, NotionPropertyValue>;
}

interface NotionQueryResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface PushResult {
  pushed: number;
  errors: number;
  skipped: number;
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

function getEmeliaApiKey(): string {
  const key = process.env.EMELIA_API_KEY;
  if (!key) throw new Error("EMELIA_API_KEY manquant");
  return key;
}

/**
 * Sépare un nom complet en firstName / lastName.
 * "Jean Dupont" → { firstName: "Jean", lastName: "Dupont" }
 * "Jean-Pierre Dupont Martin" → { firstName: "Jean-Pierre", lastName: "Dupont Martin" }
 */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

// --- Notion → Lecture ---

/**
 * Récupère tous les contacts "À envoyer" sans Emelia ID dans la database Prospection.
 */
async function fetchProspectsToSend(): Promise<NotionProspect[]> {
  const prospects: NotionProspect[] = [];
  let cursor: string | null = null;

  do {
    const body: Record<string, unknown> = {
      filter: {
        and: [
          {
            property: "Statut",
            select: { equals: "À envoyer" },
          },
          {
            property: "Emelia ID",
            rich_text: { is_empty: true },
          },
          {
            property: "Email",
            email: { is_not_empty: true },
          },
        ],
      },
      page_size: 100,
    };

    if (cursor) body.start_cursor = cursor;

    const response = await fetch(
      `${NOTION_API_BASE}/databases/${PROSPECTION_DB_ID}/query`,
      {
        method: "POST",
        headers: getNotionHeaders(),
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`Notion query error: ${response.status}`);
    }

    const data = (await response.json()) as NotionQueryResponse;

    for (const page of data.results) {
      const nom =
        page.properties.Nom?.title?.[0]?.plain_text ?? "";
      const email = page.properties.Email?.email ?? "";
      const entreprise =
        page.properties.Entreprise?.rich_text?.[0]?.plain_text ?? "";
      const poste =
        page.properties.Poste?.rich_text?.[0]?.plain_text ?? "";
      const campagne =
        page.properties.Campagne?.select?.name ?? null;

      if (!email) continue;

      prospects.push({
        pageId: page.id,
        nom,
        email,
        entreprise,
        poste,
        campagne,
      });
    }

    cursor = data.has_more ? data.next_cursor : null;
  } while (cursor);

  return prospects;
}

// --- Emelia → Push ---

/**
 * Ajoute un contact dans une campagne Emelia.
 * Retourne l'Emelia contact ID ou null si erreur.
 */
async function pushContactToEmelia(
  campaignId: string,
  prospect: NotionProspect
): Promise<string | null> {
  const { firstName, lastName } = splitName(prospect.nom);

  const contact: Record<string, string> = {
    email: prospect.email,
    firstName,
    lastName,
  };

  if (prospect.entreprise) contact.company = prospect.entreprise;
  if (prospect.poste) contact.position = prospect.poste;

  const query = `mutation($id: ID!, $contact: JSON!) {
    addContactToCampaignHook(id: $id, contact: $contact)
  }`;

  const response = await fetch(EMELIA_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: getEmeliaApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { id: campaignId, contact },
    }),
  });

  if (!response.ok) return null;

  const json = (await response.json()) as {
    data?: { addContactToCampaignHook: string };
    errors?: Array<{ message: string }>;
  };

  if (json.errors && json.errors.length > 0) return null;

  return json.data?.addContactToCampaignHook ?? null;
}

// --- Notion → Mise à jour ---

/**
 * Met à jour une page Notion avec l'Emelia ID et le statut "Envoyé".
 */
async function markAsSent(
  pageId: string,
  emeliaId: string
): Promise<boolean> {
  const response = await fetch(`${NOTION_API_BASE}/pages/${pageId}`, {
    method: "PATCH",
    headers: getNotionHeaders(),
    body: JSON.stringify({
      properties: {
        "Emelia ID": {
          rich_text: [{ text: { content: emeliaId } }],
        },
        Statut: {
          select: { name: "Envoyé" },
        },
      },
    }),
  });

  return response.ok;
}

// --- Fonction principale ---

/**
 * Pousse les contacts "À envoyer" de Notion vers Emelia.
 *
 * @param campaignId — ID de la campagne Emelia cible.
 *   Doit être dans EMELIA_CAMPAIGN_IDS sinon la fonction refuse.
 */
export async function pushNotionToEmelia(
  campaignId: string
): Promise<PushResult> {
  // Sécurité : vérifier que la campagne est autorisée
  const allowedIds = getAllowedCampaignIds();
  if (!allowedIds.includes(campaignId)) {
    throw new Error(
      `Campagne ${campaignId} non autorisée. Campagnes autorisées : ${allowedIds.join(", ")}`
    );
  }

  const prospects = await fetchProspectsToSend();

  let pushed = 0;
  let errors = 0;
  let skipped = 0;

  for (const prospect of prospects) {
    try {
      // Si le prospect a une campagne Notion définie, on pourrait filtrer ici
      // Pour l'instant on pousse tous les "À envoyer" vers la campagne cible

      const emeliaId = await pushContactToEmelia(campaignId, prospect);

      if (emeliaId) {
        const updated = await markAsSent(prospect.pageId, emeliaId);
        if (updated) {
          pushed++;
        } else {
          // Contact poussé dans Emelia mais Notion pas mis à jour
          pushed++;
          errors++;
        }
      } else {
        errors++;
      }
    } catch {
      errors++;
    }
  }

  return { pushed, errors, skipped };
}

/**
 * Raccourci : pousse vers la première campagne autorisée.
 * Utile quand il n'y a qu'une seule campagne configurée.
 */
export async function pushNotionToDefaultCampaign(): Promise<PushResult> {
  const allowedIds = getAllowedCampaignIds();
  if (allowedIds.length === 0) {
    return { pushed: 0, errors: 0, skipped: 0 };
  }
  return pushNotionToEmelia(allowedIds[0]);
}
