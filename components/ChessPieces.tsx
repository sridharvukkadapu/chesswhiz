"use client";

import React from "react";

// ═══════════════════════════════════════════════════════════════
// Premium chess piece SVGs — direct port of the design bundle.
// Each piece is rendered at a base 120x120 viewBox; scale via `size`.
// White = ivory porcelain with warm gold rim.
// Black = obsidian with amethyst rim.
// ═══════════════════════════════════════════════════════════════

// Mount once at the app root (inside Board.tsx) so the gradient/filter
// defs are reachable from every <Piece/> instance.
export function PieceDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        {/* WHITE: ivory porcelain with warm gold rim */}
        <linearGradient id="cwWBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF6E1" />
          <stop offset="50%" stopColor="#F0DCAD" />
          <stop offset="100%" stopColor="#9C7A3F" />
        </linearGradient>
        <radialGradient id="cwWHi" cx="0.4" cy="0.3" r="0.6">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        {/* BLACK: obsidian with amethyst rim */}
        <linearGradient id="cwBBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A2A55" />
          <stop offset="50%" stopColor="#1A1126" />
          <stop offset="100%" stopColor="#08050F" />
        </linearGradient>
        <radialGradient id="cwBHi" cx="0.4" cy="0.3" r="0.6">
          <stop offset="0%" stopColor="#E0BBFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#E0BBFF" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

const PIECE_PATHS: Record<
  string,
  { body: string; base: string; crown?: string; eye?: { cx: number; cy: number } }
> = {
  king: {
    body:
      "M60 12 L60 22 M52 17 L68 17 M60 22 C45 22 38 32 38 44 C38 54 44 60 50 62 L48 78 L72 78 L70 62 C76 60 82 54 82 44 C82 32 75 22 60 22 Z",
    base: "M42 78 L78 78 L82 88 L86 100 L34 100 L38 88 Z",
    crown: "M52 17 L68 17 M56 12 L64 12 M60 8 L60 22",
  },
  queen: {
    body:
      "M60 14 C56 14 54 17 54 20 C54 23 56 26 60 26 C64 26 66 23 66 20 C66 17 64 14 60 14 Z M44 28 L48 50 L60 30 L72 50 L76 28 L82 32 L78 56 C78 60 74 64 60 64 C46 64 42 60 42 56 L38 32 Z M50 64 L70 64 L72 78 L48 78 Z",
    base: "M42 78 L78 78 L82 88 L86 100 L34 100 L38 88 Z",
  },
  rook: {
    body:
      "M40 18 L40 32 L48 32 L48 24 L56 24 L56 32 L64 32 L64 24 L72 24 L72 32 L80 32 L80 18 Z M44 32 L44 64 L42 70 L78 70 L76 64 L76 32 Z",
    base: "M40 70 L80 70 L84 80 L88 100 L32 100 L36 80 Z",
  },
  bishop: {
    body:
      "M60 12 C58 12 57 14 57 16 C57 17 58 18 60 18 C62 18 63 17 63 16 C63 14 62 12 60 12 Z M60 18 C50 18 42 28 42 42 C42 52 48 60 54 64 L48 78 L72 78 L66 64 C72 60 78 52 78 42 C78 28 70 18 60 18 Z M55 38 L65 50",
    base: "M44 78 L76 78 L80 88 L84 100 L36 100 L40 88 Z",
  },
  knight: {
    body:
      "M44 100 L46 80 C36 70 38 56 46 48 C44 42 46 36 50 32 L46 26 L52 22 L58 28 C66 24 76 28 82 38 C88 50 84 70 78 80 L80 100 Z M58 38 C56 36 53 36 51 38 C49 40 49 43 51 45 C53 47 56 47 58 45 Z",
    base: "M40 90 L84 90 L88 100 L36 100 Z",
    eye: { cx: 56, cy: 41 },
  },
  pawn: {
    body:
      "M60 18 C54 18 50 22 50 28 C50 32 52 35 55 37 C50 39 46 44 46 50 C46 56 50 60 55 62 L52 78 L68 78 L65 62 C70 60 74 56 74 50 C74 44 70 39 65 37 C68 35 70 32 70 28 C70 22 66 18 60 18 Z",
    base: "M44 78 L76 78 L80 88 L84 100 L36 100 L40 88 Z",
  },
};

export type PieceType = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn";

interface PieceProps {
  type: PieceType;
  color?: "white" | "black";
  size?: number;
  glow?: string | null;
  style?: React.CSSProperties;
}

export function Piece({
  type, color = "white", size = 80, glow = null, style = {},
}: PieceProps) {
  const isWhite = color === "white";
  const bodyFill = isWhite ? "url(#cwWBody)" : "url(#cwBBody)";
  const baseFill = bodyFill;
  const accent = isWhite ? "#B07A0E" : "#9333EA";
  const stroke = isWhite ? "#7A5418" : "#1F0A38";
  const hi = isWhite ? "url(#cwWHi)" : "url(#cwBHi)";
  const p = PIECE_PATHS[type];
  if (!p) return null;

  const filterStyle: React.CSSProperties = glow
    ? { filter: `drop-shadow(0 0 12px ${glow})` }
    : {};

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={{ display: "block", overflow: "visible", ...filterStyle, ...style }}
      aria-hidden
    >
      {/* base shadow ellipse */}
      <ellipse cx="60" cy="104" rx="28" ry="4" fill="rgba(0,0,0,0.45)" filter="blur(2px)" />

      {/* base */}
      <path d={p.base} fill={baseFill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />

      {/* body */}
      <path d={p.body} fill={bodyFill} stroke={stroke} strokeWidth="1.5"
            strokeLinejoin="round" strokeLinecap="round" />

      {/* highlight */}
      <path d={p.body} fill={hi} opacity="0.9" />

      {/* crown details for king */}
      {type === "king" && p.crown && (
        <>
          <path d={p.crown} stroke={accent} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="60" cy="9" r="3" fill={accent} />
        </>
      )}

      {/* knight eye */}
      {type === "knight" && p.eye && (
        <>
          <circle cx={p.eye.cx} cy={p.eye.cy} r="2.2"
                  fill={isWhite ? "#1A1210" : "#FCD34D"} />
          <circle cx={p.eye.cx + 0.7} cy={p.eye.cy - 0.6} r="0.7" fill="#FFF" />
        </>
      )}

      {/* bishop slash detail */}
      {type === "bishop" && (
        <line x1="55" y1="38" x2="65" y2="50" stroke={accent} strokeWidth="2" strokeLinecap="round" />
      )}

      {/* queen orb tip */}
      {type === "queen" && <circle cx="60" cy="20" r="3" fill={accent} />}
    </svg>
  );
}

// chess.js gives us pieces as { type: "p"|"n"|"b"|"r"|"q"|"k", color: "w"|"b" }
const TYPE_FROM_LETTER: Record<string, PieceType> = {
  p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king",
};

export function PieceFromChess({
  piece, size = 80, glow = null,
}: {
  piece: { type: string; color: string } | null;
  size?: number;
  glow?: string | null;
}) {
  if (!piece) return null;
  const type = TYPE_FROM_LETTER[piece.type];
  if (!type) return null;
  return <Piece type={type} color={piece.color === "w" ? "white" : "black"} size={size} glow={glow} />;
}
