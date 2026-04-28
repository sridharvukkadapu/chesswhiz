import { Chess } from "chess.js";
import type { Color, PieceType } from "@/lib/chess/types";
import { detectTactics } from "@/lib/coaching/tactics";

export interface OpportunityResult {
  type: "hanging_piece" | "fork" | "pin" | "mate_in_1" | "bot_threat";
  details: string;
  triggerType: "TACTIC_AVAILABLE" | "BOT_TACTIC_INCOMING";
  materialWon?: number;
  squares?: string[];
}

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 100,
};

function opposite(color: Color): Color {
  return color === "w" ? "b" : "w";
}

function isOnStartingSquare(square: string, type: PieceType, color: Color): boolean {
  const backRank = color === "w" ? "1" : "8";
  const pawnRank = color === "w" ? "2" : "7";
  if (type === "p" && square[1] === pawnRank) return true;
  if (["n", "b", "r", "q", "k"].includes(type) && square[1] === backRank) return true;
  return false;
}

/**
 * Count how many pieces of `attackerColor` can legally capture on `square`.
 * We temporarily place an enemy piece on the square (so chess.js allows captures),
 * flip side-to-move to `attackerColor`, and count how many legal moves land on it.
 */
function countCapturersOf(
  chess: Chess,
  square: string,
  attackerColor: Color
): number {
  const fen = chess.fen();
  const parts = fen.split(" ");
  // Replace the piece on the square with an enemy piece so captures are legal.
  // We use a queen of the opposite color as the "bait" piece.
  const enemyColor = opposite(attackerColor);
  const tmp = new Chess(fen);
  // Place an enemy queen on the target square
  tmp.remove(square as never);
  tmp.put({ type: "q", color: enemyColor }, square as never);
  // Build FEN with attackerColor to move
  const newFen = tmp.fen().split(" ");
  newFen[1] = attackerColor;
  newFen[3] = "-";
  const probe = new Chess();
  try { probe.load(newFen.join(" ")); } catch { return 0; }
  return probe.moves({ verbose: true })
    .filter((m) => m.to === square)
    .length;
}

function countAttackersAndDefenders(
  chess: Chess,
  square: string,
  botColor: Color
): { attackers: number; defenders: number } {
  const kidColor = opposite(botColor);
  return {
    attackers: countCapturersOf(chess, square, kidColor),
    defenders: countCapturersOf(chess, square, botColor),
  };
}

export function analyzeOpportunities(
  chess: Chess,
  kidColor: Color
): OpportunityResult | null {
  const botColor = opposite(kidColor);
  const board = chess.board();
  const pieceNames: Record<PieceType, string> = {
    p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
  };

  // ── 1. Hanging enemy piece ───────────────────────────
  let bestHanging: { square: string; value: number; type: PieceType } | null = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== botColor || p.type === "k") continue;
      const val = PIECE_VALUES[p.type as PieceType];
      if (val < 3) continue; // ignore pawns
      const sq = "abcdefgh"[c] + (8 - r);
      // Skip pieces still on their starting square (noise — they haven't moved out)
      if (isOnStartingSquare(sq, p.type as PieceType, botColor)) continue;
      const { attackers, defenders } = countAttackersAndDefenders(chess, sq, botColor);
      if (defenders === 0) {
        if (!bestHanging || val > bestHanging.value) {
          bestHanging = { square: sq, value: val, type: p.type as PieceType };
        }
      }
    }
  }
  if (bestHanging) {
    return {
      type: "hanging_piece",
      triggerType: "TACTIC_AVAILABLE",
      details: `The bot's ${pieceNames[bestHanging.type]} on ${bestHanging.square} is undefended — can you take it?`,
      materialWon: bestHanging.value * 100,
      squares: [bestHanging.square],
    };
  }

  // ── 2–4. Scan kid's active non-pawn pieces ──────────
  // Priority: fork (2) → pin (3) → mate_in_1 (4).
  // We collect the best result per tier and return the highest hit.
  // Mate_in_1 is checked last but returned with higher priority than fork/pin
  // because checkmate is the ultimate teaching moment (tests confirm this ordering).
  const candidates: { square: string; type: PieceType }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== kidColor || p.type === "p" || p.type === "k") continue;
      const sq = "abcdefgh"[c] + (8 - r);
      if (isOnStartingSquare(sq, p.type as PieceType, kidColor)) continue;
      candidates.push({ square: sq, type: p.type as PieceType });
      if (candidates.length >= 8) break;
    }
    if (candidates.length >= 8) break;
  }

  // Collect best result per priority bucket, then return highest.
  let mateResult: OpportunityResult | null = null;
  let forkResult: OpportunityResult | null = null;
  let pinResult: OpportunityResult | null = null;

  for (const candidate of candidates) {
    const legalMoves = chess.moves({ verbose: true, square: candidate.square as never });
    for (const lm of legalMoves) {
      if (lm.piece === "p") continue;

      const clone = new Chess(chess.fen());
      clone.move(lm);

      // Check for mate in 1
      if (clone.isCheckmate() && !mateResult) {
        mateResult = {
          type: "mate_in_1",
          triggerType: "TACTIC_AVAILABLE",
          details: `There's a checkmate available! Can you find it?`,
          materialWon: 99999,
          squares: [lm.from, lm.to],
        };
        // Highest possible priority — short-circuit entire scan
        return mateResult;
      }

      if (forkResult && pinResult) continue; // already have both lower-priority results

      const tactics = detectTactics(chess, clone, { from: lm.from, to: lm.to });
      for (const t of tactics) {
        if (!t.detected) continue;
        if (t.type === "fork" && !forkResult) {
          forkResult = {
            type: "fork",
            triggerType: "TACTIC_AVAILABLE",
            details: t.details,
            materialWon: t.materialWon,
            squares: (t as { targetSquares?: string[] }).targetSquares ?? [],
          };
        }
        if (t.type === "pin" && !pinResult) {
          pinResult = {
            type: "pin",
            triggerType: "TACTIC_AVAILABLE",
            details: t.details,
            materialWon: t.materialWon,
          };
        }
      }
    }
  }

  // Return highest priority result found (mate > fork > pin)
  if (mateResult) return mateResult;
  if (forkResult) return forkResult;
  if (pinResult) return pinResult;

  // ── 5. Bot threat ────────────────────────────────────
  const botCandidates: { square: string; type: PieceType }[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p.color !== botColor || p.type === "p" || p.type === "k") continue;
      const sq = "abcdefgh"[c] + (8 - r);
      if (isOnStartingSquare(sq, p.type as PieceType, botColor)) continue;
      botCandidates.push({ square: sq, type: p.type as PieceType });
      if (botCandidates.length >= 8) break;
    }
    if (botCandidates.length >= 8) break;
  }

  const fenParts = chess.fen().split(" ");
  fenParts[1] = botColor;
  fenParts[3] = "-";
  const botTurnChess = new Chess();
  try { botTurnChess.load(fenParts.join(" ")); } catch { return null; }

  for (const candidate of botCandidates) {
    const legalMoves = botTurnChess.moves({ verbose: true, square: candidate.square as never });
    for (const lm of legalMoves) {
      if (lm.piece === "p") continue;
      const clone = new Chess(botTurnChess.fen());
      clone.move(lm);
      if (clone.isCheckmate()) {
        return {
          type: "bot_threat",
          triggerType: "BOT_TACTIC_INCOMING",
          details: `The bot can checkmate you! Look carefully at what it's setting up.`,
        };
      }
      const tactics = detectTactics(botTurnChess, clone, { from: lm.from, to: lm.to });
      for (const t of tactics) {
        if (t.detected && (t.type === "fork" || t.type === "pin")) {
          return {
            type: "bot_threat",
            triggerType: "BOT_TACTIC_INCOMING",
            details: `Watch out — the bot is setting up a ${t.type}! Can you stop it?`,
          };
        }
      }
    }
  }

  return null;
}
