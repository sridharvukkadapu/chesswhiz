import { computeDifficulty, recordResult } from "../adaptive-difficulty";
import type { PlayerProgression } from "../types";

function makeProgression(overrides: Partial<PlayerProgression> = {}): PlayerProgression {
  return {
    rank: "pawn",
    xp: 0,
    currentKingdom: "village",
    completedKingdoms: [],
    defeatedBosses: [],
    masteredStrategies: [],
    earnedPowers: [],
    activeMission: null,
    streak: 0,
    lastPlayedDate: "2026-01-01",
    tier: "free",
    challengeBias: "balanced",
    recentResults: [],
    learningStage: 1,
    ...overrides,
  };
}

describe("computeDifficulty", () => {
  it("returns 1 (easy) for a new player", () => {
    expect(computeDifficulty(makeProgression({ recentResults: [] }))).toBe(1);
  });
  it("increases to 2 after 3 consecutive wins", () => {
    expect(computeDifficulty(makeProgression({ recentResults: ["win", "win", "win"] }))).toBe(2);
  });
  it("drops to 1 after 2 consecutive losses from 2", () => {
    expect(computeDifficulty(makeProgression({ recentResults: ["win", "win", "win", "loss", "loss"] }))).toBe(1);
  });
  it("sharp bias bumps difficulty up by 1", () => {
    expect(computeDifficulty(makeProgression({ recentResults: [], challengeBias: "sharp" }))).toBe(2);
  });
  it("relaxed bias drops difficulty by 1 (min 1)", () => {
    expect(computeDifficulty(makeProgression({ recentResults: ["win", "win", "win"], challengeBias: "relaxed" }))).toBe(1);
  });
  it("never exceeds 3", () => {
    expect(computeDifficulty(makeProgression({ recentResults: ["win","win","win","win","win","win"], challengeBias: "sharp" }))).toBeLessThanOrEqual(3);
  });
  it("never goes below 1", () => {
    expect(computeDifficulty(makeProgression({ recentResults: ["loss","loss","loss","loss","loss","loss"], challengeBias: "relaxed" }))).toBeGreaterThanOrEqual(1);
  });
});

describe("recordResult", () => {
  it("appends the result", () => {
    const prog = makeProgression({ recentResults: ["win"] });
    expect(recordResult(prog, "loss").recentResults).toEqual(["win", "loss"]);
  });
  it("keeps only the last 10 results", () => {
    const ten = Array(10).fill("win") as Array<"win" | "loss" | "draw">;
    const prog = makeProgression({ recentResults: ten });
    const updated = recordResult(prog, "loss");
    expect(updated.recentResults).toHaveLength(10);
    expect(updated.recentResults[9]).toBe("loss");
  });
});
