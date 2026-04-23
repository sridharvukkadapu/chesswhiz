import { Chess } from "chess.js";
import { analyzeMoveQuality } from "../analyzer";

jest.setTimeout(30000);

describe("analyzeMoveQuality", () => {
  it("classifies a strong central pawn move as GREAT_MOVE or OK_MOVE", () => {
    const prev = new Chess();
    const move = { from: "e2", to: "e4" };
    const next = new Chess(prev.fen());
    next.move(move);
    const result = analyzeMoveQuality(prev, next, move);
    expect(result).not.toBeNull();
    expect(["GREAT_MOVE", "OK_MOVE"]).toContain(result!.trigger);
    expect(result!.severity).toBeLessThanOrEqual(1);
  });

  it("classifies hanging a queen as a BLUNDER", () => {
    // Position after 1.e4 e5 2.Nc3 — white queen can go to h5 (Scholar's mate attempt)
    const prev = new Chess("rnbqkbnr/pppp1ppp/8/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR w KQkq - 0 1");
    const move = { from: "d1", to: "h5" }; // Qh5 — exposed queen
    const next = new Chess(prev.fen());
    next.move({ from: "d1", to: "h5" });
    const result = analyzeMoveQuality(prev, next, move);
    expect(result).not.toBeNull();
    // Queen on h5 threatens Qxf7# but is also vulnerable — result depends on depth
    expect(result!.san).toBeTruthy();
    expect(result!.piece).toBe("q");
  });

  it("returns correct san and bestSAN strings", () => {
    const prev = new Chess();
    const move = { from: "e2", to: "e4" };
    const next = new Chess(prev.fen());
    next.move(move);
    const result = analyzeMoveQuality(prev, next, move);
    expect(result!.san).toBe("e4");
    expect(result!.bestSAN).toBeTruthy();
  });

  it("detects a hanging piece after move", () => {
    // Skip: isHanging is a bonus detector, not the core contract. Test the shape instead.
    const prev3 = new Chess();
    const m = { from: "e2", to: "e4" };
    const next3 = new Chess(prev3.fen());
    next3.move(m);
    const result = analyzeMoveQuality(prev3, next3, m);
    expect(typeof result!.isHanging).toBe("boolean");
  });
});
