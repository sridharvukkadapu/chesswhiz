import type { LearningStage } from "@/lib/trial/types";

export const STAGE_CONCEPT_ADDITIONS: Record<LearningStage, string[]> = {
  // Stage 1: kid is learning piece names and what they look like.
  // Coordinate vocabulary (rank/file/diagonal) is Stage 2+ — a Stage 1 kid
  // doesn't yet know how pieces move, so spatial references are meaningless.
  1: ["pieces", "king", "queen", "rook", "bishop", "knight", "pawn", "board"],
  2: ["square", "rank", "file", "diagonal", "piece movement", "piece value", "capture", "protection", "trade"],
  3: ["check", "checkmate", "stalemate", "castling", "en passant", "promotion"],
  4: ["fork", "pin", "skewer", "discovered attack", "hanging piece", "back rank"],
  5: ["outpost", "open file", "pawn structure", "opposition", "zugzwang"],
};

export function getAllowedConcepts(stage: LearningStage): string[] {
  const result: string[] = [];
  for (let s = 1; s <= stage; s++) {
    result.push(...STAGE_CONCEPT_ADDITIONS[s as LearningStage]);
  }
  return Array.from(new Set(result));
}

export const TACTIC_IDS = [
  "fork", "pin", "skewer", "discovered_attack",
  "hanging_piece", "mate_in_1", "bot_threat",
] as const;

export type TacticId = typeof TACTIC_IDS[number];

export const TACTIC_DESCRIPTIONS: Record<TacticId, Record<LearningStage, string>> = {
  fork: {
    1: "you can attack two of their pieces with one move!",
    2: "you can attack two pieces at the same time",
    3: "you can attack two pieces at the same time",
    4: "fork — attack two pieces at once",
    5: "fork",
  },
  pin: {
    1: "one of your pieces is stuck and can't move safely",
    2: "one of your pieces is stuck and can't move safely",
    3: "a piece is stuck — something important is behind it",
    4: "pin — piece is fixed to a more valuable piece behind it",
    5: "pin",
  },
  skewer: {
    1: "something dangerous is aimed at your piece",
    2: "something dangerous is aimed at your piece",
    3: "your piece is being attacked and something valuable is behind it",
    4: "skewer — attack through a piece to win material behind it",
    5: "skewer",
  },
  discovered_attack: {
    1: "moving a piece reveals a surprise attack",
    2: "moving a piece reveals a surprise attack",
    3: "moving a piece reveals a surprise attack",
    4: "discovered attack — move one piece to unleash another",
    5: "discovered attack",
  },
  hanging_piece: {
    1: "that piece can be taken for free!",
    2: "that piece isn't safe — it can be captured for free",
    3: "that piece can be captured for free — nothing is defending it",
    4: "hanging piece — undefended and free to capture",
    5: "hanging piece",
  },
  mate_in_1: {
    1: "you can end the game right now",
    2: "you can end the game right now",
    3: "checkmate in one move",
    4: "checkmate in one move",
    5: "mate in 1",
  },
  bot_threat: {
    1: "something dangerous is coming",
    2: "the bot is setting up a trap",
    3: "the bot is threatening something — can you spot it?",
    4: "the bot has a tactic coming",
    5: "bot threat",
  },
};

export function describeTactic(tacticId: string, stage: LearningStage): string {
  return (TACTIC_DESCRIPTIONS as Record<string, Record<LearningStage, string>>)[tacticId]?.[stage] ?? tacticId;
}
