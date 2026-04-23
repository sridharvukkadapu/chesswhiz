import { Chess } from "chess.js";
import { evaluate } from "../evaluation";

describe("evaluate", () => {
  it("returns 0 for starting position (balanced)", () => {
    const chess = new Chess();
    expect(evaluate(chess)).toBe(0);
  });

  it("returns positive score when white has material advantage", () => {
    // Remove black queen
    const chess = new Chess("rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(evaluate(chess)).toBeGreaterThan(0);
  });

  it("returns negative score when black has material advantage", () => {
    // Remove white queen
    const chess2 = new Chess("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1");
    expect(evaluate(chess2)).toBeLessThan(0);
  });
});
