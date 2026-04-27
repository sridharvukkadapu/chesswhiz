"use client";

import type { GameStatus } from "@/lib/chess/types";
import { T } from "@/lib/design/tokens";
import { Trophy, Handshake, Bot, type LucideIcon } from "lucide-react";

interface GameStatusProps {
  status: GameStatus;
  playerName: string;
  onReset: () => void;
}

export default function GameStatusBar({ status, playerName, onReset }: GameStatusProps) {
  if (status === "playing") return null;

  const isWin = status === "white_wins";
  const isDraw = status === "stalemate" || status === "draw";

  const config: {
    label: string; color: string; bg: string; border: string; glow: string; Icon: LucideIcon;
  } = isWin
    ? {
        label: `${playerName} wins!`,
        color: T.sageDeep,
        bg: "rgba(124,182,158,0.12)",
        border: "rgba(124,182,158,0.45)",
        glow: "0 0 24px rgba(124,182,158,0.22)",
        Icon: Trophy,
      }
    : isDraw
      ? {
          label: "Draw",
          color: T.ink,
          bg: "#FFFCF5",
          border: T.border,
          glow: T.shadowSoft,
          Icon: Handshake,
        }
      : {
          label: "Bot wins",
          color: T.coralDeep,
          bg: "rgba(255,107,90,0.10)",
          border: "rgba(255,107,90,0.35)",
          glow: "0 0 24px rgba(255,107,90,0.18)",
          Icon: Bot,
        };

  return (
    <div
      role="status"
      aria-live="assertive"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 16,
        background: config.bg,
        border: `1.5px solid ${config.border}`,
        boxShadow: config.glow,
        animation: "statusSlide 0.4s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <config.Icon aria-hidden size={22} color={config.color} strokeWidth={2.2} />
      <span
        style={{
          fontFamily: T.fontDisplay,
          fontStyle: "italic",
          fontSize: 22,
          fontWeight: 600,
          color: config.color,
          letterSpacing: "-0.01em",
          flex: 1,
        }}
      >
        {config.label}
      </span>
      <button type="button"
        onClick={onReset}
        style={{
          padding: "10px 20px",
          borderRadius: 12,
          background: T.coral,
          color: "#FFFCF5",
          border: "none",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: T.fontUI,
          boxShadow: T.glowCoral,
          letterSpacing: "0.05em",
        }}
      >
        Play Again
      </button>

      <style>{`
        @keyframes statusSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
