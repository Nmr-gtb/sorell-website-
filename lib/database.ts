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

export async function upsertNewsletterConfig(userId: string, config: Record<string, unknown>) {
  const upsertData: Record<string, unknown> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };
  if (config.topics !== undefined) upsertData.topics = config.topics;
  if (config.sources !== undefined) upsertData.sources = config.sources;
  if (config.frequency !== undefined) upsertData.frequency = config.frequency;
  if (config.custom_brief !== undefined) upsertData.custom_brief = config.custom_brief;
  if (config.send_day !== undefined) upsertData.send_day = config.send_day;
  if (config.send_hour !== undefined) upsertData.send_hour = config.send_hour;
  if (config.brand_color !== undefined) upsertData.brand_color = config.brand_color;
  if (config.text_color !== undefined) upsertData.text_color = config.text_color;
  if (config.bg_color !== undefined) upsertData.bg_color = config.bg_color;
  if (config.body_text_color !== undefined) upsertData.body_text_color = config.body_text_color;
  if (config.custom_logo_url !== undefined) upsertData.custom_logo_url = config.custom_logo_url;

  const { data, error } = await supabase
    .from("newsletter_config")
    .upsert(upsertData, { onConflict: "user_id" })
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

export async function getMonthlyManualCount(userId: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("newsletters")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "draft")
    .gte("generated_at", startOfMonth.toISOString());

  return { count: count || 0, error };
}
