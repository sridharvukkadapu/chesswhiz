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
