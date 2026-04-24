import type { Mission, PlayerProgression, Strategy, TacticType } from "./types";
import { KINGDOMS, POWERS } from "./data";

// Map strategy IDs to the tactic type the detector fires for.
// Keep this table narrow: if a strategy doesn't correspond to a detected
// tactic, we skip it (missions need to be verifiable).
export const STRATEGY_TO_TACTIC: Record<string, TacticType> = {
  knight_forks: "fork",
  royal_fork: "fork",
  pawn_forks: "fork",
  absolute_pin: "pin",
  relative_pin: "pin",
  pin_exploitation: "pin",
  rook_skewer: "skewer",
  king_skewer: "skewer",
  discovered_attack: "discovered_attack",
  discovered_check: "discovered_attack",
  double_check: "double_check",
  back_rank_mate: "back_rank_mate",
};

// Map tactics to the Power awarded when the mission completes.
// We ONLY award a power whose tactic text plausibly matches — no "any power
// in the kingdom" fallback, because awarding a Pin power for a fork mission
// would break the trust the spec insists on.
function powerIdForTactic(tactic: TacticType, kingdomId: string): string | null {
  const needle = tactic.replace(/_/g, " ");
  const match = POWERS.find(
    (p) =>
      p.kingdom === kingdomId &&
      p.tactic.toLowerCase().includes(needle)
  );
  return match?.id ?? null;
}

/**
 * Find the next unmastered strategy in the given kingdom that corresponds
 * to the given tactic. Used when completing a mission to figure out which
 * strategy to mark as mastered.
 */
export function findStrategyForTactic(
  kingdomId: string,
  tactic: TacticType,
  mastered: string[]
): Strategy | null {
  const k = KINGDOMS.find((x) => x.id === kingdomId);
  if (!k) return null;
  return (
    k.strategies.find(
      (s) =>
        STRATEGY_TO_TACTIC[s.id] === tactic &&
        !mastered.includes(s.id)
    ) ?? null
  );
}

function describe(tactic: TacticType): string {
  const names: Record<TacticType, string> = {
    fork: "Find a fork in your next game!",
    pin: "Find a pin in your next game!",
    skewer: "Find a skewer in your next game!",
    discovered_attack: "Land a discovered attack!",
    double_check: "Deliver a double check!",
    back_rank_mate: "Deliver a back rank mate!",
    sacrifice: "Sacrifice for advantage!",
    deflection: "Deflect a defender!",
    overloading: "Overload an opponent's piece!",
    zwischenzug: "Find an in-between move!",
  };
  return names[tactic] ?? "Find a clever tactic!";
}

function nextUnmasteredStrategy(progression: PlayerProgression): { strategy: Strategy; kingdomId: string } | null {
  // Walk the current kingdom first, then FALL THROUGH to later kingdoms
  // if nothing matches. This prevents new players in "village" (which has
  // no detectable strategies — it's a tutorial kingdom) from being stuck
  // with no mission, and it keeps the mission stream going if a later
  // kingdom has purely conceptual strategies (e.g. center_control).
  const startIdx = KINGDOMS.findIndex((k) => k.id === progression.currentKingdom);
  if (startIdx < 0) return null;
  for (let i = startIdx; i < KINGDOMS.length; i++) {
    const kingdom = KINGDOMS[i];
    for (const s of kingdom.strategies) {
      if (progression.masteredStrategies.includes(s.id)) continue;
      if (!STRATEGY_TO_TACTIC[s.id]) continue; // un-verifiable
      const prereqsMet = s.prerequisites.every((pre) =>
        progression.masteredStrategies.includes(pre)
      );
      if (!prereqsMet) continue;
      return { strategy: s, kingdomId: kingdom.id };
    }
  }
  return null;
}

/**
 * Generate the next mission for the player based on their current kingdom
 * and mastered strategies. Returns null when there's nothing to assign.
 */
export function generateMission(progression: PlayerProgression): Mission | null {
  const picked = nextUnmasteredStrategy(progression);
  if (!picked) return null;
  const tactic = STRATEGY_TO_TACTIC[picked.strategy.id];
  if (!tactic) return null;
  // Look up the power in the kingdom that OWNS the strategy, not the
  // player's current kingdom — otherwise a fall-through mission to a
  // later kingdom's strategy would have no power to award.
  const powerId = powerIdForTactic(tactic, picked.kingdomId);
  if (!powerId) return null;
  return {
    id: `mission_${picked.strategy.id}_${Date.now()}`,
    targetTactic: tactic,
    description: describe(tactic),
    powerId,
    gamesAttempted: 0,
    maxGamesBeforeHint: 3,
  };
}

/**
 * Returns true if the given tactic type detected in a game satisfies the
 * active mission. Used by the game store to trigger mission completion.
 */
export function missionMatchesTactic(mission: Mission, tacticType: string): boolean {
  if (mission.targetTactic === tacticType) return true;
  // Double check also satisfies a discovered-attack mission (it's a subtype).
  if (mission.targetTactic === "discovered_attack" && tacticType === "double_check") return true;
  return false;
}

/**
 * When the kingdom has been fully conquered (all detectable strategies mastered),
 * missions run out. Returns the list of kingdoms the player could move to next.
 */
export function findNextKingdom(progression: PlayerProgression): string | null {
  const currentIdx = KINGDOMS.findIndex((k) => k.id === progression.currentKingdom);
  if (currentIdx < 0 || currentIdx >= KINGDOMS.length - 1) return null;
  return KINGDOMS[currentIdx + 1].id;
}
