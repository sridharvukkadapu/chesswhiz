"use client";

import React from "react";
import { useTime } from "@/lib/design/atmosphere";

// ═══════════════════════════════════════════════════════════════
// Coach Pawn — Warm Character redesign.
// Ported from the v2/warm/coach.jsx design handoff.
// Two modes: 'kid' (rounded beanie, bright, friendly) and
//            'adult' (glasses, distinguished).
// Expressions: idle | talking | cheer | sad | aha
// ═══════════════════════════════════════════════════════════════

export type CoachExpression = "idle" | "talking" | "cheer" | "sad" | "aha";

interface Props {
  size?: number;
  expression?: CoachExpression;
  glow?: boolean;
  style?: React.CSSProperties;
  mode?: "kid" | "adult";
}

export default function CoachPawn({
  size = 220, expression = "idle", glow = true, style = {}, mode = "kid",
}: Props) {
  const time = useTime();

  // gentle breathing bob
  const bob = Math.sin(time * 1.6) * 2.5;
  // blink every ~3.5s
  const blinkPhase = (time % 3.5) / 3.5;
  const blinking = blinkPhase > 0.94 && blinkPhase < 0.99;
  // talking mouth
  const talking = expression === "talking";
  const mouthOpen = talking ? 0.5 + 0.5 * Math.abs(Math.sin(time * 6)) : 0.15;

  const isCheer = expression === "cheer" || expression === "aha";
  const isSad   = expression === "sad";

  // Speaking ring pulse
  const ringR = talking ? (75 + Math.sin(time * 4) * 4) : 0;

  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `translateY(${bob}px)`,
        filter: glow
          ? "drop-shadow(0 4px 20px rgba(255,107,90,0.30)) drop-shadow(0 8px 24px rgba(31,42,68,0.18))"
          : "none",
        ...style,
      }}
      aria-hidden
    >
      <svg viewBox="0 0 220 220" width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="cpBodyWarm" cx="0.4" cy="0.35" r="0.7">
            <stop offset="0%" stopColor={mode === "kid" ? "#FFE7C9" : "#EAD8C0"} />
            <stop offset="70%" stopColor={mode === "kid" ? "#F5C896" : "#D9C0A0"} />
            <stop offset="100%" stopColor="#C8965A" />
          </radialGradient>
          <radialGradient id="cpHeadWarm" cx="0.38" cy="0.30" r="0.7">
            <stop offset="0%" stopColor={mode === "kid" ? "#FFF3DC" : "#F5ECDC"} />
            <stop offset="60%" stopColor={mode === "kid" ? "#FFDFA8" : "#E8D5AA"} />
            <stop offset="100%" stopColor="#C8965A" />
          </radialGradient>
          <radialGradient id="cpCheekWarm" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#F4A6B8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F4A6B8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="cpCoralGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF8E70" />
            <stop offset="100%" stopColor="#E04A3A" />
          </linearGradient>
          <linearGradient id="cpBeanieGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF8E70" />
            <stop offset="100%" stopColor="#FF6B5A" />
          </linearGradient>
        </defs>

        {/* shadow */}
        <ellipse cx="110" cy="208" rx="55" ry="8" fill="rgba(31,42,68,0.15)" />

        {/* BODY — pawn-shaped pedestal */}
        <path
          d="M50 210 Q50 188 62 182 L72 158 Q62 146 72 132 L80 118 Q62 96 110 90 Q158 96 140 118 L148 132 Q158 146 148 158 L158 182 Q170 188 170 210 Z"
          fill="url(#cpBodyWarm)"
          stroke="#3D2A1B"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* HEAD */}
        <circle
          cx="110"
          cy="78"
          r="44"
          fill="url(#cpHeadWarm)"
          stroke="#3D2A1B"
          strokeWidth="3"
        />
        {/* highlight */}
        <ellipse cx="94" cy="60" rx="16" ry="10" fill="#FFFFFF" opacity="0.45" />

        {/* KID: beanie hat */}
        {mode === "kid" && (
          <g>
            <path
              d="M68 56 Q110 26 152 56 L152 48 Q110 18 68 48 Z"
              fill="url(#cpBeanieGrad)"
              stroke="#3D2A1B"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {/* pompom */}
            <circle cx="110" cy="28" r="9" fill="#F2C94C" stroke="#3D2A1B" strokeWidth="2.5" />
            <circle cx="110" cy="28" r="5" fill="#FDE27A" />
          </g>
        )}

        {/* ADULT: glasses + hair */}
        {mode === "adult" && (
          <g>
            <circle cx="90" cy="78" r="12" fill="none" stroke="#3D2A1B" strokeWidth="2.5" />
            <circle cx="130" cy="78" r="12" fill="none" stroke="#3D2A1B" strokeWidth="2.5" />
            <line x1="102" y1="78" x2="118" y2="78" stroke="#3D2A1B" strokeWidth="2.5" />
            <line x1="78" y1="78" x2="72" y2="76" stroke="#3D2A1B" strokeWidth="2" />
            <line x1="142" y1="78" x2="148" y2="76" stroke="#3D2A1B" strokeWidth="2" />
            <path
              d="M80 50 Q90 40 100 48 Q110 36 120 46 Q130 38 140 50"
              fill="none"
              stroke="#3D2A1B"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* CHEEKS */}
        <ellipse cx="78" cy="92" rx="10" ry="7" fill="url(#cpCheekWarm)" opacity={isCheer ? 0.9 : 0.65} />
        <ellipse cx="142" cy="92" rx="10" ry="7" fill="url(#cpCheekWarm)" opacity={isCheer ? 0.9 : 0.65} />

        {/* EYES */}
        {blinking ? (
          <>
            <path d="M80 76 Q88 80 96 76" stroke="#3D2A1B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M124 76 Q132 80 140 76" stroke="#3D2A1B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        ) : mode === "adult" ? (
          // Adult eyes through glasses
          <>
            <ellipse cx="90" cy="79" rx="4" ry={isSad ? 3.5 : 4.5} fill="#3D2A1B" />
            <ellipse cx="130" cy="79" rx="4" ry={isSad ? 3.5 : 4.5} fill="#3D2A1B" />
            <circle cx="91.5" cy="77" r="1.5" fill="#FFF" />
            <circle cx="131.5" cy="77" r="1.5" fill="#FFF" />
          </>
        ) : isSad ? (
          <>
            <ellipse cx="88" cy="80" rx="5" ry="6" fill="#FFFFFF" />
            <ellipse cx="132" cy="80" rx="5" ry="6" fill="#FFFFFF" />
            <ellipse cx="88" cy="82" rx="3.5" ry="4" fill="#3D2A1B" />
            <ellipse cx="132" cy="82" rx="3.5" ry="4" fill="#3D2A1B" />
            <circle cx="89" cy="80" r="1.2" fill="#FFF" />
            <circle cx="133" cy="80" r="1.2" fill="#FFF" />
            {/* sad brows */}
            <path d="M80 68 Q86 70 94 69" stroke="#3D2A1B" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M126 69 Q134 70 140 68" stroke="#3D2A1B" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="88" cy="78" rx={isCheer ? 5.5 : 5} ry={isCheer ? 6 : 7} fill="#FFFFFF" />
            <ellipse cx="132" cy="78" rx={isCheer ? 5.5 : 5} ry={isCheer ? 6 : 7} fill="#FFFFFF" />
            <ellipse cx="88" cy={isCheer ? 77 : 78} rx="3.5" ry={isCheer ? 4 : 4.5} fill="#3D2A1B" />
            <ellipse cx="132" cy={isCheer ? 77 : 78} rx="3.5" ry={isCheer ? 4 : 4.5} fill="#3D2A1B" />
            <circle cx="89.5" cy={isCheer ? 75.5 : 76.5} r="1.5" fill="#FFF" />
            <circle cx="133.5" cy={isCheer ? 75.5 : 76.5} r="1.5" fill="#FFF" />
            {isCheer && (
              <>
                <circle cx="91" cy="73" r="1.2" fill="#F2C94C" />
                <circle cx="135" cy="73" r="1.2" fill="#F2C94C" />
              </>
            )}
          </>
        )}

        {/* MOUTH */}
        {isCheer ? (
          <path
            d="M90 102 Q110 120 130 102 Q110 114 90 102 Z"
            fill="#3D2A1B"
            stroke="#3D2A1B"
            strokeWidth="1.5"
          />
        ) : isSad ? (
          <path
            d="M94 110 Q110 103 126 110"
            stroke="#3D2A1B"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <ellipse
            cx="110"
            cy={102}
            rx="8"
            ry={3 + mouthOpen * 7}
            fill="#3D2A1B"
            opacity="0.85"
          />
        )}

        {/* Speaking ring (talking only) */}
        {talking && (
          <circle
            cx="110"
            cy="110"
            r={ringR}
            fill="none"
            stroke="#FF6B5A"
            strokeWidth="2.5"
            strokeDasharray="4 6"
            opacity="0.45"
          />
        )}

        {/* Cheer sparkles orbiting */}
        {isCheer &&
          [...Array(6)].map((_, i) => {
            const angle = (i / 6) * Math.PI * 2 + time;
            const r = 58 + Math.sin(time * 3 + i) * 6;
            const cx = 110 + Math.cos(angle) * r;
            const cy = 75 + Math.sin(angle) * r * 0.75;
            const colors = ["#FF6B5A", "#F2C94C", "#7CB69E", "#7FBFE8", "#F4A6B8", "#FF8E70"];
            return (
              <g key={i} transform={`translate(${cx} ${cy})`}>
                <path
                  d="M 0 -5 L 1.2 -1.2 L 5 0 L 1.2 1.2 L 0 5 L -1.2 1.2 L -5 0 L -1.2 -1.2 Z"
                  fill={colors[i]}
                />
              </g>
            );
          })}
      </svg>
    </div>
  );
}

// Speech bubble — warm parchment style
export function SpeechBubble({
  text, width = 360, tail = "left", visible = true, opacity = 1, style = {},
}: {
  text: React.ReactNode;
  width?: number;
  tail?: "left" | "right";
  visible?: boolean;
  opacity?: number;
  style?: React.CSSProperties;
}) {
  if (!visible) return null;
  return (
    <div
      style={{
        position: "relative",
        width,
        background: "linear-gradient(160deg, #FFFCF5 0%, #F5E9C9 100%)",
        borderRadius: 22,
        padding: "18px 24px",
        boxShadow:
          "0 8px 28px rgba(31,42,68,0.14), inset 0 0 0 1.5px rgba(31,42,68,0.10)",
        fontFamily: 'var(--font-jakarta), "Plus Jakarta Sans", sans-serif',
        fontSize: 17,
        color: "#1F2A44",
        lineHeight: 1.5,
        opacity,
        transform: `scale(${0.95 + opacity * 0.05})`,
        transformOrigin: tail === "left" ? "left center" : "right center",
        ...style,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          [tail]: -11,
          top: "50%",
          marginTop: -12,
          width: 0,
          height: 0,
          borderTop: "12px solid transparent",
          borderBottom: "12px solid transparent",
          [tail === "left" ? "borderRight" : "borderLeft"]: "14px solid #F5E9C9",
        }}
      />
      {text}
    </div>
  );
}
