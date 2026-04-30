import type { LearnerModel, ConceptId } from "@/lib/learner/types";
import type { TrialResult } from "./types";

const TACTIC_TO_CONCEPT: Record<string, ConceptId> = {
  fork: "fork",
  pin: "pin",
  skewer: "skewer",
  discovered_attack: "discovered_attack",
};

export function seedLearnerModelFromTrial(
  model: LearnerModel,
  result: TrialResult
): LearnerModel {
  let concepts = [...model.conceptsIntroduced];

  // Seed known tactics as score: 0.8 (known but worth reinforcing)
  for (const tacticId of result.strengthsAndGaps.tacticsKnown) {
    const conceptId = TACTIC_TO_CONCEPT[tacticId];
    if (!conceptId) continue;
    const existing = concepts.find((c) => c.conceptId === conceptId);
    if (existing) {
      concepts = concepts.map((c) =>
        c.conceptId === conceptId ? { ...c, score: Math.max(c.score, 0.8) } : c
      );
    } else {
      concepts.push({
        conceptId,
        score: 0.8,
        seenCount: 1,
        correctCount: 1,
        lastSeenMove: 0,
      });
    }
  }

  // Seed missed tactics as score: 0.1 (new concept — needs introduction)
  for (const missed of result.strengthsAndGaps.tacticsMissed) {
    const conceptId = TACTIC_TO_CONCEPT[missed.id];
    if (!conceptId) continue;
    const existing = concepts.find((c) => c.conceptId === conceptId);
    if (!existing) {
      concepts.push({
        conceptId,
        score: 0.1,
        seenCount: 1,
        correctCount: 0,
        lastSeenMove: 0,
      });
    }
  }

  return { ...model, conceptsIntroduced: concepts };
}
