"use client";

import { Chess } from "chess.js";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Move, LastMove, Square, BoardAnnotation } from "@/lib/chess/types";
import BoardAnnotations from "@/components/BoardAnnotations";
import { Piece, PieceDefs, PieceFromChess, type PieceType } from "@/components/ChessPieces";
import { T } from "@/lib/design/tokens";
import { usePrefersReducedMotion } from "@/lib/design/atmosphere";

const COLS = "abcdefgh";

function squareFromRC(r: number, c: number): string {
  return COLS[c] + (8 - r);
}

function rcFromSquare(sq: string): { r: number; c: number } {
  const file = sq.charCodeAt(0) - 97;
  const rank = parseInt(sq[1], 10);
  return { r: 8 - rank, c: file };
}

const PIECE_TYPE_FROM_LETTER: Record<string, PieceType> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
};

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
  onCancelPromo?: () => void;
}

// ── Slide animation: when lastMove changes, render an overlay piece
// that physically moves from `from` square center to `to` square center
// with a parabolic arc lift. The destination square is hidden during
// the slide so we don't see two copies of the piece.
const SLIDE_MS = 320;

interface SlideState {
  fromR: number;
  fromC: number;
  toR: number;
  toC: number;
  pieceType: PieceType;
  pieceColor: "white" | "black";
  startedAt: number;
}

export default function Board({
  chess, selected, legalHighlights, lastMove,
  showPromo, status, botThinking, annotation, voicePlaying,
  onSquareClick, onPromo, onCancelPromo,
}: BoardProps) {
  const board = chess.board();
  const inCheck = chess.isCheck();
  const turn = chess.turn();
  const reducedMotion = usePrefersReducedMotion();

  // ── Slide state ─────────────────────────────────────────────────
  const lastSeenMoveRef = useRef<LastMove | null>(null);
  const [slide, setSlide] = useState<SlideState | null>(null);
  const [slideTick, setSlideTick] = useState(0); // forces re-render during animation

  // Promotion modal: autofocus the queen option when shown, and let Escape dismiss.
  const promoFirstOptionRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!showPromo) return;
    promoFirstOptionRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onCancelPromo) onCancelPromo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPromo, onCancelPromo]);

  useEffect(() => {
    if (!lastMove) {
      lastSeenMoveRef.current = null;
      return;
    }
    const prev = lastSeenMoveRef.current;
    if (prev && prev.from === lastMove.from && prev.to === lastMove.to) return;
    lastSeenMoveRef.current = lastMove;
    if (reducedMotion) return; // no slide for reduced motion users

    const { r: toR, c: toC } = rcFromSquare(lastMove.to);
    const { r: fromR, c: fromC } = rcFromSquare(lastMove.from);
    const dest = board[toR][toC];
    if (!dest) return;
    const pieceType = PIECE_TYPE_FROM_LETTER[dest.type];
    if (!pieceType) return;

    setSlide({
      fromR,
      fromC,
      toR,
      toC,
      pieceType,
      pieceColor: dest.color === "w" ? "white" : "black",
      startedAt: performance.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMove?.from, lastMove?.to, reducedMotion]);

  // Animate via rAF while a slide is active
  useEffect(() => {
    if (!slide) return;
    let raf: number | null = null;
    const tick = () => {
      const elapsed = performance.now() - slide.startedAt;
      if (elapsed >= SLIDE_MS) {
        setSlide(null);
        return;
      }
      setSlideTick((n) => n + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [slide]);

  // ── Particle burst ─────────────────────────────────────────────
  // Fires when the player makes a tactic-detected or great move.
  // The parent calls into the imperatively-exposed handle by setting
  // the `lastMove` to a special marker — but to keep the API simple,
  // we just fire a soft burst on every successful move (the kid sees
  // a tiny spark on every move, a bigger one on captures). This also
  // lets the bot's good moves flash too, which is fine.
  const [bursts, setBursts] = useState<{ id: number; r: number; c: number; big: boolean; startedAt: number }[]>([]);
  const burstIdRef = useRef(0);

  useEffect(() => {
    if (!lastMove || reducedMotion) return;
    const { r, c } = rcFromSquare(lastMove.to);
    const dest = board[r][c];
    // Bigger burst on captures (we infer from board: if material count
    // dropped we'd need history; cheap proxy is just always "small"
    // for now — the slide + drop shadow is the main visual lift).
    const big = !!dest && dest.color === "w"; // bigger burst on player moves
    const id = ++burstIdRef.current;
    setBursts((b) => [...b, { id, r, c, big, startedAt: performance.now() }]);
    const timeout = setTimeout(() => {
      setBursts((b) => b.filter((x) => x.id !== id));
    }, 900);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMove?.from, lastMove?.to]);

  // Drive a re-render while bursts are active so their progress advances
  useEffect(() => {
    if (bursts.length === 0) return;
    let raf: number | null = null;
    const tick = () => {
      setSlideTick((n) => n + 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [bursts.length]);

  // Slide progress (0..1, eased)
  const slideProgress = slide
    ? Math.min(1, (performance.now() - slide.startedAt) / SLIDE_MS)
    : 0;
  const easedSlideProgress = 1 - Math.pow(1 - slideProgress, 3); // easeOutCubic

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 680, aspectRatio: "1 / 1" }}>
      <PieceDefs />

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

            // Hide the destination square's piece while the slide is in flight
            const hidePieceForSlide =
              !!slide && slide.toR === r && slide.toC === c && slideProgress < 1;

            const baseGradient = isLight
              ? "linear-gradient(180deg, #F5E2B8 0%, #E8CD9C 100%)"
              : "linear-gradient(180deg, #B88652 0%, #9C6E3C 100%)";

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
                {overlays}
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
                {piece && !hidePieceForSlide && (
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

        {/* Slide overlay — animated piece between squares */}
        {slide && slideProgress < 1 && (
          <SlideOverlay slide={slide} progress={easedSlideProgress} />
        )}

        {/* Particle bursts on every move */}
        {bursts.map((b) => (
          <ParticleBurst key={b.id} burst={b} />
        ))}

        <BoardAnnotations annotation={annotation ?? null} voicePlaying={voicePlaying} />
      </div>

      {/* Promotion modal — unchanged */}
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
              {(["q", "r", "b", "n"] as const).map((p, i) => (
                <button type="button"
                  key={p}
                  ref={i === 0 ? promoFirstOptionRef : undefined}
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
                  onFocus={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = T.amber;
                    (e.currentTarget as HTMLElement).style.boxShadow = T.glowAmber;
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = T.border;
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                  }}
                  onBlur={(e) => {
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

// ── Sliding piece overlay ─────────────────────────────────────────
function SlideOverlay({ slide, progress }: { slide: SlideState; progress: number }) {
  // Each square is 1/8 of the board. Position via percentage so the
  // slide tracks the fluid sizing.
  const fromX = (slide.fromC + 0.5) * 12.5; // %
  const fromY = (slide.fromR + 0.5) * 12.5;
  const toX = (slide.toC + 0.5) * 12.5;
  const toY = (slide.toR + 0.5) * 12.5;
  const x = fromX + (toX - fromX) * progress;
  const y = fromY + (toY - fromY) * progress;
  // Parabolic lift — peak at progress=0.5 (~3% of board height)
  const liftPx = -Math.sin(progress * Math.PI) * 12;

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: "12.5%",
        height: "12.5%",
        transform: `translate(-50%, -50%) translateY(${liftPx}px)`,
        filter: `drop-shadow(0 ${4 + liftPx * -0.3}px ${6 + liftPx * -0.5}px rgba(0,0,0,0.5))`,
        pointerEvents: "none",
        zIndex: 8,
      }}
    >
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Piece type={slide.pieceType} color={slide.pieceColor} size={64} />
      </div>
    </div>
  );
}

// ── Particle burst on a square ────────────────────────────────────
function ParticleBurst({ burst }: { burst: { id: number; r: number; c: number; big: boolean; startedAt: number } }) {
  const elapsed = (performance.now() - burst.startedAt) / 1000;
  const t = Math.min(1, elapsed / 0.9);
  if (t >= 1) return null;

  const cx = (burst.c + 0.5) * 12.5;
  const cy = (burst.r + 0.5) * 12.5;
  const count = burst.big ? 16 : 8;
  const colors = burst.big
    ? ["#34D399", "#FCD34D", "#34D399", "#FCD34D"]
    : ["#FCD34D", "#FCD34D"];

  return (
    <svg
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9,
      }}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {Array.from({ length: count }, (_, i) => {
        const ang = (i / count) * Math.PI * 2;
        const r = 1 + t * (burst.big ? 9 : 5);
        const px = cx + Math.cos(ang) * r;
        const py = cy + Math.sin(ang) * r;
        const op = Math.max(0, 1 - t);
        const sz = (burst.big ? 0.55 : 0.4) * (1 - t * 0.6);
        return (
          <circle
            key={i}
            cx={px}
            cy={py}
            r={sz}
            fill={colors[i % colors.length]}
            opacity={op}
            style={{ filter: "drop-shadow(0 0 0.8px currentColor)" }}
          />
        );
      })}
    </svg>
  );
}
