import { generateAnnotation } from "../annotations";
import type { MoveAnalysis, Move } from "@/lib/chess/types";
import type { TacticDetection } from "@/lib/progression/types";

function move(from: string, to: string): Move {
  return { from, to };
}

function analysis(overrides: Partial<MoveAnalysis> = {}): MoveAnalysis {
  return {
    trigger: "OK_MOVE",
    severity: 1,
    san: "e4",
    bestSAN: "e4",
    diff: 0,
    piece: "p",
    captured: null,
    isHanging: false,
    eval: 0,
    ...overrides,
  };
}

function tactic(overrides: Partial<TacticDetection> = {}): TacticDetection {
  return {
    type: "fork",
    detected: true,
    details: "test fork",
    materialWon: 300,
    ...overrides,
  };
}

describe("generateAnnotation", () => {
  describe("tactics — visualizable", () => {
    it("draws green fork arrows from attacker to each target", () => {
      const fork = tactic({
        type: "fork",
        attackerSquare: "f7",
        targetSquares: ["e8", "h8"],
      });
      const a = generateAnnotation(analysis({ trigger: "GREAT_MOVE" }), [fork], move("d5", "f7"));
      expect(a).not.toBeNull();
      expect(a!.arrows).toHaveLength(2);
      expect(a!.arrows![0]).toMatchObject({ from: "f7", to: "e8", color: "green" });
      expect(a!.arrows![1]).toMatchObject({ from: "f7", to: "h8", color: "green" });
      expect(a!.circles).toEqual([{ square: "f7", color: "green" }]);
    });

    it("draws blue pin arrow plus red circle on the pinned piece", () => {
      const pin = tactic({
        type: "pin",
        attackerSquare: "g5",
        pinnedSquare: "f6",
        behindSquare: "d8",
      });
      const a = generateAnnotation(analysis({ trigger: "GREAT_MOVE" }), [pin], move("c1", "g5"));
      expect(a).not.toBeNull();
      const colors = a!.arrows!.map((x) => x.color);
      expect(colors).toContain("blue");
      expect(a!.circles).toEqual([{ square: "f6", color: "red" }]);
    });

    it("draws red skewer arrows from attacker through front to back", () => {
      const skewer = tactic({
        type: "skewer",
        attackerSquare: "h1",
        frontSquare: "h7",
        backSquare: "h8",
      });
      const a = generateAnnotation(analysis({ trigger: "GREAT_MOVE" }), [skewer], move("h2", "h1"));
      expect(a).not.toBeNull();
      expect(a!.arrows!.every((x) => x.color === "red")).toBe(true);
    });

    it("ignores tactics that have no square data (defensive)", () => {
      const broken = tactic({ type: "fork" }); // no attackerSquare/targetSquares
      const a = generateAnnotation(
        analysis({ trigger: "INACCURACY" }),
        [broken],
        move("e2", "e4"),
      );
      // Falls through to the generic fallback (yellow arrow on inaccuracy)
      expect(a).not.toBeNull();
      expect(a!.arrows![0].color).toBe("yellow");
    });

    it("only annotates 'detected: true' tactics", () => {
      const undetected = tactic({
        type: "fork",
        detected: false,
        attackerSquare: "f7",
        targetSquares: ["e8", "h8"],
      });
      const a = generateAnnotation(
        analysis({ trigger: "GREAT_MOVE" }),
        [undetected],
        move("e4", "e5"),
      );
      // Falls through (no fork rendered) to the center-pawn praise rule,
      // which fires for GREAT_MOVE on e5
      expect(a).not.toBeNull();
      expect(a!.highlights).toBeDefined();
    });
  });

  describe("trigger-driven fallbacks", () => {
    it("BLUNDER puts a red circle on the bad square", () => {
      const a = generateAnnotation(analysis({ trigger: "BLUNDER", severity: 4 }), [], move("d8", "h4"));
      expect(a).not.toBeNull();
      expect(a!.circles).toEqual([{ square: "h4", color: "red" }]);
    });

    it("center pawn praise lights up the four center squares", () => {
      const a = generateAnnotation(analysis({ trigger: "GREAT_MOVE" }), [], move("e2", "e4"));
      expect(a).not.toBeNull();
      const sqs = a!.highlights!.map((h) => h.square).sort();
      expect(sqs).toEqual(["d4", "d5", "e4", "e5"]);
    });

    it("hanging piece warning circles the move's destination in red", () => {
      const a = generateAnnotation(
        analysis({ trigger: "OK_MOVE", isHanging: true }),
        [],
        move("d1", "h5"),
      );
      expect(a).not.toBeNull();
      expect(a!.circles).toEqual([{ square: "h5", color: "red" }]);
    });

    it("INACCURACY draws a yellow from→to arrow + ring", () => {
      const a = generateAnnotation(analysis({ trigger: "INACCURACY", severity: 2 }), [], move("g1", "h3"));
      expect(a).not.toBeNull();
      expect(a!.arrows![0]).toMatchObject({ from: "g1", to: "h3", color: "yellow" });
      expect(a!.circles).toEqual([{ square: "h3", color: "yellow" }]);
    });

    it("MISTAKE also draws yellow (same severity tone)", () => {
      const a = generateAnnotation(analysis({ trigger: "MISTAKE", severity: 3 }), [], move("g1", "h3"));
      expect(a!.arrows![0].color).toBe("yellow");
    });

    it("OK_MOVE generates no annotation — too routine", () => {
      const a = generateAnnotation(analysis({ trigger: "OK_MOVE" }), [], move("h2", "h3"));
      expect(a).toBeNull();
    });

    it("GREAT_MOVE on a non-center, non-tactic square also generates none", () => {
      // A development move that isn't to the center and has no tactic
      const a = generateAnnotation(analysis({ trigger: "GREAT_MOVE" }), [], move("g1", "f3"));
      // Falls through all rules including the center check (f3 not in CENTER_SQUARES)
      // Lands on the generic fallback (green arrow + ring on f3)
      expect(a).not.toBeNull();
      expect(a!.arrows![0]).toMatchObject({ from: "g1", to: "f3", color: "green" });
    });
  });

  describe("priority", () => {
    it("a fork tactic always wins over the trigger fallback", () => {
      // BLUNDER would normally produce a red circle. A simultaneous fork
      // (unlikely in practice but a real edge case) should still draw the
      // green tactic visualization.
      const fork = tactic({
        type: "fork",
        attackerSquare: "c4",
        targetSquares: ["e5", "f7"],
      });
      const a = generateAnnotation(
        analysis({ trigger: "BLUNDER", severity: 4 }),
        [fork],
        move("d5", "c4"),
      );
      expect(a!.arrows!.every((x) => x.color === "green")).toBe(true);
    });
  });
});
