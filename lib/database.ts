import { supabase } from "./supabase";

// ═══ PROFILE ═══

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return { data, error };
}

export async function updateProfile(userId: string, updates: { full_name?: string; plan?: string }) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();
  return { data, error };
}

// ═══ NEWSLETTER CONFIG ═══

export async function getNewsletterConfig(userId: string) {
  const { data, error } = await supabase
    .from("newsletter_config")
    .select("*")
    .eq("user_id", userId)
    .single();
  return { data, error };
}

export async function upsertNewsletterConfig(userId: string, config: {
  topics?: { id: string; label: string; enabled: boolean }[];
  sources?: string[];
  frequency?: string;
  custom_brief?: string;
  send_day?: string;
  send_hour?: number;
}) {
  const { data, error } = await supabase
    .from("newsletter_config")
    .upsert({
      user_id: userId,
      topics: config.topics ?? [],
      sources: config.sources ?? [],
      frequency: config.frequency ?? "weekly",
      custom_brief: config.custom_brief ?? "",
      send_day: config.send_day ?? "monday",
      send_hour: config.send_hour ?? 9,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select()
    .single();
  return { data, error };
}

export async function getAllNewsletterConfigs() {
  const { data, error } = await supabase
    .from("newsletter_config")
    .select("*, profiles!newsletter_config_user_id_fkey(full_name, plan)")
    .not("topics", "eq", "[]");
  return { data: data ?? [], error };
}

// ═══ RECIPIENTS ═══

export async function getRecipients(userId: string) {
  const { data, error } = await supabase
    .from("recipients")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return { data: data ?? [], error };
}

export async function addRecipient(userId: string, recipient: { name: string; email: string; role: string }) {
  const { data, error } = await supabase
    .from("recipients")
    .insert({ user_id: userId, ...recipient })
    .select()
    .single();
  return { data, error };
}

export async function deleteRecipient(recipientId: string) {
  const { error } = await supabase
    .from("recipients")
    .delete()
    .eq("id", recipientId);
  return { error };
}

// ═══ NEWSLETTERS ═══

export async function getMonthlyNewsletterCount(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("newsletters")
    .select("id")
    .eq("user_id", userId)
    .gte("generated_at", startOfMonth.toISOString());

  return { count: data?.length || 0, error };
}
