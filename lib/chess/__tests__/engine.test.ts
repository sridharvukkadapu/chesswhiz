import { Chess } from "chess.js";
import { getLegalMoves, applyMove, getGameStatus, moveToSAN, toFEN } from "../engine";

describe("engine", () => {
  it("getLegalMoves returns all legal moves from starting position", () => {
    const chess = new Chess();
    const moves = getLegalMoves(chess);
    expect(moves).toHaveLength(20);
  });

  it("getLegalMoves filtered to square e2 returns 2 moves", () => {
    const chess = new Chess();
    const moves = getLegalMoves(chess, "e2");
    expect(moves).toHaveLength(2);
  });

  it("applyMove returns a new Chess instance without mutating the original", () => {
    const chess = new Chess();
    const original = chess.fen();
    const next = applyMove(chess, { from: "e2", to: "e4" });
    expect(chess.fen()).toBe(original);
    expect(next.fen()).not.toBe(original);
  });

  it("getGameStatus returns playing for starting position", () => {
    const chess = new Chess();
    expect(getGameStatus(chess)).toBe("playing");
  });

  it("getGameStatus returns black_wins for fool's mate", () => {
    const chess = new Chess();
    // Fool's mate: 1. f3 e5 2. g4 Qh4#
    chess.move("f3"); chess.move("e5");
    chess.move("g4"); chess.move("Qh4");
    expect(getGameStatus(chess)).toBe("black_wins");
  });

  it("moveToSAN returns correct notation", () => {
    const chess = new Chess();
    expect(moveToSAN(chess, { from: "e2", to: "e4" })).toBe("e4");
  });

  it("toFEN returns valid FEN string", () => {
    const chess = new Chess();
    expect(toFEN(chess)).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  });
});
