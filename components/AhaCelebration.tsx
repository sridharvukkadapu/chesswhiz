"use client";

import { useEffect } from "react";
import type { TacticDetection, Power } from "@/lib/progression/types";
import { T } from "@/lib/design/tokens";
import { useTime, StarField } from "@/lib/design/atmosphere";
import CoachPawn from "@/components/CoachPawn";
import { sfx } from "@/lib/audio/sfx";
import { haptics } from "@/lib/audio/haptics";

interface AhaCelebrationProps {
  celebration: { tactic: TacticDetection; power: Power } | null;
  onDismiss: () => void;
  playerName: string;
}

const TACTIC_LABEL: Record<string, string> = {
  fork: "The Fork",
  pin: "The Pin",
  skewer: "The Skewer",
  discovered_attack: "Discovery",
  double_check: "Double Check",
  back_rank_mate: "Back Rank Mate",
  sacrifice: "Sacrifice",
  deflection: "Deflection",
  overloading: "Overload",
  zwischenzug: "Zwischenzug",
};

const TACTIC_BLURB: Record<string, string> = {
  fork: "You attacked two pieces at once. Brilliant!",
  pin: "You froze their piece in place. Brilliant!",
  skewer: "You forced the bigger piece to move. Brilliant!",
  discovered_attack: "You revealed a hidden attacker. Brilliant!",
  double_check: "Two checkers — they HAVE to move the king!",
  back_rank_mate: "The king ran out of squares. Game over!",
  sacrifice: "You gave up material to win bigger. Brilliant!",
  deflection: "You pulled their piece out of position!",
  overloading: "Their piece couldn't defend everything!",
  zwischenzug: "An in-between move that flipped the script!",
};

export default function AhaCelebration({ celebration, onDismiss, playerName }: AhaCelebrationProps) {
  const time = useTime();

  useEffect(() => {
    if (!celebration) return;
    sfx.aha();
    haptics.aha();
    const t = setTimeout(onDismiss, 6000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [celebration, onDismiss]);

  if (!celebration) return null;

  const tacticName = TACTIC_LABEL[celebration.tactic.type] ?? "The Move";
  const blurb = TACTIC_BLURB[celebration.tactic.type] ?? "Brilliant move!";

  // Crystal ambient transforms — bob + slow tilt
  const crystalRot = Math.sin(time * 0.6) * 6;
  const crystalBob = Math.sin(time * 2) * 8;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Power unlocked: ${tacticName}`}
      onClick={onDismiss}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: T.bgRadialEmerald,
        cursor: "pointer",
        overflow: "hidden",
        animation: "ahaIn 0.4s ease-out, ahaFlash 0.6s ease-out",
      }}
    >
      <StarField count={120} seed={9} opacity={0.7} />

      {/* Radial light burst — pulses */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          transform: "translate(-50%, -50%)",
          width: "min(140vw, 1500px)",
          height: "min(140vw, 1500px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(192,132,252,0.40) 0%, rgba(52,211,153,0.20) 30%, transparent 60%)",
          animation: "ahaPulse 2s infinite",
          pointerEvents: "none",
        }}
      />

      {/* Spinning rays */}
      <svg
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "42%",
          transform: `translate(-50%,-50%) rotate(${time * 8}deg)`,
          width: "min(120vw, 1400px)",
          height: "min(120vw, 1400px)",
        }}
        viewBox="-700 -700 1400 1400"
      >
        {[...Array(24)].map((_, i) => {
          const ang = (i / 24) * 360;
          return (
            <polygon
              key={i}
              points="0,-650 8,-200 -8,-200"
              fill="rgba(252,211,77,0.12)"
              transform={`rotate(${ang})`}
            />
          );
        })}
      </svg>

      {/* CRYSTAL — the unlocked Power */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "32%",
          transform: `translate(-50%, -50%) translateY(${crystalBob}px) rotateZ(${crystalRot}deg)`,
          filter: "drop-shadow(0 0 40px rgba(192,132,252,0.9)) drop-shadow(0 0 80px rgba(52,211,153,0.5))",
          animation: "ahaCrystalIn 1.2s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        <svg width="240" height="280" viewBox="0 0 280 320" aria-hidden>
          <defs>
            <linearGradient id="crystalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E0BBFF" />
              <stop offset="50%" stopColor="#9333EA" />
              <stop offset="100%" stopColor="#3B0764" />
            </linearGradient>
            <linearGradient id="crystalShine" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 140 20 L 220 130 L 180 280 L 100 280 L 60 130 Z"
            fill="url(#crystalGrad)"
            stroke="#FCD34D"
            strokeWidth="3"
          />
          <path
            d="M 140 20 L 140 280 M 60 130 L 220 130 M 60 130 L 140 20 L 220 130"
            stroke="rgba(252,211,77,0.6)"
            strokeWidth="2"
            fill="none"
          />
          <path d="M 140 20 L 95 130 L 100 270 L 70 130 Z" fill="url(#crystalShine)" />
          <ellipse cx="140" cy="160" rx="35" ry="50" fill="rgba(252,211,77,0.8)" filter="blur(20px)" />
        </svg>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "55%",
            transform: "translate(-50%, -50%)",
            fontSize: 52,
            filter: "drop-shadow(0 0 12px rgba(252,211,77,0.9))",
            pointerEvents: "none",
          }}
        >
          {celebration.power.icon}
        </div>
      </div>

      {/* "POWER UNLOCKED" header + tactic name */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "62%",
          transform: "translate(-50%, 0)",
          textAlign: "center",
          width: "100%",
          padding: "0 20px",
          animation: "ahaTitleIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 1.2s both",
        }}
      >
        <div
          style={{
            fontFamily: T.fontUI,
            fontSize: "clamp(13px, 1.6vw, 18px)",
            fontWeight: 700,
            color: T.amethystGlow,
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            marginBottom: 14,
            paddingLeft: "0.5em",
          }}
        >
          ✦ Power Unlocked ✦
        </div>
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: "clamp(54px, 9vw, 110px)",
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #E0BBFF 0%, #FCD34D 50%, #6EE7B7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            lineHeight: 1,
            animation: "ahaNameIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 1.6s both",
          }}
        >
          {tacticName}
        </div>
        <div
          style={{
            marginTop: 16,
            fontFamily: T.fontHand,
            fontSize: "clamp(20px, 2.6vw, 30px)",
            color: T.amberGlow,
            transform: "rotate(-1deg)",
            animation: "ahaBlurbIn 0.5s ease-out 2.2s both",
          }}
        >
          &ldquo;{blurb}&rdquo;
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: T.fontUI,
            fontSize: 14,
            color: T.textLo,
            animation: "ahaBlurbIn 0.5s ease-out 2.6s both",
          }}
        >
          {playerName}, you earned <strong style={{ color: T.amberGlow }}>{celebration.power.name}</strong> · Tap to dismiss
        </div>
      </div>

      {/* Coach Pawn cheering bottom-left */}
      <div
        style={{
          position: "absolute",
          left: 60,
          bottom: 60,
          animation: "ahaCoachIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 2.4s both",
        }}
      >
        <CoachPawn size={180} expression="aha" />
      </div>

      {/* CONFETTI */}
      <ConfettiBurst time={time} />

      <style>{`
        @keyframes ahaIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ahaFlash {
          0%, 100% { background-color: transparent; }
          5% { background-color: rgba(255,255,255,0.45); }
        }
        @keyframes ahaPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes ahaCrystalIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes ahaTitleIn {
          from { opacity: 0; transform: translate(-50%, 40px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes ahaNameIn {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes ahaBlurbIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ahaCoachIn {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

function ConfettiBurst({ time }: { time: number }) {
  const colors = ["#FCD34D", "#34D399", "#C084FC", "#FF6B6B", "#7DA8FF"];
  const t = time;
  return (
    <svg
      aria-hidden
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
    >
      {Array.from({ length: 80 }, (_, i) => {
        let s = (i + 1) * 9301;
        s = (s * 9301 + 49297) % 233280;
        const startX = (s / 233280) * 1920;
        s = (s * 9301 + 49297) % 233280;
        const colorIdx = Math.floor((s / 233280) * 5);
        s = (s * 9301 + 49297) % 233280;
        const drift = -50 + (s / 233280) * 100;
        s = (s * 9301 + 49297) % 233280;
        const speed = 120 + (s / 233280) * 240;
        s = (s * 9301 + 49297) % 233280;
        const rotSpeed = 200 + (s / 233280) * 400;
        s = (s * 9301 + 49297) % 233280;
        const sz = 8 + (s / 233280) * 14;
        const y = -50 + ((t * speed) % 1300);
        const x = startX + drift * t;
        const rot = rotSpeed * t;
        if (y > 1100) return null;
        return (
          <rect
            key={i}
            x={x - sz / 2}
            y={y}
            width={sz}
            height={sz * 0.6}
            fill={colors[colorIdx]}
            opacity={0.9}
            transform={`rotate(${rot} ${x} ${y + sz / 2})`}
          />
        );
      })}
    </svg>
  );
}
