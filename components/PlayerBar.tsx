"use client";

const P = {
  cream: "#FBF7F0",
  parchment: "#F0E8D8",
  ink: "#1A1210",
  inkMed: "#5C544A",
  inkLight: "#8A8278",
  inkFaint: "#B0A898",
  inkGhost: "#D0C8BC",
  emerald: "#1B7340",
  emeraldPale: "#E6F4EC",
  gold: "#C7940A",
};

function BotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px", borderRadius: 12,
      background: isActive ? P.emeraldPale : "white",
      border: `1.5px solid ${isActive ? P.emerald : P.inkGhost}`,
      boxShadow: isActive
        ? `0 0 0 3px rgba(27,115,64,0.08), 0 2px 12px rgba(26,18,16,0.06)`
        : `0 2px 8px rgba(26,18,16,0.05)`,
      transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      {/* Icon */}
      <span style={{
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        color: isActive ? P.emerald : P.inkFaint,
        transition: "color 0.2s ease",
      }}>
        {isBot ? <BotIcon /> : <PlayerIcon />}
      </span>

      {/* Name */}
      <span style={{
        fontSize: 14, fontWeight: 700,
        color: isActive ? P.ink : P.inkLight,
        fontFamily: "var(--font-nunito), sans-serif",
        transition: "color 0.2s ease",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>{name}</span>

      {/* Color label */}
      <span style={{
        fontSize: 11, color: P.inkFaint, flexShrink: 0,
        fontFamily: "var(--font-nunito), sans-serif",
        textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600,
      }}>{colorLabel}</span>

      {/* Active pulse dot */}
      {isActive && !isBotThinking && (
        <div className="ml-auto player-active" style={{
          marginLeft: "auto", flexShrink: 0,
          width: 8, height: 8, borderRadius: "50%",
          background: P.emerald,
          boxShadow: `0 0 6px ${P.emerald}80`,
        }} />
      )}

      {/* Bot thinking dots */}
      {isBotThinking && (
        <span style={{ marginLeft: "auto", flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }} aria-label="Bot is thinking">
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              display: "inline-block", width: 5, height: 5, borderRadius: "50%",
              background: P.gold,
              animation: `dotPulse 1.4s infinite ease-in-out ${i * 0.2}s`,
            }} />
          ))}
        </span>
      )}

      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.7); }
          40% { opacity: 1; transform: scale(1); }
        }
        .player-active {
          animation: playerPulse 2s infinite ease-in-out;
        }
        @keyframes playerPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(27,115,64,0.4); }
          50% { box-shadow: 0 0 0 5px rgba(27,115,64,0); }
        }
      `}</style>
    </div>
  );
}
