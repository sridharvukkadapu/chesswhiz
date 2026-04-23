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
      <div
        className="grid overflow-hidden rounded-xl"
        style={{
          gridTemplateColumns: "repeat(8, 1fr)",
          gridTemplateRows: "repeat(8, 1fr)",
          width: "min(calc(100vw - 32px), 480px)",
          height: "min(calc(100vw - 32px), 480px)",
          boxShadow: "0 12px 48px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)",
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

          let bg: string;
          if (isSelected) bg = isLight ? "#b5d87a" : "#8cad50";
          else if (isLast) bg = isLight ? "#ced26b" : "#aaa23a";
          else bg = isLight ? "#ecd8b8" : "#ae825e";

          const clickable =
            status === "playing" &&
            !botThinking &&
            (piece?.color === "w" || isLegal);

          return (
            <div
              key={i}
              onClick={() => onSquareClick(r, c)}
              className="flex items-center justify-center relative select-none"
              style={{ background: bg, cursor: clickable ? "pointer" : "default", transition: "background 0.08s" }}
            >
              {isCheckKing && (
                <div
                  className="absolute inset-0"
                  style={{ background: "radial-gradient(circle, rgba(232,64,64,0.5) 0%, rgba(232,64,64,0.12) 60%, transparent 100%)" }}
                />
              )}
              {c === 0 && (
                <span
                  className="absolute top-0.5 left-0.5 text-[9px] font-bold opacity-60"
                  style={{ color: isLight ? "#ae825e" : "#ecd8b8", fontFamily: "'Outfit', sans-serif" }}
                >
                  {8 - r}
                </span>
              )}
              {r === 7 && (
                <span
                  className="absolute bottom-0.5 right-0.5 text-[9px] font-bold opacity-60"
                  style={{ color: isLight ? "#ae825e" : "#ecd8b8", fontFamily: "'Outfit', sans-serif" }}
                >
                  {COLS[c]}
                </span>
              )}
              {isLegal && !isCaptureLegal && (
                <div className="w-[26%] h-[26%] rounded-full" style={{ background: "rgba(0,0,0,0.18)" }} />
              )}
              {isCaptureLegal && (
                <div className="absolute inset-[4%] rounded-full" style={{ border: "3.5px solid rgba(0,0,0,0.22)" }} />
              )}
              {piece && (
                <span
                  className="relative z-10 leading-none"
                  style={{
                    fontSize: "clamp(28px, min(calc((100vw - 32px) / 9), 52px), 52px)",
                    filter: piece.color === "b"
                      ? "drop-shadow(0 1px 3px rgba(0,0,0,0.5))"
                      : "drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
                    transform: isSelected ? "scale(1.12)" : "scale(1)",
                    transition: "transform 0.1s",
                  }}
                >
                  {PIECE_CHARS[piece.color + piece.type.toUpperCase()]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {showPromo && (
        <div
          className="absolute inset-0 flex items-center justify-center z-20 rounded-xl"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="flex gap-2 p-4 rounded-2xl border"
            style={{ background: "#282523", borderColor: "#3a3633" }}
          >
            {["q", "r", "b", "n"].map((p) => (
              <button
                key={p}
                onClick={() => onPromo(p)}
                className="w-14 h-14 flex items-center justify-center rounded-xl border text-4xl cursor-pointer transition-all"
                style={{ background: "#1e1c1a", borderColor: "#3a3633" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#5be882";
                  (e.currentTarget as HTMLElement).style.background = "rgba(91,232,130,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#3a3633";
                  (e.currentTarget as HTMLElement).style.background = "#1e1c1a";
                }}
              >
                {PIECE_CHARS["w" + p.toUpperCase()]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
