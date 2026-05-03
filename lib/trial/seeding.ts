import type { LearnerModel, ConceptId } from "@/lib/learner/types";
import type { TrialResult } from "./types";

const TACTIC_TO_CONCEPT: Record<string, ConceptId> = {
  fork: "fork",
  pin: "pin",
  skewer: "skewer",
  discovered_attack: "discovered_attack",
};

function upsertConcept(
  concepts: LearnerModel["conceptsIntroduced"],
  conceptId: ConceptId,
  score: number,
): LearnerModel["conceptsIntroduced"] {
  const existing = concepts.find((c) => c.conceptId === conceptId);
  if (existing) {
    return concepts.map((c) =>
      c.conceptId === conceptId ? { ...c, score: Math.max(c.score, score) } : c
    );
  }
  return [
    ...concepts,
    { conceptId, score, seenCount: 1, correctCount: score >= 0.5 ? 1 : 0, lastSeenMove: 0 },
  ];
}

export function seedLearnerModelFromTrial(
  model: LearnerModel,
  result: TrialResult
): LearnerModel {
  let concepts = [...model.conceptsIntroduced];
  const { strengthsAndGaps } = result;

  // ── Tactic knowledge (R4) ────────────────────────────────────
  // Known tactics → 0.8 (introduced and demonstrated correct)
  for (const tacticId of strengthsAndGaps.tacticsKnown) {
    const conceptId = TACTIC_TO_CONCEPT[tacticId];
    if (!conceptId) continue;
    concepts = upsertConcept(concepts, conceptId, 0.8);
  }

  // Missed tactics → 0.1 (needs introduction, don't skip)
  for (const missed of strengthsAndGaps.tacticsMissed) {
    const conceptId = TACTIC_TO_CONCEPT[missed.id];
    if (!conceptId) continue;
    const existing = concepts.find((c) => c.conceptId === conceptId);
    if (!existing) {
      concepts = upsertConcept(concepts, conceptId, 0.1);
    }
  }

  // ── Check / checkmate understanding (R3) ────────────────────
  // checkmate_pattern covers both check-detection and mate-in-1 knowledge.
  if (strengthsAndGaps.checkUnderstanding === "strong") {
    concepts = upsertConcept(concepts, "checkmate_pattern", 0.7);
  } else if (strengthsAndGaps.checkUnderstanding === "weak") {
    concepts = upsertConcept(concepts, "checkmate_pattern", 0.1);
  }

  // ── Piece movement (R2) ──────────────────────────────────────
  // Weak/untested piece movers → seed material_count at 0.1 so the coach
  // knows to explain piece values and movement before assuming the kid
  // can reason about captures or trades.
  const movementTested = Object.values(strengthsAndGaps.pieceMovement);
  const anyWeakMovement = movementTested.some((s) => s === "weak");
  const allUntested = movementTested.every((s) => s === "untested");

  if (anyWeakMovement || allUntested) {
    concepts = upsertConcept(concepts, "material_count", 0.1);
  } else if (movementTested.every((s) => s === "strong" || s === "untested")) {
    // Passed all tested movement → mark material_count as introduced
    concepts = upsertConcept(concepts, "material_count", 0.6);
  }

  // ── Defending / trading (R2 strong movement) ────────────────
  // If the kid correctly found all rook and knight squares, they
  // understand controlled squares — seed defending at 0.4 (learning).
  const rookStrong = strengthsAndGaps.pieceMovement.rook === "strong";
  const knightStrong = strengthsAndGaps.pieceMovement.knight === "strong";
  if (rookStrong && knightStrong) {
    concepts = upsertConcept(concepts, "defending", 0.4);
  }

  return { ...model, conceptsIntroduced: concepts };
}
