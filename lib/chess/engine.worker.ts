// Web Worker: runs minimax off the main thread so the UI never freezes.
// Receives a FindMoveRequest, posts back a FindMoveResponse.

import { Chess } from "chess.js";
import { evaluate } from "./evaluation";
import { getLegalMoves, applyMove } from "./engine";
import { tacticOpportunityBonus } from "@/lib/progression/bot-tuning";
import type { Move, Difficulty } from "./types";
import type { TacticType } from "@/lib/progression/types";

export interface FindMoveRequest {
  fen: string;
  difficulty: Difficulty;
  tacticPreference?: TacticType;
  historyLength: number;
}

export interface FindMoveResponse {
  move: Move | null;
}

// Opening book (same as ai.ts — duplicated here so the worker is self-contained)
function fenKey(chess: Chess): string {
  return chess.fen().split(" ").slice(0, 4).join(" ");
}

const BOOK: Record<string, string[]> = {
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -": ["e5", "e5", "e5", "c5", "e6"],
  "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq -": ["d5", "d5", "Nf6", "Nf6"],
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq -": ["Nc6", "Nc6", "Nf6", "d6"],
  "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq -": ["d6", "Nc6", "e6"],
  "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": ["c4", "Nf3", "c4"],
  "rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": ["c4", "Nf3"],
  "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq -": ["Bc4", "Bb5", "d4"],
};

function lookupBook(chess: Chess): Move | null {
  const key = fenKey(chess);
  const options = BOOK[key];
  if (!options || options.length === 0) return null;
  const san = options[Math.floor(Math.random() * options.length)];
  try {
    const clone = new Chess(chess.fen());
    const result = clone.move(san);
    if (!result) return null;
    return { from: result.from, to: result.to, promotion: result.promotion as Move["promotion"] };
  } catch {
    return null;
  }
}

function minimax(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  const moves = getLegalMoves(chess);
  if (depth === 0 || moves.length === 0) {
    if (moves.length === 0) {
      if (chess.isCheckmate()) return maximizing ? -99999 : 99999;
      return 0;
    }
    return evaluate(chess);
  }
  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      best = Math.max(best, minimax(applyMove(chess, move), depth - 1, alpha, beta, false));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      best = Math.min(best, minimax(applyMove(chess, move), depth - 1, alpha, beta, true));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

self.onmessage = (e: MessageEvent<FindMoveRequest>) => {
  const { fen, difficulty, tacticPreference, historyLength } = e.data;
  const chess = new Chess(fen);
  const moves = getLegalMoves(chess);

  if (moves.length === 0) {
    self.postMessage({ move: null } satisfies FindMoveResponse);
    return;
  }

  // Opening book for medium/hard
  if (difficulty >= 2 && historyLength < 6) {
    const bookMove = lookupBook(chess);
    if (bookMove) {
      self.postMessage({ move: bookMove } satisfies FindMoveResponse);
      return;
    }
  }

  if (difficulty === 1) {
    const captures = moves.filter((m) => {
      const clone = new Chess(chess.fen());
      return clone.move({ from: m.from, to: m.to })?.captured != null;
    });
    const pick =
      captures.length > 0 && Math.random() < 0.4
        ? captures[Math.floor(Math.random() * captures.length)]
        : moves[Math.floor(Math.random() * moves.length)];
    self.postMessage({ move: pick } satisfies FindMoveResponse);
    return;
  }

  const depth = difficulty === 2 ? 2 : 3;
  const isMax = chess.turn() === "w";
  let bestScore = isMax ? -Infinity : Infinity;
  let bestMoves: Move[] = [];

  for (const move of moves) {
    const afterBot = applyMove(chess, move);
    let score = minimax(afterBot, depth - 1, -Infinity, Infinity, !isMax);
    if (tacticPreference) {
      const bonus = tacticOpportunityBonus(afterBot, tacticPreference);
      score = isMax ? score + bonus : score - bonus;
    }
    if ((isMax && score > bestScore) || (!isMax && score < bestScore)) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  if (difficulty === 2 && Math.random() < 0.15) {
    self.postMessage({ move: moves[Math.floor(Math.random() * moves.length)] } satisfies FindMoveResponse);
    return;
  }

  const result = bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? null;
  self.postMessage({ move: result } satisfies FindMoveResponse);
};
