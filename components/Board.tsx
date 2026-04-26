"use client";

import { Chess } from "chess.js";
import type { Move, LastMove, Square, BoardAnnotation } from "@/lib/chess/types";
import BoardAnnotations from "@/components/BoardAnnotations";
import { Piece, PieceDefs, PieceFromChess } from "@/components/ChessPieces";
import { T } from "@/lib/design/tokens";

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
  annotation?: BoardAnnotation | null;
  voicePlaying?: boolean;
  onSquareClick: (r: number, c: number) => void;
  onPromo: (piece: string) => void;
}

export default function Board({
  chess, selected, legalHighlights, lastMove,
  showPromo, status, botThinking, annotation, voicePlaying,
  onSquareClick, onPromo,
}: BoardProps) {
  const board = chess.board();
  const inCheck = chess.isCheck();
  const turn = chess.turn();

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 680, aspectRatio: "1 / 1" }}>
      {/* Mount the shared SVG defs once per board so PieceFromChess can reach the gradients */}
      <PieceDefs />

      {/* Wood frame — outer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, #5C3A1F 0%, #3D2615 50%, #2A180A 100%)",
          borderRadius: 12,
          boxShadow:
            "0 30px 90px rgba(0,0,0,0.7), 0 0 0 2px rgba(245,182,56,0.25), inset 0 2px 4px rgba(255,200,120,0.15), inset 0 -2px 4px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(252,211,77,0.4)",
        }}
      />

      {/* Inner playing surface — squares + pieces + annotations all live here */}
      <div
        style={{
          position: "absolute",
          inset: 14,
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.6)",
          touchAction: "manipulation",
        }}
      >
        {/* Squares grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gridTemplateRows: "repeat(8, 1fr)",
            width: "100%",
            height: "100%",
            position: "relative",
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

            // Two-tone wood gradient per square (matches design bundle)
            const baseGradient = isLight
              ? "linear-gradient(180deg, #F5E2B8 0%, #E8CD9C 100%)"
              : "linear-gradient(180deg, #B88652 0%, #9C6E3C 100%)";

            // Highlight overlays — order matters (last move under selected under check)
            const overlays: React.ReactNode[] = [];
            if (isLast) {
              overlays.push(
                <div
                  key="last"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(245,182,56,0.32)",
                    pointerEvents: "none",
                  }}
                />,
              );
            }
            if (isSelected) {
              overlays.push(
                <div
                  key="sel"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(52,211,153,0.34)",
                    boxShadow: "inset 0 0 0 3px rgba(110,231,183,0.7)",
                    pointerEvents: "none",
                  }}
                />,
              );
            }
            if (isCheckKing) {
              overlays.push(
                <div
                  key="chk"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(circle at 50% 45%, rgba(255,107,107,0.7) 0%, rgba(255,107,107,0.25) 55%, transparent 75%)",
                    pointerEvents: "none",
                  }}
                />,
              );
            }

            const clickable =
              status === "playing" && !botThinking && (piece?.color === "w" || isLegal);

            return (
              <div
                key={i}
                onClick={() => onSquareClick(r, c)}
                style={{
                  position: "relative",
                  background: baseGradient,
                  cursor: clickable ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  userSelect: "none",
                }}
              >
                {/* Wood grain dust */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                      "radial-gradient(circle at 30% 30%, rgba(0,0,0,0.06) 0.5px, transparent 0.7px), radial-gradient(circle at 70% 70%, rgba(255,255,255,0.05) 0.4px, transparent 0.6px)",
                    backgroundSize: "6px 6px, 6px 6px",
                    pointerEvents: "none",
                  }}
                />

                {/* Highlight overlays */}
                {overlays}

                {/* Coordinates: file letters on rank 1, rank numbers on file h */}
                {r === 7 && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 2,
                      left: 4,
                      fontFamily: T.fontMono,
                      fontSize: "max(8px, 1.4cqw)",
                      fontWeight: 700,
                      color: isLight ? "#9C6E3C" : "#F5E2B8",
                      pointerEvents: "none",
                      lineHeight: 1,
                    }}
                  >
                    {COLS[c]}
                  </span>
                )}
                {c === 7 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 4,
                      fontFamily: T.fontMono,
                      fontSize: "max(8px, 1.4cqw)",
                      fontWeight: 700,
                      color: isLight ? "#9C6E3C" : "#F5E2B8",
                      pointerEvents: "none",
                      lineHeight: 1,
                    }}
                  >
                    {8 - r}
                  </span>
                )}

                {/* Legal-move dot */}
                {isLegal && !isCaptureLegal && (
                  <div
                    style={{
                      position: "absolute",
                      width: "28%",
                      height: "28%",
                      borderRadius: "50%",
                      background: "rgba(0,0,0,0.22)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Legal-capture ring */}
                {isCaptureLegal && (
                  <div
                    style={{
                      position: "absolute",
                      inset: "3%",
                      borderRadius: "50%",
                      border: "3.5px solid rgba(0,0,0,0.28)",
                      pointerEvents: "none",
                    }}
                  />
                )}

                {/* Piece */}
                {piece && (
                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      width: "92%",
                      height: "92%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: isSelected ? "scale(1.08)" : "scale(1)",
                      transition: "transform 160ms cubic-bezier(0.34,1.56,0.64,1)",
                      willChange: "transform",
                    }}
                  >
                    <PieceFromChess piece={piece} size={64} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Coach annotation overlay — arrows, circles, highlights.
            Sits inside the rounded clip so nothing spills past the edge. */}
        <BoardAnnotations annotation={annotation ?? null} voicePlaying={voicePlaying} />
      </div>

      {/* Promotion modal */}
      {showPromo && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
            borderRadius: 12,
            background: "rgba(7,5,15,0.78)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              padding: "24px 28px",
              borderRadius: 22,
              background: T.velvet,
              border: `1.5px solid ${T.borderStrong}`,
              boxShadow: T.shadowDeep,
              animation: "promoAppear 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: T.textLo,
                fontFamily: T.fontUI,
              }}
            >
              Promote pawn
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              {(["q", "r", "b", "n"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => onPromo(p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    background: T.amethystBg,
                    border: `1.5px solid ${T.border}`,
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = T.amber;
                    (e.currentTarget as HTMLElement).style.boxShadow = T.glowAmber;
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = T.border;
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                  }}
                  aria-label={`Promote to ${{ q: "queen", r: "rook", b: "bishop", n: "knight" }[p]}`}
                >
                  <Piece
                    type={({ q: "queen", r: "rook", b: "bishop", n: "knight" } as const)[p]}
                    color="white"
                    size={48}
                  />
                </button>
              ))}
            </div>
          </div>
          <style>{`
            @keyframes promoAppear {
              from { opacity: 0; transform: scale(0.92); }
              to   { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
