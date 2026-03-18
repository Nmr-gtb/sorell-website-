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
}) {
  const { data, error } = await supabase
    .from("newsletter_config")
    .upsert({
      user_id: userId,
      topics: config.topics ?? [],
      sources: config.sources ?? [],
      frequency: config.frequency ?? "weekly-1",
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select()
    .single();
  return { data, error };
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
