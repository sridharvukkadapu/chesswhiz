"use client";

import React from "react";
import type { PlayerProgression, Rank } from "@/lib/progression/types";
import { KINGDOMS, getPowersForKingdom } from "@/lib/progression/data";
import { T, KINGDOM_COLORS } from "@/lib/design/tokens";
import { useTime, GoldFoilText } from "@/lib/design/atmosphere";
import { Piece, type PieceType } from "@/components/ChessPieces";

interface KnightCardProps {
  playerName: string;
  progression: PlayerProgression;
  rank: Rank;
  stats: { gamesWon: number; puzzlesSolved: number; longestStreak: number };
}

const RANK_PIECE: Record<string, PieceType> = {
  pawn: "pawn",
  knight: "knight",
  bishop: "bishop",
  rook: "rook",
  queen: "queen",
  king: "king",
};

function titleFromProgression(prog: PlayerProgression): string {
  const last = prog.defeatedBosses[prog.defeatedBosses.length - 1];
  if (last) {
    const k = KINGDOMS.find((kk) => kk.boss?.name === last);
    if (k) return `${k.name} Champion`;
  }
  if (prog.completedKingdoms.length > 0) {
    const idx = prog.completedKingdoms.length - 1;
    const k = KINGDOMS.find((kk) => kk.id === prog.completedKingdoms[idx]);
    if (k) return `${k.name} Champion`;
  }
  return "Rising Apprentice";
}

function rarity(prog: PlayerProgression): "common" | "uncommon" | "rare" | "epic" | "legendary" {
  if (prog.earnedPowers.length >= 18) return "legendary";
  if (prog.earnedPowers.length >= 12) return "epic";
  if (prog.earnedPowers.length >= 6) return "rare";
  if (prog.earnedPowers.length >= 2) return "uncommon";
  return "common";
}

const RARITY_TINT: Record<string, { color: string; bg: string; border: string }> = {
  common: { color: "#C8A87A", bg: "rgba(200,168,122,0.15)", border: "rgba(200,168,122,0.30)" },
  uncommon: { color: T.sage, bg: "rgba(124,182,158,0.20)", border: "rgba(124,182,158,0.45)" },
  rare: { color: "#7FBFE8", bg: "rgba(127,191,232,0.18)", border: "rgba(127,191,232,0.45)" },
  epic: { color: "#F4A6B8", bg: "rgba(244,166,184,0.18)", border: "rgba(244,166,184,0.45)" },
  legendary: { color: T.butter, bg: "rgba(242,201,76,0.20)", border: "rgba(242,201,76,0.55)" },
};

function dateCode(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

function KnightCard({ playerName, progression, rank, stats }: KnightCardProps) {
  const time = useTime();
  // Subtle 3D tilt that gently oscillates
  const tiltX = Math.sin(time * 0.5) * 1.5;
  const tiltY = Math.cos(time * 0.6) * 2;
  // Holographic shimmer sweep — moves across card
  const shimmerX = ((time * 0.6) % 2) - 0.3;

  const title = titleFromProgression(progression);
  const r = rarity(progression);
  const tint = RARITY_TINT[r];

  // Bosses defeated chips
  const bossTags = progression.defeatedBosses
    .map((bossName) => {
      const k = KINGDOMS.find((kk) => kk.boss?.name === bossName);
      return k ? { name: k.boss!.name, color: KINGDOM_COLORS[k.id] ?? T.amber } : null;
    })
    .filter(Boolean) as { name: string; color: string }[];

  const playerCode = playerName.toUpperCase().replace(/\s+/g, "").slice(0, 8) || "PLAYER";
  const cardId = `CW-${dateCode()}-${playerCode} · #${String(progression.xp % 99999).padStart(5, "0")}`;

  return (
    <div
      style={{
        transform: `perspective(2400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        transformStyle: "preserve-3d",
        width: "min(520px, 92vw)",
        aspectRatio: "520 / 760",
        animation: "kcIn 1.0s cubic-bezier(0.34,1.56,0.64,1) both",
      }}
    >
      {/* CARD BODY (outer foil rim) */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 32,
          background: "linear-gradient(155deg, #3D2A1B 0%, #2A1A0E 30%, #1A0F08 70%, #2A1A0E 100%)",
          padding: 4,
          boxShadow: `${T.shadowDeep}, 0 0 60px rgba(242,201,76,0.35), inset 0 0 0 2px rgba(242,201,76,0.55)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Holographic shimmer overlay */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 32,
            background: `linear-gradient(${110 + Math.sin(time * 0.3) * 10}deg,
              transparent 0%,
              transparent ${(shimmerX * 100) | 0}%,
              rgba(255,255,255,0.30) ${((shimmerX + 0.08) * 100) | 0}%,
              rgba(242,201,76,0.20) ${((shimmerX + 0.16) * 100) | 0}%,
              transparent ${((shimmerX + 0.24) * 100) | 0}%,
              transparent 100%)`,
            mixBlendMode: "screen",
            pointerEvents: "none",
            zIndex: 5,
          }}
        />

        {/* Inner card surface */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 28,
            background: "linear-gradient(170deg, #2A1A0E 0%, #150C05 100%)",
            border: "1px solid rgba(242,201,76,0.35)",
            padding: "28px 24px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* foil corner accents */}
          {(["tl", "tr", "bl", "br"] as const).map((corner) => {
            const pos: React.CSSProperties = {
              tl: { top: 14, left: 14 },
              tr: { top: 14, right: 14 },
              bl: { bottom: 14, left: 14 },
              br: { bottom: 14, right: 14 },
            }[corner];
            const rot = { tl: 0, tr: 90, bl: 270, br: 180 }[corner];
            return (
              <svg
                key={corner}
                width="32"
                height="32"
                viewBox="0 0 36 36"
                style={{ position: "absolute", ...pos, transform: `rotate(${rot}deg)` }}
                aria-hidden
              >
                <defs>
                  <linearGradient id={`kcCorner-${corner}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F2C94C" />
                    <stop offset="100%" stopColor="#C8965A" />
                  </linearGradient>
                </defs>
                <path
                  d="M 4 4 L 32 4 M 4 4 L 4 32 M 4 4 L 14 14"
                  stroke={`url(#kcCorner-${corner})`}
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            );
          })}

          {/* Header — rank chip + rarity badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div
              style={{
                fontFamily: T.fontUI,
                fontSize: 11,
                fontWeight: 700,
                color: T.butter,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}
            >
              ♘ {rank.name} Rank
            </div>
            <div
              style={{
                padding: "4px 10px",
                background: tint.bg,
                border: `1px solid ${tint.border}`,
                borderRadius: 6,
                fontFamily: T.fontUI,
                fontSize: 10,
                fontWeight: 700,
                color: tint.color,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              {r}
            </div>
          </div>

          {/* Player name (gold foil) */}
          <div style={{ marginBottom: 4 }}>
            <GoldFoilText fontSize={48} italic>
              {playerName || "Player"}
            </GoldFoilText>
          </div>
          <div
            style={{
              fontFamily: T.fontHand,
              fontSize: 22,
              color: "#C8A87A",
              transform: "rotate(-1.5deg)",
              marginBottom: 18,
            }}
          >
            {title}
          </div>

          {/* Big piece in frame */}
          <div
            style={{
              flex: 1,
              position: "relative",
              borderRadius: 18,
              background: "radial-gradient(ellipse at 50% 30%, rgba(242,201,76,0.22) 0%, rgba(42,26,14,0.7) 60%, rgba(21,12,5,1) 100%)",
              border: "1px solid rgba(242,201,76,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              boxShadow: "inset 0 0 30px rgba(0,0,0,0.4)",
              minHeight: 220,
            }}
          >
            {/* radial sunburst */}
            <svg style={{ position: "absolute", inset: 0 }} viewBox="0 0 460 360" aria-hidden>
              {[...Array(20)].map((_, i) => (
                <line
                  key={i}
                  x1="230"
                  y1="180"
                  x2={230 + Math.cos((i / 20) * Math.PI * 2 + time * 0.3) * 300}
                  y2={180 + Math.sin((i / 20) * Math.PI * 2 + time * 0.3) * 300}
                  stroke="rgba(242,201,76,0.15)"
                  strokeWidth="1"
                />
              ))}
            </svg>
            <div
              style={{
                filter: "drop-shadow(0 0 24px rgba(242,201,76,0.7))",
                transform: `translateY(${Math.sin(time * 1.5) * 4}px)`,
              }}
            >
              <Piece type={RANK_PIECE[rank.id] ?? "knight"} color="white" size={180} />
            </div>
            <div
              aria-hidden
              style={{
                position: "absolute",
                bottom: 30,
                left: "50%",
                transform: "translateX(-50%)",
                width: 200,
                height: 22,
                borderRadius: "50%",
                background: "radial-gradient(ellipse, rgba(242,201,76,0.6) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
            />
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {[
              { label: "GAMES WON", value: String(stats.gamesWon), color: T.sage },
              { label: "POWERS", value: `${progression.earnedPowers.length}`, color: "#F4A6B8" },
              { label: "STREAK", value: `${stats.longestStreak}d`, color: T.butter },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  padding: "10px 8px",
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${s.color}55`,
                  borderRadius: 10,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: T.fontDisplay,
                    fontStyle: "italic",
                    fontWeight: 700,
                    fontSize: 24,
                    color: s.color,
                    lineHeight: 1,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontFamily: T.fontUI,
                    fontSize: 10,
                    color: "#C8A87A",
                    letterSpacing: "0.15em",
                    marginTop: 4,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Bosses defeated tags */}
          {bossTags.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {bossTags.slice(0, 3).map((b, i) => (
                <div
                  key={i}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 100,
                    background: `${b.color}22`,
                    border: `1px solid ${b.color}66`,
                    fontFamily: T.fontUI,
                    fontSize: 11,
                    fontWeight: 600,
                    color: b.color,
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                  }}
                >
                  ✦ {b.name}
                </div>
              ))}
            </div>
          )}

          {/* Footer ID + brand mark */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: T.fontMono,
                fontSize: 10,
                color: "#7A5C3A",
                letterSpacing: "0.15em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {cardId}
            </div>
            <div
              style={{
                fontFamily: T.fontDisplay,
                fontStyle: "italic",
                fontSize: 14,
                fontWeight: 600,
                background: "linear-gradient(135deg, #F2C94C, #FF8E70, #F2C94C)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ChessWhiz
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes kcIn {
          from { opacity: 0; transform: perspective(2400px) translateY(60px) scale(0.5); }
          to   { opacity: 1; transform: perspective(2400px) translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default KnightCard;
