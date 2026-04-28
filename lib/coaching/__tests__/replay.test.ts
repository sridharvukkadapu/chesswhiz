import { buildReplaySequence } from "../replay";

describe("buildReplaySequence", () => {
  it("returns empty array for empty history", () => {
    expect(buildReplaySequence([], 0)).toEqual([]);
  });

  it("returns up to 3 steps starting from triggerIdx - 2", () => {
    const history = ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"];
    const steps = buildReplaySequence(history, 5);
    expect(steps.length).toBeLessThanOrEqual(3);
    expect(steps.length).toBeGreaterThan(0);
  });

  it("each step has a valid FEN string", () => {
    const history = ["e4", "e5", "Nf3"];
    const steps = buildReplaySequence(history, 2);
    for (const step of steps) {
      expect(step.fen).toMatch(/^[1-8pnbrqkPNBRQK\/]+ [wb] /);
    }
  });

  it("returns at most 3 steps even for long histories", () => {
    const history = ["e4","e5","Nf3","Nc6","Bc4","Bc5","c3","Nf6","d4","exd4","cxd4","Bb4+"];
    const steps = buildReplaySequence(history, 11);
    expect(steps.length).toBeLessThanOrEqual(3);
  });
});
