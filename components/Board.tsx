"use client";

import { Chess } from "chess.js";
import type { Move, LastMove, Square } from "@/lib/chess/types";

const PIECE_CHARS: Record<string, string> = {
  wK: "♔", wQ: "♕", wR: "♖", wB: "♗", wN: "♘", wP: "♙",
  bK: "♚", bQ: "♛", bR: "♜", bB: "♝", bN: "♞", bP: "♟",
};

const COLS = "abcdefgh";

function squareFromRC(r: number, c: number): string {
  return COLS[c] + (8 - r);
}

interface BoardProps {
  chess: Chess;
  selected: Square | null;
  legalHighlights: Move[];
  lastMove: LastMove | null;
  showPromo: Move | null;
  status: string;
  botThinking: boolean;
  onSquareClick: (r: number, c: number) => void;
  onPromo: (piece: string) => void;
}

export default function Board({
  chess, selected, legalHighlights, lastMove,
  showPromo, status, botThinking, onSquareClick, onPromo,
}: BoardProps) {
  const board = chess.board();
  const inCheck = chess.isCheck();
  const turn = chess.turn();

  return (
    <div className="relative">
      {/* Outer glow ring */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 24px 64px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.5)",
        }}
      >
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(8, 1fr)",
            gridTemplateRows: "repeat(8, 1fr)",
            width: "min(calc(100vw - 24px), 480px)",
            height: "min(calc(100vw - 24px), 480px)",
            touchAction: "manipulation",
          }}
        >
          {Array.from({ length: 64 }, (_, i) => {
            const r = Math.floor(i / 8);
            const c = i % 8;
            const isLight = (r + c) % 2 === 0;
            const piece = board[r][c];
            const sq = squareFromRC(r, c);

            const isSelected = selected?.r === r && selected?.c === c;
            const isLegal = legalHighlights.some((m) => m.to === sq);
            const isCaptureLegal = isLegal && !!piece;
            const isLastFrom = lastMove?.from === sq;
            const isLastTo = lastMove?.to === sq;
            const isLast = isLastFrom || isLastTo;
            const isCheckKing = inCheck && piece?.type === "k" && piece.color === turn;

            // Base square color — warm wood tones
            let bgBase: string;
            if (isSelected) bgBase = isLight ? "#4a7c3f" : "#355c2c";
            else if (isLast) bgBase = isLight ? "#c9a227" : "#9e7d1a";
            else bgBase = isLight ? "#f0d9b5" : "#b58863";

            const clickable =
              status === "playing" &&
              !botThinking &&
              (piece?.color === "w" || isLegal);

            return (
              <div
                key={i}
                onClick={() => onSquareClick(r, c)}
                className={`flex items-center justify-center relative select-none ${isLight ? "board-square-light" : "board-square-dark"} ${isLastTo ? "square-land" : ""}`}
                style={{
                  background: bgBase,
                  cursor: clickable ? "pointer" : "default",
                  transition: "background 0.12s ease",
                }}
              >
                {/* Check king highlight */}
                {isCheckKing && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "radial-gradient(circle at 50% 45%, rgba(220,38,38,0.65) 0%, rgba(220,38,38,0.2) 55%, transparent 75%)",
                    }}
                  />
                )}

                {/* Selected square inner vignette */}
                {isSelected && (
                  <div
                    className="absolute inset-0"
                    style={{
                      boxShadow: "inset 0 0 0 3px rgba(255,255,255,0.25)",
                      borderRadius: 0,
                    }}
                  />
                )}

                {/* Rank numbers (left edge) */}
                {c === 0 && (
                  <span
                    className="absolute top-0.5 left-1 text-[10px] font-bold leading-none select-none pointer-events-none"
                    style={{
                      color: isLight ? "#b58863" : "#f0d9b5",
                      opacity: 0.85,
                      fontFamily: "var(--font-nunito), sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {8 - r}
                  </span>
                )}

                {/* File letters (bottom edge) */}
                {r === 7 && (
                  <span
                    className="absolute bottom-0.5 right-1 text-[10px] font-bold leading-none select-none pointer-events-none"
                    style={{
                      color: isLight ? "#b58863" : "#f0d9b5",
                      opacity: 0.85,
                      fontFamily: "var(--font-nunito), sans-serif",
                      fontWeight: 700,
                    }}
                  >
                    {COLS[c]}
                  </span>
                )}

                {/* Legal move dot */}
                {isLegal && !isCaptureLegal && (
                  <div
                    className="rounded-full"
                    style={{
                      width: "28%",
                      height: "28%",
                      background: "rgba(0,0,0,0.2)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                )}

                {/* Legal capture ring */}
                {isCaptureLegal && (
                  <div
                    className="absolute inset-[3%] rounded-full pointer-events-none"
                    style={{
                      border: "3.5px solid rgba(0,0,0,0.24)",
                    }}
                  />
                )}

                {/* Piece */}
                {piece && (
                  <span
                    className="relative z-10 leading-none"
                    style={{
                      fontSize: "clamp(28px, min(calc((100vw - 32px) / 9), 52px), 52px)",
                      filter: piece.color === "b"
                        ? "drop-shadow(0 2px 4px rgba(0,0,0,0.7)) drop-shadow(0 1px 1px rgba(0,0,0,0.5))"
                        : "drop-shadow(0 2px 3px rgba(0,0,0,0.4)) drop-shadow(0 0 1px rgba(0,0,0,0.2))",
                      transform: isSelected ? "scale(1.16)" : "scale(1)",
                      transition: "transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      willChange: "transform",
                    }}
                  >
                    {PIECE_CHARS[piece.color + piece.type.toUpperCase()]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Promotion modal */}
      {showPromo && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20 rounded-xl"
          style={{ background: "rgba(251,247,240,0.88)", backdropFilter: "blur(12px)" }}
        >
          <div
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
              padding: "24px", borderRadius: 20,
              background: "white",
              border: "1px solid #D0C8BC",
              boxShadow: "0 0 0 4px #F0E8D8, 0 24px 48px rgba(26,18,16,0.15)",
              animation: "promoAppear 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            <span style={{
              fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase",
              color: "#8A8278", fontFamily: "var(--font-nunito), sans-serif",
            }}>Promote pawn</span>
            <div style={{ display: "flex", gap: 10 }}>
              {["q", "r", "b", "n"].map((p) => (
                <button
                  key={p}
                  onClick={() => onPromo(p)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 60, height: 60, borderRadius: 14,
                    background: "#F5EFE4", border: "1.5px solid #D0C8BC",
                    fontSize: 34, cursor: "pointer",
                    transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                  aria-label={`Promote to ${{ q: "queen", r: "rook", b: "bishop", n: "knight" }[p]}`}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#1B7340";
                    (e.currentTarget as HTMLElement).style.background = "#E6F4EC";
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#D0C8BC";
                    (e.currentTarget as HTMLElement).style.background = "#F5EFE4";
                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                  }}
                >
                  {PIECE_CHARS["w" + p.toUpperCase()]}
                </button>
              ))}
            </div>
          </div>
          <style>{`
            @keyframes promoAppear {
              from { opacity: 0; transform: scale(0.9); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
