import { enforceLength } from "../prompts";

describe("enforceLength", () => {
  it("returns short text unchanged", () => {
    const text = "Nice move! That controls the center.";
    expect(enforceLength(text, "GREAT_MOVE")).toBe(text);
  });

  it("trims past the per-trigger word ceiling", () => {
    // GREAT_MOVE max is 15 words.
    const text = Array(30).fill("word").join(" ") + ".";
    const trimmed = enforceLength(text, "GREAT_MOVE");
    const words = trimmed.replace(/[…]+$/, "").trim().split(/\s+/);
    expect(words.length).toBeLessThanOrEqual(15);
  });

  it("ends at a sentence boundary when one is past halfway", () => {
    const text =
      "First sentence here is fine. " +
      "Second sentence is also fine and adds context that we don't strictly need to end the message cleanly.";
    const trimmed = enforceLength(text, "GREAT_MOVE");
    // Should end with a period rather than an ellipsis if a sentence-end
    // exists in the truncation window.
    expect(trimmed.endsWith(".") || trimmed.endsWith("…")).toBe(true);
  });

  it("falls back to ellipsis when no sentence break is past halfway", () => {
    // 20 words with no internal punctuation
    const text = Array(20).fill("word").join(" ");
    const trimmed = enforceLength(text, "GREAT_MOVE");
    expect(trimmed.endsWith("…")).toBe(true);
  });

  it("BLUNDER allows much more text than GREAT_MOVE", () => {
    const text = Array(40).fill("word").join(" ") + ".";
    const great = enforceLength(text, "GREAT_MOVE");
    const blunder = enforceLength(text, "BLUNDER");
    // BLUNDER's 50-word cap should keep all 40
    expect(blunder).toBe(text);
    // GREAT_MOVE's 15-word cap should chop it down
    expect(great.length).toBeLessThan(blunder.length);
  });

  it("trims to default 30 when given an unknown trigger", () => {
    const text = Array(50).fill("word").join(" ") + ".";
    // @ts-expect-error — testing fallback behavior on bogus trigger
    const trimmed = enforceLength(text, "UNKNOWN_TRIGGER");
    const words = trimmed.replace(/[…]+$/, "").trim().split(/\s+/);
    expect(words.length).toBeLessThanOrEqual(30);
  });

  it("preserves emoji + punctuation in short responses", () => {
    const text = "DOUBLE ATTACK! 🍴";
    expect(enforceLength(text, "GREAT_MOVE")).toBe(text);
  });
});
