import type { LearnerModel, ConceptId, ErrorPatternId } from "@/lib/learner/types";

const CONCEPT_LABELS: Partial<Record<string, string>> = {
  fork: "knows about the Fork (attacking two pieces at once)",
  pin: "knows about the Pin (freezing a piece on a line)",
  skewer: "knows about the Skewer (forcing the big piece to move)",
  discovered_attack: "knows about the Discovered Attack (revealing a hidden attacker)",
  double_check: "knows about the Double Check (two checkers at once)",
  back_rank_mate: "knows about Back Rank Mate (sneaking a rook or queen behind the pawns)",
  sacrifice: "knows about Sacrifices (giving up material to win bigger)",
  deflection: "knows about Deflection (pulling a piece out of position)",
  overloading: "knows about Overloading (making a piece defend too much)",
  zwischenzug: "knows about Zwischenzug (an in-between move)",
  hanging_piece: "knows to check for hanging pieces (undefended pieces)",
  defending: "is learning how to defend pieces under attack",
  trading: "understands piece trading and when it's good",
  development: "knows about developing pieces early",
  king_safety: "understands king safety and when to castle",
  center_control: "knows about controlling the center",
  material_count: "can count material to know who's ahead",
  checkmate_pattern: "recognizes common checkmate patterns",
};

const ERROR_LABELS: Partial<Record<string, string>> = {
  hangs_queen: "sometimes leaves the queen unprotected",
  hangs_rook: "sometimes leaves a rook unprotected",
  hangs_bishop: "sometimes leaves a bishop unprotected",
  hangs_knight: "sometimes leaves a knight unprotected",
  hangs_pawn: "sometimes leaves pawns unprotected",
  moves_into_fork: "sometimes moves into a fork",
  ignores_check_threat: "sometimes misses when the king is threatened",
  trades_down_losing: "sometimes makes unfavorable trades",
  back_rank_weak: "sometimes leaves the back rank weak",
  king_exposed: "sometimes leaves the king in open positions",
  missed_checkmate: "sometimes misses checkmate opportunities",
};

export function conceptToPlainText(conceptId: ConceptId): string {
  return CONCEPT_LABELS[conceptId] ?? `is learning ${String(conceptId).replace(/_/g, " ")}`;
}

export function errorPatternToPlainText(patternId: ErrorPatternId): string {
  return ERROR_LABELS[patternId] ?? `has a pattern with ${String(patternId).replace(/_/g, " ")}`;
}

export interface MemoryDisplayItem {
  id: string;
  text: string;
  type: "mastered" | "learning" | "struggling" | "error";
  canForget: boolean;
  conceptId?: ConceptId;
  errorPatternId?: ErrorPatternId;
}

export function modelToDisplayItems(model: LearnerModel): MemoryDisplayItem[] {
  const items: MemoryDisplayItem[] = [];

  for (const c of model.conceptsIntroduced) {
    const type: MemoryDisplayItem["type"] =
      c.score >= 0.8 ? "mastered" :
      c.score >= 0.4 ? "learning" :
      "struggling";

    items.push({
      id: `concept_${c.conceptId}`,
      text: conceptToPlainText(c.conceptId),
      type,
      canForget: true,
      conceptId: c.conceptId,
    });
  }

  for (const e of model.recurringErrors) {
    items.push({
      id: `error_${e.patternId}`,
      text: errorPatternToPlainText(e.patternId),
      type: "error",
      canForget: true,
      errorPatternId: e.patternId,
    });
  }

  return items;
}

export function getMemoryStats(model: LearnerModel): { gamesPlayed: number; tacticsSpotted: number; masteredCount: number } {
  const mastered = model.conceptsIntroduced.filter((c) => c.score >= 0.8).length;
  return {
    gamesPlayed: model.stats.gamesPlayed,
    tacticsSpotted: model.stats.tacticsSpotted,
    masteredCount: mastered,
  };
}
