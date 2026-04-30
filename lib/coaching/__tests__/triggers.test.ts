import { shouldCoach } from "../triggers";
import { findTemplate, requiresLLM } from "../templates";
import type { MoveAnalysis } from "@/lib/chess/types";

function makeAnalysis(overrides: Partial<MoveAnalysis>): MoveAnalysis {
  return {
    trigger: "OK_MOVE", severity: 1, san: "e4", bestSAN: "e4",
    diff: 50, piece: "p", captured: null, isHanging: false, eval: 0,
    ...overrides,
  };
}

describe("shouldCoach", () => {
  it("always coaches BLUNDER regardless of cooldown", () => {
    const analysis = makeAnalysis({ trigger: "BLUNDER", severity: 4 });
    expect(shouldCoach(analysis, 5, 4)).toBe(true); // 1 move since last coach
  });

  it("always coaches MISTAKE regardless of cooldown", () => {
    const analysis = makeAnalysis({ trigger: "MISTAKE", severity: 3 });
    expect(shouldCoach(analysis, 5, 4)).toBe(true);
  });

  it("respects cooldown for lower severity moves", () => {
    const analysis = makeAnalysis({ trigger: "INACCURACY", severity: 2 });
    // Only 2 moves since last coach — cooldown applies
    expect(shouldCoach(analysis, 6, 5)).toBe(false);
  });

  it("coaches after cooldown expires for inaccuracy", () => {
    // Run many times — at 25% probability, statistically should coach at least once in 20 runs
    const analysis = makeAnalysis({ trigger: "INACCURACY", severity: 2 });
    const results = Array.from({ length: 50 }, () => shouldCoach(analysis, 10, 5));
    expect(results.some(Boolean)).toBe(true);
  });

  it("coaches opening moves (moveCount <= 2)", () => {
    const analysis = makeAnalysis({ trigger: "OK_MOVE", severity: 1 });
    // Run 20 times — opening moves always pass the gate
    const results = Array.from({ length: 20 }, () => shouldCoach(analysis, 1, -5));
    expect(results.some(Boolean)).toBe(true);
  });

  it("does not coach OK_MOVE mid-game past cooldown (rare random)", () => {
    const analysis = makeAnalysis({ trigger: "OK_MOVE", severity: 1 });
    // moveCount=10, lastCoachMove=5 — past cooldown, but OK_MOVE has a random gate (35% probability)
    // Force random to fail (probability is < 0.35, so use 0.5) to test the failure path
    const origRandom = Math.random;
    Math.random = () => 0.5;
    const result = shouldCoach(analysis, 10, 5);
    Math.random = origRandom;
    expect(result).toBe(false);
  });
});

describe("shouldCoach — TACTIC_AVAILABLE restraint", () => {
  it("fires TACTIC_AVAILABLE after 1 move cooldown", () => {
    const analysis = makeAnalysis({ trigger: "TACTIC_AVAILABLE" as never, severity: 0 });
    // moveCount=5, lastCoachMove=4 → movesSinceCoach=1 → should allow
    expect(shouldCoach(analysis, 5, 4)).toBe(true);
  });

  it("suppresses TACTIC_AVAILABLE within 1-move cooldown", () => {
    const analysis = makeAnalysis({ trigger: "TACTIC_AVAILABLE" as never, severity: 0 });
    // moveCount=5, lastCoachMove=5 → movesSinceCoach=0 → should suppress
    expect(shouldCoach(analysis, 5, 5)).toBe(false);
  });

  it("GREAT_MOVE is still blocked at movesSinceCoach=1 while TACTIC_AVAILABLE is not", () => {
    // GREAT_MOVE at movesSinceCoach=1 hits the standard 2-move gate → false
    const greatMove = makeAnalysis({ trigger: "GREAT_MOVE", severity: 0 });
    const origRandom = Math.random;
    Math.random = () => 0; // force probability to fail
    const greatMoveResult = shouldCoach(greatMove, 5, 4);
    Math.random = origRandom;
    expect(greatMoveResult).toBe(false);

    // TACTIC_AVAILABLE at movesSinceCoach=1 takes the 1-move path → true
    const tacticAvail = makeAnalysis({ trigger: "TACTIC_AVAILABLE" as never, severity: 0 });
    expect(shouldCoach(tacticAvail, 5, 4)).toBe(true);
  });
});

describe("requiresLLM", () => {
  it("returns true for BLUNDER", () => {
    expect(requiresLLM("BLUNDER")).toBe(true);
  });

  it("returns true for INACCURACY", () => {
    expect(requiresLLM("INACCURACY")).toBe(true);
  });

  it("returns true for RECURRING_ERROR", () => {
    expect(requiresLLM("RECURRING_ERROR")).toBe(true);
  });

  it("returns false for GREAT_MOVE (still uses templates)", () => {
    expect(requiresLLM("GREAT_MOVE")).toBe(false);
  });

  it("findTemplate returns null for BLUNDER (no template should fire)", () => {
    expect(findTemplate("BLUNDER", "8-10")).toBeNull();
    expect(findTemplate("BLUNDER", "5-7")).toBeNull();
    expect(findTemplate("BLUNDER", "11+")).toBeNull();
  });

  it("findTemplate returns null for INACCURACY and RECURRING_ERROR", () => {
    expect(findTemplate("INACCURACY", "8-10")).toBeNull();
    expect(findTemplate("RECURRING_ERROR", "8-10")).toBeNull();
    // RECURRING_ERROR has concrete template entries under the pattern key —
    // the guard clause must suppress them even when a pattern is provided
    expect(findTemplate("RECURRING_ERROR", "8-10", { recurringErrorPattern: "hangs_queen" })).toBeNull();
  });
});
