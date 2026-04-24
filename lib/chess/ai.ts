import { Chess } from "chess.js";
import { evaluate } from "./evaluation";
import { getLegalMoves, applyMove } from "./engine";
import type { Move, Difficulty } from "./types";
import type { TacticType } from "@/lib/progression/types";
import { tacticOpportunityBonus } from "@/lib/progression/bot-tuning";

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

// Yields to the browser event loop between root-level move evaluations,
// keeping the UI responsive while the bot calculates.
// When `tacticPreference` is provided, the bot gets a soft (20-50cp) bonus
// for moves that leave positions where the player could execute that tactic.
// This creates teaching moments without making the bot play badly.
export async function findBestMove(
  chess: Chess,
  difficulty: Difficulty,
  tacticPreference?: TacticType
): Promise<Move | null> {
  const moves = getLegalMoves(chess);
  if (moves.length === 0) return null;

  if (difficulty === 1) {
    // Easy: mostly random, occasionally captures
    await yieldToBrowser();
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
    // Yield between each root move so the browser stays responsive
    await yieldToBrowser();
    const afterBot = applyMove(chess, move);
    let score = minimax(afterBot, depth - 1, -Infinity, Infinity, !isMax);

    // Soft tactic-opportunity bonus for missions. The student (the other
    // side) should get tactic-friendly setups. Scores are from white's POV
    // (higher=better for white); bot is typically black (minimizer). We
    // nudge the bot to PICK tactic-friendly moves by making those moves
    // look slightly better for it (lower score when bot is minimizer,
    // higher when bot is maximizer). 20-50cp is subtle enough that the bot
    // still plays real chess.
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
    return moves[Math.floor(Math.random() * moves.length)];
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? null;
}

// Use scheduler.yield() when available (Chrome 115+), fall back to setTimeout(0)
function yieldToBrowser(): Promise<void> {
  if (typeof (globalThis as any).scheduler?.yield === "function") {
    return (globalThis as any).scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}
