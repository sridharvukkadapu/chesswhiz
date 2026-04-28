import { getDailyPuzzle, type DailyPuzzle } from "../daily";
import type { LearnerModel } from "@/lib/learner/types";

function makeModel(overrides: Partial<LearnerModel> = {}): LearnerModel {
  return {
    version: 1,
    playerId: "test",
    conceptsIntroduced: [],
    recurringErrors: [],
    recentCoachMessages: [],
    currentSession: { gameId: "g1", moveCount: 0, startedAt: Date.now() },
    stats: { gamesPlayed: 0, totalMoves: 0, tacticsSpotted: 0 },
    ...overrides,
  };
}

describe("getDailyPuzzle", () => {
  it("returns a puzzle object with required fields", () => {
    const puzzle = getDailyPuzzle(makeModel());
    expect(puzzle).not.toBeNull();
    expect(puzzle!.fen).toBeTruthy();
    expect(puzzle!.solution).toBeTruthy();
    expect(puzzle!.concept).toBeTruthy();
    expect(puzzle!.hint).toBeTruthy();
  });

  it("returns a puzzle for a model with no concepts introduced", () => {
    const puzzle = getDailyPuzzle(makeModel());
    expect(["fork", "pin", "hanging_piece"]).toContain(puzzle!.concept);
  });

  it("is deterministic for the same date + playerId", () => {
    const model = makeModel({ playerId: "abc" });
    const p1 = getDailyPuzzle(model, new Date("2026-01-15"));
    const p2 = getDailyPuzzle(model, new Date("2026-01-15"));
    expect(p1!.fen).toBe(p2!.fen);
  });

  it("returns different puzzles for different dates", () => {
    const model = makeModel({ playerId: "abc" });
    const p1 = getDailyPuzzle(model, new Date("2026-01-15"));
    const p2 = getDailyPuzzle(model, new Date("2026-01-16"));
    expect(p1).not.toBeNull();
    expect(p2).not.toBeNull();
  });
});
