import { Chess } from "chess.js";
import { evaluate } from "@/lib/chess/evaluation";
import { getLegalMoves, moveToSAN } from "@/lib/chess/engine";
import type { Move, MoveAnalysis, TriggerType, PieceType } from "@/lib/chess/types";

// Synchronous fast evaluation: compare player move eval vs best static eval.
// We avoid running a full minimax here — too slow on the main thread.
// Instead we do a 1-ply quiescence: find the best single-move response for the
// opponent and use that as the reference score.
function fastBestEval(prev: Chess): number {
  const moves = prev.moves({ verbose: true });
  if (moves.length === 0) return evaluate(prev);
  let best = -Infinity;
  for (const m of moves) {
    const next = new Chess(prev.fen());
    next.move(m);
    const s = evaluate(next);
    if (s > best) best = s;
  }
  return best;
}

export function analyzeMoveQuality(
  prev: Chess,
  next: Chess,
  move: Move
): MoveAnalysis | null {
  const prevBoard = prev.board();
  const piece = prevBoard[8 - parseInt(move.from[1])][move.from.charCodeAt(0) - 97];
  if (!piece) return null;

  const capturedSquare = prevBoard[8 - parseInt(move.to[1])][move.to.charCodeAt(0) - 97];

  const newEval = evaluate(next);
  // Use fast 1-ply reference instead of full depth-2 minimax
  const bestEval = fastBestEval(prev);
  const bestSAN = "";
  const san = moveToSAN(prev, move);

  const diff = Math.abs(bestEval - newEval);

  let trigger: TriggerType;
  let severity: 0 | 1 | 2 | 3 | 4;
  if (diff < 30) { trigger = "GREAT_MOVE"; severity = 0; }
  else if (diff < 80) { trigger = "OK_MOVE"; severity = 1; }
  else if (diff < 200) { trigger = "INACCURACY"; severity = 2; }
  else if (diff < 400) { trigger = "MISTAKE"; severity = 3; }
  else { trigger = "BLUNDER"; severity = 4; }

  // Check if the moved piece is now attackable by the opponent
  const oppMoves = getLegalMoves(next);
  const isHanging = oppMoves.some((m) => m.to === move.to);

  return {
    trigger,
    severity,
    san,
    bestSAN,
    diff,
    piece: piece.type as PieceType,
    captured: capturedSquare ? (capturedSquare.type as PieceType) : null,
    isHanging,
    eval: newEval,
  };
}
