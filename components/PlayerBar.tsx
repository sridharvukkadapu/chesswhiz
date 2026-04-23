"use client";

interface PlayerBarProps {
  name: string;
  colorLabel: string;
  isActive: boolean;
  isBotThinking: boolean;
  emoji: string;
}

export default function PlayerBar({ name, colorLabel, isActive, isBotThinking, emoji }: PlayerBarProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors"
      style={{
        background: "#1e1c1a",
        borderColor: isActive ? "rgba(91,232,130,0.4)" : "#3a3633",
      }}
    >
      <span className="text-base">{emoji}</span>
      <span
        className="text-sm font-bold"
        style={{ color: isActive ? "#5be882" : "#c8c0b5", fontFamily: "'Outfit', sans-serif" }}
      >
        {name}
      </span>
      <span className="text-xs" style={{ color: "#8a8278", fontFamily: "'Outfit', sans-serif" }}>
        ({colorLabel})
      </span>
      {isActive && !isBotThinking && (
        <div
          className="ml-auto w-2 h-2 rounded-full"
          style={{ background: "#5be882", boxShadow: "0 0 8px rgba(91,232,130,0.6)" }}
        />
      )}
      {isBotThinking && (
        <span className="ml-auto text-xs" style={{ color: "#e8c45b", fontFamily: "'Outfit', sans-serif" }}>
          thinking...
        </span>
      )}
    </div>
  );
}
