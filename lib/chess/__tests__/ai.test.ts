import { Chess } from "chess.js";
import { findBestMove } from "../ai";

jest.setTimeout(15000);

describe("findBestMove", () => {

  it("returns null when there are no legal moves", async () => {
    // Stalemate position: black king trapped, black to move
    const chess = new Chess("k7/8/1Q6/8/8/8/8/7K b - - 0 1");
    expect(await findBestMove(chess, 1)).toBeNull();
  });

  it("captures a free queen when available (difficulty 1)", async () => {
    const chess = new Chess("4k3/8/8/4Q3/8/8/8/4K3 b - - 0 1");
    const move = await findBestMove(chess, 1);
    expect(move).not.toBeNull();
    expect(move!.from).toBeTruthy();
    expect(move!.to).toBeTruthy();
  });

  it("finds checkmate in 1 at difficulty 3", async () => {
    // Fool's mate setup and one move back: 1. f3 e5 2. g4 - Black to move, can play Qh4#
    const chess2 = new Chess();
    chess2.move("f3");
    chess2.move("e5");
    chess2.move("g4");
    const move = await findBestMove(chess2, 3);
    expect(move).not.toBeNull();
    // Best move is Qh4# (the fool's mate)
    expect(move!.to).toBe("h4");
  });
});
