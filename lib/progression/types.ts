// Ranks — the 6 player levels
export type RankId = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";

export interface Rank {
  id: RankId;
  name: string;
  icon: string;
  level: number;
  xpRequired: number;
  color: string;
}

// Kingdoms — the 7 world regions
export type KingdomId =
  | "village"
  | "fork_forest"
  | "pin_palace"
  | "skewer_spire"
  | "discovery_depths"
  | "strategy_summit"
  | "endgame_throne";

export interface Boss {
  name: string;
  emoji: string;
  personality: string;
  signature: string;
  dialogue: string[];
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  coachExplanation: string;
  kingdom: KingdomId;
  prerequisites: string[];
  xpReward: number;
}

export interface Kingdom {
  id: KingdomId;
  name: string;
  subtitle: string;
  level: number;
  color: string;
  description: string;
  boss: Boss | null;
  strategies: Strategy[];
}

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface Power {
  id: string;
  name: string;
  icon: string;
  tactic: string;
  kingdom: KingdomId;
  howToEarn: string;
  coachCelebration: string;
  rarity: Rarity;
}

export interface Mission {
  id: string;
  targetTactic: TacticType;
  description: string;
  powerId: string;
  gamesAttempted: number;
  maxGamesBeforeHint: number;
}

export type Tier = "free" | "champion";

export interface PlayerProgression {
  rank: RankId;
  xp: number;
  currentKingdom: KingdomId;
  completedKingdoms: KingdomId[];
  defeatedBosses: string[];
  masteredStrategies: string[];
  earnedPowers: string[];
  activeMission: Mission | null;
  streak: number;
  lastPlayedDate: string; // ISO date (YYYY-MM-DD)
  tier: Tier;
}

// Tactic detection
export type TacticType =
  | "fork"
  | "pin"
  | "skewer"
  | "discovered_attack"
  | "double_check"
  | "back_rank_mate"
  | "sacrifice"
  | "deflection"
  | "overloading"
  | "zwischenzug";

export interface TacticDetection {
  type: TacticType;
  detected: boolean;
  details: string;
  materialWon: number; // centipawns

  // Squares involved — populated by detectors so the board annotation
  // layer can draw arrows/circles from the same logic that named the tactic.
  attackerSquare?: string;     // e.g. the forking knight, the pinning bishop
  targetSquares?: string[];    // pieces attacked by the tactic (forks: both)
  pinnedSquare?: string;       // the piece that's stuck in place
  behindSquare?: string;       // pin: the high-value piece behind
  frontSquare?: string;        // skewer: the bigger piece in front
  backSquare?: string;         // skewer: the back piece exposed when the front moves
}

// XP source logging
export interface XPEntry {
  amount: number;
  source: string;
  timestamp: number;
}
