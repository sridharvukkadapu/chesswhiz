import { Chess } from "chess.js";
import { evaluate } from "./evaluation";
import { getLegalMoves, applyMove } from "./engine";
import type { Move, Difficulty } from "./types";

function minimax(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  const moves = getLegalMoves(chess);
  if (depth === 0 || moves.length === 0) {
    if (moves.length === 0) {
      if (chess.isCheckmate()) return maximizing ? -99999 : 99999;
      return 0; // stalemate
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

export function findBestMove(chess: Chess, difficulty: Difficulty): Move | null {
  const moves = getLegalMoves(chess);
  if (moves.length === 0) return null;

  if (difficulty === 1) {
    const captures = moves.filter((m) => {
      const clone = new Chess(chess.fen());
      const result = clone.move({ from: m.from, to: m.to });
      return result?.captured != null;
    });
    if (captures.length > 0 && Math.random() < 0.4) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth = difficulty === 2 ? 2 : 3;
  const isMax = chess.turn() === "w";
  let bestScore = isMax ? -Infinity : Infinity;
  let bestMoves: Move[] = [];

  for (const move of moves) {
    const score = minimax(applyMove(chess, move), depth - 1, -Infinity, Infinity, !isMax);
    if ((isMax && score > bestScore) || (!isMax && score < bestScore)) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  if (difficulty === 2 && Math.random() < 0.15) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
