/**
 * Notion API helpers pour la gestion des taches Sorell.
 * Utilise fetch natif (pas de SDK Notion).
 *
 * Database properties:
 * - "Tache" (title)
 * - "Statut" (status: "Pas commence", "En cours", "Termine")
 * - "Priorite" (select: "Haute", "Moyenne", "Basse")
 * - "Echeance" (date)
 * - "Notes" (rich_text)
 */

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

function getNotionHeaders(): Record<string, string> {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error("NOTION_API_KEY manquant");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
  };
}

function getDatabaseId(): string {
  const id = process.env.NOTION_DATABASE_ID;
  if (!id) throw new Error("NOTION_DATABASE_ID manquant");
  return id;
}

// --- Types ---

export interface NotionTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  notes: string;
}

interface NotionRichText {
  type: string;
  text?: { content: string };
  plain_text: string;
}

interface NotionPageProperties {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface NotionPage {
  id: string;
  properties: NotionPageProperties;
}

interface NotionQueryResponse {
  results: NotionPage[];
  has_more: boolean;
  next_cursor: string | null;
}

// --- Helpers ---

function extractTitle(properties: NotionPageProperties): string {
  const titleProp = properties["Tâche"];
  if (!titleProp?.title?.length) return "";
  return titleProp.title.map((t: NotionRichText) => t.plain_text).join("");
}

function extractStatus(properties: NotionPageProperties): string {
  return properties["Statut"]?.status?.name ?? "Pas commencé";
}

function extractPriority(properties: NotionPageProperties): string {
  return properties["Priorité"]?.select?.name ?? "Moyenne";
}

function extractDueDate(properties: NotionPageProperties): string | null {
  return properties["Échéance"]?.date?.start ?? null;
}

function extractNotes(properties: NotionPageProperties): string {
  const notesProp = properties["Notes"];
  if (!notesProp?.rich_text?.length) return "";
  return notesProp.rich_text.map((t: NotionRichText) => t.plain_text).join("");
}

function pageToTask(page: NotionPage): NotionTask {
  return {
    id: page.id,
    title: extractTitle(page.properties),
    status: extractStatus(page.properties),
    priority: extractPriority(page.properties),
    dueDate: extractDueDate(page.properties),
    notes: extractNotes(page.properties),
  };
}

// --- API Calls ---

/**
 * Cree une nouvelle tache dans la database Notion.
 */
export async function createTask(params: {
  title: string;
  priority?: string;
  notes?: string;
  dueDate?: string;
}): Promise<NotionTask> {
  const properties: NotionPageProperties = {
    "Tâche": {
      title: [{ text: { content: params.title } }],
    },
    "Statut": {
      status: { name: "Pas commencé" },
    },
    "Priorité": {
      select: { name: params.priority ?? "Moyenne" },
    },
  };

  if (params.notes) {
    properties["Notes"] = {
      rich_text: [{ text: { content: params.notes } }],
    };
  }

  if (params.dueDate) {
    properties["Échéance"] = {
      date: { start: params.dueDate },
    };
  }

  const response = await fetch(`${NOTION_API_BASE}/pages`, {
    method: "POST",
    headers: getNotionHeaders(),
    body: JSON.stringify({
      parent: { database_id: getDatabaseId() },
      properties,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Notion createTask error (${response.status}): ${errorBody}`);
  }

  const page = (await response.json()) as NotionPage;
  return pageToTask(page);
}

/**
 * Recherche des taches par nom (fuzzy via contains).
 */
export async function searchTasks(query: string): Promise<NotionTask[]> {
  const response = await fetch(`${NOTION_API_BASE}/databases/${getDatabaseId()}/query`, {
    method: "POST",
    headers: getNotionHeaders(),
    body: JSON.stringify({
      filter: {
        property: "Tâche",
        title: {
          contains: query,
        },
      },
      page_size: 10,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Notion searchTasks error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as NotionQueryResponse;
  return data.results.map(pageToTask);
}

/**
 * Liste toutes les taches non terminees, groupees par priorite.
 */
export async function listActiveTasks(): Promise<NotionTask[]> {
  const response = await fetch(`${NOTION_API_BASE}/databases/${getDatabaseId()}/query`, {
    method: "POST",
    headers: getNotionHeaders(),
    body: JSON.stringify({
      filter: {
        property: "Statut",
        status: {
          does_not_equal: "Terminé",
        },
      },
      sorts: [
        {
          property: "Priorité",
          direction: "ascending",
        },
      ],
      page_size: 100,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Notion listActiveTasks error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as NotionQueryResponse;
  return data.results.map(pageToTask);
}

/**
 * Met a jour le statut d'une tache.
 */
export async function updateTaskStatus(pageId: string, status: string): Promise<NotionTask> {
  const response = await fetch(`${NOTION_API_BASE}/pages/${pageId}`, {
    method: "PATCH",
    headers: getNotionHeaders(),
    body: JSON.stringify({
      properties: {
        "Statut": {
          status: { name: status },
        },
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Notion updateTaskStatus error (${response.status}): ${errorBody}`);
  }

  const page = (await response.json()) as NotionPage;
  return pageToTask(page);
}

/**
 * Met a jour les champs d'une tache (priorite, notes, echeance).
 */
export async function updateTaskFields(
  pageId: string,
  fields: {
    priority?: string;
    notes?: string;
    dueDate?: string;
  }
): Promise<NotionTask> {
  const properties: NotionPageProperties = {};

  if (fields.priority) {
    properties["Priorité"] = {
      select: { name: fields.priority },
    };
  }

  if (fields.notes) {
    properties["Notes"] = {
      rich_text: [{ text: { content: fields.notes } }],
    };
  }

  if (fields.dueDate) {
    properties["Échéance"] = {
      date: { start: fields.dueDate },
    };
  }

  const response = await fetch(`${NOTION_API_BASE}/pages/${pageId}`, {
    method: "PATCH",
    headers: getNotionHeaders(),
    body: JSON.stringify({ properties }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Notion updateTaskFields error (${response.status}): ${errorBody}`);
  }

  const page = (await response.json()) as NotionPage;
  return pageToTask(page);
}

/**
 * Archive (supprime) une tache.
 */
export async function archiveTask(pageId: string): Promise<void> {
  const response = await fetch(`${NOTION_API_BASE}/pages/${pageId}`, {
    method: "PATCH",
    headers: getNotionHeaders(),
    body: JSON.stringify({ archived: true }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Notion archiveTask error (${response.status}): ${errorBody}`);
  }
}

/**
 * Formate la liste des taches pour l'affichage Telegram.
 */
export function formatTaskList(tasks: NotionTask[]): string {
  if (tasks.length === 0) {
    return "Aucune tache en cours.";
  }

  const priorityOrder: Record<string, number> = {
    Haute: 1,
    Moyenne: 2,
    Basse: 3,
  };

  const sorted = [...tasks].sort(
    (a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
  );

  const grouped: Record<string, NotionTask[]> = {};
  for (const task of sorted) {
    const key = task.priority || "Autre";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(task);
  }

  const priorityEmoji: Record<string, string> = {
    Haute: "🔴",
    Moyenne: "🟡",
    Basse: "🟢",
  };

  const lines: string[] = [];
  for (const [priority, priorityTasks] of Object.entries(grouped)) {
    const emoji = priorityEmoji[priority] ?? "⚪";
    lines.push(`\n<b>${emoji} ${priority}</b>`);
    for (const task of priorityTasks) {
      const statusIcon = task.status === "En cours" ? "🔄" : "⬜";
      let line = `  ${statusIcon} ${task.title}`;
      if (task.dueDate) {
        line += ` (${task.dueDate})`;
      }
      lines.push(line);
    }
  }

  return `<b>Taches en cours (${tasks.length})</b>${lines.join("\n")}`;
}
