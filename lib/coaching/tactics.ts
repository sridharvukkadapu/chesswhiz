import { Chess } from "chess.js";
import type { Move, PieceType, Color } from "@/lib/chess/types";
import type { TacticDetection } from "@/lib/progression/types";

// ── Helpers ────────────────────────────────────────────

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 100,
};

function cv(piece: PieceType): number {
  return PIECE_VALUES[piece] * 100; // centipawns
}

function opposite(color: Color): Color {
  return color === "w" ? "b" : "w";
}

/**
 * Return all squares that a given piece-on-square attacks right now in the
 * given position. Uses chess.js internals by asking for all verbose moves
 * from that square (including captures), plus an extra pass to include
 * attack squares that are defended by the opponent (chess.js filters these
 * out of its own moves but they still count for attacks).
 *
 * Because chess.js `moves({ square })` only returns moves for the side to
 * move, for attack detection we temporarily flip the side-to-move with a
 * constructed FEN.
 */
function squaresAttackedBy(fen: string, from: string): string[] {
  try {
    const tmp = new Chess(fen);
    // If it's not this piece's turn, rebuild FEN with flipped side-to-move.
    const piece = tmp.get(from as never);
    if (!piece) return [];
    if (piece.color !== tmp.turn()) {
      const parts = fen.split(" ");
      parts[1] = piece.color;
      // Clear en-passant to avoid ghost attacks
      parts[3] = "-";
      const alt = new Chess();
      try {
        alt.load(parts.join(" "));
      } catch {
        return [];
      }
      return alt
        .moves({ verbose: true, square: from as never })
        .map((m) => m.to);
    }
    return tmp.moves({ verbose: true, square: from as never }).map((m) => m.to);
  } catch {
    return [];
  }
}

/**
 * Is the given square attacked by any piece of `by` color in the position?
 */
function isSquareAttackedBy(chess: Chess, square: string, by: Color): boolean {
  // chess.js provides .isAttacked(square, color) in recent versions.
  // Fall back to manual scan if not available.
  const c = chess as unknown as { isAttacked?: (sq: string, col: Color) => boolean };
  if (typeof c.isAttacked === "function") {
    return c.isAttacked(square, by);
  }
  // Manual fallback: probe all squares of `by` color.
  const board = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let cc = 0; cc < 8; cc++) {
      const p = board[r][cc];
      if (p && p.color === by) {
        const fromSq = "abcdefgh"[cc] + (8 - r);
        const attacks = squaresAttackedBy(chess.fen(), fromSq);
        if (attacks.includes(square)) return true;
      }
    }
  }
  return false;
}

/**
 * List opponent pieces attacked by the given piece-on-square after the move.
 * Returns [{ square, type, value }].
 */
function piecesAttackedFrom(
  chess: Chess,
  from: string
): { square: string; type: PieceType; value: number }[] {
  const attacks = squaresAttackedBy(chess.fen(), from);
  const piece = chess.get(from as never);
  if (!piece) return [];
  const mine = piece.color;
  const result: { square: string; type: PieceType; value: number }[] = [];
  for (const sq of attacks) {
    const target = chess.get(sq as never);
    if (target && target.color !== mine) {
      result.push({ square: sq, type: target.type as PieceType, value: cv(target.type as PieceType) });
    }
  }
  return result;
}

// ── Fork detection ─────────────────────────────────────
//
// After the player's move, check if the moved piece attacks 2+ opponent
// pieces simultaneously. The fork "counts" only if:
//   - It wins material on balance, OR
//   - One of the forked targets is the king (royal fork — king MUST move).

function detectFork(chess: Chess, move: Move): TacticDetection | null {
  const attacks = piecesAttackedFrom(chess, move.to);
  if (attacks.length < 2) return null;

  // Sort targets by value descending.
  const sorted = [...attacks].sort((a, b) => b.value - a.value);
  const hasKing = sorted.some((t) => t.type === "k");

  // Count targets worth at least a minor piece (3+) OR the king.
  // A real fork needs two valuable targets — a "fork" on king + one pawn is just a check.
  const valuableTargets = sorted.filter((t) => t.value >= 300 || t.type === "k");
  if (valuableTargets.length < 2) return null;

  // Is the forking piece itself defended, or can it be captured for free?
  const forker = chess.get(move.to as never);
  if (!forker) return null;
  const opponent = opposite(forker.color);
  const forkerUnderAttack = isSquareAttackedBy(chess, move.to, opponent);

  // Attacker defended? (by any friendly piece)
  const forkerDefended = isSquareAttackedBy(chess, move.to, forker.color);

  // Estimated material won: biggest non-king target, minus risk of losing the forker.
  const biggest = sorted.find((t) => t.type !== "k");
  const materialWon = biggest ? biggest.value : 0;
  const forkerValue = cv(forker.type as PieceType);

  // If the forker is hanging and worth more than the biggest target (and no king forked), skip.
  if (forkerUnderAttack && !forkerDefended && !hasKing && forkerValue > materialWon) {
    return null;
  }

  const targetNames = sorted
    .map((t) => `${pieceName(t.type)} on ${t.square}`)
    .join(" and ");
  const details = hasKing
    ? `Royal fork! Your ${pieceName(forker.type as PieceType)} attacks the king and ${targetNames.replace(/king on [a-h][1-8] and /, "")}.`
    : `Fork! Your ${pieceName(forker.type as PieceType)} on ${move.to} attacks ${targetNames}.`;

  return {
    type: "fork",
    detected: true,
    details,
    materialWon,
    attackerSquare: move.to,
    targetSquares: sorted.map((t) => t.square),
  };
}

// ── Pin detection ──────────────────────────────────────
//
// A pin exists when a sliding piece (B/R/Q) attacks along a ray, and the
// first opponent piece on that ray is blocking a more valuable piece
// (or the king) behind it on the same ray.

type Dir = { dr: number; dc: number };
const BISHOP_DIRS: Dir[] = [
  { dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 },
];
const ROOK_DIRS: Dir[] = [
  { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
];

function sqToRC(sq: string): { r: number; c: number } {
  return { r: 8 - parseInt(sq[1], 10), c: sq.charCodeAt(0) - 97 };
}

function rcToSq(r: number, c: number): string {
  return "abcdefgh"[c] + (8 - r);
}

function dirsForPiece(type: PieceType): Dir[] {
  if (type === "b") return BISHOP_DIRS;
  if (type === "r") return ROOK_DIRS;
  if (type === "q") return [...BISHOP_DIRS, ...ROOK_DIRS];
  return [];
}

function detectPin(chess: Chess, move: Move): TacticDetection | null {
  const attacker = chess.get(move.to as never);
  if (!attacker) return null;
  if (!["b", "r", "q"].includes(attacker.type)) return null;

  const start = sqToRC(move.to);
  const board = chess.board();
  const opp = opposite(attacker.color);

  for (const dir of dirsForPiece(attacker.type as PieceType)) {
    let r = start.r + dir.dr;
    let c = start.c + dir.dc;
    let firstPiece: { sq: string; type: PieceType; color: Color } | null = null;

    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const sq = rcToSq(r, c);
      const p = board[r][c];
      if (p) {
        if (!firstPiece) {
          // The first piece along the ray
          if (p.color !== opp) break; // blocked by own piece — no pin
          firstPiece = { sq, type: p.type as PieceType, color: p.color as Color };
        } else {
          // The second piece — if it's an opponent piece worth more (or is king), it's a pin
          if (p.color === opp) {
            const pinnedValue = cv(firstPiece.type);
            const backValue = cv(p.type as PieceType);
            const isKingBehind = p.type === "k";
            if (isKingBehind) {
              // Absolute pin — always meaningful, even if pinning a pawn
              return {
                type: "pin",
                detected: true,
                details: `Absolute pin! Your ${pieceName(attacker.type as PieceType)} on ${move.to} pins the ${pieceName(firstPiece.type)} on ${firstPiece.sq} to the king.`,
                materialWon: pinnedValue,
                attackerSquare: move.to,
                pinnedSquare: firstPiece.sq,
                behindSquare: sq,
              };
            }
            // Relative pin — require the PINNED piece to be worth ≥3 (minor piece or higher).
            // Pinning a pawn to a minor piece is noise (pawn wasn't going anywhere).
            if (backValue > pinnedValue && pinnedValue >= 300) {
              return {
                type: "pin",
                detected: true,
                details: `Relative pin! Your ${pieceName(attacker.type as PieceType)} on ${move.to} pins the ${pieceName(firstPiece.type)} to the ${pieceName(p.type as PieceType)} behind it.`,
                materialWon: pinnedValue,
                attackerSquare: move.to,
                pinnedSquare: firstPiece.sq,
                behindSquare: sq,
              };
            }
          }
          break;
        }
      }
      r += dir.dr;
      c += dir.dc;
    }
  }
  return null;
}

// ── Skewer detection ───────────────────────────────────
//
// Same ray geometry as a pin, but the MORE valuable piece (or king) is in
// FRONT, and a less valuable piece is behind. When the front piece moves,
// the back piece gets captured.

function detectSkewer(chess: Chess, move: Move): TacticDetection | null {
  const attacker = chess.get(move.to as never);
  if (!attacker) return null;
  if (!["b", "r", "q"].includes(attacker.type)) return null;

  const start = sqToRC(move.to);
  const board = chess.board();
  const opp = opposite(attacker.color);

  for (const dir of dirsForPiece(attacker.type as PieceType)) {
    let r = start.r + dir.dr;
    let c = start.c + dir.dc;
    let firstPiece: { sq: string; type: PieceType; color: Color } | null = null;

    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p) {
        if (!firstPiece) {
          if (p.color !== opp) break;
          firstPiece = { sq: rcToSq(r, c), type: p.type as PieceType, color: p.color as Color };
        } else {
          if (p.color === opp) {
            const frontValue = cv(firstPiece.type);
            const backValue = cv(p.type as PieceType);
            const isKingFront = firstPiece.type === "k";
            // Skewer: front piece is MORE valuable (or king) than back piece,
            // and back piece is worth at least a minor piece (don't celebrate skewering to pawns).
            const meaningful = backValue >= 300;
            if ((isKingFront || frontValue > backValue) && meaningful) {
              const backSq = rcToSq(r, c);
              return {
                type: "skewer",
                detected: true,
                details: `Skewer! Your ${pieceName(attacker.type as PieceType)} on ${move.to} forces the ${pieceName(firstPiece.type)} to move, exposing the ${pieceName(p.type as PieceType)} behind it.`,
                materialWon: backValue,
                attackerSquare: move.to,
                frontSquare: firstPiece.sq,
                backSquare: backSq,
              };
            }
          }
          break;
        }
      }
      r += dir.dr;
      c += dir.dc;
    }
  }
  return null;
}

// ── Discovered attack detection ────────────────────────
//
// After the player moves a piece off a ray, check whether a friendly
// sliding piece (B/R/Q) BEHIND the "from" square now attacks something
// valuable (≥3) along that freshly-opened line.
//
// Sub-types:
//   - "discovered_check" — the revealed attack hits the opponent king
//   - "double_check"     — BOTH the moving piece and the revealed piece
//                          give check

function detectDiscoveredAttack(
  chess: Chess,
  move: Move
): TacticDetection | null {
  const mover = chess.get(move.to as never);
  if (!mover) return null;

  const from = sqToRC(move.from);
  const board = chess.board();
  const myColor = mover.color as Color;
  const oppColor = opposite(myColor);

  // For each of the 8 possible sliding directions, see if our piece moving
  // off "from" revealed a friendly B/R/Q attacking an opponent piece.
  const allDirs: { dir: Dir; kind: "diag" | "ortho" }[] = [
    ...BISHOP_DIRS.map((d) => ({ dir: d, kind: "diag" as const })),
    ...ROOK_DIRS.map((d) => ({ dir: d, kind: "ortho" as const })),
  ];

  for (const { dir, kind } of allDirs) {
    // Walk "backward" from `from` in the opposite direction to find the
    // friendly slider that was hidden behind us.
    let r = from.r - dir.dr;
    let c = from.c - dir.dc;
    let revealer: { sq: string; type: PieceType } | null = null;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p) {
        if (p.color === myColor) {
          const isDiagSlider = p.type === "b" || p.type === "q";
          const isOrthoSlider = p.type === "r" || p.type === "q";
          if ((kind === "diag" && isDiagSlider) || (kind === "ortho" && isOrthoSlider)) {
            revealer = { sq: rcToSq(r, c), type: p.type as PieceType };
          }
        }
        break;
      }
      r -= dir.dr;
      c -= dir.dc;
    }
    if (!revealer) continue;

    // Now walk FORWARD from `from` in the original direction to find the
    // first piece the revealer is now attacking.
    r = from.r + dir.dr;
    c = from.c + dir.dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p) {
        if (p.color === oppColor) {
          const targetValue = cv(p.type as PieceType);
          const isKing = p.type === "k";
          // Only fire on targets worth ≥3 or the king.
          if (isKing || targetValue >= 300) {
            // Double check? — the moving piece ALSO gives check.
            const moverGivesCheck = chess.isCheck() && moverAttacksKing(chess, move.to, oppColor);
            const revealedIsCheck = isKing;
            const sub = revealedIsCheck && moverGivesCheck ? "double check" : revealedIsCheck ? "discovered check" : "discovered attack";
            return {
              type: "discovered_attack",
              detected: true,
              details: `${sub[0].toUpperCase() + sub.slice(1)}! Your ${pieceName(mover.type as PieceType)} moved off the line, revealing your ${pieceName(revealer.type)} on ${revealer.sq} attacking the ${pieceName(p.type as PieceType)} on ${rcToSq(r, c)}.`,
              materialWon: isKing ? 10000 : targetValue,
            };
          }
        }
        break;
      }
      r += dir.dr;
      c += dir.dc;
    }
  }

  return null;
}

// Helper: does the piece on `sq` attack the opponent king?
function moverAttacksKing(chess: Chess, sq: string, oppColor: Color): boolean {
  const board = chess.board();
  let kingSq: string | null = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === "k" && p.color === oppColor) {
        kingSq = rcToSq(r, c);
        break;
      }
    }
    if (kingSq) break;
  }
  if (!kingSq) return false;
  return squaresAttackedBy(chess.fen(), sq).includes(kingSq);
}

// ── Back rank mate detection ──────────────────────────
//
// Checkmate where:
//   - It IS checkmate
//   - The mating piece is a rook or queen
//   - The king is on its back rank (rank 1 for black, rank 8 for white)
//   - The king is blocked in by its own pawns/pieces

function detectBackRankMate(chess: Chess, move: Move): TacticDetection | null {
  if (!chess.isCheckmate()) return null;

  const mover = chess.get(move.to as never);
  if (!mover) return null;
  if (mover.type !== "r" && mover.type !== "q") return null;

  // The king being mated is the side-to-move (can't escape).
  const losingColor = chess.turn() as Color;
  const kingRank = losingColor === "w" ? "1" : "8";
  // Find the losing king
  const board = chess.board();
  let kingSq: string | null = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === "k" && p.color === losingColor) {
        kingSq = rcToSq(r, c);
        break;
      }
    }
    if (kingSq) break;
  }
  if (!kingSq || !kingSq.endsWith(kingRank)) return null;

  // Must be delivered along the back rank
  if (!move.to.endsWith(kingRank)) return null;

  return {
    type: "back_rank_mate",
    detected: true,
    details: `Back rank mate! The enemy king was trapped on its own back rank with nowhere to run.`,
    materialWon: 10000, // checkmate
  };
}

// ── Pretty piece names ─────────────────────────────────
function pieceName(t: PieceType): string {
  return { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" }[t];
}

// ── Main entry point ──────────────────────────────────
export function detectTactics(
  _prevState: Chess,
  newState: Chess,
  move: Move
): TacticDetection[] {
  const results: TacticDetection[] = [];

  const backRank = detectBackRankMate(newState, move);
  if (backRank) results.push(backRank);

  const fork = detectFork(newState, move);
  if (fork) results.push(fork);

  const pin = detectPin(newState, move);
  if (pin) results.push(pin);

  const skewer = detectSkewer(newState, move);
  if (skewer) results.push(skewer);

  const discovered = detectDiscoveredAttack(newState, move);
  if (discovered) results.push(discovered);

  return results;
}
