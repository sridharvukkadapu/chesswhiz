import type { LearnerModel } from "./types";
import { createEmptyLearnerModel } from "./model";
import { getDeviceId } from "@/lib/identity/device";

const LEARNER_KEY_PREFIX = "chesswhiz.learner.";

function djb2(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h >>>= 0;
  }
  return h;
}

function modelChecksum(model: LearnerModel): number {
  const key = `${model.version}|${model.playerId}|${model.stats.gamesPlayed}|${model.stats.totalMoves}`;
  return djb2(key);
}

export function derivePlayerId(name: string, age: number): string {
  const hash = djb2(`${name.toLowerCase().trim()}|${age}`);
  return `p_${hash}`;
}

export function loadLearnerModel(playerId: string): LearnerModel {
  if (typeof window === "undefined") return createEmptyLearnerModel(playerId);
  try {
    const raw = localStorage.getItem(LEARNER_KEY_PREFIX + playerId);
    if (!raw) return createEmptyLearnerModel(playerId);
    const { _cs, ...rest } = JSON.parse(raw) as LearnerModel & { _cs?: number };
    const model = rest as LearnerModel;
    if (_cs !== undefined && modelChecksum(model) !== _cs) {
      return createEmptyLearnerModel(playerId);
    }
    return model;
  } catch {
    return createEmptyLearnerModel(playerId);
  }
}

export function saveLearnerModel(model: LearnerModel): void {
  if (typeof window === "undefined") return;
  try {
    const payload = { ...model, _cs: modelChecksum(model) };
    localStorage.setItem(LEARNER_KEY_PREFIX + model.playerId, JSON.stringify(payload));
  } catch {}
}

export async function syncToServer(model: LearnerModel, playerName?: string, ageBand?: string): Promise<void> {
  if (typeof window === "undefined") return;
  const deviceId = getDeviceId();
  if (!deviceId) return; // null on SSR
  try {
    await fetch("/api/memory/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, playerName, ageBand, model }),
    });
  } catch (err) {
    console.warn("[memory/sync] offline or error:", err);
  }
}
