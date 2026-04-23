"use client";

import type { GameStatus } from "@/lib/chess/types";

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

  const color = isWin ? "#c4e85b" : isDraw ? "#5bb8e8" : "#e8705b";
  const bg = isWin ? "rgba(196,232,91,0.08)" : isDraw ? "rgba(91,184,232,0.08)" : "rgba(232,112,91,0.08)";
  const label = isWin ? `${playerName} wins!` : isDraw ? "Draw!" : "Bot wins!";
  const Icon = isWin ? TrophyIcon : isDraw ? HandshakeIcon : BotWinIcon;

  return (
    <div
      className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border"
      style={{ background: bg, borderColor: `${color}30` }}
    >
      <span style={{ color }} aria-hidden="true"><Icon /></span>
      <span className="text-base font-bold" style={{ color, fontFamily: "var(--font-baloo), sans-serif" }}>
        {label}
      </span>
      <button
        onClick={onReset}
        className="px-4 py-2 rounded-lg text-xs font-bold border cursor-pointer"
        style={{
          background: "#282523",
          borderColor: "#3a3633",
          color: "#c8c0b5",
          fontFamily: "var(--font-nunito), sans-serif",
          minHeight: "44px",
          transition: "background 0.15s ease, border-color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#32302e";
          (e.currentTarget as HTMLElement).style.borderColor = "#5a5550";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "#282523";
          (e.currentTarget as HTMLElement).style.borderColor = "#3a3633";
        }}
      >
        Play Again
      </button>
    </div>
  );
}
