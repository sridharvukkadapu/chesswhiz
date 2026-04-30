import type { MoveAnalysis } from "@/lib/chess/types";
import type { LearnerModel } from "@/lib/learner/types";

export function shouldCoach(
  analysis: MoveAnalysis,
  moveCountOrModel: number | LearnerModel,
  lastCoachMove?: number
): boolean {
  let moveCount: number;
  let movesSinceCoach: number;

  if (typeof moveCountOrModel === "object") {
    moveCount = moveCountOrModel.currentSession.moveCount;
    movesSinceCoach = moveCount;
  } else {
    moveCount = moveCountOrModel;
    movesSinceCoach = moveCount - (lastCoachMove ?? -3);
  }

  // Always coach on serious mistakes — no cooldown
  if (analysis.severity >= 3) return true;

  // TACTIC_AVAILABLE: highest-value teaching moments — 1-move cooldown only
  if ((analysis.trigger as string) === "TACTIC_AVAILABLE") {
    return movesSinceCoach >= 1;
  }

  // Standard cooldown: at least 2 player moves between coaching messages
  if (movesSinceCoach < 2) return false;

  // Opening (moves 1–6): quieter
  if (moveCount <= 6) {
    if (analysis.severity === 0) return Math.random() < 0.40;
    if (analysis.severity === 1) return Math.random() < 0.25;
    if (analysis.severity === 2) return Math.random() < 0.60;
    return true;
  }

  // Mid/late game
  if (analysis.severity === 0) return Math.random() < 0.45;
  if (analysis.severity === 1) return Math.random() < 0.35;
  if (analysis.severity === 2) return Math.random() < 0.70;
  return true;
}
