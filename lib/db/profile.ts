import { getSupabaseClient } from "./supabase";
import type { KidProfileRow } from "./types";

export async function getOrCreateProfile(
  deviceId: string,
  playerName?: string,
  ageBand?: string
): Promise<KidProfileRow> {
  const db = getSupabaseClient();

  const { data: existing } = await db
    .from("kid_profile")
    .select("*")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (existing) {
    if (
      (playerName && existing.player_name !== playerName) ||
      (ageBand && existing.age_band !== ageBand)
    ) {
      const { data: updated, error: updateError } = await db
        .from("kid_profile")
        .update({
          player_name: playerName ?? existing.player_name,
          age_band: ageBand ?? existing.age_band,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (updateError) console.warn("[profile] update failed:", updateError.message);
      return (updated ?? existing) as KidProfileRow;
    }
    return existing as KidProfileRow;
  }

  const { data: created, error } = await db
    .from("kid_profile")
    .insert({ device_id: deviceId, player_name: playerName ?? null, age_band: ageBand ?? null })
    .select("*")
    .single();

  if (error || !created) throw new Error(`Failed to create profile: ${error?.message}`);
  return created as KidProfileRow;
}
