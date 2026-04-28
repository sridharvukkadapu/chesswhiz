import type { TacticType } from "@/lib/progression/types";

export type ConceptId =
  | TacticType
  | "hanging_piece"
  | "defending"
  | "trading"
  | "development"
  | "king_safety"
  | "center_control"
  | "material_count"
  | "checkmate_pattern";

export type AgeBand = "5-7" | "8-10" | "11+";

export interface ConceptMastery {
  conceptId: ConceptId;
  score: number;        // 0..1 Bayesian
  seenCount: number;
  correctCount: number;
  lastSeenMove: number;
}

export type ErrorPatternId =
  | "hangs_queen"
  | "hangs_rook"
  | "hangs_bishop"
  | "hangs_knight"
  | "hangs_pawn"
  | "moves_into_fork"
  | "ignores_check_threat"
  | "trades_down_losing"
  | "back_rank_weak"
  | "king_exposed"
  | "missed_checkmate";

export interface RecurringError {
  patternId: ErrorPatternId;
  count: number;
  exampleFENs: string[];  // up to 3
  lastSeenMove: number;
}

export interface LearnerModel {
  version: 1;
  playerId: string;
  conceptsIntroduced: ConceptMastery[];
  recurringErrors: RecurringError[];
  recentCoachMessages: string[];  // last 2
  currentSession: {
    gameId: string;
    moveCount: number;
    startedAt: number;
  };
  stats: {
    gamesPlayed: number;
    totalMoves: number;
    tacticsSpotted: number;
  };
}

export interface LearnerSignal {
  type: "correct_application" | "missed_opportunity" | "error_committed";
  conceptId: ConceptId;
  errorPatternId?: ErrorPatternId;
  fen?: string;
  moveNumber: number;
}
