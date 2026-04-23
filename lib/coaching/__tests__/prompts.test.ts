import { buildCoachPrompt, FALLBACKS } from "../prompts";
import type { MoveAnalysis } from "@/lib/chess/types";

const analysis: MoveAnalysis = {
  trigger: "BLUNDER", severity: 4, san: "Bxf7", bestSAN: "Nf3",
  diff: 520, piece: "b", captured: null, isHanging: true, eval: -300,
};

describe("buildCoachPrompt", () => {
  it("returns system and user strings", () => {
    const prompt = buildCoachPrompt(analysis, [], "Alex", 9);
    expect(typeof prompt.system).toBe("string");
    expect(typeof prompt.user).toBe("string");
    expect(prompt.system.length).toBeGreaterThan(0);
    expect(prompt.user.length).toBeGreaterThan(0);
  });

  it("includes player name in system prompt", () => {
    const prompt = buildCoachPrompt(analysis, [], "Jordan", 9);
    expect(prompt.system).toContain("Jordan");
  });

  it("includes age-appropriate rules for age 6", () => {
    const prompt = buildCoachPrompt(analysis, [], "Sam", 6);
    expect(prompt.system).toContain("2 sentences");
  });

  it("includes age-appropriate rules for age 12", () => {
    const prompt = buildCoachPrompt(analysis, [], "Sam", 12);
    expect(prompt.system).toContain("terminology");
  });

  it("includes played move and best move in user prompt", () => {
    const prompt = buildCoachPrompt(analysis, ["e4", "e5"], "Alex", 9);
    expect(prompt.user).toContain("Bxf7");
    expect(prompt.user).toContain("Nf3");
  });

  it("FALLBACKS has entries for all trigger types", () => {
    const triggers = ["GREAT_MOVE", "OK_MOVE", "INACCURACY", "MISTAKE", "BLUNDER"];
    triggers.forEach((t) => {
      expect(FALLBACKS[t]).toBeDefined();
      expect(FALLBACKS[t].length).toBeGreaterThan(0);
    });
  });
});
