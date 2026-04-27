"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getRankByXP, getNextRank, KINGDOMS, isReadyForNextKingdom } from "@/lib/progression/data";
import type { PlayerProgression, Mission } from "@/lib/progression/types";
import type { GameStatus, CoachMessage } from "@/lib/chess/types";
import UpgradeModal from "./UpgradeModal";
import CoachPawn from "./CoachPawn";
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

const RANK_PIECE: Record<string, PieceType> = {
  pawn: "pawn",
  knight: "knight",
  bishop: "bishop",
  rook: "rook",
  queen: "queen",
  king: "king",
};

interface PostGameProps {
  status: GameStatus;
  playerName: string;
  moveHistory: string[];
  coachMessages: CoachMessage[];
  progression: PlayerProgression;
  onPlayAgain: () => void;
}

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

  const lengthNote = moves < 12 ? "a quick game" : moves < 30 ? "a solid full-length game" : "a long, thoughtful game";

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
    <div
      style={{
        background: "rgba(245,182,56,0.08)",
        border: `1.5px solid rgba(245,182,56,0.32)`,
        borderRadius: 16,
        padding: "16px 18px",
        boxShadow: "0 0 24px rgba(245,182,56,0.12)",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span
          style={{
            fontFamily: T.fontDisplay,
            fontStyle: "italic",
            fontSize: 14,
            fontWeight: 600,
            color: T.amberGlow,
            letterSpacing: 0.3,
          }}
        >
          03
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: T.amberGlow,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontFamily: T.fontUI,
          }}
        >
          Current Quest
        </span>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 600,
          color: T.textHi,
          fontFamily: T.fontUI,
          lineHeight: 1.5,
        }}
      >
        {mission.description}
      </p>
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          color: T.textLo,
          fontFamily: T.fontMono,
        }}
      >
        Games attempted: {mission.gamesAttempted}
        {mission.maxGamesBeforeHint > 0 ? ` · hint after ${mission.maxGamesBeforeHint}` : ""}
      </div>
    </div>
  );
}

export default function PostGameScreen({
  status, playerName, moveHistory, coachMessages, progression, onPlayAgain,
}: PostGameProps) {
  const review = useMemo(
    () => buildReview({ status, playerName, moveHistory, coachMessages }),
    [status, playerName, moveHistory, coachMessages],
  );

  const rank = getRankByXP(progression.xp);
  const next = getNextRank(rank.id);
  const floor = rank.xpRequired;
  const ceil = next ? next.xpRequired : rank.xpRequired + 1;
  const pct = next ? Math.min(100, Math.max(0, ((progression.xp - floor) / (ceil - floor)) * 100)) : 100;
  const xpToNext = next ? Math.max(0, ceil - progression.xp) : 0;

  const kingdom = KINGDOMS.find((k) => k.id === progression.currentKingdom) ?? KINGDOMS[0];
  const kingdomColor = KINGDOM_COLORS[kingdom.id] ?? T.amber;

  const isWin = status === "white_wins";
  const accent = isWin ? T.emeraldGlow : status === "black_wins" ? T.rubyGlow : T.amberGlow;

  const showUpgradePitch = progression.tier === "free" && isReadyForNextKingdom(progression.masteredStrategies);
  const forkForest = KINGDOMS.find((k) => k.id === "fork_forest");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Game complete"
      style={{
        background: "linear-gradient(180deg, rgba(36,24,69,0.85) 0%, rgba(14,10,31,0.95) 100%)",
        borderRadius: 24,
        border: `1.5px solid ${T.borderStrong}`,
        boxShadow: T.shadowDeep,
        padding: "28px 24px",
        animation: "postGameIn 0.55s cubic-bezier(0.16,1,0.3,1) both",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Header — coach + result headline */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <CoachPawn size={72} expression={isWin ? "cheer" : status === "black_wins" ? "sad" : "idle"} />
        <div>
          <span
            style={{
              fontFamily: T.fontHand,
              fontSize: 16,
              color: T.amberGlow,
              display: "block",
              transform: "rotate(-2deg)",
              marginBottom: 4,
            }}
          >
            well played →
          </span>
          <h2
            style={{
              fontFamily: T.fontDisplay,
              fontStyle: "italic",
              fontSize: 28,
              fontWeight: 600,
              color: accent,
              margin: 0,
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
            }}
          >
            {review.headline}
          </h2>
        </div>
      </div>

      {/* 01 Coach review */}
      <div style={{ marginBottom: 14 }}>
        <SectionLabel num="01" text="Coach Pawn's Review" tone={T.amberGlow} />
        <div
          style={{
            background: "linear-gradient(180deg, rgba(245,182,56,0.08) 0%, rgba(245,182,56,0.02) 100%)",
            border: "1.5px solid rgba(245,182,56,0.28)",
            borderRadius: 18,
            padding: "16px 18px",
            position: "relative",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: -10,
              top: 18,
              width: 0,
              height: 0,
              borderTop: "10px solid transparent",
              borderBottom: "10px solid transparent",
              borderRight: "12px solid rgba(245,182,56,0.28)",
            }}
          />
          <p style={{ margin: 0, fontFamily: T.fontUI, fontSize: 15, lineHeight: 1.55, color: T.textHi }}>
            {review.body}
          </p>
        </div>
      </div>

      {/* 02 XP + rank progress */}
      <div style={{ marginBottom: 14 }}>
        <SectionLabel num="02" text="Your Progress" tone={T.textMed} />
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #F5E2B8, #B07A0E)",
                border: `1.5px solid ${rank.color}`,
                boxShadow: T.glowAmber,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Piece type={RANK_PIECE[rank.id] ?? "pawn"} color="white" size={32} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  fontSize: 18,
                  fontWeight: 600,
                  color: T.textHi,
                }}
              >
                {rank.name}
              </div>
              <div
                style={{
                  fontFamily: T.fontMono,
                  fontSize: 12,
                  color: T.textLo,
                }}
              >
                {progression.xp.toLocaleString()} XP
                {next ? ` · ${xpToNext} to ${next.name}` : " · max rank"}
              </div>
            </div>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progression.xp}
            aria-valuemin={floor}
            aria-valuemax={ceil}
            aria-label={`XP progress: ${progression.xp} of ${ceil}`}
            style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background: T.goldFoil,
                boxShadow: "0 0 8px rgba(245,182,56,0.6)",
                transition: "width 800ms cubic-bezier(0.16,1,0.3,1)",
              }}
            />
          </div>
        </div>
      </div>

      {/* 03 Quest / Upgrade pitch */}
      {showUpgradePitch && forkForest ? (
        <button type="button"
          onClick={() => setUpgradeOpen(true)}
          aria-label="Unlock the Fork Forest with Champion"
          style={{
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            marginBottom: 20,
            padding: "16px 18px",
            borderRadius: 16,
            background: "linear-gradient(135deg, rgba(245,182,56,0.18) 0%, rgba(192,132,252,0.12) 100%)",
            border: `1.5px solid ${T.amber}`,
            boxShadow: T.glowAmber,
            fontFamily: "inherit",
            color: "inherit",
            transition: "transform 200ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontSize: 14, fontWeight: 600, color: T.amberGlow }}>
              03
            </span>
            <span style={{ fontFamily: T.fontUI, fontSize: 10, fontWeight: 800, color: T.amberGlow, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Next Adventure
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: T.fontUI,
                fontSize: 9,
                fontWeight: 800,
                color: T.amberGlow,
                background: "rgba(7,5,15,0.7)",
                border: `1px solid ${T.amber}80`,
                padding: "2px 8px",
                borderRadius: 6,
                letterSpacing: "0.18em",
              }}
            >
              🔒 CHAMPION
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>🌲</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  fontSize: 18,
                  fontWeight: 600,
                  color: T.textHi,
                }}
              >
                The Fork Forest awaits!
              </div>
              <div style={{ fontFamily: T.fontUI, fontSize: 13, color: T.textMed, marginTop: 2 }}>
                Face the <strong style={{ color: T.amberGlow }}>Knight Twins</strong> and earn the Fork Master power →
              </div>
            </div>
          </div>
        </button>
      ) : progression.activeMission ? (
        <div style={{ marginBottom: 20 }}>
          <MissionProgress mission={progression.activeMission} />
        </div>
      ) : (
        <div
          style={{
            marginBottom: 20,
            padding: "14px 16px",
            borderRadius: 16,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 24 }}>{KINGDOM_ICONS[kingdom.id] ?? "♟"}</span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontSize: 16, color: T.textHi }}>
              {kingdom.name}
            </div>
            <div style={{ fontFamily: T.fontUI, fontSize: 12, color: T.textLo }}>{kingdom.subtitle}</div>
          </div>
        </div>
      )}

      {/* Three actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <button type="button"
          onClick={onPlayAgain}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            background: T.goldFoil,
            color: T.inkDeep,
            border: "none",
            borderRadius: 14,
            minHeight: 56,
            cursor: "pointer",
            fontFamily: T.fontUI,
            boxShadow: T.glowAmber,
            transition: "transform 200ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
          onFocus={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          onBlur={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
        >
          <span style={{ fontSize: 18 }}>♟</span>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em" }}>Play Again</span>
        </button>
        <Link
          href="/kingdom"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            background: "rgba(255,255,255,0.04)",
            color: T.textMed,
            border: `1.5px solid ${T.border}`,
            borderRadius: 14,
            minHeight: 56,
            textDecoration: "none",
            fontFamily: T.fontUI,
            transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = T.amber;
            (e.currentTarget as HTMLElement).style.color = T.amberGlow;
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = T.amber;
            (e.currentTarget as HTMLElement).style.color = T.amberGlow;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = T.border;
            (e.currentTarget as HTMLElement).style.color = T.textMed;
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = T.border;
            (e.currentTarget as HTMLElement).style.color = T.textMed;
          }}
        >
          <span style={{ fontSize: 18 }}>🗺</span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em" }}>Kingdom Map</span>
        </Link>
        <Link
          href="/card"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            background: "rgba(255,255,255,0.04)",
            color: T.textMed,
            border: `1.5px solid ${T.border}`,
            borderRadius: 14,
            minHeight: 56,
            textDecoration: "none",
            fontFamily: T.fontUI,
            transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = T.amethyst;
            (e.currentTarget as HTMLElement).style.color = T.amethystGlow;
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = T.amethyst;
            (e.currentTarget as HTMLElement).style.color = T.amethystGlow;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = T.border;
            (e.currentTarget as HTMLElement).style.color = T.textMed;
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = T.border;
            (e.currentTarget as HTMLElement).style.color = T.textMed;
          }}
        >
          <span style={{ fontSize: 18 }}>🃏</span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em" }}>Knight Card</span>
        </Link>
      </div>

      <style>{`
        @keyframes postGameIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        blockedKingdomName={forkForest?.name}
        blockedKingdomIcon="🌲"
      />
    </div>
  );
}

function SectionLabel({ num, text, tone }: { num: string; text: string; tone: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, padding: "0 4px" }}>
      <span
        style={{
          fontFamily: T.fontDisplay,
          fontStyle: "italic",
          fontSize: 14,
          fontWeight: 600,
          color: tone,
          letterSpacing: 0.3,
        }}
      >
        {num}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: tone,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          fontFamily: T.fontUI,
        }}
      >
        {text}
      </span>
    </div>
  );
}
