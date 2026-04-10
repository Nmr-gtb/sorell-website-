/**
 * Emelia — Client GraphQL pour l'API Emelia (cold email).
 *
 * Endpoint : https://graphql.emelia.io/graphql
 * Auth : header Authorization avec la clé API (pas de prefix Bearer).
 *
 * Ce module est indépendant de Notion. Il expose uniquement
 * des fonctions pour interroger les campagnes et contacts Emelia.
 */

const EMELIA_GRAPHQL_URL = "https://graphql.emelia.io/graphql";

// --- Types ---

export interface EmeliaCampaign {
  _id: string;
  name: string;
  status: string; // "RUNNING" | "PAUSED" | "FINISHED" | "DRAFT"
  createdAt: string;
}

export interface EmeliaContact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string; // "REPLIED" | "SENT" | "OPENED" | "CLICKED" | "BOUNCED" | "UNSUBSCRIBED"
  lastReplied: string | null; // timestamp ms as string
  lastContacted: string | null;
  lastOpen: string | null;
  campaigns: string[];
}

export interface EmeliaContactList {
  _id: string;
  name: string;
  contactCount: number;
  contacts: {
    list: EmeliaContact[];
    count: number;
  };
}

export type EmeliaEvent =
  | "SENT"
  | "OPENED"
  | "CLICKED"
  | "REPLIED"
  | "BOUNCED"
  | "UNSUBSCRIBED";

// --- Helpers internes ---

function getApiKey(): string {
  const key = process.env.EMELIA_API_KEY;
  if (!key) throw new Error("EMELIA_API_KEY manquant");
  return key;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function graphqlQuery<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(EMELIA_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(
      `Emelia API error: ${response.status} ${response.statusText}`
    );
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors && json.errors.length > 0) {
    throw new Error(`Emelia GraphQL error: ${json.errors[0].message}`);
  }

  if (!json.data) {
    throw new Error("Emelia GraphQL: aucune donnée retournée");
  }

  return json.data;
}

// --- Filtrage campagnes autorisées ---

/**
 * Retourne la liste des IDs de campagnes autorisées.
 * Définis dans EMELIA_CAMPAIGN_IDS (séparés par des virgules).
 * Si vide ou absent, retourne un tableau vide → aucune sync.
 */
export function getAllowedCampaignIds(): string[] {
  const raw = process.env.EMELIA_CAMPAIGN_IDS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

// --- Fonctions exportées ---

/**
 * Récupère toutes les campagnes Emelia.
 */
export async function fetchCampaigns(): Promise<EmeliaCampaign[]> {
  const query = `
    query {
      all_campaigns {
        _id
        name
        status
        createdAt
      }
    }
  `;

  const data = await graphqlQuery<{ all_campaigns: EmeliaCampaign[] }>(query);
  return data.all_campaigns;
}

/**
 * Récupère les contacts filtrés par événement, UNIQUEMENT pour les campagnes autorisées.
 * Pagine automatiquement si nécessaire (100 contacts par page).
 *
 * SÉCURITÉ : ne touche jamais aux campagnes non listées dans EMELIA_CAMPAIGN_IDS.
 * Si aucune campagne autorisée, retourne un tableau vide.
 */
export async function fetchContactsByEvent(
  event: EmeliaEvent
): Promise<EmeliaContact[]> {
  const allowedIds = getAllowedCampaignIds();
  if (allowedIds.length === 0) return [];

  const allContacts: EmeliaContact[] = [];
  const seenIds = new Set<string>();

  // D'abord, récupérer toutes les contact lists avec la première page
  const firstPageQuery = `
    query {
      contact_lists {
        _id
        name
        contactCount
        contacts(page: 1, perPage: 100, event: ${event}) {
          list {
            _id
            firstName
            lastName
            email
            status
            lastReplied
            lastContacted
            lastOpen
            campaigns
          }
          count
        }
      }
    }
  `;

  const firstData = await graphqlQuery<{
    contact_lists: EmeliaContactList[];
  }>(firstPageQuery);

  for (const contactList of firstData.contact_lists) {
    const { list, count } = contactList.contacts;

    // Ajouter les contacts de la première page (dédupliqués + filtrés par campagne)
    for (const contact of list) {
      if (seenIds.has(contact._id)) continue;
      // Ne garder que les contacts appartenant à une campagne autorisée
      const belongsToAllowed = contact.campaigns?.some((cId) =>
        allowedIds.includes(cId)
      );
      if (!belongsToAllowed) continue;
      seenIds.add(contact._id);
      allContacts.push(contact);
    }

    // Paginer si plus de 100 contacts dans cette liste
    const totalPages = Math.ceil(count / 100);
    for (let page = 2; page <= totalPages; page++) {
      const pageQuery = `
        query {
          contact_lists {
            _id
            contacts(page: ${page}, perPage: 100, event: ${event}) {
              list {
                _id
                firstName
                lastName
                email
                status
                lastReplied
                lastContacted
                lastOpen
                campaigns
              }
              count
            }
          }
        }
      `;

      const pageData = await graphqlQuery<{
        contact_lists: Array<{
          _id: string;
          contacts: { list: EmeliaContact[]; count: number };
        }>;
      }>(pageQuery);

      // Trouver la bonne contact list dans les résultats
      const matchingList = pageData.contact_lists.find(
        (cl) => cl._id === contactList._id
      );
      if (matchingList) {
        for (const contact of matchingList.contacts.list) {
          if (seenIds.has(contact._id)) continue;
          const belongsToAllowed = contact.campaigns?.some((cId) =>
            allowedIds.includes(cId)
          );
          if (!belongsToAllowed) continue;
          seenIds.add(contact._id);
          allContacts.push(contact);
        }
      }
    }
  }

  return allContacts;
}

/**
 * Raccourci : récupère les contacts ayant répondu (campagnes autorisées uniquement).
 */
export async function fetchRepliedContacts(): Promise<EmeliaContact[]> {
  return fetchContactsByEvent("REPLIED");
}
