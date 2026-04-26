"use client";

import Link from "next/link";
import { getRankByXP, getNextRank, KINGDOMS } from "@/lib/progression/data";
import type { PlayerProgression } from "@/lib/progression/types";

const P = {
  cream: "#FBF7F0",
  parchment: "#F0E8D8",
  ink: "#1A1210",
  inkSoft: "#2E2620",
  inkMed: "#5C544A",
  inkLight: "#8A8278",
  inkGhost: "#D0C8BC",
  emerald: "#1B7340",
  gold: "#C7940A",
};

const KINGDOM_ICONS: Record<string, string> = {
  village: "🏘️",
  fork_forest: "🌲",
  pin_palace: "🏰",
  skewer_spire: "🗼",
  discovery_depths: "⛰️",
  strategy_summit: "🏔️",
  endgame_throne: "👑",
};

export default function ProgressStrip({ progression }: { progression: PlayerProgression }) {
  const rank = getRankByXP(progression.xp);
  const next = getNextRank(rank.id);
  const floor = rank.xpRequired;
  const ceil = next ? next.xpRequired : rank.xpRequired + 1;
  const pct = next ? Math.min(100, Math.max(0, ((progression.xp - floor) / (ceil - floor)) * 100)) : 100;

  const kingdom = KINGDOMS.find((k) => k.id === progression.currentKingdom) ?? KINGDOMS[0];
  const missionText = progression.activeMission?.description ?? `Explore ${kingdom.name}`;
  const missionShort = missionText.length > 42 ? missionText.slice(0, 39) + "…" : missionText;

  return (
    <Link href="/kingdom" aria-label={`Open the kingdom map. Current rank: ${rank.name}, ${progression.xp} XP. Currently in ${kingdom.name}. Mission: ${missionText}`} style={{
      display: "block", textDecoration: "none", color: "inherit",
      borderBottom: `1px solid ${P.inkGhost}40`,
      background: "rgba(251,247,240,0.7)",
      backdropFilter: "blur(12px)",
      transition: "background 0.2s ease",
    }}>
      <div style={{
        maxWidth: 1000, margin: "0 auto",
        padding: "8px 16px",
        display: "flex", alignItems: "center", gap: 12,
        fontFamily: "var(--font-nunito), sans-serif",
        minHeight: 32,
      }}>
        {/* Rank chip */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, color: rank.color, lineHeight: 1 }}>{rank.icon}</span>
          <span style={{
            fontSize: 11, fontWeight: 800, color: rank.color,
            letterSpacing: 0.4, textTransform: "uppercase",
          }}>{rank.name}</span>
          <span style={{ fontSize: 11, color: P.inkLight, fontWeight: 600 }}>· {progression.xp} XP</span>
        </div>

        {/* Mini XP bar */}
        <div style={{
          width: 80, height: 4, borderRadius: 2,
          background: P.parchment, overflow: "hidden", flexShrink: 0,
        }}>
          <div style={{
            width: `${pct}%`, height: "100%",
            background: `linear-gradient(90deg, ${rank.color}, ${next?.color ?? rank.color})`,
            transition: "width 0.5s ease-out",
          }} />
        </div>

        {/* Divider */}
        <span aria-hidden style={{ color: P.inkGhost, fontSize: 12, flexShrink: 0 }}>·</span>

        {/* Kingdom + mission */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          minWidth: 0, flex: 1,
        }}>
          <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>{KINGDOM_ICONS[kingdom.id] ?? "♟"}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, color: P.inkSoft,
            flexShrink: 0,
          }}>{kingdom.name}</span>
          <span aria-hidden style={{ color: P.inkGhost, fontSize: 12, flexShrink: 0 }}>·</span>
          <span style={{
            fontSize: 11, color: P.inkLight,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            minWidth: 0,
          }}>{missionShort}</span>
        </div>

        {/* Chevron */}
        <span aria-hidden style={{
          color: P.inkLight, flexShrink: 0,
          display: "flex", alignItems: "center",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
