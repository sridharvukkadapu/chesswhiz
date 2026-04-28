import type { LearnerModel } from "@/lib/learner/types";

export interface DailyPuzzle {
  fen: string;
  solution: string;
  concept: string;
  hint: string;
  title: string;
}

const PUZZLE_BANK: Record<string, Array<[string, string, string]>> = {
  fork: [
    ["r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4", "Nd5", "Can your knight attack the queen AND a rook at the same time?"],
    ["r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "Nxe5", "Look for a knight move that attacks two pieces at once!"],
  ],
  pin: [
    ["r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4", "Bxf7+", "Can your bishop pin something to the king?"],
  ],
  hanging_piece: [
    ["r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3", "Nxe5", "Is there a piece that isn't protected? Take it!"],
    ["rnbqkb1r/pppp1ppp/5n2/4p3/4PP2/8/PPPP2PP/RNBQKBNR w KQkq - 1 3", "fxe5", "Look for a piece with no defenders — it's free material!"],
  ],
  skewer: [
    ["4k3/8/8/8/8/8/4R3/4K3 w - - 0 1", "Re8+", "Drive the king away with a check — what's hiding behind it?"],
  ],
  back_rank_mate: [
    ["6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1", "Ra8#", "The king is trapped behind its own pawns — can you deliver checkmate?"],
  ],
};

const CONCEPT_PRIORITY = ["hanging_piece", "fork", "pin", "skewer", "back_rank_mate"];

function selectConcept(model: LearnerModel): string {
  const introduced = model.conceptsIntroduced;
  if (introduced.length === 0) return "hanging_piece";
  const withPuzzles = introduced
    .filter((c) => PUZZLE_BANK[c.conceptId])
    .sort((a, b) => a.score - b.score);
  if (withPuzzles.length > 0) return withPuzzles[0].conceptId;
  return CONCEPT_PRIORITY.find((c) => PUZZLE_BANK[c]) ?? "fork";
}

function deterministicIndex(playerId: string, date: Date, length: number): number {
  const dateStr = date.toISOString().slice(0, 10);
  const seed = `${playerId}-${dateStr}`;
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h) ^ seed.charCodeAt(i);
    h >>>= 0;
  }
  return h % length;
}

export function getDailyPuzzle(model: LearnerModel, date: Date = new Date()): DailyPuzzle | null {
  const concept = selectConcept(model);
  const puzzles = PUZZLE_BANK[concept];
  if (!puzzles || puzzles.length === 0) return null;

  const idx = deterministicIndex(model.playerId, date, puzzles.length);
  const [fen, solution, hint] = puzzles[idx];

  const conceptLabels: Record<string, string> = {
    fork: "Today's Fork!",
    pin: "Today's Pin!",
    hanging_piece: "Spot the Free Piece!",
    skewer: "Today's Skewer!",
    back_rank_mate: "Back Rank Alert!",
    discovered_attack: "Discovery Time!",
  };

  return { fen, solution, concept, hint, title: conceptLabels[concept] ?? "Today's Puzzle!" };
}
