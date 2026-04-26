import type { MoveAnalysis } from "@/lib/chess/types";

export function shouldCoach(
  analysis: MoveAnalysis,
  moveCount: number,
  lastCoachMove: number
): boolean {
  const movesSinceCoach = moveCount - lastCoachMove;

  // Always coach on serious mistakes
  if (analysis.severity >= 3) return true;

  // Cooldown: skip coaching if fewer than 3 moves since last coaching (for non-critical moves)
  if (movesSinceCoach < 3) return false;

  // Opening (moves 1–6): much quieter cadence. Praise for great opening
  // moves only ~15% of the time — opening pushes are repetitive and
  // don't need commentary on every move.
  if (moveCount <= 6 && analysis.severity === 0) {
    return Math.random() < 0.15;
  }

  // Praise great moves sometimes
  if (analysis.severity === 0 && Math.random() < 0.35) return true;

  // Note inaccuracies occasionally
  if (analysis.severity === 2 && Math.random() < 0.25) return true;

  // Very first move: one quick welcome acknowledgment is fine.
  if (moveCount <= 2 && analysis.severity === 1) return true;

  return false;
}
