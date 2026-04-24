"use client";

import { forwardRef } from "react";
import type { PlayerProgression, Rank } from "@/lib/progression/types";
import { KINGDOMS, POWERS } from "@/lib/progression/data";

const P = {
  cream: "#FBF7F0",
  creamDeep: "#F5EFE4",
  parchment: "#F0E8D8",
  ink: "#1A1210",
  inkSoft: "#2E2620",
  inkMed: "#5C544A",
  inkLight: "#8A8278",
  inkFaint: "#B0A898",
  inkGhost: "#D0C8BC",
  emerald: "#1B7340",
  emeraldPale: "#E6F4EC",
  gold: "#C7940A",
  goldLight: "#F0D060",
  goldPale: "#FDF6E3",
};

interface KnightCardProps {
  playerName: string;
  progression: PlayerProgression;
  rank: Rank;
  stats: { gamesWon: number; puzzlesSolved: number; longestStreak: number };
}

function titleFromProgression(prog: PlayerProgression): string {
  // Pick the most recently defeated boss's kingdom name as a title.
  const last = prog.defeatedBosses[prog.defeatedBosses.length - 1];
  if (!last) return "Apprentice of the Pawn Village";
  const kingdom = KINGDOMS.find((k) => k.boss?.name === last);
  if (!kingdom) return "Chess Traveler";
  return `${kingdom.name} Champion`;
}

function rarestAchievement(prog: PlayerProgression): { icon: string; label: string } | null {
  const order: Record<string, number> = { common: 1, rare: 2, epic: 3, legendary: 4 };
  let best: { icon: string; label: string; rank: number } | null = null;
  for (const id of prog.earnedPowers) {
    const pw = POWERS.find((p) => p.id === id);
    if (!pw) continue;
    const r = order[pw.rarity] ?? 0;
    if (!best || r > best.rank) best = { icon: pw.icon, label: pw.name, rank: r };
  }
  return best ? { icon: best.icon, label: best.label } : null;
}

const KnightCard = forwardRef<HTMLDivElement, KnightCardProps>(function KnightCard(
  { playerName, progression, rank, stats },
  ref
) {
  const title = titleFromProgression(progression);
  const rare = rarestAchievement(progression);
  const totalPowers = POWERS.length;

  return (
    <div
      ref={ref}
      style={{
        width: 360,
        background: P.cream,
        border: `1px solid ${P.inkGhost}`,
        borderRadius: 24,
        boxShadow: `0 0 0 6px ${P.parchment}, 0 28px 72px rgba(26,18,16,0.2), 0 4px 14px rgba(26,18,16,0.1)`,
        padding: "28px 24px",
        position: "relative",
        fontFamily: "var(--font-nunito), sans-serif",
        color: P.ink,
        overflow: "hidden",
      }}
    >
      {/* Subtle corner ornaments */}
      <div aria-hidden style={{ position: "absolute", inset: 8, borderRadius: 18, border: `1px dashed ${P.inkGhost}`, pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ textAlign: "center", position: "relative" }}>
        <div style={{
          fontFamily: "'Caveat', cursive", fontSize: 16, color: P.gold,
          letterSpacing: 1, marginBottom: 4,
        }}>knight of the chess kingdom</div>
        <div style={{
          fontSize: 28, lineHeight: 1, color: rank.color, margin: "4px 0",
          filter: `drop-shadow(0 3px 8px ${rank.color}40)`,
        }}>{rank.icon}</div>
        <div style={{
          fontSize: 26, fontWeight: 900,
          fontFamily: "var(--font-playfair), serif",
          color: P.ink, letterSpacing: -0.4,
        }}>{playerName || "Anonymous"}</div>
        <div style={{
          display: "inline-block", marginTop: 6, padding: "3px 10px", borderRadius: 6,
          background: P.goldPale, border: `1px solid ${P.gold}44`,
          fontSize: 10, fontWeight: 800, color: P.gold, letterSpacing: 1,
          textTransform: "uppercase",
        }}>{title}</div>
      </div>

      {/* Rank + XP */}
      <div style={{
        marginTop: 18, padding: "14px 16px", borderRadius: 14,
        background: "white", border: `1px solid ${P.inkGhost}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, color: P.inkLight, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Rank
          </div>
          <div style={{
            fontSize: 18, fontWeight: 800, color: P.ink,
            fontFamily: "var(--font-playfair), serif",
          }}>{rank.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: P.inkLight, letterSpacing: 1.5, textTransform: "uppercase" }}>
            XP
          </div>
          <div style={{
            fontSize: 18, fontWeight: 800, color: P.emerald,
            fontFamily: "var(--font-playfair), serif",
          }}>{progression.xp.toLocaleString()}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        marginTop: 10, padding: "14px 16px", borderRadius: 14,
        background: P.creamDeep, border: `1px solid ${P.inkGhost}`,
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
      }}>
        <Stat label="Bosses" value={stats.gamesWon} />
        <Stat label="Powers" value={`${progression.earnedPowers.length}/${totalPowers}`} />
        <Stat label="Streak" value={`${stats.longestStreak}d`} />
      </div>

      {/* Bosses */}
      {progression.defeatedBosses.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: P.inkLight, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
            Bosses Defeated
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {progression.defeatedBosses.map((b) => (
              <span key={b} style={{
                padding: "4px 10px", borderRadius: 8,
                background: P.emeraldPale, border: `1px solid ${P.emerald}44`,
                fontSize: 11, fontWeight: 700, color: P.emerald,
              }}>{b}</span>
            ))}
          </div>
        </div>
      )}

      {/* Rarest achievement */}
      {rare && (
        <div style={{
          marginTop: 14, padding: "12px 14px", borderRadius: 12,
          background: `linear-gradient(135deg, ${P.goldPale} 0%, ${P.emeraldPale} 100%)`,
          border: `1px solid ${P.gold}55`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 24 }}>{rare.icon}</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: P.gold, letterSpacing: 1, textTransform: "uppercase" }}>
              Rarest Achievement
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: P.ink, fontFamily: "var(--font-playfair), serif" }}>
              {rare.label}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 18, textAlign: "center",
        fontSize: 10, color: P.inkFaint, letterSpacing: 1.5, textTransform: "uppercase",
      }}>
        ChessWhiz · Made with ♥
      </div>
    </div>
  );
});

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontSize: 20, fontWeight: 900, color: P.ink,
        fontFamily: "var(--font-playfair), serif",
      }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 800, color: P.inkLight, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

export default KnightCard;
