import type { PlayerProgression } from "./types";
import type { Difficulty } from "@/lib/chess/types";

export function computeDifficulty(prog: PlayerProgression): Difficulty {
  const results = prog.recentResults;

  // Count trailing wins and losses
  let trailingWins = 0;
  let trailingLosses = 0;

  for (let i = results.length - 1; i >= 0; i--) {
    if (results[i] === "win") {
      if (trailingLosses > 0) break;
      trailingWins++;
    } else if (results[i] === "loss") {
      if (trailingWins > 0) break;
      trailingLosses++;
    } else {
      break; // draw resets the streak
    }
  }

  // Determine base difficulty from overall history
  const wins = results.filter((r) => r === "win").length;
  const total = results.length;
  const winRate = total > 0 ? wins / total : 0;

  let base: Difficulty = 1;
  if (total >= 3 && winRate >= 0.65) base = 2;
  if (total >= 6 && winRate >= 0.75) base = 3;

  // Apply streak adjustments — only bump up if winRate hasn't already done so
  if (trailingWins >= 3 && base < 2) base = Math.min(3, base + 1) as Difficulty;
  if (trailingLosses >= 2) base = Math.max(1, base - 1) as Difficulty;

  // Apply parent bias
  if (prog.challengeBias === "sharp") base = Math.min(3, base + 1) as Difficulty;
  if (prog.challengeBias === "relaxed") base = Math.max(1, base - 1) as Difficulty;

  return base;
}

export function recordResult(
  prog: PlayerProgression,
  result: "win" | "loss" | "draw"
): PlayerProgression {
  const updated = [...prog.recentResults, result].slice(-10);
  return { ...prog, recentResults: updated };
}
