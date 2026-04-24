import { Chess } from "chess.js";
import { getLegalMoves, applyMove } from "@/lib/chess/engine";
import type { Move } from "@/lib/chess/types";
import type { TacticType } from "./types";

/**
 * Given a post-bot-move position, score how tactic-friendly it is for the
 * player (side-to-move after the bot plays). Higher = more teaching moments.
 *
 * The score is added to the bot's regular evaluation as a soft preference:
 * 20-50 centipawns, so it nudges the bot toward teaching positions without
 * making it play badly.
 */
export function tacticOpportunityBonus(
  postBotPosition: Chess,
  targetTactic: TacticType
): number {
  // Player is to move after the bot. Check how many of the player's moves
  // would create the target tactic.
  const playerMoves = getLegalMoves(postBotPosition);
  if (playerMoves.length === 0) return 0;

  let bonus = 0;

  switch (targetTactic) {
    case "fork":
      bonus = countForkOpportunities(postBotPosition, playerMoves);
      break;
    case "pin":
      bonus = countPinOpportunities(postBotPosition, playerMoves);
      break;
    case "skewer":
      bonus = countSkewerOpportunities(postBotPosition, playerMoves);
      break;
    case "back_rank_mate":
      bonus = countBackRankWeakness(postBotPosition);
      break;
    case "discovered_attack":
    case "double_check":
      bonus = countDiscoveryOpportunities(postBotPosition, playerMoves);
      break;
    default:
      bonus = 0;
  }

  // Clamp to the 20-50 range specified in the design doc.
  return Math.min(50, Math.max(0, bonus));
}

/**
 * Returns the number of legal player moves that would attack 2+ opponent
 * pieces from the landing square, scaled into a bonus.
 */
function countForkOpportunities(pos: Chess, moves: Move[]): number {
  let n = 0;
  for (const m of moves) {
    const next = applyMove(pos, m);
    const piece = next.get(m.to as never);
    if (!piece) continue;
    const attacksCount = countAttacksFrom(next, m.to);
    if (attacksCount >= 2) n++;
  }
  return n > 0 ? Math.min(50, 25 + n * 5) : 0;
}

function countPinOpportunities(pos: Chess, moves: Move[]): number {
  // Count moves that put a B/R/Q where it attacks an opponent piece with
  // a more valuable piece on the same line behind.
  let n = 0;
  for (const m of moves) {
    const next = applyMove(pos, m);
    const piece = next.get(m.to as never);
    if (!piece) continue;
    if (!["b", "r", "q"].includes(piece.type)) continue;
    if (rayPinFromSquare(next, m.to)) n++;
  }
  return n > 0 ? Math.min(45, 20 + n * 4) : 0;
}

function countSkewerOpportunities(pos: Chess, moves: Move[]): number {
  let n = 0;
  for (const m of moves) {
    const next = applyMove(pos, m);
    const piece = next.get(m.to as never);
    if (!piece) continue;
    if (!["b", "r", "q"].includes(piece.type)) continue;
    if (raySkewerFromSquare(next, m.to)) n++;
  }
  return n > 0 ? Math.min(45, 20 + n * 4) : 0;
}

function countBackRankWeakness(pos: Chess): number {
  // Bonus if the bot (black) has a weak back rank — pawns on 7th rank and
  // no luft. This makes back-rank mate puzzles possible for the player.
  // We're measuring the BLACK back rank (8th rank from white's POV).
  const board = pos.board();
  const king = findKing(pos, "b");
  if (!king) return 0;
  const { r, c } = king;
  if (r !== 0) return 0; // king not on back rank
  const pawnsInFront =
    (board[1][c]?.type === "p" && board[1][c]?.color === "b" ? 1 : 0) +
    (c > 0 && board[1][c - 1]?.type === "p" && board[1][c - 1]?.color === "b" ? 1 : 0) +
    (c < 7 && board[1][c + 1]?.type === "p" && board[1][c + 1]?.color === "b" ? 1 : 0);
  return pawnsInFront >= 2 ? 30 : 0;
}

function countDiscoveryOpportunities(pos: Chess, moves: Move[]): number {
  // Approximate: count moves by a piece that has a friendly slider directly
  // behind it (one of 8 directions). This is cheap and soft — we don't need
  // to verify the revealed attack actually hits a target.
  let n = 0;
  for (const m of moves) {
    if (hasFriendlySliderBehind(pos, m.from)) n++;
  }
  return n > 0 ? Math.min(40, 15 + n * 3) : 0;
}

// ── helpers ─────────────────────────────────────────────

function countAttacksFrom(pos: Chess, square: string): number {
  try {
    const parts = pos.fen().split(" ");
    const piece = pos.get(square as never);
    if (!piece) return 0;
    // Flip side-to-move so we can enumerate attack moves from this square.
    parts[1] = piece.color;
    parts[3] = "-";
    const alt = new Chess();
    try {
      alt.load(parts.join(" "));
    } catch {
      return 0;
    }
    const atks = alt.moves({ verbose: true, square: square as never });
    // Count captures and checks on opponent pieces
    const targets = new Set<string>();
    for (const a of atks) {
      if (a.captured) {
        const capturedType = a.captured as string;
        // Only count valuable targets (>= knight value)
        if (["n", "b", "r", "q", "k"].includes(capturedType)) {
          targets.add(a.to);
        }
      }
    }
    return targets.size;
  } catch {
    return 0;
  }
}

function findKing(pos: Chess, color: "w" | "b"): { r: number; c: number } | null {
  const board = pos.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === "k" && p.color === color) return { r, c };
    }
  }
  return null;
}

type Dir = { dr: number; dc: number };
const DIAG: Dir[] = [
  { dr: -1, dc: -1 }, { dr: -1, dc: 1 }, { dr: 1, dc: -1 }, { dr: 1, dc: 1 },
];
const ORTHO: Dir[] = [
  { dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
];

function sqToRC(sq: string): { r: number; c: number } {
  return { r: 8 - parseInt(sq[1], 10), c: sq.charCodeAt(0) - 97 };
}

function dirsFor(type: string): Dir[] {
  if (type === "b") return DIAG;
  if (type === "r") return ORTHO;
  if (type === "q") return [...DIAG, ...ORTHO];
  return [];
}

// Returns true if the slider on `from` finds a pin configuration along any ray.
function rayPinFromSquare(pos: Chess, from: string): boolean {
  const piece = pos.get(from as never);
  if (!piece) return false;
  const board = pos.board();
  const start = sqToRC(from);
  const opp = piece.color === "w" ? "b" : "w";

  const pieceValue: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };

  for (const dir of dirsFor(piece.type)) {
    let r = start.r + dir.dr;
    let c = start.c + dir.dc;
    let first: { type: string } | null = null;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p) {
        if (!first) {
          if (p.color !== opp) break;
          first = { type: p.type };
        } else {
          if (p.color === opp && (p.type === "k" || pieceValue[p.type] > pieceValue[first.type])) return true;
          break;
        }
      }
      r += dir.dr;
      c += dir.dc;
    }
  }
  return false;
}

function raySkewerFromSquare(pos: Chess, from: string): boolean {
  const piece = pos.get(from as never);
  if (!piece) return false;
  const board = pos.board();
  const start = sqToRC(from);
  const opp = piece.color === "w" ? "b" : "w";
  const pieceValue: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 };

  for (const dir of dirsFor(piece.type)) {
    let r = start.r + dir.dr;
    let c = start.c + dir.dc;
    let first: { type: string } | null = null;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p) {
        if (!first) {
          if (p.color !== opp) break;
          first = { type: p.type };
        } else {
          if (p.color === opp && (first.type === "k" || pieceValue[first.type] > pieceValue[p.type])) return true;
          break;
        }
      }
      r += dir.dr;
      c += dir.dc;
    }
  }
  return false;
}

function hasFriendlySliderBehind(pos: Chess, from: string): boolean {
  const piece = pos.get(from as never);
  if (!piece) return false;
  const board = pos.board();
  const start = sqToRC(from);
  const mine = piece.color;
  const all = [...DIAG, ...ORTHO];
  for (const dir of all) {
    let r = start.r + dir.dr;
    let c = start.c + dir.dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p) {
        if (p.color === mine) {
          const kindDiag = DIAG.some((d) => d.dr === dir.dr && d.dc === dir.dc);
          if (kindDiag && (p.type === "b" || p.type === "q")) return true;
          if (!kindDiag && (p.type === "r" || p.type === "q")) return true;
        }
        break;
      }
      r += dir.dr;
      c += dir.dc;
    }
  }
  return false;
}
