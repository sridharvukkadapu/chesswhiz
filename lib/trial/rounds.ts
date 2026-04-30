// lib/trial/rounds.ts
import type { TrialAnswer, TrialRoundId, PieceKind } from "./types";

// ── Round 1: Board Knowledge ──────────────────────────────────
export const BOARD_SQUARES = ["e4", "d4", "a1", "h8", "c6", "f3", "b5", "g7"] as const;
export type BoardSquare = typeof BOARD_SQUARES[number];

// Pick 5 random squares from the bank (deterministic order for now, can shuffle at runtime)
export const ROUND1_QUESTIONS: Array<{ target: BoardSquare }> = [
  { target: "e4" },
  { target: "a1" },
  { target: "h8" },
  { target: "f3" },
  { target: "b5" },
];
// Color question: f1 is a light square (rank 1, file f = index 5; (5+1) % 2 = 0 → light)
export const ROUND1_COLOR_QUESTION = { square: "f1", color: "light" as const };

// ── Round 2: Piece Movement ───────────────────────────────────
export const ROUND2_PIECE_ORDER: PieceKind[] = [
  "rook", "bishop", "queen", "king", "knight", "pawn",
];

// FEN-like board config per piece: { fen, piece, color, expectedSquares }
// Pieces placed at mid-board for a good move set
export interface PieceQuestion {
  pieceKind: PieceKind;
  placedOn: string;             // e.g. "d4"
  color: "white" | "black";
  expectedSquares: string[];    // all squares this piece can reach from placedOn
  extraPieces?: Array<{ square: string; color: "white" | "black"; kind: PieceKind }>;
}

export const ROUND2_PIECE_QUESTIONS: Record<PieceKind, PieceQuestion> = {
  rook: {
    pieceKind: "rook",
    placedOn: "d4",
    color: "white",
    expectedSquares: [
      "a4","b4","c4","e4","f4","g4","h4",
      "d1","d2","d3","d5","d6","d7","d8",
    ],
  },
  bishop: {
    pieceKind: "bishop",
    placedOn: "d4",
    color: "white",
    expectedSquares: [
      "a1","b2","c3","e5","f6","g7","h8",
      "a7","b6","c5","e3","f2","g1",
    ],
  },
  queen: {
    pieceKind: "queen",
    placedOn: "d4",
    color: "white",
    expectedSquares: [
      // rook moves
      "a4","b4","c4","e4","f4","g4","h4",
      "d1","d2","d3","d5","d6","d7","d8",
      // bishop moves
      "a1","b2","c3","e5","f6","g7","h8",
      "a7","b6","c5","e3","f2","g1",
    ],
  },
  king: {
    pieceKind: "king",
    placedOn: "d4",
    color: "white",
    expectedSquares: ["c3","d3","e3","c4","e4","c5","d5","e5"],
  },
  knight: {
    pieceKind: "knight",
    placedOn: "d4",
    color: "white",
    expectedSquares: ["b3","b5","c2","c6","e2","e6","f3","f5"],
  },
  pawn: {
    pieceKind: "pawn",
    placedOn: "e2",
    color: "white",
    // opponent pawn on d3 → test diagonal capture
    extraPieces: [{ square: "d3", color: "black", kind: "pawn" }],
    expectedSquares: ["e3", "e4", "d3"],
  },
};

// ── Round 3: Check & Checkmate ────────────────────────────────
export interface CheckQuestion {
  type: "check-detection";
  fen: string;
  isInCheck: boolean;
}
export interface MateQuestion {
  type: "checkmate-in-1";
  fen: string;
  correctMove: { from: string; to: string };
}
export type Round3Question = CheckQuestion | MateQuestion;

export const ROUND3_QUESTIONS: Round3Question[] = [
  // Check detection: white king on e1, black rook on e8 (open file → check)
  {
    type: "check-detection",
    fen: "4r3/8/8/8/8/8/8/4K3 w - - 0 1",
    isInCheck: true,
  },
  // Check detection: white king on e1, black rook on a8 (no check)
  {
    type: "check-detection",
    fen: "r7/8/8/8/8/8/8/4K3 w - - 0 1",
    isInCheck: false,
  },
  // Checkmate-in-1: Q+K box mate (queen delivers mate)
  {
    type: "checkmate-in-1",
    fen: "7k/8/6KQ/8/8/8/8/8 w - - 0 1",
    correctMove: { from: "h6", to: "h7" },
  },
  // Checkmate-in-1: R+K back-rank mate
  {
    type: "checkmate-in-1",
    fen: "7k/8/6K1/8/8/8/8/7R w - - 0 1",
    correctMove: { from: "h1", to: "h8" },
  },
];

// ── Round 4: Tactics ──────────────────────────────────────────
export interface TacticQuestion {
  tacticId: string;
  fen: string;
  correctMove: { from: string; to: string };
  correctPiece: string;  // the square of the piece to tap first
}

export const ROUND4_TACTIC_QUESTIONS: TacticQuestion[] = [
  // Fork: knight on c3 forks king on e4 and rook on a4
  {
    tacticId: "fork",
    fen: "8/8/8/8/r3k3/2N5/8/4K3 w - - 0 1",
    correctMove: { from: "c3", to: "b5" },
    correctPiece: "c3",
  },
  // Pin: bishop on b2 pins knight on d4 to king on f6
  {
    tacticId: "pin",
    fen: "8/8/5k2/8/3n4/8/1B6/4K3 w - - 0 1",
    correctMove: { from: "b2", to: "d4" },
    correctPiece: "b2",
  },
  // Skewer: rook on a1 skewers king on a8, rook on a6 behind
  {
    tacticId: "skewer",
    fen: "k7/8/r7/8/8/8/8/R3K3 w - - 0 1",
    correctMove: { from: "a1", to: "a8" },
    correctPiece: "a1",
  },
  // Discovered attack: white bishop on c1 is blocked; moving d2 pawn reveals it
  {
    tacticId: "discovered_attack",
    fen: "4k3/8/8/8/8/8/3P4/2B1K3 w - - 0 1",
    correctMove: { from: "d2", to: "d4" },
    correctPiece: "d2",
  },
];

// ── Round 5: Strategy ─────────────────────────────────────────
export interface StrategyQuestion {
  fen: string;
  bestMove: { from: string; to: string };
  mediocreMove: { from: string; to: string };
  badMove: { from: string; to: string };
  theme: string;
}

export const ROUND5_STRATEGY_QUESTIONS: StrategyQuestion[] = [
  // Open file: white rook should go to d1 (open d-file), not a1, not h1
  {
    fen: "r1bqkb1r/ppp2ppp/2np1n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQR1K1 w kq - 0 1",
    theme: "open-file",
    bestMove: { from: "e1", to: "e3" },     // rook to open e-file
    mediocreMove: { from: "d1", to: "d2" }, // queen development (fine but not the plan)
    badMove: { from: "c4", to: "f7" },      // premature bishop sac
  },
  // Active vs passive: knight should go to f5 (outpost), not retreat to d3
  {
    fen: "r2q1rk1/ppp1bppp/2np1n2/4p3/2B1P3/2NP1N2/PPP2PPP/R1BQK2R w KQ - 0 1",
    theme: "active-piece",
    bestMove: { from: "c3", to: "d5" },     // knight to strong outpost
    mediocreMove: { from: "f3", to: "d2" }, // passive retreat
    badMove: { from: "c4", to: "b3" },      // bishop retreat for no reason
  },
  // Pawn structure: avoid doubled pawns by recapturing with pawn, not bishop
  {
    fen: "r1bqk2r/pppp1ppp/2n2n2/4p3/1bB1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1",
    theme: "pawn-structure",
    bestMove: { from: "c3", to: "b4" },     // recapture with knight (keeps structure)
    mediocreMove: { from: "d2", to: "b4" }, // pawn recapture (creates doubled pawns)
    badMove: { from: "c4", to: "b5" },      // random bishop move
  },
];

// ── Adaptive short-circuit ────────────────────────────────────
export function getNextRound(
  currentRound: TrialRoundId,
  answers: TrialAnswer[]
): TrialRoundId | null {
  const roundAnswers = answers.filter((a) => a.roundId === currentRound);

  if (currentRound === 1) {
    const weighted = roundAnswers.reduce(
      (sum, a) => sum + (a.correct ? (a.confident === false ? 0.5 : 1) : 0),
      0
    );
    if (weighted < 4) return null; // fail → stop, place at Stage 1
    return 2;
  }

  if (currentRound === 2) {
    const failCount = roundAnswers.filter((a) => !a.correct).length;
    if (failCount > 0) return null; // any failure → stop, place at Stage 2
    return 3;
  }

  if (currentRound === 3) {
    const correct = roundAnswers.filter((a) => a.correct).length;
    if (correct < 3) return null; // fail → stop, place at Stage 3
    return 4;
  }

  if (currentRound === 4) {
    const correct = roundAnswers.filter((a) => a.correct).length;
    if (correct < 3) return null; // partial or full fail → stop, place at Stage 4
    return 5;
  }

  // Round 5 is always last
  return null;
}
