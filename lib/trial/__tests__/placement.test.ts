// lib/trial/__tests__/placement.test.ts
import { placeTrial } from "../placement";
import type { TrialAnswer } from "../types";

function ans(overrides: Partial<TrialAnswer> & Pick<TrialAnswer, "roundId" | "correct">): TrialAnswer {
  return {
    questionIndex: 0,
    confident: null,
    responseTimeMs: 1000,
    ...overrides,
  };
}

// R1: 2 piece-recognition questions (knight, queen)
function r1Pass(): TrialAnswer[] {
  return [0, 1].map((i) => ans({ roundId: 1, questionIndex: i, correct: true }));
}
function r1Fail(): TrialAnswer[] {
  return [0, 1].map((i) => ans({ roundId: 1, questionIndex: i, correct: false }));
}

// R2: 2 movement questions (rook, knight)
function r2Pass(): TrialAnswer[] {
  return [
    ans({ roundId: 2, questionIndex: 0, correct: true, pieceKind: "rook" }),
    ans({ roundId: 2, questionIndex: 1, correct: true, pieceKind: "knight" }),
  ];
}

// R3: 2 questions (check-detection, checkmate-in-1)
function r3Pass(): TrialAnswer[] {
  return [0, 1].map((i) => ans({ roundId: 3, questionIndex: i, correct: true }));
}

// R4: 2 tactic questions (fork, pin)
function r4Pass(): TrialAnswer[] {
  return [
    ans({ roundId: 4, questionIndex: 0, correct: true, tacticId: "fork" }),
    ans({ roundId: 4, questionIndex: 1, correct: true, tacticId: "pin" }),
  ];
}

// R5: 1 strategy question
function r5Pass(): TrialAnswer[] {
  return [ans({ roundId: 5, questionIndex: 0, correct: true })];
}

describe("placeTrial()", () => {
  // ── Round 1 gate ─────────────────────────────────────────────

  it("R1 all wrong → Stage 1 / village", () => {
    const result = placeTrial(r1Fail());
    expect(result.learningStage).toBe(1);
    expect(result.kingdomId).toBe("village");
    expect(result.strengthsAndGaps.boardKnowledge).toBe("weak");
  });

  it("R1 1/2 correct → passes R1 (≥1 correct required)", () => {
    const answers = [
      ans({ roundId: 1, questionIndex: 0, correct: true }),
      ans({ roundId: 1, questionIndex: 1, correct: false }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBeGreaterThanOrEqual(2);
    expect(result.strengthsAndGaps.boardKnowledge).toBe("strong");
  });

  it("R1 empty → Stage 1", () => {
    const result = placeTrial([]);
    expect(result.learningStage).toBe(1);
  });

  // ── Round 2 gate ─────────────────────────────────────────────

  it("R1 passes, R2 fails at rook → Stage 2, rook: weak", () => {
    const answers = [
      ...r1Pass(),
      ans({ roundId: 2, questionIndex: 0, correct: false, pieceKind: "rook" }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(2);
    expect(result.kingdomId).toBe("village");
    expect(result.strengthsAndGaps.pieceMovement.rook).toBe("weak");
  });

  it("R1 passes, R2 fails at knight → Stage 2, rook strong, knight weak", () => {
    const answers = [
      ...r1Pass(),
      ans({ roundId: 2, questionIndex: 0, correct: true, pieceKind: "rook" }),
      ans({ roundId: 2, questionIndex: 1, correct: false, pieceKind: "knight" }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(2);
    expect(result.strengthsAndGaps.pieceMovement.rook).toBe("strong");
    expect(result.strengthsAndGaps.pieceMovement.knight).toBe("weak");
    // pieces not tested in R2 are untested
    expect(result.strengthsAndGaps.pieceMovement.pawn).toBe("untested");
  });

  // ── Round 3 gate ─────────────────────────────────────────────

  it("R1+R2 pass, R3 fails (1/2) → Stage 3, checkUnderstanding: weak", () => {
    const answers = [
      ...r1Pass(),
      ...r2Pass(),
      ans({ roundId: 3, questionIndex: 0, correct: true }),
      ans({ roundId: 3, questionIndex: 1, correct: false }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(3);
    expect(result.strengthsAndGaps.checkUnderstanding).toBe("weak");
  });

  it("R1-R3 pass → checkUnderstanding: strong", () => {
    const result = placeTrial([...r1Pass(), ...r2Pass(), ...r3Pass()]);
    expect(result.strengthsAndGaps.checkUnderstanding).toBe("strong");
  });

  // ── Round 4 gate ─────────────────────────────────────────────

  it("R1-R3 pass, R4 fails at fork → Stage 4 / fork_forest", () => {
    const answers = [
      ...r1Pass(), ...r2Pass(), ...r3Pass(),
      ans({ roundId: 4, questionIndex: 0, correct: false, tacticId: "fork", missType: "blind" }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(4);
    expect(result.kingdomId).toBe("fork_forest");
    expect(result.strengthsAndGaps.tacticsMissed[0]).toEqual({ id: "fork", missType: "blind" });
  });

  it("R1-R3 pass, R4 fork✓ pin✗ → Stage 4 / pin_palace, fork in tacticsKnown", () => {
    const answers = [
      ...r1Pass(), ...r2Pass(), ...r3Pass(),
      ans({ roundId: 4, questionIndex: 0, correct: true, tacticId: "fork" }),
      ans({ roundId: 4, questionIndex: 1, correct: false, tacticId: "pin", missType: "execution" }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(4);
    expect(result.kingdomId).toBe("pin_palace");
    expect(result.strengthsAndGaps.tacticsKnown).toEqual(["fork"]);
    expect(result.strengthsAndGaps.tacticsMissed[0]).toEqual({ id: "pin", missType: "execution" });
  });

  it("missType is preserved correctly", () => {
    const answers = [
      ...r1Pass(), ...r2Pass(), ...r3Pass(),
      ans({ roundId: 4, questionIndex: 0, correct: false, tacticId: "fork", missType: "execution" }),
    ];
    const result = placeTrial(answers);
    expect(result.strengthsAndGaps.tacticsMissed[0].missType).toBe("execution");
  });

  // ── Round 5 gate ─────────────────────────────────────────────

  it("R1-R4 pass, R5 fails → Stage 4 / discovery_depths", () => {
    const answers = [
      ...r1Pass(), ...r2Pass(), ...r3Pass(), ...r4Pass(),
      ans({ roundId: 5, questionIndex: 0, correct: false }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(4);
    expect(result.kingdomId).toBe("discovery_depths");
  });

  it("R1-R4 pass, R5 absent → Stage 4 / discovery_depths", () => {
    const result = placeTrial([...r1Pass(), ...r2Pass(), ...r3Pass(), ...r4Pass()]);
    expect(result.learningStage).toBe(4);
    expect(result.kingdomId).toBe("discovery_depths");
  });

  it("R1-R5 all pass → Stage 5 / strategy_summit", () => {
    const answers = [...r1Pass(), ...r2Pass(), ...r3Pass(), ...r4Pass(), ...r5Pass()];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(5);
    expect(result.kingdomId).toBe("strategy_summit");
  });

  it("R5 with confident: false → advancedPlayer: false", () => {
    const answers = [
      ...r1Pass(), ...r2Pass(), ...r3Pass(), ...r4Pass(),
      ans({ roundId: 5, questionIndex: 0, correct: true, confident: false }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(5);
    expect(result.advancedPlayer).toBe(false);
  });

  it("R5 with confident: true → advancedPlayer: true", () => {
    const answers = [
      ...r1Pass(), ...r2Pass(), ...r3Pass(), ...r4Pass(),
      ans({ roundId: 5, questionIndex: 0, correct: true, confident: true }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(5);
    expect(result.advancedPlayer).toBe(true);
  });

  // ── strengthsAndGaps ─────────────────────────────────────────

  it("boardKnowledge is strong when R1 passes cleanly", () => {
    const result = placeTrial([...r1Pass(), ...r2Pass()]);
    expect(result.strengthsAndGaps.boardKnowledge).toBe("strong");
  });

  it("untested pieces stay untested when R2 stops early", () => {
    const answers = [
      ...r1Pass(),
      ans({ roundId: 2, questionIndex: 0, correct: false, pieceKind: "rook" }),
    ];
    const result = placeTrial(answers);
    expect(result.strengthsAndGaps.pieceMovement.knight).toBe("untested");
    expect(result.strengthsAndGaps.pieceMovement.pawn).toBe("untested");
  });
});
