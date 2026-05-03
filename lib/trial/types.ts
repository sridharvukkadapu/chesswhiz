// lib/trial/types.ts
import type { KingdomId } from "@/lib/progression/types";

export type LearningStage = 1 | 2 | 3 | 4 | 5;

// Piece kinds used in Trial — separate from chess.js PieceType ("p"|"n"|etc)
export type PieceKind = "rook" | "bishop" | "queen" | "king" | "knight" | "pawn";

export type TrialRoundId = 1 | 2 | 3 | 4 | 5;

// One recorded answer per question within The Trial
export interface TrialAnswer {
  roundId: TrialRoundId;
  questionIndex: number;    // 0-based within the round
  correct: boolean;
  confident: boolean | null;  // null = user skipped the toggle (auto-skipped)
  responseTimeMs: number;     // wall-clock ms from question shown to answer submitted
  pieceKind?: PieceKind;      // Round 2 only
  tacticId?: string;          // Round 4 only
  missType?: "execution" | "blind"; // Round 4, wrong answers only
}

// Final output of placeTrial()
export interface TrialResult {
  learningStage: LearningStage;   // 1–5 (never 6 — The Trial cannot verify endgame technique)
  kingdomId: KingdomId;
  advancedPlayer: boolean;        // true if Round 5 perfect — accelerates Stage 5 pacing
  strengthsAndGaps: StrengthsAndGaps;
}

export interface StrengthsAndGaps {
  boardKnowledge: SkillLevel;
  pieceMovement: Record<PieceKind, SkillLevel>;
  checkUnderstanding: SkillLevel;
  tacticsKnown: string[];
  tacticsMissed: Array<{ id: string; missType: "execution" | "blind" }>;
}

export type SkillLevel = "strong" | "weak" | "untested";
