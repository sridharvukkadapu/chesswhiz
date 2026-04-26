import type { BoardAnnotation } from "@/lib/chess/types";
import type { TacticDetection } from "@/lib/progression/types";
import type { Move } from "@/lib/chess/types";
import type { MoveAnalysis } from "@/lib/chess/types";

const CENTER_SQUARES = new Set(["d4", "d5", "e4", "e5"]);

/**
 * Map a coaching moment to a board annotation. Returns null if there's
 * nothing visually meaningful to show — not every coach message needs
 * an overlay (the board's lastMove highlight already shows the move).
 */
export function generateAnnotation(
  analysis: MoveAnalysis,
  tactics: TacticDetection[],
  move: Move
): BoardAnnotation | null {
  // Tactics first — they're the highest-information annotations.

  const fork = tactics.find((t) => t.type === "fork" && t.detected);
  if (fork && fork.attackerSquare && fork.targetSquares?.length) {
    return {
      arrows: fork.targetSquares.map((sq) => ({
        from: fork.attackerSquare!,
        to: sq,
        color: "green" as const,
      })),
      circles: [{ square: fork.attackerSquare, color: "green" as const }],
      duration: 6000,
    };
  }

  const pin = tactics.find((t) => t.type === "pin" && t.detected);
  if (pin && pin.attackerSquare && pin.pinnedSquare) {
    const arrows: BoardAnnotation["arrows"] = [
      { from: pin.attackerSquare, to: pin.pinnedSquare, color: "blue" },
    ];
    if (pin.behindSquare) {
      arrows.push({
        from: pin.pinnedSquare,
        to: pin.behindSquare,
        color: "blue",
        opacity: 0.3,
      });
    }
    return {
      arrows,
      circles: [{ square: pin.pinnedSquare, color: "red" }],
      duration: 6000,
    };
  }

  const skewer = tactics.find((t) => t.type === "skewer" && t.detected);
  if (skewer && skewer.attackerSquare && skewer.frontSquare) {
    const arrows: BoardAnnotation["arrows"] = [
      { from: skewer.attackerSquare, to: skewer.frontSquare, color: "red" },
    ];
    if (skewer.backSquare) {
      arrows.push({
        from: skewer.frontSquare,
        to: skewer.backSquare,
        color: "red",
        opacity: 0.3,
      });
    }
    return {
      arrows,
      duration: 6000,
    };
  }

  // Blunder: red circle on the bad square. (We don't draw a green arrow
  // for the better move because the system prompt forbids naming
  // specific moves to the kid — showing the move would contradict that.)
  if (analysis.trigger === "BLUNDER") {
    return {
      circles: [{ square: move.to, color: "red" }],
      duration: 5000,
    };
  }

  // Center-control praise on classical opening pushes.
  if (
    analysis.trigger === "GREAT_MOVE" &&
    CENTER_SQUARES.has(move.to)
  ) {
    return {
      highlights: Array.from(CENTER_SQUARES).map((sq) => ({
        square: sq,
        color: "green" as const,
        opacity: 0.2,
      })),
      circles: [{ square: move.to, color: "green" as const }],
      duration: 4000,
    };
  }

  // Hanging piece warning.
  if (analysis.isHanging) {
    return {
      circles: [{ square: move.to, color: "red" }],
      duration: 4000,
    };
  }

  // No annotation for routine moves — clean board, no clutter.
  return null;
}
