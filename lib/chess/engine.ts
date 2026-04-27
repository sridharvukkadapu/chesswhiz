import { Chess } from "chess.js";
import type { Move, GameStatus } from "./types";

export function getLegalMoves(chess: Chess, square?: string): Move[] {
  const verbose = chess.moves({ verbose: true, square: square as any });
  return verbose.map((m) => ({
    from: m.from,
    to: m.to,
    promotion: m.promotion as any,
  }));
}

export function applyMove(chess: Chess, move: Move): Chess {
  const next = new Chess(chess.fen());
  next.move({ from: move.from, to: move.to, promotion: move.promotion });
  return next;
}

export function getGameStatus(chess: Chess): GameStatus {
  if (chess.isCheckmate()) {
    return chess.turn() === "w" ? "black_wins" : "white_wins";
  }
  if (chess.isStalemate()) return "stalemate";
  if (chess.isDraw()) return "draw";
  return "playing";
}

export function moveToSAN(chess: Chess, move: Move): string {
  const clone = new Chess(chess.fen());
  const result = clone.move({ from: move.from, to: move.to, promotion: move.promotion });
  return result?.san ?? "";
}

export function toFEN(chess: Chess): string {
  return chess.fen();
}

// ─── Move classification ──────────────────────────────────────────
// Picks the single most "important" sound/haptic cue for what just
// happened, from the player's perspective (player is always white in
// ChessWhiz v1). Priority: end-of-game > check > castle > promotion
// > capture > plain move. Used by /play to drive sfx and haptics in
// one consistent place.

export type MoveSound =
  | "win" | "lose" | "draw"
  | "check" | "castle" | "promotion" | "capture" | "move";

export function classifyMoveSound(args: {
  san: string;
  status: GameStatus;
  inCheck: boolean; // chess.isCheck() AFTER the move
}): MoveSound {
  const { san, status, inCheck } = args;
  // Game-end takes priority. The player is white, so white_wins == win.
  if (status === "white_wins") return "win";
  if (status === "black_wins") return "lose";
  if (status === "stalemate" || status === "draw") return "draw";
  // Mid-game priority: check > castle > promotion > capture > move
  if (inCheck) return "check";
  if (san.includes("O-O")) return "castle";
  if (san.includes("=")) return "promotion";
  if (san.includes("x")) return "capture";
  return "move";
}
