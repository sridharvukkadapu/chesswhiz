import type { MoveAnalysis } from "@/lib/chess/types";

export function shouldCoach(
  analysis: MoveAnalysis,
  moveCount: number,
  lastCoachMove: number
): boolean {
  const movesSinceCoach = moveCount - lastCoachMove;

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
