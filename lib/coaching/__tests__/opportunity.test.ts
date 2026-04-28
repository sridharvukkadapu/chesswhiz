import { Chess } from "chess.js";
import { analyzeOpportunities } from "../opportunity";

describe("analyzeOpportunities", () => {
  it("returns null for a quiet starting position", () => {
    const chess = new Chess();
    expect(analyzeOpportunities(chess, "w")).toBeNull();
  });

  it("detects a hanging enemy piece", () => {
    // Black knight on e5, undefended, white can capture
    const chess = new Chess("4k3/8/8/4n3/8/8/8/R3K3 w Q - 0 1");
    const result = analyzeOpportunities(chess, "w");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("hanging_piece");
  });

  it("detects mate in 1 for the kid", () => {
    // Scholar's mate setup — white queen h5, bishop c4, black king e8
    const chess = new Chess("r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4");
    const result = analyzeOpportunities(chess, "w");
    expect(result).not.toBeNull();
    expect(result!.type).toBe("mate_in_1");
  });

  it("returns null when no opportunities exist", () => {
    // Closed position after e4, black to scan — no obvious tactics
    const chess = new Chess("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1");
    expect(analyzeOpportunities(chess, "b")).toBeNull();
  });
});
