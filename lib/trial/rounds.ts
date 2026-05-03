// lib/trial/rounds.ts
import type { TrialAnswer, TrialRoundId, PieceKind } from "./types";

// ── Round 1: Piece Recognition ────────────────────────────────
// Starting position FEN — kid sees a real chess board, not an empty grid.
export const ROUND1_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// Each question: "tap the [piece]" — tests can the kid identify pieces visually.
// We ask about white pieces so the squares are deterministic and unambiguous.
export interface PieceRecognitionQuestion {
  pieceKind: PieceKind;
  // All squares on the board that count as correct (there may be two knights, etc.)
  correctSquares: string[];
  // Voice prompt
  voice: string;
  displayLabel: string;
}

export const ROUND1_QUESTIONS: PieceRecognitionQuestion[] = [
  {
    pieceKind: "knight",
    correctSquares: ["b1", "g1"],
    voice: "Tap one of the white knights!",
    displayLabel: "Tap a White Knight",
  },
  {
    pieceKind: "queen",
    correctSquares: ["d1"],
    voice: "Now tap the white queen!",
    displayLabel: "Tap the White Queen",
  },
];

// ── Round 2: Piece Movement ───────────────────────────────────
// Only rook and knight — rook tests sliding piece understanding,
// knight tests the L-shape (hardest to learn, best differentiator).
export const ROUND2_PIECE_ORDER: PieceKind[] = ["rook", "knight"];

export interface PieceQuestion {
  pieceKind: PieceKind;
  placedOn: string;
  color: "white" | "black";
  expectedSquares: string[];
  extraPieces?: Array<{ square: string; color: "white" | "black"; kind: PieceKind }>;
  voice: string;
  displayLabel: string;
}

export const ROUND2_PIECE_QUESTIONS: Record<string, PieceQuestion> = {
  rook: {
    pieceKind: "rook",
    placedOn: "d4",
    color: "white",
    expectedSquares: [
      "a4","b4","c4","e4","f4","g4","h4",
      "d1","d2","d3","d5","d6","d7","d8",
    ],
    voice: "Tap every square the rook can reach!",
    displayLabel: "Where can the Rook go?",
  },
  knight: {
    pieceKind: "knight",
    placedOn: "d4",
    color: "white",
    expectedSquares: ["b3","b5","c2","c6","e2","e6","f3","f5"],
    voice: "Knights jump in an L-shape — tap all the squares it can reach!",
    displayLabel: "Where can the Knight jump?",
  },
};

// ── Round 3: Check & Checkmate ────────────────────────────────
export interface CheckQuestion {
  type: "check-detection";
  fen: string;
  isInCheck: boolean;
  voice: string;
  displayLabel: string;
}
export interface MateQuestion {
  type: "checkmate-in-1";
  fen: string;
  correctMove: { from: string; to: string };
  voice: string;
  displayLabel: string;
}
export type Round3Question = CheckQuestion | MateQuestion;

export const ROUND3_QUESTIONS: Round3Question[] = [
  {
    type: "check-detection",
    // White king on e1, black rook fires down the e-file — king IS in check
    fen: "4r2k/8/8/8/8/8/8/4K3 w - - 0 1",
    isInCheck: true,
    voice: "Is the white king in check right now?",
    displayLabel: "Is the King in check?",
  },
  {
    type: "checkmate-in-1",
    // Q+K ladder mate: Qh7 is checkmate
    fen: "7k/8/6KQ/8/8/8/8/8 w - - 0 1",
    correctMove: { from: "h6", to: "h7" },
    voice: "Move the queen to give checkmate in one move!",
    displayLabel: "Checkmate in 1 — find it!",
  },
];

// ── Round 4: Tactics ──────────────────────────────────────────
export interface TacticQuestion {
  tacticId: string;
  fen: string;
  correctMove: { from: string; to: string };
  correctPiece: string;
  voice: string;
  displayLabel: string;
  hint: string;
}

export const ROUND4_TACTIC_QUESTIONS: TacticQuestion[] = [
  {
    // Royal fork: knight on b5 → Nc7 attacks king on e8 AND rook on a8
    tacticId: "fork",
    fen: "r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1",
    correctMove: { from: "b5", to: "c7" },
    correctPiece: "b5",
    voice: "The knight can attack TWO pieces at once! Find the fork!",
    displayLabel: "Find the Fork!",
    hint: "Move the knight to attack both the king and the rook",
  },
  {
    // Pin: Bishop pins the knight to the king
    tacticId: "pin",
    fen: "8/8/5k2/8/3n4/8/1B6/4K3 w - - 0 1",
    correctMove: { from: "b2", to: "d4" },
    correctPiece: "b2",
    voice: "The bishop can pin a piece to the king! Find it!",
    displayLabel: "Find the Pin!",
    hint: "Attack a piece that can't move because it shields the king",
  },
];

// ── Round 5: Strategy ─────────────────────────────────────────
export interface StrategyQuestion {
  fen: string;
  bestMove: { from: string; to: string };
  mediocreMove: { from: string; to: string };
  badMove: { from: string; to: string };
  theme: string;
  voice: string;
  displayLabel: string;
}

export const ROUND5_STRATEGY_QUESTIONS: StrategyQuestion[] = [
  {
    // Active rook: Rook should take the open e-file
    fen: "r1bqkb1r/ppp2ppp/2np1n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQR1K1 w kq - 0 1",
    theme: "open-file",
    bestMove: { from: "e1", to: "e3" },
    mediocreMove: { from: "d1", to: "d2" },
    badMove: { from: "c4", to: "f7" },
    voice: "Rooks love open files! Which move puts the rook on the best square?",
    displayLabel: "Best plan for the Rook?",
  },
];

// ── Adaptive short-circuit ────────────────────────────────────
// Returns the next round to show, or null to stop and score.
export function getNextRound(
  currentRound: TrialRoundId,
  answers: TrialAnswer[]
): TrialRoundId | null {
  const roundAnswers = answers.filter((a) => a.roundId === currentRound);

  if (currentRound === 1) {
    // Must recognise at least 1 of 2 pieces to continue (very low bar — almost everyone passes)
    const correct = roundAnswers.filter((a) => a.correct).length;
    if (correct === 0) return null; // total blank → Stage 1
    return 2;
  }

  if (currentRound === 2) {
    // Both movement questions; any failure → Stage 2
    const failCount = roundAnswers.filter((a) => !a.correct).length;
    if (failCount > 0) return null;
    return 3;
  }

  if (currentRound === 3) {
    // 2 questions; need both right to advance
    const correct = roundAnswers.filter((a) => a.correct).length;
    if (correct < 2) return null;
    return 4;
  }

  if (currentRound === 4) {
    // 2 tactic questions; need both right to advance to strategy
    const correct = roundAnswers.filter((a) => a.correct).length;
    if (correct < 2) return null;
    return 5;
  }

  // Round 5 is always last
  return null;
}
