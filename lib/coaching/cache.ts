import type { CoachRequest, CoachResponse } from "./schema";

interface CacheEntry {
  response: CoachResponse;
  expiresAt: number;
}

const MAX_ENTRIES = 500;
const TTL_MS = 60 * 60 * 1000; // 1 hour

// LRU cache: Map preserves insertion order; delete+re-insert = move to end (most recent)
const cache = new Map<string, CacheEntry>();

export function cacheKey(req: CoachRequest): string {
  const tactics = [...(req.tacticsAvailableForKid ?? [])].sort().join(",");
  const botTactics = [...(req.tacticsAvailableForBot ?? [])].sort().join(",");
  const errors = (req.learnerSummary?.recurringErrors ?? [])
    .map((e) => e.patternId)
    .sort()
    .join(",");
  return [
    req.fen,
    req.lastMove?.san ?? "",
    req.mover,
    req.trigger,
    req.ageBand,
    req.activeMissionConcept ?? "",
    tactics,
    botTactics,
    errors,
  ].join("|");
}

export function getCached(req: CoachRequest): CoachResponse | null {
  const key = cacheKey(req);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  // Move to end (LRU)
  cache.delete(key);
  cache.set(key, entry);
  return entry.response;
}

export function setCached(req: CoachRequest, response: CoachResponse): void {
  const key = cacheKey(req);
  // Evict oldest if at capacity
  if (cache.size >= MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(key, { response, expiresAt: Date.now() + TTL_MS });
}

export function getCacheStats(): { size: number; maxEntries: number } {
  return { size: cache.size, maxEntries: MAX_ENTRIES };
}
