// components/TrialBoard.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { Chess } from "chess.js";
import { Piece, PieceDefs } from "@/components/ChessPieces";
import type { PieceType as ChessPieceType } from "@/components/ChessPieces";
import { T } from "@/lib/design/tokens";
import type { PieceKind } from "@/lib/trial/types";

// ── Types ────────────────────────────────────────────────────

export type TrialBoardMode =
  | "tap-square"    // Round 1: tap a named square
  | "multi-select"  // Round 2: tap all squares a piece can reach
  | "move"          // Rounds 3–5: tap piece, then tap destination
  | "arrows";       // Round 5: pre-drawn arrows, tap one

export interface ArrowOption {
  id: string;
  from: string;
  to: string;
  label: string;
}

export interface TrialBoardProps {
  mode: TrialBoardMode;
  fen?: string;                      // position to display (default: empty board)
  highlightSquares?: string[];       // squares highlighted as targets (shown in purple)
  _correctSquare?: string;           // shown briefly after wrong tap
  onSquareTap?: (sq: string) => void; // mode: tap-square
  // multi-select
  selectedSquares?: string[];
  expectedCount?: number;            // for "N of M squares found" counter
  onSquareToggle?: (sq: string) => void;
  onSubmit?: () => void;
  // move
  legalMoveSquares?: string[];       // destinations highlighted after piece tap
  onPieceTap?: (sq: string) => void;
  onMoveTap?: (sq: string) => void;
  selectedPiece?: string | null;
  // arrows
  arrows?: ArrowOption[];
  onArrowTap?: (id: string) => void;
  selectedArrow?: string | null;
  // feedback
  flashSquare?: { sq: string; type: "correct" | "wrong" } | null;
  // check detection overlay (Round 3)
  showCheckButtons?: boolean;
  onCheckAnswer?: (isCheck: boolean) => void;
}

const COLS = "abcdefgh";
function squareFromRC(r: number, c: number) { return COLS[c] + (8 - r); }
function rcFromSquare(sq: string) {
  return { r: 8 - parseInt(sq[1], 10), c: sq.charCodeAt(0) - 97 };
}
const CHESS_TO_PIECE_TYPE: Record<string, ChessPieceType> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
};

const LIGHT_SQ = "#F0D9B5";
const DARK_SQ  = "#B58863";

export default function TrialBoard({
  mode,
  fen = "8/8/8/8/8/8/8/8 w - - 0 1",
  highlightSquares = [],
  _correctSquare,
  onSquareTap,
  selectedSquares = [],
  expectedCount,
  onSquareToggle,
  onSubmit,
  legalMoveSquares = [],
  onPieceTap,
  onMoveTap,
  selectedPiece,
  arrows = [],
  onArrowTap,
  selectedArrow,
  flashSquare,
  showCheckButtons,
  onCheckAnswer,
}: TrialBoardProps) {
  const chess = new Chess(fen);
  const board = chess.board();

  const [flashState, setFlashState] = useState<{ sq: string; type: "correct" | "wrong" } | null>(null);

  useEffect(() => {
    if (!flashSquare) return;
    setFlashState(flashSquare);
    const t = setTimeout(() => setFlashState(null), flashSquare.type === "correct" ? 200 : 300);
    return () => clearTimeout(t);
  }, [flashSquare]);

  const handleSquareClick = useCallback((sq: string) => {
    if (mode === "tap-square") onSquareTap?.(sq);
    else if (mode === "multi-select") onSquareToggle?.(sq);
    else if (mode === "move") {
      if (selectedPiece) onMoveTap?.(sq);
      else onPieceTap?.(sq);
    }
  }, [mode, selectedPiece, onSquareTap, onSquareToggle, onPieceTap, onMoveTap]);

  const boardSize = 320;
  const sqSize = boardSize / 8;

  return (
    <div style={{ position: "relative", width: boardSize, userSelect: "none" }}>
      <PieceDefs />
      <svg width={boardSize} height={boardSize} style={{ display: "block", borderRadius: 6, overflow: "hidden" }}>
        {/* Squares */}
        {Array.from({ length: 8 }, (_, r) =>
          Array.from({ length: 8 }, (_, c) => {
            const sq = squareFromRC(r, c);
            const isLight = (r + c) % 2 === 0;
            const isSelected = selectedSquares.includes(sq);
            const isLegal = legalMoveSquares.includes(sq);
            const isHighlight = highlightSquares.includes(sq);
            const isPieceSelected = selectedPiece === sq;
            const flash = flashState?.sq === sq ? flashState.type : null;

            let fill = isLight ? LIGHT_SQ : DARK_SQ;
            if (isHighlight || isSelected) fill = "rgba(139,92,246,0.45)";
            if (isLegal) fill = "rgba(52,211,153,0.45)";
            if (isPieceSelected) fill = "rgba(251,191,36,0.55)";
            if (flash === "correct") fill = "rgba(52,211,153,0.85)";
            if (flash === "wrong") fill = "rgba(239,68,68,0.65)";

            return (
              <rect
                key={sq}
                x={c * sqSize}
                y={r * sqSize}
                width={sqSize}
                height={sqSize}
                fill={fill}
                style={{ cursor: "pointer", transition: "fill 150ms" }}
                onClick={() => handleSquareClick(sq)}
              />
            );
          })
        )}

        {/* Coordinate labels */}
        {Array.from({ length: 8 }, (_, i) => (
          <g key={`coord-${i}`}>
            <text
              x={i * sqSize + sqSize - 4}
              y={boardSize - 3}
              fontSize={9}
              textAnchor="end"
              fill={i % 2 === 0 ? DARK_SQ : LIGHT_SQ}
              style={{ pointerEvents: "none" }}
            >
              {COLS[i]}
            </text>
            <text
              x={3}
              y={i * sqSize + 11}
              fontSize={9}
              fill={i % 2 === 0 ? LIGHT_SQ : DARK_SQ}
              style={{ pointerEvents: "none" }}
            >
              {8 - i}
            </text>
          </g>
        ))}

        {/* Arrow overlays (Round 5) */}
        {mode === "arrows" && arrows.map((arrow) => {
          const from = rcFromSquare(arrow.from);
          const to = rcFromSquare(arrow.to);
          const x1 = from.c * sqSize + sqSize / 2;
          const y1 = from.r * sqSize + sqSize / 2;
          const x2 = to.c * sqSize + sqSize / 2;
          const y2 = to.r * sqSize + sqSize / 2;
          const isChosen = selectedArrow === arrow.id;
          const color = isChosen ? "#F59E0B" : "rgba(99,102,241,0.75)";
          const arrowId = `arrowhead-${arrow.id}`;
          return (
            <g key={arrow.id} onClick={() => onArrowTap?.(arrow.id)} style={{ cursor: "pointer" }}>
              <defs>
                <marker id={arrowId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 Z" fill={color} />
                </marker>
              </defs>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={color}
                strokeWidth={isChosen ? 6 : 4}
                markerEnd={`url(#${arrowId})`}
                opacity={0.9}
              />
            </g>
          );
        })}

        {/* Pieces */}
        {board.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) return null;
            const sq = squareFromRC(r, c);
            const pieceType = CHESS_TO_PIECE_TYPE[cell.type] ?? "pawn";
            const color = cell.color === "w" ? "white" : "black";
            const x = c * sqSize;
            const y = r * sqSize;
            return (
              <g
                key={sq}
                transform={`translate(${x},${y})`}
                style={{ cursor: mode === "move" ? "pointer" : "default" }}
                onClick={() => handleSquareClick(sq)}
              >
                <Piece
                  type={pieceType}
                  color={color}
                  size={sqSize}
                />
              </g>
            );
          })
        )}
      </svg>

      {/* Multi-select counter */}
      {mode === "multi-select" && selectedSquares.length > 0 && expectedCount !== undefined && (
        <div style={{
          marginTop: 8,
          textAlign: "center",
          fontFamily: T.fontUI,
          fontSize: 14,
          fontWeight: 600,
          color: T.inkLow,
        }}>
          {selectedSquares.length} of {expectedCount} squares found
        </div>
      )}

      {/* Submit button (multi-select) */}
      {mode === "multi-select" && selectedSquares.length > 0 && onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          style={{
            marginTop: 10,
            width: "100%",
            padding: "12px 0",
            background: T.coral,
            color: "#FFFCF5",
            border: "none",
            borderRadius: 100,
            fontFamily: T.fontUI,
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          That's all of them!
        </button>
      )}

      {/* Check detection buttons (Round 3) */}
      {showCheckButtons && onCheckAnswer && (
        <div style={{
          display: "flex",
          gap: 8,
          marginTop: 8,
        }}>
          <button
            type="button"
            onClick={() => onCheckAnswer(true)}
            style={{
              flex: 1,
              padding: "12px 0",
              background: "#D1FAE5",
              border: "2px solid #34D399",
              borderRadius: 8,
              fontFamily: T.fontUI,
              fontSize: 15,
              fontWeight: 700,
              color: "#065F46",
              cursor: "pointer",
            }}
          >
            ✓ Yes, check!
          </button>
          <button
            type="button"
            onClick={() => onCheckAnswer(false)}
            style={{
              flex: 1,
              padding: "12px 0",
              background: "#FEE2E2",
              border: "2px solid #F87171",
              borderRadius: 8,
              fontFamily: T.fontUI,
              fontSize: 15,
              fontWeight: 700,
              color: "#7F1D1D",
              cursor: "pointer",
            }}
          >
            ✗ No check
          </button>
        </div>
      )}
    </div>
  );
}
