"use client";

import { useEffect, useRef, useState } from "react";
import type { Annotation } from "@/lib/coaching/schema";
import type { BoardAnnotation, AnnotationColor } from "@/lib/chess/types";

// Named export for new Annotation type (from schema)
// Default export kept for BoardAnnotation backward compat

const SQUARE_SIZE = 64;

function squareToXY(square: string, orientation: "white" | "black"): { x: number; y: number } {
  const file = square.charCodeAt(0) - 97; // a=0..h=7
  const rank = parseInt(square[1], 10);   // 1..8
  const col = orientation === "white" ? file : 7 - file;
  const row = orientation === "white" ? 8 - rank : rank - 1;
  return {
    x: col * SQUARE_SIZE + SQUARE_SIZE / 2,
    y: row * SQUARE_SIZE + SQUARE_SIZE / 2,
  };
}

interface NewAnnotationProps {
  annotation: Annotation;
  orientation?: "white" | "black";
  active?: boolean;
}

export function BoardAnnotations({ annotation, orientation = "white", active = true }: NewAnnotationProps) {
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [annotation]);

  if (!active || !annotation || annotation.type === "none") return null;

  const squares = annotation.squares ?? [];
  const secondary = annotation.secondarySquares ?? [];

  const SIZE = SQUARE_SIZE * 8;

  return (
    <svg
      key={animKey}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
        zIndex: 15,
        overflow: "visible",
      }}
      aria-hidden="true"
    >
      <defs>
        <style>{`
          @keyframes bca-fork-ray {
            0% { stroke-dashoffset: 200; opacity: 0; }
            40% { opacity: 1; }
            100% { stroke-dashoffset: 0; opacity: 0.85; }
          }
          @keyframes bca-halo-pulse {
            0%, 100% { r: 28px; opacity: 0.6; }
            50% { r: 34px; opacity: 0.9; }
          }
          @keyframes bca-pin-draw {
            from { stroke-dashoffset: 300; opacity: 0; }
            to { stroke-dashoffset: 0; opacity: 0.9; }
          }
          @keyframes bca-frozen {
            0%, 100% { fill-opacity: 0.12; }
            50% { fill-opacity: 0.22; }
          }
          @keyframes bca-hanging-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          @keyframes bca-hanging-pulse {
            0%, 100% { r: 30px; opacity: 0.5; }
            50% { r: 38px; opacity: 0; }
          }
          @keyframes bca-reveal-ray {
            from { stroke-dashoffset: 200; opacity: 0; }
            to { stroke-dashoffset: 0; opacity: 0.75; }
          }
          @keyframes bca-ghost-ring {
            0%, 100% { stroke-opacity: 0.4; r: 22px; }
            50% { stroke-opacity: 0.8; r: 26px; }
          }
          @keyframes bca-badge-pop {
            0% { transform: scale(0); }
            70% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
          @keyframes bca-chain-draw {
            from { stroke-dashoffset: 200; }
            to { stroke-dashoffset: 0; }
          }
          @keyframes bca-attack-draw {
            from { stroke-dashoffset: 200; opacity: 0; }
            to { stroke-dashoffset: 0; opacity: 0.85; }
          }
          @keyframes bca-danger-stripe {
            to { stroke-dashoffset: -20; }
          }
          @keyframes bca-highlight-fade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}</style>
      </defs>

      {annotation.type === "fork_rays" && squares.length >= 1 && (
        <ForkRays primarySquare={squares[0]} targetSquares={squares.slice(1)} orientation={orientation} />
      )}

      {annotation.type === "pin_line" && squares.length >= 2 && (
        <PinLine attackerSquare={squares[0]} pinnedSquare={squares[1]} behindSquare={squares[2]} orientation={orientation} />
      )}

      {annotation.type === "skewer_line" && squares.length >= 2 && (
        <SkewerLine attackerSquare={squares[0]} frontSquare={squares[1]} backSquare={squares[2]} orientation={orientation} />
      )}

      {annotation.type === "discovered_attack" && squares.length >= 1 && (
        <DiscoveredAttack movedSquare={squares[0]} revealedSquare={squares[1]} targetSquare={squares[2]} orientation={orientation} />
      )}

      {annotation.type === "hanging_piece" && squares.length >= 1 && (
        <HangingPiece square={squares[0]} orientation={orientation} />
      )}

      {annotation.type === "defended_chain" && squares.length >= 2 && (
        <DefendedChain squares={squares} orientation={orientation} />
      )}

      {annotation.type === "attack_arrow" && squares.length >= 2 && (
        <AttackArrow fromSquare={squares[0]} toSquare={squares[1]} orientation={orientation} />
      )}

      {annotation.type === "danger_square" && squares.length >= 1 && (
        <DangerSquare square={squares[0]} orientation={orientation} />
      )}

      {annotation.type === "highlight_square" && squares.map((sq, i) => (
        <HighlightSquare key={i} square={sq} orientation={orientation} delay={i * 80} />
      ))}
    </svg>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ForkRays({ primarySquare, targetSquares, orientation }: {
  primarySquare: string; targetSquares: string[]; orientation: "white" | "black"
}) {
  const primary = squareToXY(primarySquare, orientation);
  return (
    <>
      {/* Halo around forking piece */}
      <circle cx={primary.x} cy={primary.y} r={26}
        fill="rgba(239,68,68,0.12)" stroke="rgba(239,68,68,0.7)" strokeWidth={2.5}
        style={{ animation: "bca-halo-pulse 1.4s ease-in-out infinite" }}
      />
      {/* Badge */}
      <g style={{ animation: "bca-badge-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both", transformOrigin: `${primary.x}px ${primary.y - 32}px` }}>
        <circle cx={primary.x} cy={primary.y - 32} r={10} fill="#EF4444" />
        <text x={primary.x} y={primary.y - 28} textAnchor="middle" fill="white" fontSize={12} fontWeight="bold">!</text>
      </g>
      {/* Dashed rays to targets */}
      {targetSquares.map((tSq, i) => {
        const t = squareToXY(tSq, orientation);
        const dx = t.x - primary.x, dy = t.y - primary.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const x1 = primary.x + (dx / len) * 30;
        const y1 = primary.y + (dy / len) * 30;
        const x2 = t.x - (dx / len) * 26;
        const y2 = t.y - (dy / len) * 26;
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="rgba(239,68,68,0.85)" strokeWidth={3} strokeDasharray="8 4"
            style={{ animation: `bca-fork-ray 0.5s ${i * 80}ms cubic-bezier(0.22,1,0.36,1) both`, strokeDashoffset: 200 }}
          />
        );
      })}
      {/* Target squares highlight */}
      {targetSquares.map((tSq, i) => {
        const t = squareToXY(tSq, orientation);
        return (
          <rect key={`tgt-${i}`}
            x={t.x - SQUARE_SIZE / 2 + 3} y={t.y - SQUARE_SIZE / 2 + 3}
            width={SQUARE_SIZE - 6} height={SQUARE_SIZE - 6} rx={6}
            fill="rgba(239,68,68,0.15)" stroke="rgba(239,68,68,0.5)" strokeWidth={2}
          />
        );
      })}
    </>
  );
}

function PinLine({ attackerSquare, pinnedSquare, behindSquare, orientation }: {
  attackerSquare: string; pinnedSquare: string; behindSquare?: string; orientation: "white" | "black"
}) {
  const attacker = squareToXY(attackerSquare, orientation);
  const pinned = squareToXY(pinnedSquare, orientation);
  const behind = behindSquare ? squareToXY(behindSquare, orientation) : null;
  return (
    <>
      {/* Frozen overlay on pinned piece */}
      <rect x={pinned.x - SQUARE_SIZE / 2 + 2} y={pinned.y - SQUARE_SIZE / 2 + 2}
        width={SQUARE_SIZE - 4} height={SQUARE_SIZE - 4} rx={5}
        fill="rgba(147,51,234,0.15)" stroke="rgba(147,51,234,0.6)" strokeWidth={2}
        style={{ animation: "bca-frozen 1.6s ease-in-out infinite" }}
      />
      {/* Pin line */}
      <line x1={attacker.x} y1={attacker.y} x2={pinned.x} y2={pinned.y}
        stroke="rgba(147,51,234,0.85)" strokeWidth={3} strokeDasharray="10 4"
        style={{ animation: "bca-pin-draw 0.5s cubic-bezier(0.22,1,0.36,1) both", strokeDashoffset: 300 }}
      />
      {/* Faded continuation to behind piece */}
      {behind && (
        <line x1={pinned.x} y1={pinned.y} x2={behind.x} y2={behind.y}
          stroke="rgba(147,51,234,0.35)" strokeWidth={2} strokeDasharray="6 5"
          style={{ animation: "bca-pin-draw 0.5s 200ms cubic-bezier(0.22,1,0.36,1) both", strokeDashoffset: 300 }}
        />
      )}
    </>
  );
}

function SkewerLine({ attackerSquare, frontSquare, backSquare, orientation }: {
  attackerSquare: string; frontSquare: string; backSquare?: string; orientation: "white" | "black"
}) {
  const attacker = squareToXY(attackerSquare, orientation);
  const front = squareToXY(frontSquare, orientation);
  const back = backSquare ? squareToXY(backSquare, orientation) : null;
  return (
    <>
      <line x1={attacker.x} y1={attacker.y} x2={front.x} y2={front.y}
        stroke="rgba(234,179,8,0.9)" strokeWidth={3} strokeDasharray="10 4"
        style={{ animation: "bca-pin-draw 0.5s cubic-bezier(0.22,1,0.36,1) both", strokeDashoffset: 300 }}
      />
      {back && (
        <line x1={front.x} y1={front.y} x2={back.x} y2={back.y}
          stroke="rgba(234,179,8,0.4)" strokeWidth={2} strokeDasharray="6 5"
          style={{ animation: "bca-pin-draw 0.5s 180ms cubic-bezier(0.22,1,0.36,1) both", strokeDashoffset: 300 }}
        />
      )}
      <rect x={front.x - SQUARE_SIZE / 2 + 3} y={front.y - SQUARE_SIZE / 2 + 3}
        width={SQUARE_SIZE - 6} height={SQUARE_SIZE - 6} rx={5}
        fill="rgba(234,179,8,0.12)" stroke="rgba(234,179,8,0.55)" strokeWidth={2}
      />
    </>
  );
}

function DiscoveredAttack({ movedSquare, revealedSquare, targetSquare, orientation }: {
  movedSquare: string; revealedSquare?: string; targetSquare?: string; orientation: "white" | "black"
}) {
  const moved = squareToXY(movedSquare, orientation);
  const revealed = revealedSquare ? squareToXY(revealedSquare, orientation) : null;
  const target = targetSquare ? squareToXY(targetSquare, orientation) : null;
  return (
    <>
      {/* Ghost ring around the piece that moved */}
      <circle cx={moved.x} cy={moved.y} r={24}
        fill="none" stroke="rgba(6,182,212,0.6)" strokeWidth={2.5} strokeDasharray="6 4"
        style={{ animation: "bca-ghost-ring 1.6s ease-in-out infinite" }}
      />
      {/* Reveal ray from the piece that was behind */}
      {revealed && target && (
        <line x1={revealed.x} y1={revealed.y} x2={target.x} y2={target.y}
          stroke="rgba(6,182,212,0.8)" strokeWidth={3.5} strokeDasharray="12 5"
          style={{ animation: "bca-reveal-ray 0.6s 200ms cubic-bezier(0.22,1,0.36,1) both", strokeDashoffset: 200 }}
        />
      )}
    </>
  );
}

function HangingPiece({ square, orientation }: { square: string; orientation: "white" | "black" }) {
  const pos = squareToXY(square, orientation);
  return (
    <>
      {/* Pulsing red ring */}
      <circle cx={pos.x} cy={pos.y} r={28}
        fill="none" stroke="rgba(239,68,68,0.7)" strokeWidth={3}
        style={{ animation: "bca-hanging-pulse 1.2s ease-out infinite" }}
      />
      {/* "?" badge bobbing up */}
      <g style={{ animation: "bca-hanging-bob 1.4s ease-in-out infinite", transformOrigin: `${pos.x}px ${pos.y}px` }}>
        <circle cx={pos.x} cy={pos.y - 36} r={12} fill="#EF4444" />
        <text x={pos.x} y={pos.y - 31} textAnchor="middle" fill="white" fontSize={14} fontWeight="bold">?</text>
      </g>
    </>
  );
}

function DefendedChain({ squares, orientation }: { squares: string[]; orientation: "white" | "black" }) {
  const positions = squares.map((sq) => squareToXY(sq, orientation));
  return (
    <>
      {positions.map((pos, i) => {
        if (i === positions.length - 1) return null;
        const next = positions[i + 1];
        return (
          <line key={i} x1={pos.x} y1={pos.y} x2={next.x} y2={next.y}
            stroke="rgba(34,197,94,0.75)" strokeWidth={2.5} strokeDasharray="8 4"
            style={{ animation: `bca-chain-draw 0.4s ${i * 100}ms cubic-bezier(0.22,1,0.36,1) both`, strokeDashoffset: 200 }}
          />
        );
      })}
      {positions.map((pos, i) => (
        <circle key={`dot-${i}`} cx={pos.x} cy={pos.y} r={5}
          fill="rgba(34,197,94,0.8)"
          style={{ opacity: 0, animation: `bca-highlight-fade 0.3s ${i * 100 + 200}ms both` }}
        />
      ))}
    </>
  );
}

function AttackArrow({ fromSquare, toSquare, orientation }: {
  fromSquare: string; toSquare: string; orientation: "white" | "black"
}) {
  const from = squareToXY(fromSquare, orientation);
  const to = squareToXY(toSquare, orientation);
  const dx = to.x - from.x, dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const x1 = from.x + (dx / len) * 28;
  const y1 = from.y + (dy / len) * 28;
  const x2 = to.x - (dx / len) * 30;
  const y2 = to.y - (dy / len) * 30;
  // Arrow head
  const angle = Math.atan2(dy, dx);
  const arrowSize = 10;
  const ax1 = x2 - arrowSize * Math.cos(angle - 0.4);
  const ay1 = y2 - arrowSize * Math.sin(angle - 0.4);
  const ax2 = x2 - arrowSize * Math.cos(angle + 0.4);
  const ay2 = y2 - arrowSize * Math.sin(angle + 0.4);
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="rgba(239,68,68,0.85)" strokeWidth={4} strokeLinecap="round"
        style={{ animation: "bca-attack-draw 0.5s cubic-bezier(0.22,1,0.36,1) both", strokeDashoffset: 200, strokeDasharray: 200 }}
      />
      <polygon points={`${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`}
        fill="rgba(239,68,68,0.85)"
        style={{ animation: "bca-highlight-fade 0.2s 400ms both", opacity: 0 }}
      />
    </>
  );
}

function DangerSquare({ square, orientation }: { square: string; orientation: "white" | "black" }) {
  const pos = squareToXY(square, orientation);
  const x = pos.x - SQUARE_SIZE / 2 + 3;
  const y = pos.y - SQUARE_SIZE / 2 + 3;
  const w = SQUARE_SIZE - 6;
  const id = `dg-${square}`;
  return (
    <>
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(239,68,68,0.3)" />
          <stop offset="100%" stopColor="rgba(239,68,68,0)" />
        </radialGradient>
      </defs>
      <rect x={x} y={y} width={w} height={w} rx={6} fill={`url(#${id})`} />
      <rect x={x} y={y} width={w} height={w} rx={6}
        fill="none" stroke="rgba(239,68,68,0.6)" strokeWidth={2} strokeDasharray="8 4"
        style={{ animation: "bca-danger-stripe 1.2s linear infinite", strokeDashoffset: 0 }}
      />
    </>
  );
}

function HighlightSquare({ square, orientation, delay }: {
  square: string; orientation: "white" | "black"; delay: number
}) {
  const pos = squareToXY(square, orientation);
  return (
    <rect
      x={pos.x - SQUARE_SIZE / 2 + 3} y={pos.y - SQUARE_SIZE / 2 + 3}
      width={SQUARE_SIZE - 6} height={SQUARE_SIZE - 6} rx={6}
      fill="rgba(34,197,94,0.18)" stroke="rgba(34,197,94,0.55)" strokeWidth={2}
      style={{ opacity: 0, animation: `bca-highlight-fade 0.35s ${delay}ms both` }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy default export: BoardAnnotation type from chess/types (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function squareCenter(sq: string, flipped: boolean): { x: number; y: number } {
  const file = sq.charCodeAt(0) - 97;
  const rank = parseInt(sq[1], 10);
  const x = flipped ? 7 - file : file;
  const y = flipped ? rank - 1 : 8 - rank;
  return { x: x + 0.5, y: y + 0.5 };
}

const COLORS: Record<AnnotationColor, { rgb: string; hex: string }> = {
  green:  { rgb: "34, 197, 94",  hex: "#22C55E" },
  red:    { rgb: "239, 68, 68",  hex: "#EF4444" },
  yellow: { rgb: "234, 179, 8",  hex: "#EAB308" },
  blue:   { rgb: "59, 130, 246", hex: "#3B82F6" },
};

function rgba(color: AnnotationColor, alpha: number): string {
  return `rgba(${COLORS[color].rgb}, ${alpha})`;
}

interface LegacyProps {
  annotation: BoardAnnotation | null;
  flipped?: boolean;
  voicePlaying?: boolean;
}

export default function LegacyBoardAnnotations({ annotation, flipped = false, voicePlaying = false }: LegacyProps) {
  const [content, setContent] = useState<BoardAnnotation | null>(null);
  const [visible, setVisible] = useState(false);
  const [staggerStep, setStaggerStep] = useState(0);

  useEffect(() => {
    if (annotation) {
      setContent(annotation);
      setVisible(true);
      setStaggerStep(0);
      const t1 = setTimeout(() => setStaggerStep(1), 180);
      const t2 = setTimeout(() => setStaggerStep(2), 360);
      const t3 = setTimeout(() => setStaggerStep(99), 600);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    if (content) {
      setVisible(false);
      const t = setTimeout(() => setContent(null), 400);
      return () => clearTimeout(t);
    }
  }, [annotation]);

  if (!content) return null;

  const arrowMarkerSize = 0.35;

  return (
    <svg
      viewBox="0 0 8 8"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
        zIndex: 15,
        opacity: visible ? 1 : 0,
        transition: "opacity 400ms ease",
      }}
      aria-hidden="true"
    >
      <defs>
        {(Object.keys(COLORS) as AnnotationColor[]).map((c) => (
          <marker key={c} id={`bca-arrow-${c}`}
            markerWidth={arrowMarkerSize * 2} markerHeight={arrowMarkerSize * 2}
            refX={arrowMarkerSize * 1.6} refY={arrowMarkerSize}
            orient="auto" markerUnits="userSpaceOnUse"
          >
            <polygon
              points={`0 0, ${arrowMarkerSize * 2} ${arrowMarkerSize}, 0 ${arrowMarkerSize * 2}`}
              fill={rgba(c, 0.9)}
            />
          </marker>
        ))}
        <filter id="bca-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0.04" stdDeviation="0.05" floodOpacity="0.35" />
        </filter>
      </defs>

      {content.highlights?.map((h, i) => {
        const c = squareCenter(h.square, flipped);
        return (
          <rect key={`h-${i}`} x={c.x - 0.5} y={c.y - 0.5} width={1} height={1}
            fill={rgba(h.color, h.opacity ?? 0.3)} rx={0.08}
            style={{ opacity: staggerStep >= 2 ? 1 : 0, transition: "opacity 280ms ease-out" }}
          />
        );
      })}

      {content.arrows?.map((a, i) => {
        const f = squareCenter(a.from, flipped);
        const t = squareCenter(a.to, flipped);
        const dx = t.x - f.x, dy = t.y - f.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.01) return null;
        const x1 = f.x + (dx / len) * 0.25;
        const y1 = f.y + (dy / len) * 0.25;
        const x2 = t.x - (dx / len) * 0.4;
        const y2 = t.y - (dy / len) * 0.4;
        const pathLen = len * 1.2;
        return (
          <line key={`a-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={rgba(a.color, a.opacity ?? 0.7)} strokeWidth={0.16} strokeLinecap="round"
            markerEnd={`url(#bca-arrow-${a.color})`} filter="url(#bca-shadow)"
            strokeDasharray={pathLen}
            strokeDashoffset={staggerStep >= 1 + i * 0.5 ? 0 : pathLen}
            style={{ transition: "stroke-dashoffset 350ms cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        );
      })}

      {content.circles?.map((cir, i) => {
        const c = squareCenter(cir.square, flipped);
        return (
          <circle key={`c-${i}`} cx={c.x} cy={c.y} r={0.44}
            fill="none" stroke={rgba(cir.color, 0.85)} strokeWidth={0.085}
            style={{ opacity: 1, filter: "url(#bca-shadow)" }}
          />
        );
      })}

      {content.influenceSquares?.map((sq, i) => {
        const c = squareCenter(sq, flipped);
        const color = content.influenceColor ?? "green";
        return (
          <circle key={`inf-${i}`} cx={c.x} cy={c.y} r={0.15}
            fill={rgba(color, 0.55)}
            style={{ opacity: staggerStep >= 2 ? 1 : 0, transition: `opacity ${200 + i * 40}ms ease-out` }}
          />
        );
      })}

      {content.dangerSquares?.map((sq, i) => {
        const c = squareCenter(sq, flipped);
        const pid = `bca-danger-${i}`;
        return (
          <g key={`dz-${i}`}>
            <defs>
              <pattern id={pid} patternUnits="userSpaceOnUse" width="0.18" height="0.18" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="0.18" stroke={COLORS.red.hex} strokeWidth="0.05" opacity="0.18" />
              </pattern>
            </defs>
            <rect x={c.x - 0.46} y={c.y - 0.46} width={0.92} height={0.92} rx={0.06} fill={`url(#${pid})`} />
            <rect x={c.x - 0.45} y={c.y - 0.45} width={0.9} height={0.9} rx={0.06}
              fill="none" stroke={rgba("red", 0.35)} strokeWidth={0.06} strokeDasharray="0.18,0.1" />
          </g>
        );
      })}

      {content.threatSquares?.map((sq, i) => {
        const c = squareCenter(sq, flipped);
        return (
          <rect key={`thr-${i}`}
            x={c.x - 0.47} y={c.y - 0.47} width={0.94} height={0.94} rx={0.07}
            fill={rgba("red", 0.14)} stroke={rgba("red", 0.35)} strokeWidth={0.055}
          />
        );
      })}

      {content.heroSquare && (() => {
        const c = squareCenter(content.heroSquare, flipped);
        const color = content.heroColor ?? "green";
        return (
          <g key="hero">
            <circle cx={c.x} cy={c.y} r={0.35}
              fill={rgba(color, 0.1)} stroke={rgba(color, 0.7)} strokeWidth={0.055} />
          </g>
        );
      })()}

      <style>{`
        @keyframes bcaPulse {
          0%, 100% { stroke-width: 0.085; opacity: 0.85; }
          50%      { stroke-width: 0.12;  opacity: 1; }
        }
      `}</style>
    </svg>
  );
}
