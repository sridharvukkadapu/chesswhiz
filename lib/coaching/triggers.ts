import type { MoveAnalysis } from "@/lib/chess/types";
import type { LearnerModel } from "@/lib/learner/types";

export function shouldCoach(
  analysis: MoveAnalysis,
  moveCountOrModel: number | LearnerModel,
  lastCoachMove?: number
): boolean {
  // New signature: (analysis, learnerModel)
  // Legacy signature: (analysis, moveCount, lastCoachMove)
  let moveCount: number;
  let movesSinceCoach: number;

  if (typeof moveCountOrModel === "object") {
    moveCount = moveCountOrModel.currentSession.moveCount;
    // Use recentCoachMessages length as a proxy — if we have 2+ recent messages,
    // we've been coaching recently. Real cooldown tracked by store.lastCoachMove.
    // When called with LearnerModel we don't have lastCoachMove, so use moveCount.
    movesSinceCoach = moveCount; // conservative — will always be >= 0
  } else {
    moveCount = moveCountOrModel;
    movesSinceCoach = moveCount - (lastCoachMove ?? -3);
  }

  // Always coach on serious mistakes — no cooldown
  if (analysis.severity >= 3) return true;

  // Cooldown: at least 2 player moves between coaching messages
  if (movesSinceCoach < 2) return false;

  // Opening (moves 1–6): quieter — only great moves and mistakes
  if (moveCount <= 6) {
    if (analysis.severity === 0) return Math.random() < 0.40; // great move praise
    if (analysis.severity === 1) return Math.random() < 0.25; // light acknowledgment
    if (analysis.severity === 2) return Math.random() < 0.60; // inaccuracy worth noting
    return true; // mistake/blunder always
  }

  // Mid/late game: comment often enough to feel like a real coach
  if (analysis.severity === 0) return Math.random() < 0.45;  // great move
  if (analysis.severity === 1) return Math.random() < 0.35;  // solid move, keep going
  if (analysis.severity === 2) return Math.random() < 0.70;  // inaccuracy
  return true; // mistake/blunder always
}
