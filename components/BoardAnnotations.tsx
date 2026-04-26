"use client";

import { useEffect, useState } from "react";
import type { BoardAnnotation, AnnotationColor } from "@/lib/chess/types";

// Coordinates are in chess-square units (0..8). The SVG uses viewBox
// "0 0 8 8" and stretches to the parent's size, so the overlay tracks
// the board's fluid sizing without any pixel math.

const COLORS: Record<AnnotationColor, { rgb: string }> = {
  green:  { rgb: "34, 197, 94" },
  red:    { rgb: "239, 68, 68" },
  yellow: { rgb: "234, 179, 8" },
  blue:   { rgb: "59, 130, 246" },
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

      <style>{`
        .bca-pulse {
          animation: bcaPulse 1.4s ease-in-out infinite;
        }
        @keyframes bcaPulse {
          0%, 100% { stroke-width: 0.085; opacity: 0.85; }
          50%      { stroke-width: 0.12;  opacity: 1; }
        }
      `}</style>
    </svg>
  );
}
