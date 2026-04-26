"use client";

import React from "react";
import { useTime } from "@/lib/design/atmosphere";

// ═══════════════════════════════════════════════════════════════
// Coach Pawn — the brand mascot.
// Direct port of coach-pawn.jsx from the design handoff.
// Animations preserved exactly:
//   - gentle breathing bob (sin wave on Y)
//   - blink every ~3.5s
//   - talking mouth opens to audio rhythm
//   - eye tracks slightly (sin/cos drift)
//   - cape sways
//   - cheer mode: eye sparkles, joyful smile, orbiting sparkles
//   - sad mode: downturned eyes + brows + frown
// ═══════════════════════════════════════════════════════════════

export type CoachExpression = "idle" | "talking" | "cheer" | "sad" | "aha";

interface Props {
  size?: number;
  expression?: CoachExpression;
  glow?: boolean;
  style?: React.CSSProperties;
}

export default function CoachPawn({
  size = 220, expression = "idle", glow = true, style = {},
}: Props) {
  const time = useTime();

  // gentle breathing bob (~1.6 Hz)
  const bob = Math.sin(time * 1.6) * 2;
  // eye blink cycle every ~3.5s, with a brief 5% blink window
  const blinkPhase = (time % 3.5) / 3.5;
  const blinking = blinkPhase > 0.94 && blinkPhase < 0.99;
  // talking mouth animation
  const talking = expression === "talking";
  const mouthOpen = talking ? 0.5 + 0.5 * Math.abs(Math.sin(time * 9)) : 0;

  const isCheer = expression === "cheer" || expression === "aha";
  const isSad = expression === "sad";

  // Eye direction (tracks slightly)
  const eyeOffsetX = isCheer ? 0 : Math.sin(time * 0.7) * 1.2;
  const eyeOffsetY = isCheer ? -1.5 : isSad ? 1.5 : Math.cos(time * 0.5) * 0.8;

  const pupilR = isCheer ? 5 : isSad ? 3 : 4;
  const cheekAlpha = isCheer ? 0.85 : 0.55;
  const capeSwayDeg = Math.sin(time * 1.2) * 4 + (isCheer ? 6 : 0);

  return (
    <div
      style={{
        width: size,
        height: size,
        transform: `translateY(${bob}px)`,
        filter: glow
          ? "drop-shadow(0 0 24px rgba(252,211,77,0.45)) drop-shadow(0 8px 16px rgba(0,0,0,0.5))"
          : "none",
        ...style,
      }}
      aria-hidden
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="cpBody" cx="0.4" cy="0.35" r="0.7">
            <stop offset="0%" stopColor="#FFFAEB" />
            <stop offset="60%" stopColor="#F5E2B0" />
            <stop offset="100%" stopColor="#B8923D" />
          </radialGradient>
          <radialGradient id="cpHead" cx="0.4" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="#FFFEF6" />
            <stop offset="55%" stopColor="#F8EDC7" />
            <stop offset="100%" stopColor="#C29A45" />
          </radialGradient>
          <linearGradient id="cpCape" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9333EA" />
            <stop offset="60%" stopColor="#5B1AA0" />
            <stop offset="100%" stopColor="#2E0A5C" />
          </linearGradient>
          <linearGradient id="cpGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="100%" stopColor="#B07A0E" />
          </linearGradient>
          <radialGradient id="cpCheek" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#FF8FA8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FF8FA8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* shadow */}
        <ellipse cx="100" cy="186" rx="45" ry="6" fill="rgba(0,0,0,0.35)" filter="blur(2px)" />

        {/* CAPE - behind body */}
        <g style={{ transformOrigin: "100px 95px", transform: `rotate(${capeSwayDeg * 0.3}deg)` }}>
          <path
            d="M 60 95 Q 50 130 55 175 Q 100 165 145 175 Q 150 130 140 95 Z"
            fill="url(#cpCape)"
            stroke="#1F0A38"
            strokeWidth="1.5"
          />
          {/* gold trim */}
          <path
            d="M 60 95 Q 50 130 55 175 Q 100 165 145 175 Q 150 130 140 95"
            fill="none"
            stroke="url(#cpGold)"
            strokeWidth="2.5"
          />
          {/* embroidered star */}
          <g transform="translate(100 145)">
            <path
              d="M 0 -8 L 2 -2 L 8 -2 L 3 2 L 5 8 L 0 4 L -5 8 L -3 2 L -8 -2 L -2 -2 Z"
              fill="url(#cpGold)"
              opacity="0.9"
            />
          </g>
        </g>

        {/* BODY (lower bulb) */}
        <path
          d="M 70 130 Q 65 105 80 95 Q 100 90 120 95 Q 135 105 130 130 Q 145 145 140 165 Q 100 175 60 165 Q 55 145 70 130 Z"
          fill="url(#cpBody)"
          stroke="#7A5418"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* COLLAR ring (between head and body) */}
        <ellipse cx="100" cy="92" rx="22" ry="6" fill="url(#cpGold)" stroke="#7A5418" strokeWidth="1" />
        <ellipse cx="100" cy="91" rx="22" ry="3" fill="#FFE9A8" opacity="0.7" />

        {/* HEAD (sphere) */}
        <circle cx="100" cy="65" r="38" fill="url(#cpHead)" stroke="#7A5418" strokeWidth="1.8" />
        <ellipse cx="86" cy="50" rx="14" ry="9" fill="#FFFFFF" opacity="0.55" />

        {/* CROWN — tiny gold circlet */}
        <g transform="translate(100 30)">
          <path
            d="M -16 0 L -10 -8 L -4 -2 L 0 -10 L 4 -2 L 10 -8 L 16 0 L 14 4 L -14 4 Z"
            fill="url(#cpGold)"
            stroke="#7A5418"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <circle cx="0" cy="-8" r="1.5" fill="#FF6B6B" />
          <circle cx="-10" cy="-6" r="1" fill="#7DA8FF" />
          <circle cx="10" cy="-6" r="1" fill="#34D399" />
        </g>

        {/* CHEEKS */}
        <ellipse cx="76" cy="76" rx="8" ry="5" fill="url(#cpCheek)" opacity={cheekAlpha} />
        <ellipse cx="124" cy="76" rx="8" ry="5" fill="url(#cpCheek)" opacity={cheekAlpha} />

        {/* EYES — big, expressive */}
        {blinking ? (
          <>
            <path d="M 78 64 Q 84 67 90 64" stroke="#1A1210" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 110 64 Q 116 67 122 64" stroke="#1A1210" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        ) : isSad ? (
          <>
            <ellipse cx="84" cy="65" rx="6" ry="7" fill="#FFFFFF" />
            <ellipse cx="116" cy="65" rx="6" ry="7" fill="#FFFFFF" />
            <circle cx={84 + eyeOffsetX} cy={67 + eyeOffsetY} r={pupilR} fill="#1A1210" />
            <circle cx={116 + eyeOffsetX} cy={67 + eyeOffsetY} r={pupilR} fill="#1A1210" />
            <circle cx={84 + eyeOffsetX + 1} cy={66 + eyeOffsetY} r="1.2" fill="#FFF" />
            <circle cx={116 + eyeOffsetX + 1} cy={66 + eyeOffsetY} r="1.2" fill="#FFF" />
            <path d="M 76 56 Q 82 58 90 57" stroke="#1A1210" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 110 57 Q 118 58 124 56" stroke="#1A1210" strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="84" cy="64" rx="6.5" ry={isCheer ? 5 : 7.5} fill="#FFFFFF" />
            <ellipse cx="116" cy="64" rx="6.5" ry={isCheer ? 5 : 7.5} fill="#FFFFFF" />
            <circle cx={84 + eyeOffsetX} cy={64 + eyeOffsetY} r={pupilR} fill="#1A1210" />
            <circle cx={116 + eyeOffsetX} cy={64 + eyeOffsetY} r={pupilR} fill="#1A1210" />
            <circle cx={84 + eyeOffsetX + 1.5} cy={62.5 + eyeOffsetY} r="1.5" fill="#FFF" />
            <circle cx={116 + eyeOffsetX + 1.5} cy={62.5 + eyeOffsetY} r="1.5" fill="#FFF" />
            {isCheer && (
              <>
                <circle cx={87} cy={61} r="1" fill="#FCD34D" />
                <circle cx={119} cy={61} r="1" fill="#FCD34D" />
              </>
            )}
          </>
        )}

        {/* MOUTH */}
        {isCheer ? (
          <path d="M 88 82 Q 100 95 112 82 Q 100 90 88 82 Z" fill="#5B1AA0" stroke="#1A1210" strokeWidth="1.5" />
        ) : isSad ? (
          <path d="M 90 88 Q 100 82 110 88" stroke="#1A1210" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        ) : talking ? (
          <ellipse cx="100" cy="84" rx="5" ry={3 + mouthOpen * 4} fill="#5B1AA0" stroke="#1A1210" strokeWidth="1.5" />
        ) : (
          <path d="M 92 84 Q 100 89 108 84" stroke="#1A1210" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        )}

        {/* aha sparkles around head when cheering */}
        {isCheer &&
          [...Array(6)].map((_, i) => {
            const angle = (i / 6) * Math.PI * 2 + time;
            const r = 50 + Math.sin(time * 3 + i) * 5;
            const cx = 100 + Math.cos(angle) * r;
            const cy = 65 + Math.sin(angle) * r * 0.8;
            return (
              <g key={i} transform={`translate(${cx} ${cy})`}>
                <path d="M 0 -5 L 1 -1 L 5 0 L 1 1 L 0 5 L -1 1 L -5 0 L -1 -1 Z" fill="#FCD34D" />
              </g>
            );
          })}
      </svg>
    </div>
  );
}

// Speech bubble — used in landing/onboarding scenes (parchment on dark)
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
        background: "linear-gradient(180deg, #FBF6E8 0%, #F5E9C9 100%)",
        borderRadius: 20,
        padding: "18px 24px",
        boxShadow: "0 8px 28px rgba(0,0,0,0.4), inset 0 0 0 2px rgba(245,182,56,0.4)",
        fontFamily: 'var(--font-jakarta), sans-serif',
        fontSize: 17,
        color: "#1A1210",
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
          [tail]: -10,
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
