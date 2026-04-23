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
      className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors"
      style={{
        background: "#1e1c1a",
        borderColor: isActive ? "rgba(91,232,130,0.4)" : "#3a3633",
        transition: "border-color 0.15s ease",
      }}
    >
      <span
        className="flex items-center justify-center"
        style={{ color: isActive ? "#5be882" : "#5a5550", transition: "color 0.15s ease" }}
      >
        {isBot ? <BotIcon /> : <PlayerIcon />}
      </span>
      <span
        className="text-sm font-bold"
        style={{ color: isActive ? "#5be882" : "#c8c0b5", fontFamily: "var(--font-nunito), sans-serif", transition: "color 0.15s ease" }}
      >
        {name}
      </span>
      <span className="text-xs" style={{ color: "#8a8278", fontFamily: "var(--font-nunito), sans-serif" }}>
        ({colorLabel})
      </span>
      {isActive && !isBotThinking && (
        <div
          className="ml-auto w-2 h-2 rounded-full"
          style={{ background: "#5be882", boxShadow: "0 0 8px rgba(91,232,130,0.6)" }}
        />
      )}
      {isBotThinking && (
        <span className="ml-auto text-xs" style={{ color: "#e8c45b", fontFamily: "var(--font-nunito), sans-serif" }}>
          thinking...
        </span>
      )}
    </div>
  );
}
