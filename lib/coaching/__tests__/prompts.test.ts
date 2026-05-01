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

describe("buildCoachPrompt — concept gating", () => {
  const gatingBase: CoachRequest = {
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    lastMove: { from: "e2", to: "e4", san: "e4" },
    mover: "player",
    trigger: "TACTIC_AVAILABLE",
    playerName: "Alex",
    ageBand: "8-10",
  };

  it("stage 2 with fork opportunityDetail — user prompt does not contain 'fork'", () => {
    const prompt = buildCoachPrompt({
      ...gatingBase,
      learningStage: 2,
      opportunityDetail: { type: "fork", details: "knight forks king and rook", squares: ["c3"] },
    });
    expect(prompt.user).not.toMatch(/\bfork\b/i);
  });

  it("stage 4 with fork opportunityDetail — user prompt contains 'fork'", () => {
    const prompt = buildCoachPrompt({
      ...gatingBase,
      learningStage: 4,
      opportunityDetail: { type: "fork", details: "knight can fork king and rook", squares: ["c3"] },
    });
    expect(prompt.user).toContain("fork");
  });

  it("stage 3 — system prompt contains 'Concept ceiling — Stage 3'", () => {
    const prompt = buildCoachPrompt({ ...gatingBase, learningStage: 3 });
    expect(prompt.system).toContain("Concept ceiling — Stage 3");
  });

  it("stage 3 — system prompt lists 'check' in the allowed list", () => {
    const prompt = buildCoachPrompt({ ...gatingBase, learningStage: 3 });
    expect(prompt.system).toContain("check");
  });

  it("stage 3 — system prompt does not list 'fork' in the allowed list (only in DO NOT section)", () => {
    const prompt = buildCoachPrompt({ ...gatingBase, learningStage: 3 });
    const lines = prompt.system.split("\n");
    const allowedLine = lines.find((l) => l.startsWith("Concept ceiling"));
    expect(allowedLine).toBeDefined();
    const mayReferencePart = allowedLine!.split("Do NOT")[0];
    expect(mayReferencePart).not.toMatch(/\bfork\b/i);
  });

  it("no learningStage field — system prompt defaults to Stage 3", () => {
    const prompt = buildCoachPrompt({ ...gatingBase });
    expect(prompt.system).toContain("Stage 3");
  });

  it("stage 2 — TACTIC_AVAILABLE trigger desc does not contain 'fork' when fork is in tacticsAvailableForKid", () => {
    const prompt = buildCoachPrompt({
      ...gatingBase,
      learningStage: 2,
      tacticsAvailableForKid: ["fork"],
    });
    expect(prompt.user).not.toMatch(/\bfork\b/i);
  });
});
