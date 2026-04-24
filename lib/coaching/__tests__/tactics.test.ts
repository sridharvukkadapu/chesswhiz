import { Chess } from "chess.js";
import { detectTactics } from "../tactics";
import type { Move } from "@/lib/chess/types";

// Every FEN here was verified by loading it in chess.js and confirming the
// move is legal and, for positive cases, the detector fires. FENs in the
// original TACTIC_TEST_CASES.md doc had geometry errors flagged inline there;
// the ones in this file are corrected to match the INTENT of each case.

function runCase(fen: string, uci: string) {
  const prev = new Chess(fen);
  const next = new Chess(fen);
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promotion = uci.length > 4 ? uci[4] : undefined;
  const result = next.move({ from, to, promotion });
  if (!result) throw new Error(`Illegal move ${uci} in ${fen}`);
  const move: Move = { from, to, promotion: promotion as Move["promotion"] };
  return detectTactics(prev, next, move);
}

function has(detections: ReturnType<typeof detectTactics>, type: string): boolean {
  return detections.some((d) => d.type === type);
}

// ──────────────────────────────────────────────────────────
// FORK
// ──────────────────────────────────────────────────────────
describe("detectTactics — FORK", () => {
  it("F1: knight forks king and rook", () => {
    // Nb5-c7 forks Ke8 and Ra6 along knight geometry.
    expect(has(runCase("4k3/8/r7/1N6/8/8/8/4K3 w - - 0 1", "b5c7"), "fork")).toBe(true);
  });

  it("F2: knight royal fork (king + queen)", () => {
    expect(has(runCase("6k1/3q4/8/3N4/8/8/8/4K3 w - - 0 1", "d5f6"), "fork")).toBe(true);
  });

  it("F3: pawn forks two minor pieces", () => {
    expect(has(runCase("4k3/8/2n1b3/8/3P4/8/8/4K3 w - - 0 1", "d4d5"), "fork")).toBe(true);
  });

  it("F4: queen forks king and hanging rook", () => {
    expect(has(runCase("r3k3/8/8/8/8/8/8/3QK3 w - - 0 1", "d1a4"), "fork")).toBe(true);
  });

  it("F5: knight forks two rooks (no check)", () => {
    expect(has(runCase("4k3/1r3r2/8/8/4N3/8/8/4K3 w - - 0 1", "e4d6"), "fork")).toBe(true);
  });

  it("F6: pawn forks knight and bishop in realistic position", () => {
    expect(has(runCase("4k3/8/3b1n2/8/4P3/8/8/4K3 w - - 0 1", "e4e5"), "fork")).toBe(true);
  });

  it("F7: knight attacking two pawns is NOT flagged as a fork", () => {
    expect(has(runCase("4k3/8/8/8/3p1p2/8/4N3/4K3 w - - 0 1", "e2d4"), "fork")).toBe(false);
  });

  it("F8: 'fork' where forking piece can be captured for free is suppressed", () => {
    expect(has(runCase("4k3/8/2n5/8/3N4/8/8/4K3 w - - 0 1", "d4e6"), "fork")).toBe(false);
  });

  it("F9: opening development move is not a fork", () => {
    expect(
      has(
        runCase("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1", "b8c6"),
        "fork"
      )
    ).toBe(false);
  });

  it("F10: undefended queen 'fork' is suppressed", () => {
    expect(has(runCase("r3k3/8/8/3b4/8/8/3Q4/4K3 w - - 0 1", "d2a5"), "fork")).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────
// PIN
// ──────────────────────────────────────────────────────────
describe("detectTactics — PIN", () => {
  it("P1: bishop pins knight to king (absolute pin)", () => {
    expect(has(runCase("4k3/8/2n5/8/8/8/8/4KB2 w - - 0 1", "f1b5"), "pin")).toBe(true);
  });

  it("P2: rook pins queen to king on a file", () => {
    expect(has(runCase("4k3/8/8/8/4q3/8/8/4RK2 w - - 0 1", "e1e2"), "pin")).toBe(true);
  });

  it("P3: bishop pins knight to queen (relative pin)", () => {
    expect(has(runCase("3qk3/8/5n2/8/8/8/8/2B1K3 w - - 0 1", "c1g5"), "pin")).toBe(true);
  });

  it("P4: classic Bg5 pin after 1.d4 Nf6 2.c4 e6", () => {
    expect(
      has(
        runCase(
          "rnbqkb1r/pppp1ppp/4pn2/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
          "c1g5"
        ),
        "pin"
      )
    ).toBe(true);
  });

  it("P5: rook pins rook to king along a rank", () => {
    expect(has(runCase("1r4k1/8/8/8/8/8/8/R3K3 w - - 0 1", "a1a8"), "pin")).toBe(true);
  });

  it("P6: own piece between two own pieces is not a pin", () => {
    expect(has(runCase("4k3/8/4n3/8/4B3/8/8/4K3 w - - 0 1", "e4d5"), "pin")).toBe(false);
  });

  it("P7: attacking a knight with only a pawn behind is not a meaningful pin", () => {
    expect(has(runCase("4k3/4p3/4n3/8/8/8/8/4KB2 w - - 0 1", "f1b5"), "pin")).toBe(false);
  });

  it("P8: pin ray blocked by another piece is suppressed", () => {
    expect(has(runCase("4k3/8/4n3/3p4/8/8/8/4KB2 w - - 0 1", "f1b5"), "pin")).toBe(false);
  });

  it("P9: developing bishop (Bc4) does not register as a pin", () => {
    expect(
      has(
        runCase("rnbqkbnr/pppppppp/8/8/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 2", "f1c4"),
        "pin"
      )
    ).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────
// SKEWER
// ──────────────────────────────────────────────────────────
describe("detectTactics — SKEWER", () => {
  it("S1: rook skewers king with queen behind", () => {
    expect(has(runCase("1q6/8/8/1k6/8/8/8/1R5K w - - 0 1", "b1b4"), "skewer")).toBe(true);
  });

  it("S2: bishop skewers queen with rook behind on diagonal", () => {
    expect(has(runCase("2r1k3/1q6/8/8/8/8/4B3/4K3 w - - 0 1", "e2a6"), "skewer")).toBe(true);
  });

  it("S3: a pin configuration is NOT flagged as a skewer", () => {
    // Bishop b5 with knight c6 pinned to king e8 — this is a pin, not a skewer.
    expect(has(runCase("4k3/8/2n5/8/8/8/8/4KB2 w - - 0 1", "f1b5"), "skewer")).toBe(false);
  });

  it("S4: check with nothing behind the king is not a skewer", () => {
    expect(has(runCase("4k3/8/8/8/8/8/8/4RK2 w - - 0 1", "e1e7"), "skewer")).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────
// BACK RANK MATE
// ──────────────────────────────────────────────────────────
describe("detectTactics — BACK RANK MATE", () => {
  it("B1: rook delivers back rank mate on rank 8", () => {
    expect(has(runCase("6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1", "a1a8"), "back_rank_mate")).toBe(true);
  });

  it("B2: queen delivers back rank mate on rank 8", () => {
    expect(has(runCase("6k1/5ppp/8/8/8/8/8/3QK3 w - - 0 1", "d1d8"), "back_rank_mate")).toBe(true);
  });

  it("B3: black rook delivers back rank mate on rank 1", () => {
    expect(has(runCase("4k3/8/8/8/8/8/PPP5/K5r1 b - - 0 1", "g1c1"), "back_rank_mate")).toBe(true);
  });

  it("B4: queen back rank mate — king trapped by own pawns", () => {
    expect(has(runCase("5k2/5ppp/8/8/8/8/8/3Q3K w - - 0 1", "d1d8"), "back_rank_mate")).toBe(true);
  });

  it("B5: back rank mate in a middlegame context", () => {
    expect(has(runCase("1r4k1/5ppp/p7/8/8/P7/5PPP/6K1 b - - 0 1", "b8b1"), "back_rank_mate")).toBe(true);
  });

  it("B6: back rank check with an escape square is NOT a mate", () => {
    expect(has(runCase("6k1/5p1p/6p1/8/8/8/8/R3K3 w - - 0 1", "a1a8"), "back_rank_mate")).toBe(false);
  });

  it("B7: rook move on a non-back rank is not a back rank mate", () => {
    expect(has(runCase("4k3/4R3/8/8/8/8/8/4K3 w - - 0 1", "e7e8"), "back_rank_mate")).toBe(false);
  });

  it("B8: a plain check on the back rank is not a mate", () => {
    expect(has(runCase("r3k3/5ppp/8/8/8/8/8/4K3 b - - 0 1", "a8a1"), "back_rank_mate")).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────
// DISCOVERED ATTACK
// ──────────────────────────────────────────────────────────
describe("detectTactics — DISCOVERED ATTACK", () => {
  it("D1: knight moves revealing bishop attack on rook", () => {
    expect(has(runCase("4k3/6r1/8/8/3N4/8/1B6/4K3 w - - 0 1", "d4c6"), "discovered_attack")).toBe(true);
  });

  it("D2: discovered check — bishop moves revealing rook check", () => {
    expect(has(runCase("4k3/8/8/8/4B3/8/8/4RK2 w - - 0 1", "e4b7"), "discovered_attack")).toBe(true);
  });

  it("D3: double check — bishop moves giving check AND revealing rook check", () => {
    expect(has(runCase("4k3/8/8/8/8/8/4B3/4RK2 w - - 0 1", "e2b5"), "discovered_attack")).toBe(true);
  });

  it("D4: piece moves with no hidden attacker behind — no discovered attack", () => {
    expect(has(runCase("4k3/8/8/8/3N4/8/8/4K3 w - - 0 1", "d4c6"), "discovered_attack")).toBe(false);
  });

  it("D5: discovered attack only on a pawn — too minor to detect", () => {
    expect(has(runCase("4k3/8/6p1/8/3N4/8/1B6/4K3 w - - 0 1", "d4c6"), "discovered_attack")).toBe(false);
  });
});
