// lib/trial/placement.ts
import type { TrialAnswer, TrialResult, LearningStage, StrengthsAndGaps, SkillLevel, PieceKind } from "./types";
import type { KingdomId } from "@/lib/progression/types";

const ALL_PIECE_KINDS: PieceKind[] = ["rook", "bishop", "queen", "king", "knight", "pawn"];
const TACTIC_TO_KINGDOM: Record<string, KingdomId> = {
  fork: "fork_forest",
  pin: "pin_palace",
  skewer: "skewer_spire",
  discovered_attack: "discovery_depths",
};

function weightedScore(answers: TrialAnswer[]): number {
  return answers.reduce(
    (sum, a) => sum + (a.correct ? (a.confident === false ? 0.5 : 1) : 0),
    0
  );
}

function buildStrengthsAndGaps(answers: TrialAnswer[]): StrengthsAndGaps {
  const r1 = answers.filter((a) => a.roundId === 1 && a.questionIndex < 5);
  const colorAnswer = answers.find((a) => a.roundId === 1 && a.questionIndex === 5);
  const r2 = answers.filter((a) => a.roundId === 2);
  const r3 = answers.filter((a) => a.roundId === 3);
  const r4 = answers.filter((a) => a.roundId === 4);

  const boardKnowledge: SkillLevel =
    r1.length === 0 ? "untested"
    : weightedScore(r1) >= 4 ? "strong"
    : "weak";

  const colorAwareness: SkillLevel =
    colorAnswer === undefined ? "untested"
    : colorAnswer.correct ? "strong"
    : "weak";

  const pieceMovement = Object.fromEntries(
    ALL_PIECE_KINDS.map((kind) => {
      const ans = r2.find((a) => a.pieceKind === kind);
      const level: SkillLevel = ans === undefined ? "untested" : ans.correct ? "strong" : "weak";
      return [kind, level];
    })
  ) as Record<PieceKind, SkillLevel>;

  const checkUnderstanding: SkillLevel =
    r3.length === 0 ? "untested"
    : r3.filter((a) => a.correct).length >= 3 ? "strong"
    : "weak";

  const tacticsKnown: string[] = r4
    .filter((a) => a.correct && a.tacticId)
    .map((a) => a.tacticId!);

  const tacticsMissed = r4
    .filter((a) => !a.correct && a.tacticId)
    .map((a) => ({
      id: a.tacticId!,
      missType: a.missType ?? "blind" as const,
    }));

  return { boardKnowledge, colorAwareness, pieceMovement, checkUnderstanding, tacticsKnown, tacticsMissed };
}

export function placeTrial(answers: TrialAnswer[]): TrialResult {
  const strengthsAndGaps = buildStrengthsAndGaps(answers);

  // ── Round 1 ───────────────────────────────────────────────
  const r1Answers = answers.filter((a) => a.roundId === 1 && a.questionIndex < 5);
  if (r1Answers.length === 0 || weightedScore(r1Answers) < 4) {
    return { learningStage: 1, kingdomId: "village", advancedPlayer: false, strengthsAndGaps };
  }

  // ── Round 2 ───────────────────────────────────────────────
  const r2Answers = answers.filter((a) => a.roundId === 2);
  const r2Fail = r2Answers.find((a) => !a.correct);
  if (r2Fail || r2Answers.length === 0) {
    return { learningStage: 2, kingdomId: "village", advancedPlayer: false, strengthsAndGaps };
  }

  // ── Round 3 ───────────────────────────────────────────────
  const r3Answers = answers.filter((a) => a.roundId === 3);
  if (r3Answers.length === 0 || r3Answers.filter((a) => a.correct).length < 3) {
    return { learningStage: 3, kingdomId: "village", advancedPlayer: false, strengthsAndGaps };
  }

  // ── Round 4 ───────────────────────────────────────────────
  const r4Answers = answers.filter((a) => a.roundId === 4);
  const r4FirstMiss = r4Answers.find((a) => !a.correct);
  const r4Correct = r4Answers.filter((a) => a.correct).length;

  if (r4Answers.length === 0 || r4Correct < 3) {
    const kingdom: KingdomId = r4FirstMiss?.tacticId
      ? (TACTIC_TO_KINGDOM[r4FirstMiss.tacticId] ?? "fork_forest")
      : "fork_forest";
    return { learningStage: 4, kingdomId: kingdom, advancedPlayer: false, strengthsAndGaps };
  }

  // ── Round 5 ───────────────────────────────────────────────
  const r5Answers = answers.filter((a) => a.roundId === 5);
  if (r5Answers.length === 0) {
    // R4 passed but R5 not shown — place at discovery_depths
    return { learningStage: 4, kingdomId: "discovery_depths", advancedPlayer: false, strengthsAndGaps };
  }

  const r5Correct = r5Answers.filter((a) => a.correct).length;
  if (r5Correct < 2) {
    return { learningStage: 4, kingdomId: "discovery_depths", advancedPlayer: false, strengthsAndGaps };
  }

  // R5 passed — Stage 5. advancedPlayer = true if all 3 correct and confident
  const r5Perfect = r5Correct === 3 && r5Answers.every((a) => a.confident !== false);
  return { learningStage: 5, kingdomId: "strategy_summit", advancedPlayer: r5Perfect, strengthsAndGaps };
}
