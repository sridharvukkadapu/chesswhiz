"use client";

import { T } from "@/lib/design/tokens";
import { useTime } from "@/lib/design/atmosphere";

interface PlayerBarProps {
  name: string;
  colorLabel: string;
  isActive: boolean;
  isBotThinking: boolean;
  isBot?: boolean;
}

export default function PlayerBar({
  name, colorLabel, isActive, isBotThinking, isBot = false,
}: PlayerBarProps) {
  const time = useTime();
  // Active dot pulses
  const pulseAlpha = 0.6 + 0.4 * Math.abs(Math.sin(time * 3));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: 14,
        background: isActive
          ? "rgba(124,182,158,0.10)"
          : "#FFFCF5",
        border: `1.5px solid ${isActive ? "rgba(124,182,158,0.50)" : T.border}`,
        boxShadow: isActive
          ? "0 0 24px rgba(124,182,158,0.22)"
          : T.shadowSoft,
        transition: "all 250ms cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {/* Avatar circle */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: isBot
            ? "linear-gradient(135deg, #E8D8C8 0%, #C8A880 100%)"
            : "linear-gradient(135deg, #FFDFA8 0%, #C8965A 100%)",
          border: `1.5px solid ${isBot ? "rgba(255,107,90,0.30)" : "rgba(242,201,76,0.45)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontFamily: T.fontDisplay,
          fontWeight: 700,
          color: isBot ? T.coralDeep : T.butterDeep,
          flexShrink: 0,
        }}
      >
        {isBot ? "AI" : name.charAt(0).toUpperCase()}
      </div>

      {/* Name */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: T.fontUI,
            fontSize: 14,
            fontWeight: 700,
            color: isActive ? T.ink : T.inkLow,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.1,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: T.fontUI,
            fontSize: 10,
            color: T.inkDim,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginTop: 2,
          }}
        >
          {colorLabel}
        </div>
      </div>

      {/* Active pulse / bot thinking dots */}
      {isActive && !isBotThinking && (
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: T.sage,
            boxShadow: `0 0 ${8 * pulseAlpha}px ${T.sage}`,
            opacity: pulseAlpha,
            flexShrink: 0,
          }}
        />
      )}
      {isBotThinking && (
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: T.coral,
                opacity: 0.3 + 0.7 * Math.abs(Math.sin(time * 6 + i * 0.5)),
                boxShadow: `0 0 6px ${T.coralGlow}`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
