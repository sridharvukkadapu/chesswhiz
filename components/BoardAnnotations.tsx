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
  // White's perspective: a1 is bottom-left → x=0, y=7.5 (squares are 1 unit, center is +0.5)
  const x = flipped ? 7 - file : file;
  const y = flipped ? rank - 1 : 8 - rank;
  return { x: x + 0.5, y: y + 0.5 };
}

interface Props {
  annotation: BoardAnnotation | null;
  flipped?: boolean;
}

export default function BoardAnnotations({ annotation, flipped = false }: Props) {
  // Local fade-out: when annotation prop becomes null, we run a quick
  // fade before unmounting so the change isn't jarring. We render the
  // last annotation while fading.
  const [visible, setVisible] = useState(false);
  const [content, setContent] = useState<BoardAnnotation | null>(null);

  useEffect(() => {
    if (annotation) {
      setContent(annotation);
      setVisible(true);
    } else if (content) {
      setVisible(false);
      const t = setTimeout(() => setContent(null), 500);
      return () => clearTimeout(t);
    }
  }, [annotation, content]);

  if (!content) return null;

  const arrowMarkerSize = 0.35; // in square units

  return (
    <svg
      viewBox="0 0 8 8"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 5,
        opacity: visible ? 1 : 0,
        transition: "opacity 500ms ease",
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
              fill={rgba(c, 0.85)}
            />
          </marker>
        ))}
      </defs>

      {/* Square highlights */}
      {content.highlights?.map((h, i) => {
        const c = squareCenter(h.square, flipped);
        return (
          <rect
            key={`h-${i}`}
            x={c.x - 0.5}
            y={c.y - 0.5}
            width={1}
            height={1}
            fill={rgba(h.color, h.opacity ?? 0.3)}
            rx={0.08}
          />
        );
      })}

      {/* Arrows */}
      {content.arrows?.map((a, i) => {
        const f = squareCenter(a.from, flipped);
        const t = squareCenter(a.to, flipped);
        const dx = t.x - f.x;
        const dy = t.y - f.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.01) return null;
        // Pull the arrow's start out of the source square's center and
        // its tip just short of the target's center so it visually
        // points to the piece, not through it.
        const startTrim = 0.25;
        const endTrim = 0.4;
        const x1 = f.x + (dx / len) * startTrim;
        const y1 = f.y + (dy / len) * startTrim;
        const x2 = t.x - (dx / len) * endTrim;
        const y2 = t.y - (dy / len) * endTrim;
        const opacity = a.opacity ?? 0.6;
        return (
          <line
            key={`a-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={rgba(a.color, opacity)}
            strokeWidth={0.14}
            strokeLinecap="round"
            markerEnd={`url(#bca-arrow-${a.color})`}
          />
        );
      })}

      {/* Circles around squares */}
      {content.circles?.map((cir, i) => {
        const c = squareCenter(cir.square, flipped);
        return (
          <circle
            key={`c-${i}`}
            cx={c.x}
            cy={c.y}
            r={0.42}
            fill="none"
            stroke={rgba(cir.color, 0.75)}
            strokeWidth={0.07}
          />
        );
      })}
    </svg>
  );
}
