"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getRankByXP, getNextRank, KINGDOMS } from "@/lib/progression/data";
import type { PlayerProgression, Mission } from "@/lib/progression/types";
import type { GameStatus, CoachMessage } from "@/lib/chess/types";

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
  emeraldBright: "#22C55E",
  emeraldPale: "#E6F4EC",
  gold: "#C7940A",
  goldLight: "#F0D060",
  goldPale: "#FDF6E3",
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

interface PostGameProps {
  status: GameStatus;
  playerName: string;
  moveHistory: string[];
  coachMessages: CoachMessage[];
  progression: PlayerProgression;
  onPlayAgain: () => void;
}

// Deterministic coach review — built from in-conversation signals,
// no extra API call. Easy to upgrade to a Claude summary later.
function buildReview(args: {
  status: GameStatus;
  playerName: string;
  moveHistory: string[];
  coachMessages: CoachMessage[];
}): { headline: string; body: string } {
  const { status, playerName, moveHistory, coachMessages } = args;
  const moves = Math.ceil(moveHistory.length / 2);
  const praise = coachMessages.filter((m) => m.type === "praise").length;
  const corrections = coachMessages.filter((m) => m.type === "correction").length;
  const tips = coachMessages.filter((m) => m.type === "tip").length;

  const lengthNote = moves < 12
    ? "a quick game"
    : moves < 30
    ? "a solid full-length game"
    : "a long, thoughtful game";

  if (status === "white_wins") {
    const reason = praise > corrections
      ? `You found ${praise} great move${praise === 1 ? "" : "s"} along the way.`
      : "You stayed sharp until the end.";
    return {
      headline: `Checkmate, ${playerName}! 🏆`,
      body: `That was ${lengthNote}. ${reason}${corrections > 0 ? ` You hit ${corrections} rough spot${corrections === 1 ? "" : "s"} — totally normal! Every blunder is a lesson.` : ""}`,
    };
  }
  if (status === "black_wins") {
    return {
      headline: `Tough one, ${playerName}.`,
      body: `${lengthNote.charAt(0).toUpperCase() + lengthNote.slice(1)} — and the bot caught a break this time. You earned ${praise} praise call${praise === 1 ? "" : "s"} and got ${tips + corrections} coaching moment${tips + corrections === 1 ? "" : "s"} from me. The next game is yours. 💪`,
    };
  }
  return {
    headline: "Draw! 🤝",
    body: `Nicely defended, ${playerName}. Draws are surprisingly hard — neither side could land the knockout.`,
  };
}

function MissionProgress({ mission }: { mission: Mission | null }) {
  if (!mission) return null;
  return (
    <div style={{
      background: P.creamDeep,
      border: `1px solid ${P.gold}40`,
      borderRadius: 14,
      padding: "14px 16px",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{
          fontFamily: "var(--font-playfair), serif",
          fontSize: 13, fontWeight: 900, color: P.gold,
          letterSpacing: 0.3,
        }}>03</span>
        <span style={{
          fontSize: 10, fontWeight: 800, color: P.gold,
          letterSpacing: 1.4, textTransform: "uppercase",
        }}>Current Quest</span>
      </div>
      <p style={{
        margin: 0, fontSize: 14, fontWeight: 700, color: P.ink,
        fontFamily: "var(--font-nunito), sans-serif", lineHeight: 1.5,
      }}>{mission.description}</p>
      <div style={{
        marginTop: 6, fontSize: 11, color: P.inkLight,
        fontFamily: "var(--font-nunito), sans-serif", fontWeight: 600,
      }}>
        Games attempted: {mission.gamesAttempted}{mission.maxGamesBeforeHint > 0 ? ` · hint after ${mission.maxGamesBeforeHint}` : ""}
      </div>
    </div>
  );
}

export default function PostGameScreen({
  status, playerName, moveHistory, coachMessages, progression, onPlayAgain,
}: PostGameProps) {
  const review = useMemo(
    () => buildReview({ status, playerName, moveHistory, coachMessages }),
    [status, playerName, moveHistory, coachMessages]
  );

  const rank = getRankByXP(progression.xp);
  const next = getNextRank(rank.id);
  const floor = rank.xpRequired;
  const ceil = next ? next.xpRequired : rank.xpRequired + 1;
  const pct = next ? Math.min(100, Math.max(0, ((progression.xp - floor) / (ceil - floor)) * 100)) : 100;
  const xpToNext = next ? Math.max(0, ceil - progression.xp) : 0;

  const kingdom = KINGDOMS.find((k) => k.id === progression.currentKingdom) ?? KINGDOMS[0];

  const isWin = status === "white_wins";
  const accent = isWin ? P.emerald : status === "black_wins" ? "#9A3412" : P.gold;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Game complete"
      style={{
        background: "white",
        borderRadius: 24,
        border: `1px solid ${P.inkGhost}`,
        boxShadow: `0 0 0 4px ${P.parchment}, 0 24px 64px rgba(26,18,16,0.14), 0 8px 20px rgba(26,18,16,0.08)`,
        padding: "28px 24px",
        animation: "postGameAppear 0.55s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <span style={{
          fontFamily: "'Caveat', cursive", fontSize: 18, color: P.gold,
          display: "block", marginBottom: 4,
        }}>well played →</span>
        <h2 style={{
          fontSize: 26, fontWeight: 900,
          fontFamily: "var(--font-playfair), serif",
          color: accent, margin: "0 0 4px", letterSpacing: -0.6,
        }}>{review.headline}</h2>
        <div style={{
          fontSize: 11, fontWeight: 800, color: P.inkLight,
          letterSpacing: 1.4, textTransform: "uppercase",
          fontFamily: "var(--font-nunito), sans-serif",
        }}>Game Complete</div>
      </div>

      {/* 01: Coach review */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, padding: "0 4px" }}>
          <span style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: 13, fontWeight: 900, color: P.emerald,
            letterSpacing: 0.3,
          }}>01</span>
          <span style={{
            fontSize: 10, fontWeight: 800, color: P.emerald,
            letterSpacing: 1.4, textTransform: "uppercase",
          }}>Coach Pawn&apos;s Review</span>
        </div>
        <div style={{
          background: P.emeraldPale,
          border: `1.5px solid ${P.emerald}40`,
          borderRadius: "4px 16px 16px 16px",
          padding: "14px 16px",
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "white", border: `1.5px solid ${P.emerald}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, flexShrink: 0,
          }}>♟</div>
          <p style={{
            margin: 0, fontSize: 14, lineHeight: 1.65, color: P.inkSoft,
            fontFamily: "var(--font-nunito), sans-serif",
          }}>{review.body}</p>
        </div>
      </div>

      {/* 02: XP + rank progress */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, padding: "0 4px" }}>
          <span style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: 13, fontWeight: 900, color: P.inkMed,
            letterSpacing: 0.3,
          }}>02</span>
          <span style={{
            fontSize: 10, fontWeight: 800, color: P.inkMed,
            letterSpacing: 1.4, textTransform: "uppercase",
          }}>Your Progress</span>
        </div>
        <div style={{
          background: "white",
          border: `1px solid ${P.inkGhost}`,
          borderRadius: 14, padding: "14px 16px",
          boxShadow: `0 1px 4px rgba(26,18,16,0.04)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: `radial-gradient(circle at 35% 30%, ${rank.color} 0%, ${P.parchment} 90%)`,
              border: `2px solid ${rank.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, color: P.ink, flexShrink: 0,
            }}>{rank.icon}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 16, fontWeight: 900, color: P.ink,
                fontFamily: "var(--font-playfair), serif", letterSpacing: -0.3,
              }}>{rank.name}</div>
              <div style={{ fontSize: 12, color: P.inkLight, fontFamily: "var(--font-nunito), sans-serif" }}>
                {progression.xp.toLocaleString()} XP{next ? ` · ${xpToNext} to ${next.name}` : " · max rank"}
              </div>
            </div>
          </div>
          <div style={{
            height: 6, borderRadius: 3,
            background: P.parchment, overflow: "hidden",
          }}>
            <div style={{
              width: `${pct}%`, height: "100%",
              background: `linear-gradient(90deg, ${rank.color}, ${next?.color ?? rank.color})`,
              transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
        </div>
      </div>

      {/* 03: Current quest */}
      {progression.activeMission ? (
        <div style={{ marginBottom: 18 }}>
          <MissionProgress mission={progression.activeMission} />
        </div>
      ) : (
        <div style={{
          marginBottom: 18,
          padding: "14px 16px", borderRadius: 14,
          background: P.creamDeep, border: `1px solid ${P.inkGhost}`,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 22 }}>{KINGDOM_ICONS[kingdom.id] ?? "♟"}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 13, fontWeight: 800, color: P.ink,
              fontFamily: "var(--font-playfair), serif",
            }}>{kingdom.name}</div>
            <div style={{ fontSize: 12, color: P.inkLight }}>{kingdom.subtitle}</div>
          </div>
        </div>
      )}

      {/* Three actions */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
      }}>
        <button
          onClick={onPlayAgain}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
            background: P.emerald, color: "white", border: "none",
            borderRadius: 12, minHeight: 52, cursor: "pointer",
            fontFamily: "var(--font-nunito), sans-serif",
            boxShadow: "0 6px 20px rgba(27,115,64,0.25)",
            transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
        >
          <span style={{ fontSize: 16 }}>♟</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.3 }}>Play Again</span>
        </button>
        <Link href="/kingdom" style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
          background: "white", color: P.inkSoft,
          border: `1.5px solid ${P.inkGhost}`,
          borderRadius: 12, minHeight: 52,
          textDecoration: "none",
          fontFamily: "var(--font-nunito), sans-serif",
          boxShadow: "0 2px 8px rgba(26,18,16,0.05)",
          transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = P.gold; (e.currentTarget as HTMLElement).style.color = P.gold; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = P.inkGhost; (e.currentTarget as HTMLElement).style.color = P.inkSoft; }}
        >
          <span style={{ fontSize: 16 }}>🗺</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.3 }}>Kingdom Map</span>
        </Link>
        <Link href="/card" style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
          background: "white", color: P.inkSoft,
          border: `1.5px solid ${P.inkGhost}`,
          borderRadius: 12, minHeight: 52,
          textDecoration: "none",
          fontFamily: "var(--font-nunito), sans-serif",
          boxShadow: "0 2px 8px rgba(26,18,16,0.05)",
          transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = P.emerald; (e.currentTarget as HTMLElement).style.color = P.emerald; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = P.inkGhost; (e.currentTarget as HTMLElement).style.color = P.inkSoft; }}
        >
          <span style={{ fontSize: 16 }}>🃏</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.3 }}>Knight Card</span>
        </Link>
      </div>

      <style>{`
        @keyframes postGameAppear {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
