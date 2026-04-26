"use client";

import React from "react";
import { useTime } from "@/lib/design/atmosphere";

// ─── VoiceWave: 7 animated bars + pulsing glow ring while speaking ───
// Direct port of voice.jsx from the design handoff. Used next to Coach
// Pawn's name when audio is playing.
export default function VoiceWave({
  scale = 1,
  color = "#FCD34D",
  speaking = true,
  intensity = 1,
  style = {},
}: {
  scale?: number;
  color?: string;
  speaking?: boolean;
  intensity?: number;
  style?: React.CSSProperties;
}) {
  const time = useTime();
  const bars = 7;
  return (
    <div
      style={{
        position: "relative",
        transform: `scale(${scale})`,
        transformOrigin: "left center",
        display: "flex",
        alignItems: "center",
        gap: 4,
        pointerEvents: "none",
        height: 48,
        ...style,
      }}
      aria-hidden
    >
      {/* glow ring */}
      <div
        style={{
          position: "absolute",
          left: -14,
          top: -14,
          right: -14,
          bottom: -14,
          borderRadius: 100,
          border: `2px solid ${color}`,
          opacity: speaking ? 0.4 + 0.4 * Math.abs(Math.sin(time * 4)) : 0,
          boxShadow: `0 0 24px ${color}`,
          transition: "opacity 200ms ease",
        }}
      />
      {[...Array(bars)].map((_, i) => {
        const phase = i * 0.4;
        const h = speaking
          ? 12 + Math.abs(Math.sin(time * 8 + phase)) * 36 * intensity
          : 6;
        return (
          <div
            key={i}
            style={{
              width: 5,
              height: h,
              background: color,
              borderRadius: 3,
              boxShadow: `0 0 8px ${color}`,
              transition: "height 80ms",
            }}
          />
        );
      })}
    </div>
  );
}
