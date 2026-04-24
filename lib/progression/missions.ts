import type { Mission, PlayerProgression, Strategy, TacticType } from "./types";
import { KINGDOMS, POWERS, getKingdomById } from "./data";

// Map strategy IDs to the tactic type the detector fires for.
// Keep this table narrow: if a strategy doesn't correspond to a detected
// tactic, we skip it (missions need to be verifiable).
const STRATEGY_TO_TACTIC: Record<string, TacticType> = {
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
// Uses the first matching power in the current kingdom.
function powerIdForTactic(tactic: TacticType, kingdomId: string): string | null {
  const match = POWERS.find(
    (p) =>
      p.kingdom === kingdomId &&
      p.tactic.toLowerCase().includes(tactic.replace("_", " "))
  );
  if (match) return match.id;
  // Fall back to ANY power in the kingdom.
  const fallback = POWERS.find((p) => p.kingdom === kingdomId);
  return fallback?.id ?? null;
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

function nextUnmasteredStrategy(progression: PlayerProgression): Strategy | null {
  const kingdom = getKingdomById(progression.currentKingdom);
  if (!kingdom) return null;
  for (const s of kingdom.strategies) {
    if (progression.masteredStrategies.includes(s.id)) continue;
    // Only offer strategies whose tactic we can actually detect
    if (!STRATEGY_TO_TACTIC[s.id]) continue;
    // Prerequisites satisfied?
    const prereqsMet = s.prerequisites.every((pre) =>
      progression.masteredStrategies.includes(pre)
    );
    if (!prereqsMet) continue;
    return s;
  }
  return null;
}

/**
 * Generate the next mission for the player based on their current kingdom
 * and mastered strategies. Returns null when there's nothing to assign.
 */
export function generateMission(progression: PlayerProgression): Mission | null {
  const strat = nextUnmasteredStrategy(progression);
  if (!strat) return null;
  const tactic = STRATEGY_TO_TACTIC[strat.id];
  if (!tactic) return null;
  const powerId = powerIdForTactic(tactic, progression.currentKingdom);
  if (!powerId) return null;
  return {
    id: `mission_${strat.id}_${Date.now()}`,
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
