import { getSupabaseClient } from "./supabase";
import type { LearnerModel } from "@/lib/learner/types";

export async function loadMemoryFromDB(profileId: string): Promise<LearnerModel | null> {
  const db = getSupabaseClient();
  const { data } = await db
    .from("kid_memory")
    .select("model")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!data) return null;
  return data.model as LearnerModel;
}

export async function saveMemoryToDB(profileId: string, model: LearnerModel): Promise<void> {
  const db = getSupabaseClient();
  await db
    .from("kid_memory")
    .upsert(
      {
        profile_id: profileId,
        model: model as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" }
    );
}
