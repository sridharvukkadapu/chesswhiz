import { enforceLength, enforceLengthByTrigger } from "../prompts";

describe("enforceLength (ageBand-based)", () => {
  it("returns short text unchanged for 11+ band (280 char limit)", () => {
    const text = "Nice move! That controls the center.";
    expect(enforceLength(text, "11+")).toBe(text);
  });

  it("trims past the 5-7 band char ceiling (120 chars)", () => {
    const text = "x".repeat(200);
    const trimmed = enforceLength(text, "5-7");
    expect(trimmed.length).toBeLessThanOrEqual(120 + 1); // +1 for ellipsis
  });

  it("trims past the 8-10 band char ceiling (200 chars)", () => {
    const text = "x".repeat(300);
    const trimmed = enforceLength(text, "8-10");
    expect(trimmed.length).toBeLessThanOrEqual(201);
  });

  it("does not trim 11+ band text under 280 chars", () => {
    const text = "word ".repeat(40).trim(); // ~200 chars
    expect(enforceLength(text, "11+")).toBe(text);
  });
});

describe("enforceLengthByTrigger (legacy word-based)", () => {
  it("returns short text unchanged", () => {
    const text = "Nice move! That controls the center.";
    expect(enforceLengthByTrigger(text, "GREAT_MOVE")).toBe(text);
  });

  it("trims past the per-trigger word ceiling", () => {
    const text = Array(30).fill("word").join(" ") + ".";
    const trimmed = enforceLengthByTrigger(text, "GREAT_MOVE");
    const words = trimmed.replace(/[…]+$/, "").trim().split(/\s+/);
    expect(words.length).toBeLessThanOrEqual(15);
  });

  it("BLUNDER allows much more text than GREAT_MOVE", () => {
    const text = Array(40).fill("word").join(" ") + ".";
    const great = enforceLengthByTrigger(text, "GREAT_MOVE");
    const blunder = enforceLengthByTrigger(text, "BLUNDER");
    expect(blunder).toBe(text);
    expect(great.length).toBeLessThan(blunder.length);
  });

  it("preserves emoji + punctuation in short responses", () => {
    const text = "DOUBLE ATTACK! 🍴";
    expect(enforceLengthByTrigger(text, "GREAT_MOVE")).toBe(text);
  });
});
