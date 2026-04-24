import { Chess } from "chess.js";
import { evaluate } from "@/lib/chess/evaluation";
import { getLegalMoves, moveToSAN } from "@/lib/chess/engine";
import type { Move, MoveAnalysis, TriggerType, PieceType } from "@/lib/chess/types";


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
  // 1-ply reference: pick the move that yields the best eval for the side to move
  let bestEval = -Infinity;
  let bestSAN = "";
  for (const m of prev.moves({ verbose: true })) {
    const clone = new Chess(prev.fen());
    clone.move(m);
    const s = evaluate(clone);
    if (s > bestEval) { bestEval = s; bestSAN = m.san; }
  }
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
