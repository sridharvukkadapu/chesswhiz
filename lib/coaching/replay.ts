import { Chess } from "chess.js";
import type { ReplayStep } from "./schema";

export function buildReplaySequence(
  moveHistory: string[],
  triggerIdx: number
): ReplayStep[] {
  if (moveHistory.length === 0) return [];

  const endIdx = Math.min(triggerIdx, moveHistory.length - 1);
  const startIdx = Math.max(0, endIdx - 2);

  const steps: ReplayStep[] = [];

  for (let i = startIdx; i <= endIdx; i++) {
    const chess = new Chess();
    for (let j = 0; j <= i; j++) {
      try { chess.move(moveHistory[j]); } catch { break; }
    }

    const moveNumber = Math.floor(i / 2) + 1;
    const isWhite = i % 2 === 0;
    const moveLabel = `${moveNumber}${isWhite ? "." : "..."} ${moveHistory[i]}`;

    steps.push({
      fen: chess.fen(),
      narration: buildNarration(moveHistory[i], i, endIdx),
      moveLabel,
    });
  }

  return steps;
}

function buildNarration(san: string, idx: number, triggerIdx: number): string {
  const movesAgo = triggerIdx - idx;
  if (movesAgo === 0) return `And then — ${san}. See what just happened?`;
  if (movesAgo === 1) return `One move ago: ${san}.`;
  if (movesAgo === 2) return `Two moves ago: ${san}. This started it.`;
  return san;
}
