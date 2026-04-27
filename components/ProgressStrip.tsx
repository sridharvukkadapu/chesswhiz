"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import { getRankByXP, getNextRank, KINGDOMS } from "@/lib/progression/data";
import type { PlayerProgression } from "@/lib/progression/types";
import { T, KINGDOM_COLORS } from "@/lib/design/tokens";
import { Piece, type PieceType } from "@/components/ChessPieces";

const KINGDOM_ICONS: Record<string, string> = {
  village: "🏘️",
  fork_forest: "🌲",
  pin_palace: "🏰",
  skewer_spire: "🗼",
  discovery_depths: "⛰️",
  strategy_summit: "🏔️",
  endgame_throne: "👑",
};

// Rank ID → mascot piece for the avatar chip
const RANK_PIECE: Record<string, PieceType> = {
  pawn: "pawn",
  knight: "knight",
  bishop: "bishop",
  rook: "rook",
  queen: "queen",
  king: "king",
};

export default function ProgressStrip({ progression }: { progression: PlayerProgression }) {
  const rank = getRankByXP(progression.xp);
  const next = getNextRank(rank.id);
  const floor = rank.xpRequired;
  const ceil = next ? next.xpRequired : rank.xpRequired + 1;
  const pct = next ? Math.min(100, Math.max(0, ((progression.xp - floor) / (ceil - floor)) * 100)) : 100;

  const kingdom = KINGDOMS.find((k) => k.id === progression.currentKingdom) ?? KINGDOMS[0];
  const kingdomColor = KINGDOM_COLORS[kingdom.id] ?? T.amber;

  const ariaLabel = `Open the kingdom map. Current rank: ${rank.name}, ${progression.xp} XP. Currently in ${kingdom.name}.`;

  return (
    <Link
      href="/kingdom"
      aria-label={ariaLabel}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          margin: "12px auto 0",
          maxWidth: 1100,
          padding: "10px 18px",
          display: "flex",
          alignItems: "center",
          gap: 18,
          background: "rgba(26,18,56,0.72)",
          border: `1px solid ${T.border}`,
          borderRadius: 100,
          backdropFilter: "blur(14px) saturate(1.2)",
          fontFamily: T.fontUI,
          flexWrap: "wrap",
        }}
      >
        {/* Rank chip */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "linear-gradient(135deg, #F5E2B8, #B07A0E)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: T.glowAmber,
            }}
          >
            <Piece type={RANK_PIECE[rank.id] ?? "pawn"} color="white" size={26} />
          </div>
          <div
            style={{
              fontFamily: T.fontUI,
              fontSize: 13,
              fontWeight: 700,
              color: T.textHi,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {rank.name}
          </div>
        </div>

        <div style={{ width: 1, height: 22, background: T.border, flexShrink: 0 }} />

        {/* XP bar + value */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 200px", minWidth: 180 }}>
          <div
            role="progressbar"
            aria-valuenow={progression.xp}
            aria-valuemin={floor}
            aria-valuemax={ceil}
            aria-label={`XP progress to next rank: ${progression.xp} of ${ceil}`}
            style={{
              flex: 1,
              maxWidth: 220,
              height: 8,
              borderRadius: 4,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: T.goldFoil,
                boxShadow: "0 0 8px rgba(245,182,56,0.6)",
                transition: "width 600ms ease",
              }}
            />
          </div>
          <div
            style={{
              fontFamily: T.fontMono,
              fontSize: 12,
              color: T.amberGlow,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {progression.xp.toLocaleString()} XP
          </div>
        </div>

        <div style={{ width: 1, height: 22, background: T.border, flexShrink: 0 }} />

        {/* Quest */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 1 auto", minWidth: 0 }}>
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{KINGDOM_ICONS[kingdom.id] ?? "♟"}</span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: T.fontUI,
                fontSize: 10,
                color: T.textLo,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                lineHeight: 1.1,
              }}
            >
              Quest
            </div>
            <div
              style={{
                fontFamily: T.fontDisplay,
                fontStyle: "italic",
                fontSize: 16,
                color: T.textHi,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 220,
              }}
            >
              {kingdom.name}
            </div>
          </div>
        </div>

        {/* Streak chip on the right */}
        {progression.streak > 0 && (
          <>
            <div style={{ flex: 1 }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                background: "rgba(245,182,56,0.10)",
                borderRadius: 100,
                border: "1px solid rgba(245,182,56,0.3)",
                flexShrink: 0,
              }}
            >
              <Flame aria-hidden size={14} color={T.amberGlow} strokeWidth={2.4} fill={T.amberGlow} fillOpacity={0.3} />
              <span
                style={{
                  fontFamily: T.fontUI,
                  fontWeight: 700,
                  color: T.amberGlow,
                  fontSize: 12,
                }}
              >
                {progression.streak}d
              </span>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
