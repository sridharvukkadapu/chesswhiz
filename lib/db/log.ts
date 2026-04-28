import { getSupabaseClient } from "./supabase";
import type { CoachLogEntry } from "./types";

export function insertCoachLog(entry: CoachLogEntry): void {
  const db = getSupabaseClient();
  db.from("coach_log").insert(entry).then(({ error }) => {
    if (error) console.warn("[coach_log] insert failed:", error.message);
  });
}
