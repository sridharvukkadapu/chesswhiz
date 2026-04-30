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

function r1Pass(): TrialAnswer[] {
  return [0,1,2,3,4].map((i) => ans({ roundId: 1, questionIndex: i, correct: true }));
}
function r2Pass(): TrialAnswer[] {
  return ["rook","bishop","queen","king","knight","pawn"].map((p, i) =>
    ans({ roundId: 2, questionIndex: i, correct: true, pieceKind: p as any })
  );
}
function r3Pass(): TrialAnswer[] {
  return [0,1,2,3].map((i) => ans({ roundId: 3, questionIndex: i, correct: true }));
}
function r4Pass(): TrialAnswer[] {
  return ["fork","pin","skewer","discovered_attack"].map((t, i) =>
    ans({ roundId: 4, questionIndex: i, correct: true, tacticId: t })
  );
}
function r5Pass(): TrialAnswer[] {
  return [0,1,2].map((i) => ans({ roundId: 5, questionIndex: i, correct: true }));
}

describe("placeTrial()", () => {
  it("zero score → Stage 1 / village", () => {
    const answers = [0,1,2,3,4].map((i) => ans({ roundId: 1, questionIndex: i, correct: false }));
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(1);
    expect(result.kingdomId).toBe("village");
  });

  it("R1 fails (3/5 correct) → Stage 1", () => {
    const answers = [
      ans({ roundId: 1, questionIndex: 0, correct: true }),
      ans({ roundId: 1, questionIndex: 1, correct: true }),
      ans({ roundId: 1, questionIndex: 2, correct: true }),
      ans({ roundId: 1, questionIndex: 3, correct: false }),
      ans({ roundId: 1, questionIndex: 4, correct: false }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(1);
    expect(result.strengthsAndGaps.boardKnowledge).toBe("weak");
  });

  it("R1 4/5 with 3 guesses → Stage 1 (weighted score < 4)", () => {
    const answers = [
      ans({ roundId: 1, questionIndex: 0, correct: true, confident: true }),
      ans({ roundId: 1, questionIndex: 1, correct: true, confident: false }), // 0.5
      ans({ roundId: 1, questionIndex: 2, correct: true, confident: false }), // 0.5
      ans({ roundId: 1, questionIndex: 3, correct: true, confident: false }), // 0.5
      ans({ roundId: 1, questionIndex: 4, correct: false }),
    ];
    const result = placeTrial(answers);
    // weighted = 1 + 0.5 + 0.5 + 0.5 + 0 = 2.5 → < 4 → Stage 1
    expect(result.learningStage).toBe(1);
  });

  it("R1 passes, R2 fails at rook → Stage 2, pieceMovement rook: weak", () => {
    const answers = [
      ...r1Pass(),
      ans({ roundId: 2, questionIndex: 0, correct: false, pieceKind: "rook" }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(2);
    expect(result.kingdomId).toBe("village");
    expect(result.strengthsAndGaps.pieceMovement.rook).toBe("weak");
  });

  it("R1 passes, R2 fails at knight → Stage 2, rook/bishop/queen/king strong, knight weak", () => {
    const answers = [
      ...r1Pass(),
      ans({ roundId: 2, questionIndex: 0, correct: true, pieceKind: "rook" }),
      ans({ roundId: 2, questionIndex: 1, correct: true, pieceKind: "bishop" }),
      ans({ roundId: 2, questionIndex: 2, correct: true, pieceKind: "queen" }),
      ans({ roundId: 2, questionIndex: 3, correct: true, pieceKind: "king" }),
      ans({ roundId: 2, questionIndex: 4, correct: false, pieceKind: "knight" }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(2);
    expect(result.strengthsAndGaps.pieceMovement.rook).toBe("strong");
    expect(result.strengthsAndGaps.pieceMovement.knight).toBe("weak");
    expect(result.strengthsAndGaps.pieceMovement.pawn).toBe("untested");
  });

  it("R1+R2 pass, R3 fails (2/4) → Stage 3", () => {
    const answers = [
      ...r1Pass(),
      ...r2Pass(),
      ans({ roundId: 3, questionIndex: 0, correct: true }),
      ans({ roundId: 3, questionIndex: 1, correct: true }),
      ans({ roundId: 3, questionIndex: 2, correct: false }),
      ans({ roundId: 3, questionIndex: 3, correct: false }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(3);
    expect(result.strengthsAndGaps.checkUnderstanding).toBe("weak");
  });

  it("R1-R3 pass, R4 fails at fork (first tactic) → Stage 4 / fork_forest", () => {
    const answers = [
      ...r1Pass(),
      ...r2Pass(),
      ...r3Pass(),
      ans({ roundId: 4, questionIndex: 0, correct: false, tacticId: "fork", missType: "blind" }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(4);
    expect(result.kingdomId).toBe("fork_forest");
    expect(result.strengthsAndGaps.tacticsMissed[0]).toEqual({ id: "fork", missType: "blind" });
  });

  it("R1-R3 pass, R4 fork✓ pin✓ skewer✗ → Stage 4 / skewer_spire", () => {
    const answers = [
      ...r1Pass(),
      ...r2Pass(),
      ...r3Pass(),
      ans({ roundId: 4, questionIndex: 0, correct: true, tacticId: "fork" }),
      ans({ roundId: 4, questionIndex: 1, correct: true, tacticId: "pin" }),
      ans({ roundId: 4, questionIndex: 2, correct: false, tacticId: "skewer", missType: "execution" }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(4);
    expect(result.kingdomId).toBe("skewer_spire");
    expect(result.strengthsAndGaps.tacticsKnown).toEqual(["fork", "pin"]);
    expect(result.strengthsAndGaps.tacticsMissed[0]).toEqual({ id: "skewer", missType: "execution" });
  });

  it("R1-R3 pass, R4 fork✓ pin✓ skewer✗ execution missType is preserved", () => {
    const answers = [
      ...r1Pass(), ...r2Pass(), ...r3Pass(),
      ans({ roundId: 4, questionIndex: 0, correct: true, tacticId: "fork" }),
      ans({ roundId: 4, questionIndex: 1, correct: true, tacticId: "pin" }),
      ans({ roundId: 4, questionIndex: 2, correct: false, tacticId: "skewer", missType: "execution" }),
    ];
    const result = placeTrial(answers);
    expect(result.strengthsAndGaps.tacticsMissed[0].missType).toBe("execution");
  });

  it("R1-R4 pass, R5 fails (1/3) → Stage 4 / discovery_depths (finish tactics first)", () => {
    const answers = [
      ...r1Pass(), ...r2Pass(), ...r3Pass(), ...r4Pass(),
      ans({ roundId: 5, questionIndex: 0, correct: true }),
      ans({ roundId: 5, questionIndex: 1, correct: false }),
      ans({ roundId: 5, questionIndex: 2, correct: false }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(4);
    expect(result.kingdomId).toBe("discovery_depths");
  });

  it("R1-R4 pass, R5 passes (2/3) → Stage 5 / strategy_summit", () => {
    const answers = [
      ...r1Pass(), ...r2Pass(), ...r3Pass(), ...r4Pass(),
      ans({ roundId: 5, questionIndex: 0, correct: true }),
      ans({ roundId: 5, questionIndex: 1, correct: true }),
      ans({ roundId: 5, questionIndex: 2, correct: false }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(5);
    expect(result.kingdomId).toBe("strategy_summit");
    expect(result.advancedPlayer).toBe(false);
  });

  it("R1-R5 all perfect → Stage 5 / strategy_summit, advancedPlayer: true (never Stage 6)", () => {
    const answers = [
      ...r1Pass(), ...r2Pass(), ...r3Pass(), ...r4Pass(),
      ...r5Pass().map((a) => ({ ...a, confident: true as const })),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(5);
    expect(result.advancedPlayer).toBe(true);
  });

  it("color question miss does not change stage placement", () => {
    // R1 passes with board squares, color question fails — still passes R1
    const answers = [
      ...r1Pass(),
      ans({ roundId: 1, questionIndex: 5, correct: false }), // color question
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBeGreaterThanOrEqual(2);
    expect(result.strengthsAndGaps.colorAwareness).toBe("weak");
  });

  it("R2 stops after 3 failures — remaining pieces are untested", () => {
    const answers = [
      ...r1Pass(),
      ans({ roundId: 2, questionIndex: 0, correct: false, pieceKind: "rook" }),
      ans({ roundId: 2, questionIndex: 1, correct: false, pieceKind: "bishop" }),
      ans({ roundId: 2, questionIndex: 2, correct: false, pieceKind: "queen" }),
    ];
    const result = placeTrial(answers);
    expect(result.learningStage).toBe(2);
    expect(result.strengthsAndGaps.pieceMovement.king).toBe("untested");
    expect(result.strengthsAndGaps.pieceMovement.knight).toBe("untested");
    expect(result.strengthsAndGaps.pieceMovement.pawn).toBe("untested");
  });

  it("boardKnowledge is strong when R1 passes cleanly", () => {
    const result = placeTrial([...r1Pass(), ...r2Pass(), ...r3Pass()]);
    expect(result.strengthsAndGaps.boardKnowledge).toBe("strong");
  });

  it("checkUnderstanding is strong when R3 passes", () => {
    const result = placeTrial([...r1Pass(), ...r2Pass(), ...r3Pass()]);
    expect(result.strengthsAndGaps.checkUnderstanding).toBe("strong");
  });
});
