"use client";

function BotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" strokeWidth="3" strokeLinecap="round" />
      <line x1="12" y1="16" x2="12" y2="16" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="16" x2="16" y2="16" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function PlayerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

interface PlayerBarProps {
  name: string;
  colorLabel: string;
  isActive: boolean;
  isBotThinking: boolean;
  isBot?: boolean;
}

export default function PlayerBar({ name, colorLabel, isActive, isBotThinking, isBot = false }: PlayerBarProps) {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border"
      style={{
        background: "#192134",
        borderColor: isActive ? "rgba(217,119,6,0.45)" : "rgba(255,255,255,0.07)",
        transition: "border-color 0.2s ease",
        boxShadow: isActive ? "0 0 0 1px rgba(217,119,6,0.15), 0 2px 12px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      <span
        className="flex items-center justify-center flex-shrink-0"
        style={{ color: isActive ? "#D97706" : "#475569", transition: "color 0.2s ease" }}
      >
        {isBot ? <BotIcon /> : <PlayerIcon />}
      </span>
      <span
        className="text-sm font-bold truncate"
        style={{
          color: isActive ? "#f1ede8" : "#94A3B8",
          fontFamily: "var(--font-nunito), sans-serif",
          transition: "color 0.2s ease",
        }}
      >
        {name}
      </span>
      <span className="text-xs flex-shrink-0" style={{ color: "#475569", fontFamily: "var(--font-nunito), sans-serif" }}>
        {colorLabel}
      </span>

      {/* Active indicator */}
      {isActive && !isBotThinking && (
        <div
          className="ml-auto player-active w-2 h-2 rounded-full flex-shrink-0"
          style={{
            background: "#D97706",
            boxShadow: "0 0 6px rgba(217,119,6,0.8)",
          }}
        />
      )}

      {/* Bot thinking dots */}
      {isBotThinking && (
        <span className="ml-auto flex items-center gap-1 flex-shrink-0" aria-label="Bot is thinking">
          <span className="coach-dot" />
          <span className="coach-dot" />
          <span className="coach-dot" />
        </span>
      )}
    </div>
  );
}
