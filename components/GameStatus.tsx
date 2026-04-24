"use client";

import type { GameStatus } from "@/lib/chess/types";

const P = {
  ink: "#1A1210",
  inkGhost: "#D0C8BC",
  cream: "#FBF7F0",
  emerald: "#1B7340",
  emeraldPale: "#E6F4EC",
  gold: "#C7940A",
  goldPale: "#FDF6E3",
};

function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M6 3h12v8a6 6 0 0 1-12 0V3z" />
    </svg>
  );
}

function HandshakeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 17a4 4 0 0 1-4-4V7l4-4 4 4v6a4 4 0 0 1-4 4z" />
      <path d="M8 21h8" />
      <path d="M7 17l-3 4" />
      <path d="M17 17l3 4" />
    </svg>
  );
}

function BotWinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="16" x2="16" y2="16" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

interface GameStatusProps {
  status: GameStatus;
  playerName: string;
  onReset: () => void;
}

export default function GameStatusBar({ status, playerName, onReset }: GameStatusProps) {
  if (status === "playing") return null;

  const isWin = status === "white_wins";
  const isDraw = status === "stalemate" || status === "draw";

  const config = isWin
    ? { bg: P.emeraldPale, border: P.emerald, color: P.emerald, label: `${playerName} wins!`, Icon: TrophyIcon }
    : isDraw
    ? { bg: "#F8F5F0", border: P.inkGhost, color: "#64748B", label: "Draw!", Icon: HandshakeIcon }
    : { bg: "#FFF5EB", border: "#FDBA74", color: "#9A3412", label: "Bot wins!", Icon: BotWinIcon };

  return (
    <div
      role="status"
      aria-live="assertive"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        padding: "12px 16px", borderRadius: 14,
        background: config.bg,
        border: `1.5px solid ${config.border}`,
        boxShadow: `0 4px 20px rgba(26,18,16,0.08)`,
        animation: "statusSlide 0.35s cubic-bezier(0.22,1,0.36,1) both",
      }}
    >
      <span style={{ color: config.color }}>
        <config.Icon />
      </span>
      <span style={{
        fontSize: 16, fontWeight: 900, color: config.color,
        fontFamily: "var(--font-playfair), serif",
        letterSpacing: -0.3,
      }}>{config.label}</span>
      <button
        onClick={onReset}
        style={{
          marginLeft: 8, padding: "8px 18px", borderRadius: 10,
          background: P.ink, color: P.cream, border: "none",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          fontFamily: "var(--font-nunito), sans-serif",
          boxShadow: "0 2px 8px rgba(26,18,16,0.15)",
          transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          minHeight: 36,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(26,18,16,0.2)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(26,18,16,0.15)"; }}
        onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
        onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
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
