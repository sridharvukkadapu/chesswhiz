import type { BoardAnnotation, AnnotationColor } from "@/lib/chess/types";
import type { TacticDetection } from "@/lib/progression/types";
import type { Move } from "@/lib/chess/types";
import type { MoveAnalysis } from "@/lib/chess/types";
import type { Annotation } from "@/lib/coaching/schema";

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
      heroSquare: fork.attackerSquare,
      heroColor: "green",
      arrows: fork.targetSquares.map((sq) => ({
        from: fork.attackerSquare!,
        to: sq,
        color: "green" as const,
      })),
      circles: [{ square: fork.attackerSquare, color: "green" as const }],
      threatSquares: fork.targetSquares,
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
      heroSquare: pin.attackerSquare,
      heroColor: "red",
      arrows,
      circles: [{ square: pin.pinnedSquare, color: "red" }],
      threatSquares: [pin.pinnedSquare],
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
      heroSquare: skewer.attackerSquare,
      heroColor: "red",
      arrows,
      threatSquares: [skewer.frontSquare],
      duration: 6000,
    };
  }

  // Blunder: red circle + danger zone on the bad square.
  if (analysis.trigger === "BLUNDER") {
    return {
      circles: [{ square: move.to, color: "red" }],
      dangerSquares: [move.to],
      duration: 5000,
    };
  }

  // Center-control praise on classical opening pushes.
  if (
    analysis.trigger === "GREAT_MOVE" &&
    CENTER_SQUARES.has(move.to)
  ) {
    return {
      heroSquare: move.to,
      heroColor: "green",
      highlights: Array.from(CENTER_SQUARES).map((sq) => ({
        square: sq,
        color: "green" as const,
        opacity: 0.18,
      })),
      circles: [{ square: move.to, color: "green" as const }],
      influenceSquares: Array.from(CENTER_SQUARES).filter((sq) => sq !== move.to),
      influenceColor: "green",
      duration: 4000,
    };
  }

  // Hanging piece warning — danger zone + red circle.
  if (analysis.isHanging) {
    return {
      circles: [{ square: move.to, color: "red" }],
      dangerSquares: [move.to],
      duration: 4000,
    };
  }

  // Generic praise/critique fallback.
  const generic = (() => {
    if (analysis.trigger === "GREAT_MOVE") return "green" as const;
    if (analysis.trigger === "OK_MOVE") return null;
    if (analysis.trigger === "INACCURACY") return "yellow" as const;
    if (analysis.trigger === "MISTAKE") return "yellow" as const;
    return null;
  })();
  if (generic) {
    return {
      arrows: [{ from: move.from, to: move.to, color: generic, opacity: 0.55 }],
      circles: [{ square: move.to, color: generic }],
      duration: 4500,
    };
  }

  // No annotation for routine moves — clean board, no clutter.
  return null;
}

export function llmAnnotationToBoard(a: Annotation): BoardAnnotation | null {
  const sq = a.squares ?? [];
  const sq2 = a.secondarySquares ?? [];
  if (a.type === "none" || sq.length === 0) return null;

  const colorMap: Record<string, AnnotationColor> = {
    fork_rays: "green",
    pin_line: "blue",
    skewer_line: "red",
    discovered_attack: "red",
    hanging_piece: "red",
    defended_chain: "green",
    attack_arrow: "yellow",
    danger_square: "red",
    highlight_square: "green",
  };
  const color = colorMap[a.type] ?? "yellow";

  switch (a.type) {
    case "fork_rays":
      return {
        heroSquare: sq[0],
        heroColor: "green",
        arrows: sq.slice(1).map((s) => ({ from: sq[0], to: s, color: "green" as const })),
        circles: [{ square: sq[0], color: "green" as const }],
        threatSquares: sq.slice(1),
        duration: 6000,
      };
    case "pin_line":
    case "skewer_line":
      return {
        heroSquare: sq[0],
        heroColor: color,
        arrows: sq.length >= 2
          ? [{ from: sq[0], to: sq[1], color }, ...(sq[2] ? [{ from: sq[1], to: sq[2], color, opacity: 0.3 }] : [])]
          : [],
        circles: sq.length >= 2 ? [{ square: sq[1], color }] : [],
        threatSquares: sq.slice(1, 2),
        duration: 6000,
      };
    case "discovered_attack":
      return {
        arrows: sq.length >= 2 ? [{ from: sq[0], to: sq[1], color: "red" as const }] : [],
        circles: sq.map((s) => ({ square: s, color: "red" as const })),
        threatSquares: sq.slice(1),
        duration: 6000,
      };
    case "hanging_piece":
      return {
        circles: [{ square: sq[0], color: "red" as const }],
        dangerSquares: sq,
        duration: 5000,
      };
    case "defended_chain":
      return {
        circles: sq.map((s) => ({ square: s, color: "green" as const })),
        arrows: sq.length >= 2 ? sq.slice(0, -1).map((s, i) => ({ from: s, to: sq[i + 1], color: "green" as const, opacity: 0.4 })) : [],
        duration: 5000,
      };
    case "attack_arrow":
      return {
        arrows: sq.length >= 2 ? [{ from: sq[0], to: sq[1], color: "yellow" as const }] : [],
        circles: sq2.length > 0 ? sq2.map((s) => ({ square: s, color: "yellow" as const })) : [],
        duration: 5000,
      };
    case "danger_square":
      return {
        dangerSquares: sq,
        circles: sq.map((s) => ({ square: s, color: "red" as const })),
        duration: 5000,
      };
    case "highlight_square":
      return {
        highlights: sq.map((s) => ({ square: s, color: "green" as const, opacity: 0.3 })),
        circles: sq.map((s) => ({ square: s, color: "green" as const })),
        duration: 5000,
      };
    default:
      return null;
  }
}
