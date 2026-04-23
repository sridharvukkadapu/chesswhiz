import type { MoveAnalysis } from "@/lib/chess/types";

export function shouldCoach(
  analysis: MoveAnalysis,
  moveCount: number,
  lastCoachMove: number
): boolean {
  if (!analysis) return false;

  const movesSinceCoach = moveCount - lastCoachMove;

  // Always coach on serious mistakes
  if (analysis.severity >= 3) return true;

  // Cooldown: skip coaching if fewer than 3 moves since last coaching (for non-critical moves)
  if (movesSinceCoach < 3) return false;

  // Praise great moves sometimes
  if (analysis.severity === 0 && Math.random() < 0.35) return true;

  // Note inaccuracies occasionally
  if (analysis.severity === 2 && Math.random() < 0.25) return true;

  // Always coach first 2 player moves (opening guidance)
  if (moveCount <= 2 && analysis.severity <= 1) return true;

  return false;
}
