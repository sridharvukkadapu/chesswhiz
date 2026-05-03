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

function buildStrengthsAndGaps(answers: TrialAnswer[]): StrengthsAndGaps {
  const r1 = answers.filter((a) => a.roundId === 1);
  const r2 = answers.filter((a) => a.roundId === 2);
  const r3 = answers.filter((a) => a.roundId === 3);
  const r4 = answers.filter((a) => a.roundId === 4);

  // R1 now tests piece recognition (tap the knight / tap the queen)
  const boardKnowledge: SkillLevel =
    r1.length === 0 ? "untested"
    : r1.filter((a) => a.correct).length >= 1 ? "strong"
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
    : r3.filter((a) => a.correct).length >= r3.length ? "strong"
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

  return { boardKnowledge, pieceMovement, checkUnderstanding, tacticsKnown, tacticsMissed };
}

export function placeTrial(answers: TrialAnswer[]): TrialResult {
  const strengthsAndGaps = buildStrengthsAndGaps(answers);

  // ── Round 1: Piece Recognition ────────────────────────────
  const r1Answers = answers.filter((a) => a.roundId === 1);
  const r1Pass = r1Answers.length > 0 && r1Answers.filter((a) => a.correct).length >= 1;
  if (!r1Pass) {
    return { learningStage: 1, kingdomId: "village", advancedPlayer: false, strengthsAndGaps };
  }

  // ── Round 2: Piece Movement ───────────────────────────────
  const r2Answers = answers.filter((a) => a.roundId === 2);
  const r2Pass = r2Answers.length > 0 && r2Answers.every((a) => a.correct);
  if (!r2Pass) {
    return { learningStage: 2, kingdomId: "village", advancedPlayer: false, strengthsAndGaps };
  }

  // ── Round 3: Check & Checkmate ────────────────────────────
  const r3Answers = answers.filter((a) => a.roundId === 3);
  const r3Pass = r3Answers.length > 0 && r3Answers.every((a) => a.correct);
  if (!r3Pass) {
    return { learningStage: 3, kingdomId: "village", advancedPlayer: false, strengthsAndGaps };
  }

  // ── Round 4: Tactics ──────────────────────────────────────
  const r4Answers = answers.filter((a) => a.roundId === 4);
  const r4Pass = r4Answers.length > 0 && r4Answers.every((a) => a.correct);
  if (!r4Pass) {
    const r4FirstMiss = r4Answers.find((a) => !a.correct);
    const kingdom: KingdomId = r4FirstMiss?.tacticId
      ? (TACTIC_TO_KINGDOM[r4FirstMiss.tacticId] ?? "fork_forest")
      : "fork_forest";
    return { learningStage: 4, kingdomId: kingdom, advancedPlayer: false, strengthsAndGaps };
  }

  // ── Round 5: Strategy ─────────────────────────────────────
  const r5Answers = answers.filter((a) => a.roundId === 5);
  if (r5Answers.length === 0) {
    return { learningStage: 4, kingdomId: "discovery_depths", advancedPlayer: false, strengthsAndGaps };
  }

  const r5Pass = r5Answers.every((a) => a.correct);
  if (!r5Pass) {
    return { learningStage: 4, kingdomId: "discovery_depths", advancedPlayer: false, strengthsAndGaps };
  }

  const r5Perfect = r5Answers.every((a) => a.confident !== false);
  return { learningStage: 5, kingdomId: "strategy_summit", advancedPlayer: r5Perfect, strengthsAndGaps };
}
