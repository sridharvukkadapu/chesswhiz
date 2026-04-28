import { conceptToPlainText, errorPatternToPlainText, modelToDisplayItems } from "../memory-display";
import type { LearnerModel } from "@/lib/learner/types";

describe("conceptToPlainText", () => {
  it("converts fork to plain text", () => {
    expect(conceptToPlainText("fork")).toBe("knows about the Fork (attacking two pieces at once)");
  });

  it("converts hanging_piece", () => {
    const text = conceptToPlainText("hanging_piece");
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(5);
  });
});

describe("errorPatternToPlainText", () => {
  it("converts hangs_queen", () => {
    const text = errorPatternToPlainText("hangs_queen");
    expect(text).toContain("queen");
  });
});

describe("modelToDisplayItems", () => {
  const model: LearnerModel = {
    version: 1,
    playerId: "test",
    conceptsIntroduced: [
      { conceptId: "fork", score: 0.8, seenCount: 5, correctCount: 4, lastSeenMove: 10 },
      { conceptId: "pin", score: 0.4, seenCount: 3, correctCount: 1, lastSeenMove: 8 },
    ],
    recurringErrors: [
      { patternId: "hangs_queen", count: 3, exampleFENs: [], lastSeenMove: 6 },
    ],
    recentCoachMessages: ["Great fork!"],
    currentSession: { gameId: "g1", moveCount: 12, startedAt: Date.now() },
    stats: { gamesPlayed: 5, totalMoves: 80, tacticsSpotted: 3 },
  };

  it("returns an array of display items", () => {
    const items = modelToDisplayItems(model);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it("each item has id, text, type, and canForget", () => {
    const items = modelToDisplayItems(model);
    for (const item of items) {
      expect(item.id).toBeTruthy();
      expect(item.text).toBeTruthy();
      expect(["mastered", "learning", "struggling", "error"].includes(item.type)).toBe(true);
      expect(typeof item.canForget).toBe("boolean");
    }
  });
});
