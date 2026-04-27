"use client";

import { useEffect, useState } from "react";
import type { BoardAnnotation, AnnotationColor } from "@/lib/chess/types";

// Coordinates are in chess-square units (0..8). The SVG uses viewBox
// "0 0 8 8" and stretches to the parent's size, so the overlay tracks
// the board's fluid sizing without any pixel math.

const COLORS: Record<AnnotationColor, { rgb: string; hex: string }> = {
  green:  { rgb: "34, 197, 94",   hex: "#22C55E" },
  red:    { rgb: "239, 68, 68",   hex: "#EF4444" },
  yellow: { rgb: "234, 179, 8",   hex: "#EAB308" },
  blue:   { rgb: "59, 130, 246",  hex: "#3B82F6" },
};

function rgba(color: AnnotationColor, alpha: number): string {
  return `rgba(${COLORS[color].rgb}, ${alpha})`;
}

function squareCenter(sq: string, flipped: boolean): { x: number; y: number } {
  const file = sq.charCodeAt(0) - 97; // a..h => 0..7
  const rank = parseInt(sq[1], 10);   // 1..8
  const x = flipped ? 7 - file : file;
  const y = flipped ? rank - 1 : 8 - rank;
  return { x: x + 0.5, y: y + 0.5 };
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

interface Props {
  annotation: BoardAnnotation | null;
  flipped?: boolean;
  // When the coach is currently speaking, hold the annotation visible
  // and pulse it. This binds the visual to the audio.
  voicePlaying?: boolean;
}

export default function BoardAnnotations({
  annotation, flipped = false, voicePlaying = false,
}: Props) {
  const reducedMotion = usePrefersReducedMotion();

  // Two-stage state: which annotation is *active* right now, and whether
  // it's *visible* (for the fade-in/out lifecycle).
  const [content, setContent] = useState<BoardAnnotation | null>(null);
  const [visible, setVisible] = useState(false);
  // staggerStep increments every ~180ms after the annotation appears,
  // unlocking element groups in sequence. 0=circles, 1=arrows in order,
  // 2=highlights. Reduced motion jumps straight to the final step.
  const [staggerStep, setStaggerStep] = useState(0);

  // Receive a new annotation: swap content, fade in, run stagger.
  useEffect(() => {
    if (annotation) {
      setContent(annotation);
      setVisible(true);
      if (reducedMotion) {
        setStaggerStep(99);
        return;
      }
      setStaggerStep(0);
      const t1 = setTimeout(() => setStaggerStep(1), 180);
      const t2 = setTimeout(() => setStaggerStep(2), 360);
      const t3 = setTimeout(() => setStaggerStep(99), 600);
      return () => {
        clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      };
    }
    if (content) {
      // Fade out, then unmount.
      setVisible(false);
      const t = setTimeout(() => setContent(null), 400);
      return () => clearTimeout(t);
    }
  }, [annotation, reducedMotion, content]);

  if (!content) return null;

  const arrowMarkerSize = 0.35;
  const arrowAnimateMs = reducedMotion ? 0 : 350;

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
          <marker
            key={c}
            id={`bca-arrow-${c}`}
            markerWidth={arrowMarkerSize * 2}
            markerHeight={arrowMarkerSize * 2}
            refX={arrowMarkerSize * 1.6}
            refY={arrowMarkerSize}
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <polygon
              points={`0 0, ${arrowMarkerSize * 2} ${arrowMarkerSize}, 0 ${arrowMarkerSize * 2}`}
              fill={rgba(c, 0.9)}
            />
          </marker>
        ))}
        {/* Soft drop-shadow so arrows read on light wooden squares */}
        <filter id="bca-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="0.04" stdDeviation="0.05" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Highlights — last to appear, lowest visual weight */}
      {content.highlights?.map((h, i) => {
        const c = squareCenter(h.square, flipped);
        const ready = staggerStep >= 2;
        return (
          <rect
            key={`h-${i}`}
            x={c.x - 0.5}
            y={c.y - 0.5}
            width={1}
            height={1}
            fill={rgba(h.color, h.opacity ?? 0.3)}
            rx={0.08}
            style={{
              opacity: ready ? 1 : 0,
              transition: `opacity ${reducedMotion ? 0 : 280}ms ease-out`,
            }}
          />
        );
      })}

      {/* Arrows — appear in order, draw with stroke-dash growth */}
      {content.arrows?.map((a, i) => {
        const f = squareCenter(a.from, flipped);
        const t = squareCenter(a.to, flipped);
        const dx = t.x - f.x;
        const dy = t.y - f.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.01) return null;
        const startTrim = 0.25;
        const endTrim = 0.4;
        const x1 = f.x + (dx / len) * startTrim;
        const y1 = f.y + (dy / len) * startTrim;
        const x2 = t.x - (dx / len) * endTrim;
        const y2 = t.y - (dy / len) * endTrim;
        const opacity = a.opacity ?? 0.7;
        const visibleArrow = staggerStep >= 1 + i * 0.5; // each subsequent arrow trails 90ms
        // Use stroke-dasharray to "draw" the arrow from source to target.
        // Path length in viewBox units = visual length; oversize the
        // dasharray so dashoffset can fully hide it.
        const pathLen = len * 1.2;
        return (
          <line
            key={`a-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={rgba(a.color, opacity)}
            strokeWidth={0.16}
            strokeLinecap="round"
            markerEnd={`url(#bca-arrow-${a.color})`}
            filter="url(#bca-shadow)"
            strokeDasharray={pathLen}
            strokeDashoffset={visibleArrow ? 0 : pathLen}
            style={{
              transition: `stroke-dashoffset ${arrowAnimateMs}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            }}
          />
        );
      })}

      {/* Circles — first to appear (the subject of the sentence) */}
      {content.circles?.map((cir, i) => {
        const c = squareCenter(cir.square, flipped);
        const ready = staggerStep >= 0; // always first
        const pulseClass = voicePlaying && !reducedMotion ? "bca-pulse" : "";
        return (
          <circle
            key={`c-${i}`}
            cx={c.x}
            cy={c.y}
            r={0.44}
            fill="none"
            stroke={rgba(cir.color, 0.85)}
            strokeWidth={0.085}
            className={pulseClass}
            style={{
              opacity: ready ? 1 : 0,
              transformOrigin: `${c.x}px ${c.y}px`,
              transition: `opacity ${reducedMotion ? 0 : 220}ms ease-out`,
              filter: "url(#bca-shadow)",
            }}
          />
        );
      })}

      {/* ── Richer prototype visuals ─────────────────────────── */}

      {/* Influence map — small dots showing piece control */}
      {content.influenceSquares?.map((sq, i) => {
        const c = squareCenter(sq, flipped);
        const color = content.influenceColor ?? "green";
        return (
          <circle
            key={`inf-${i}`}
            cx={c.x}
            cy={c.y}
            r={0.15}
            fill={rgba(color, 0.55)}
            style={{
              opacity: staggerStep >= 2 ? 1 : 0,
              transition: `opacity ${reducedMotion ? 0 : 200 + i * 40}ms ease-out`,
            }}
          />
        );
      })}

      {/* Danger zones — diagonal stripe + animated dashed border */}
      {content.dangerSquares?.map((sq, i) => {
        const c = squareCenter(sq, flipped);
        const pid = `bca-danger-${i}`;
        return (
          <g key={`dz-${i}`} style={{ opacity: staggerStep >= 0 ? 1 : 0, transition: `opacity ${reducedMotion ? 0 : 300}ms ease-out` }}>
            <defs>
              <pattern id={pid} patternUnits="userSpaceOnUse" width="0.18" height="0.18" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="0.18" stroke={COLORS.red.hex} strokeWidth="0.05" opacity="0.18" />
              </pattern>
            </defs>
            <rect x={c.x - 0.5 + 0.04} y={c.y - 0.5 + 0.04} width={0.92} height={0.92} rx={0.06}
              fill={`url(#${pid})`} />
            <rect x={c.x - 0.5 + 0.05} y={c.y - 0.5 + 0.05} width={0.9} height={0.9} rx={0.06}
              fill="none"
              stroke={rgba("red", 0.35)}
              strokeWidth={0.06}
              strokeDasharray="0.18,0.1"
              className={reducedMotion ? "" : "bca-danger-dash"}
            />
          </g>
        );
      })}

      {/* Cage bars — trapped piece X marker */}
      {content.cageSquares?.map((sq, i) => {
        const c = squareCenter(sq, flipped);
        return (
          <g key={`cage-${i}`} style={{ opacity: staggerStep >= 0 ? 1 : 0, transition: `opacity ${reducedMotion ? 0 : 350}ms ease-out` }}>
            <rect x={c.x - 0.42} y={c.y - 0.42} width={0.84} height={0.84} rx={0.09}
              fill={rgba("red", 0.1)} stroke={rgba("red", 0.45)} strokeWidth={0.06} />
            <line x1={c.x - 0.22} y1={c.y - 0.22} x2={c.x + 0.22} y2={c.y + 0.22}
              stroke={rgba("red", 0.45)} strokeWidth={0.065} strokeLinecap="round" />
            <line x1={c.x + 0.22} y1={c.y - 0.22} x2={c.x - 0.22} y2={c.y + 0.22}
              stroke={rgba("red", 0.45)} strokeWidth={0.065} strokeLinecap="round" />
          </g>
        );
      })}

      {/* Threat squares — pulsing red fill (pieces under attack) */}
      {content.threatSquares?.map((sq, i) => {
        const c = squareCenter(sq, flipped);
        return (
          <rect key={`thr-${i}`}
            x={c.x - 0.5 + 0.03} y={c.y - 0.5 + 0.03} width={0.94} height={0.94} rx={0.07}
            fill={rgba("red", 0.14)}
            stroke={rgba("red", 0.35)}
            strokeWidth={0.055}
            className={reducedMotion ? "" : "bca-threat-pulse"}
            style={{ opacity: staggerStep >= 0 ? 1 : 0, transition: `opacity ${reducedMotion ? 0 : 280}ms ease-out` }}
          />
        );
      })}

      {/* Target squares — pulsing green fill (capturable / good squares) */}
      {content.targetSquares?.map((sq, i) => {
        const c = squareCenter(sq, flipped);
        return (
          <rect key={`tgt-${i}`}
            x={c.x - 0.5 + 0.03} y={c.y - 0.5 + 0.03} width={0.94} height={0.94} rx={0.07}
            fill={rgba("green", 0.14)}
            stroke={rgba("green", 0.35)}
            strokeWidth={0.055}
            className={reducedMotion ? "" : "bca-target-pulse"}
            style={{ opacity: staggerStep >= 1 ? 1 : 0, transition: `opacity ${reducedMotion ? 0 : 280}ms ease-out` }}
          />
        );
      })}

      {/* Hero piece halo — expanding ring around the key piece */}
      {content.heroSquare && (() => {
        const c = squareCenter(content.heroSquare, flipped);
        const color = content.heroColor ?? "green";
        return (
          <g key="hero">
            <circle cx={c.x} cy={c.y} r={0.35}
              fill={rgba(color, 0.1)}
              stroke={rgba(color, 0.7)}
              strokeWidth={0.055}
              style={{ opacity: staggerStep >= 0 ? 1 : 0, transition: `opacity ${reducedMotion ? 0 : 220}ms ease-out` }}
            />
            {!reducedMotion && (
              <circle cx={c.x} cy={c.y} r={0.42}
                fill="none"
                stroke={rgba(color, 0.5)}
                strokeWidth={0.04}
                className="bca-halo-expand"
              />
            )}
          </g>
        );
      })()}

      <style>{`
        .bca-pulse {
          animation: bcaPulse 1.4s ease-in-out infinite;
        }
        @keyframes bcaPulse {
          0%, 100% { stroke-width: 0.085; opacity: 0.85; }
          50%      { stroke-width: 0.12;  opacity: 1; }
        }
        .bca-halo-expand {
          animation: bcaHaloExpand 1.6s ease-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        @keyframes bcaHaloExpand {
          0%   { r: 0.38; opacity: 0.55; }
          100% { r: 0.56; opacity: 0; }
        }
        .bca-threat-pulse {
          animation: bcaThreatPulse 1.8s ease-in-out infinite;
        }
        @keyframes bcaThreatPulse {
          0%, 100% { opacity: 0.7; }
          50%      { opacity: 1; }
        }
        .bca-target-pulse {
          animation: bcaTargetPulse 1.8s ease-in-out infinite;
        }
        @keyframes bcaTargetPulse {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        .bca-danger-dash {
          animation: bcaDangerDash 1.2s linear infinite;
        }
        @keyframes bcaDangerDash {
          to { stroke-dashoffset: -0.56; }
        }
      `}</style>
    </svg>
  );
}
