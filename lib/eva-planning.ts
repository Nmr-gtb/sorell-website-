/**
 * Eva Planning — Rappels automatiques basés sur le Planning Lancement Notion.
 * Envoie des notifications Telegram 24h avant, 1h avant, et à l'heure de chaque événement.
 */

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

// ID de la database "Planning Lancement — Communication"
const PLANNING_DB_ID = "777d7dcf-bd14-49af-80a2-9262b4ea011d";

function getNotionHeaders(): Record<string, string> {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) throw new Error("NOTION_API_KEY manquant");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VERSION,
  };
}

export interface PlanningEvent {
  id: string;
  action: string;
  canal: string;
  date: string; // YYYY-MM-DD
  statut: string;
}

/**
 * Récupère les événements non terminés du Planning Lancement.
 */
async function fetchPlanningEvents(): Promise<PlanningEvent[]> {
  const res = await fetch(`${NOTION_API_BASE}/databases/${PLANNING_DB_ID}/query`, {
    method: "POST",
    headers: getNotionHeaders(),
    body: JSON.stringify({
      filter: {
        and: [
          {
            property: "Date",
            date: { is_not_empty: true },
          },
          {
            property: "Statut",
            status: { does_not_equal: "Terminé" },
          },
        ],
      },
      sorts: [{ property: "Date", direction: "ascending" }],
    }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  const events: PlanningEvent[] = [];

  for (const page of data.results ?? []) {
    const props = page.properties;
    const titleArr = props?.Action?.title;
    const action = titleArr?.[0]?.plain_text || "";
    const canal = props?.Canal?.select?.name || "";
    const date = props?.Date?.date?.start || "";
    const statut = props?.Statut?.status?.name || "";

    if (action && date) {
      events.push({ id: page.id, action, canal, date, statut });
    }
  }

  return events;
}

/**
 * Vérifie les événements du planning et retourne les rappels à envoyer.
 * Appelé toutes les 15 minutes par le CRON.
 *
 * @param parisNow - Date actuelle en heure de Paris (ISO string ou Date)
 * @param alreadySentKeys - Set de clés déjà envoyées (format: "eventId:type")
 */
export async function checkPlanningReminders(
  parisNow: Date,
  alreadySentKeys: Set<string>
): Promise<string | null> {
  try {
    const events = await fetchPlanningEvents();
    if (events.length === 0) return null;

    const reminders: string[] = [];
    const nowMs = parisNow.getTime();

    for (const event of events) {
      // La date Notion est au format YYYY-MM-DD (pas d'heure)
      // On suppose 9h du matin comme heure par défaut pour les événements
      const eventDate = new Date(`${event.date}T09:00:00+02:00`);
      const eventMs = eventDate.getTime();
      const diffMs = eventMs - nowMs;
      const diffHours = diffMs / (1000 * 60 * 60);

      const canalLabel = event.canal ? ` (${event.canal})` : "";

      // Rappel 24h avant (entre 23h et 25h avant)
      const key24h = `${event.id}:24h`;
      if (diffHours > 23 && diffHours <= 25 && !alreadySentKeys.has(key24h)) {
        reminders.push(
          `📅 <b>Demain</b>${canalLabel}\n` +
          `${event.action}\n` +
          `Prévu le ${formatDate(event.date)}`
        );
        alreadySentKeys.add(key24h);
      }

      // Rappel 1h avant (entre 0.5h et 1.5h avant)
      const key1h = `${event.id}:1h`;
      if (diffHours > 0.5 && diffHours <= 1.5 && !alreadySentKeys.has(key1h)) {
        reminders.push(
          `⏰ <b>Dans 1 heure</b>${canalLabel}\n` +
          `${event.action}`
        );
        alreadySentKeys.add(key1h);
      }

      // Rappel à l'heure (entre -0.5h et 0.5h)
      const keyNow = `${event.id}:now`;
      if (diffHours >= -0.5 && diffHours <= 0.5 && !alreadySentKeys.has(keyNow)) {
        reminders.push(
          `🚀 <b>C'est maintenant !</b>${canalLabel}\n` +
          `${event.action}`
        );
        alreadySentKeys.add(keyNow);
      }
    }

    if (reminders.length === 0) return null;

    return `🔔 <b>Rappel Planning</b>\n\n${reminders.join("\n\n")}`;
  } catch {
    return null;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const days = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}
