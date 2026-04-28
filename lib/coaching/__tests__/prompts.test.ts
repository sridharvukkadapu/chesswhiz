import { buildCoachPrompt, FALLBACKS } from "../prompts";
import type { CoachRequest } from "../schema";

const baseReq: CoachRequest = {
  fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
  lastMove: { from: "e2", to: "e4", san: "e4" },
  mover: "player",
  trigger: "BLUNDER",
  centipawnDelta: 520,
  playerName: "Alex",
  ageBand: "8-10",
};

describe("buildCoachPrompt", () => {
  it("returns system and user strings", () => {
    const prompt = buildCoachPrompt(baseReq);
    expect(typeof prompt.system).toBe("string");
    expect(typeof prompt.user).toBe("string");
    expect(prompt.system.length).toBeGreaterThan(0);
    expect(prompt.user.length).toBeGreaterThan(0);
  });

  it("includes player name in system prompt", () => {
    const prompt = buildCoachPrompt({ ...baseReq, playerName: "Jordan" });
    expect(prompt.system).toContain("Jordan");
  });

  it("includes age-appropriate band in system prompt for age 5-7", () => {
    const prompt = buildCoachPrompt({ ...baseReq, ageBand: "5-7" });
    expect(prompt.system).toContain("5-7");
  });

  it("includes age-appropriate band in system prompt for age 11+", () => {
    const prompt = buildCoachPrompt({ ...baseReq, ageBand: "11+" });
    expect(prompt.system).toContain("11+");
  });

  it("includes trigger info in user prompt", () => {
    const prompt = buildCoachPrompt(baseReq);
    expect(prompt.user).toContain("BLUNDER");
  });

  it("FALLBACKS has entries for all trigger types", () => {
    const triggers = ["GREAT_MOVE", "OK_MOVE", "INACCURACY", "MISTAKE", "BLUNDER"];
    triggers.forEach((t) => {
      expect(FALLBACKS[t]).toBeDefined();
      expect(FALLBACKS[t].length).toBeGreaterThan(0);
    });
  });
});
