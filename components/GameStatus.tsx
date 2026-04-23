"use client";

import type { GameStatus } from "@/lib/chess/types";

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
  const label = isWin
    ? `🏆 ${playerName} wins!`
    : isDraw
    ? "🤝 Draw!"
    : "🤖 Bot wins!";

  return (
    <div
      className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl border"
      style={{ background: bg, borderColor: `${color}30` }}
    >
      <span className="text-base font-bold" style={{ color, fontFamily: "'Fredoka', sans-serif" }}>
        {label}
      </span>
      <button
        onClick={onReset}
        className="px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer"
        style={{
          background: "#282523",
          borderColor: "#3a3633",
          color: "#c8c0b5",
          fontFamily: "'Outfit', sans-serif",
        }}
      >
        Play Again
      </button>
    </div>
  );
}
