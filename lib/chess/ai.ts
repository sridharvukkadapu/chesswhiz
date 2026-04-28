import { Chess } from "chess.js";
import { evaluate } from "./evaluation";
import { getLegalMoves, applyMove } from "./engine";
import type { Move, Difficulty } from "./types";
import type { TacticType } from "@/lib/progression/types";
import { tacticOpportunityBonus } from "@/lib/progression/bot-tuning";

// Opening book — keyed by FEN position hash (first 2 space-separated FEN fields).
// Responses are weighted SAN moves; pick randomly among them to vary play.
// Covers first 6 half-moves for common openings. Prevents 1.a4-style nonsense.
function fenKey(chess: Chess): string {
  return chess.fen().split(" ").slice(0, 4).join(" ");
}

const BOOK: Record<string, string[]> = {
  // After 1.e4 (black to move)
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -": ["e5", "e5", "e5", "c5", "e6"],
  // After 1.d4 (black to move)
  "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq -": ["d5", "d5", "Nf6", "Nf6"],
  // After 1.e4 e5 2.Nf3 (black to move)
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq -": ["Nc6", "Nc6", "Nf6", "d6"],
  // After 1.e4 c5 2.Nf3 (black to move)
  "rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq -": ["d6", "Nc6", "e6"],
  // After 1.d4 d5 (white to move)
  "rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": ["c4", "Nf3", "c4"],
  // After 1.d4 Nf6 (white to move)
  "rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq -": ["c4", "Nf3"],
  // After 1.e4 e5 2.Nf3 Nc6 (white to move)
  "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq -": ["Bc4", "Bb5", "d4"],
};

function lookupBook(chess: Chess): Move | null {
  const key = fenKey(chess);
  const options = BOOK[key];
  if (!options || options.length === 0) return null;
  const san = options[Math.floor(Math.random() * options.length)];
  try {
    const clone = new Chess(chess.fen());
    const result = clone.move(san);
    if (!result) return null;
    return { from: result.from, to: result.to, promotion: result.promotion as Move["promotion"] };
  } catch {
    return null;
  }
}

function minimax(chess: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  const moves = getLegalMoves(chess);
  if (depth === 0 || moves.length === 0) {
    if (moves.length === 0) {
      if (chess.isCheckmate()) return maximizing ? -99999 : 99999;
      return 0;
    }
    return evaluate(chess);
  }

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      best = Math.max(best, minimax(applyMove(chess, move), depth - 1, alpha, beta, false));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      best = Math.min(best, minimax(applyMove(chess, move), depth - 1, alpha, beta, true));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

// Worker pool: one persistent worker reused across moves.
let _worker: Worker | null = null;
let _workerReady = false;

function getWorker(): Worker | null {
  if (typeof window === "undefined") return null;
  if (_worker) return _worker;
  try {
    _worker = new Worker(new URL("./engine.worker.ts", import.meta.url), { type: "module" });
    _workerReady = true;
  } catch {
    _worker = null;
  }
  return _worker;
}

function findBestMoveViaWorker(
  chess: Chess,
  difficulty: Difficulty,
  tacticPreference?: TacticType,
): Promise<Move | null> {
  return new Promise((resolve) => {
    const worker = getWorker();
    if (!worker) {
      resolve(null);
      return;
    }
    const onMsg = (e: MessageEvent<import("./engine.worker").FindMoveResponse>) => {
      worker.removeEventListener("message", onMsg);
      worker.removeEventListener("error", onErr);
      resolve(e.data.move);
    };
    const onErr = () => {
      worker.removeEventListener("message", onMsg);
      worker.removeEventListener("error", onErr);
      _worker = null;
      _workerReady = false;
      resolve(null);
    };
    worker.addEventListener("message", onMsg);
    worker.addEventListener("error", onErr);
    worker.postMessage({
      fen: chess.fen(),
      difficulty,
      tacticPreference,
      historyLength: chess.history().length,
    } satisfies import("./engine.worker").FindMoveRequest);
  });
}

// When `tacticPreference` is provided, the bot gets a soft (20-50cp) bonus
// for moves that leave positions where the player could execute that tactic.
export async function findBestMove(
  chess: Chess,
  difficulty: Difficulty,
  tacticPreference?: TacticType
): Promise<Move | null> {
  const moves = getLegalMoves(chess);
  if (moves.length === 0) return null;

  // Delegate to Web Worker for medium/hard; it handles book + minimax.
  // Easy stays on main thread (it's instant — just random selection).
  if (difficulty >= 2 && _workerReady !== false && typeof window !== "undefined") {
    const workerMove = await findBestMoveViaWorker(chess, difficulty, tacticPreference);
    if (workerMove !== null) return workerMove;
    // Worker failed — fall through to main-thread path
  }

  // Opening book: use for medium/hard on first 6 half-moves
  if (difficulty >= 2 && chess.history().length < 6) {
    const bookMove = lookupBook(chess);
    if (bookMove) return bookMove;
  }

  if (difficulty === 1) {
    // Easy: mostly random, occasionally captures
    await yieldToBrowser();
    const captures = moves.filter((m) => {
      const clone = new Chess(chess.fen());
      const result = clone.move({ from: m.from, to: m.to });
      return result?.captured != null;
    });
    if (captures.length > 0 && Math.random() < 0.4) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth = difficulty === 2 ? 2 : 3;
  const isMax = chess.turn() === "w";
  let bestScore = isMax ? -Infinity : Infinity;
  let bestMoves: Move[] = [];

  for (const move of moves) {
    // Yield between each root move so the browser stays responsive
    await yieldToBrowser();
    const afterBot = applyMove(chess, move);
    let score = minimax(afterBot, depth - 1, -Infinity, Infinity, !isMax);

    // Soft tactic-opportunity bonus for missions. The student (the other
    // side) should get tactic-friendly setups. Scores are from white's POV
    // (higher=better for white); bot is typically black (minimizer). We
    // nudge the bot to PICK tactic-friendly moves by making those moves
    // look slightly better for it (lower score when bot is minimizer,
    // higher when bot is maximizer). 20-50cp is subtle enough that the bot
    // still plays real chess.
    if (tacticPreference) {
      const bonus = tacticOpportunityBonus(afterBot, tacticPreference);
      score = isMax ? score + bonus : score - bonus;
    }

    if ((isMax && score > bestScore) || (!isMax && score < bestScore)) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  if (difficulty === 2 && Math.random() < 0.15) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)] ?? null;
}

// Use scheduler.yield() when available (Chrome 115+), fall back to setTimeout(0)
function yieldToBrowser(): Promise<void> {
  if (typeof (globalThis as any).scheduler?.yield === "function") {
    return (globalThis as any).scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}
