export type Color = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type GameStatus = "playing" | "white_wins" | "black_wins" | "stalemate" | "draw";
export type TriggerType = "GREAT_MOVE" | "OK_MOVE" | "INACCURACY" | "MISTAKE" | "BLUNDER";
export type Difficulty = 1 | 2 | 3;

export interface Piece {
  type: PieceType;
  color: Color;
}

export interface Square {
  r: number;
  c: number;
}

export interface Move {
  from: string; // chess.js square notation e.g. "e2"
  to: string;
  promotion?: PieceType;
}

export interface LastMove {
  from: string;
  to: string;
}

export interface MoveAnalysis {
  trigger: TriggerType;
  severity: 0 | 1 | 2 | 3 | 4;
  san: string;
  bestSAN: string;
  diff: number;
  piece: PieceType;
  captured: PieceType | null;
  isHanging: boolean;
  eval: number;
  tactics?: import("@/lib/progression/types").TacticDetection[];
}

export interface CoachMessage {
  id: string;
  type: "intro" | "praise" | "tip" | "correction" | "celebration";
  text: string;
}

// ── Board annotations ──────────────────────────────────
// Visual overlays that illustrate what Coach Pawn just said. Drawn as
// an SVG layer on top of the board, fade in/out automatically.

export type AnnotationColor = "green" | "red" | "yellow" | "blue";

export interface SquareHighlight {
  square: string;
  color: AnnotationColor;
  opacity?: number;
}

export interface BoardArrow {
  from: string;
  to: string;
  color: AnnotationColor;
  opacity?: number;
}

export interface BoardCircle {
  square: string;
  color: AnnotationColor;
}

export interface BoardAnnotation {
  highlights?: SquareHighlight[];
  arrows?: BoardArrow[];
  circles?: BoardCircle[];
  duration?: number; // ms; default 5000
  // Richer visual elements from the prototype
  heroSquare?: string;        // Key piece — gets an expanding halo ring
  heroColor?: AnnotationColor;
  threatSquares?: string[];   // Squares that pulse red (threatened pieces)
  targetSquares?: string[];   // Squares that pulse green (capturable)
  dangerSquares?: string[];   // Diagonal-stripe danger zone (hanging piece, blocked escape)
  cageSquares?: string[];     // Trapped-piece indicator with X mark
  influenceSquares?: string[]; // Small dots showing piece control
  influenceColor?: AnnotationColor;
}

export interface CoachPrompt {
  system: string;
  user: string;
}
