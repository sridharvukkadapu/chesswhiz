"use client";

import { useState } from "react";
import type { Difficulty } from "@/lib/chess/types";

// Matches landing page palette exactly
const P = {
  cream: "#FBF7F0",
  creamDeep: "#F5EFE4",
  parchment: "#F0E8D8",
  ink: "#1A1210",
  inkSoft: "#2E2620",
  inkMed: "#5C544A",
  inkLight: "#8A8278",
  inkFaint: "#B0A898",
  inkGhost: "#D0C8BC",
  emerald: "#1B7340",
  emeraldBright: "#22C55E",
  emeraldPale: "#E6F4EC",
  gold: "#C7940A",
  goldPale: "#FDF6E3",
};

interface OnboardingProps {
  onStart: (name: string, age: number, difficulty: Difficulty) => void;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

const DIFF_OPTIONS: { label: string; value: Difficulty; stars: number; desc: string }[] = [
  { label: "Easy",   value: 1, stars: 1, desc: "Beginners welcome" },
  { label: "Medium", value: 2, stars: 2, desc: "A good challenge" },
  { label: "Hard",   value: 3, stars: 3, desc: "Think carefully!" },
];

const AGE_OPTIONS = [
  { label: "5–7",  value: 6 },
  { label: "8–10", value: 9 },
  { label: "11+",  value: 12 },
];

export default function Onboarding({ onStart }: OnboardingProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(9);
  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [nameFocused, setNameFocused] = useState(false);

  const canStart = name.trim().length > 0;

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      background: P.cream,
      fontFamily: "var(--font-nunito), sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Paper grain texture — same as landing */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.025'/%3E%3C/svg%3E")`,
      }} />

      {/* Subtle warm vignette */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse at 30% 20%, ${P.parchment} 0%, ${P.cream} 70%)`,
      }} />

      {/* Floating chess pieces — same atmosphere as landing */}
      {["♔","♕","♖","♗","♘","♙","♚","♛","♜","♝","♞","♟"].map((sym, i) => (
        <span key={i} style={{
          position: "fixed",
          left: `${(i * 8.3) % 95}%`,
          top: `${(i * 7.7) % 95}%`,
          fontSize: 18 + (i * 2.3) % 28,
          opacity: 0.018 + (i * 0.002) % 0.025,
          color: P.ink,
          pointerEvents: "none",
          zIndex: 0,
          transform: `rotate(${-20 + (i * 3.7) % 40}deg)`,
          animation: `driftSlow ${18 + (i * 1.1) % 20}s ease-in-out ${(i * 0.5) % 8}s infinite alternate`,
        }}>{sym}</span>
      ))}

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 420,
        background: "white",
        borderRadius: 24,
        border: `1px solid ${P.inkGhost}`,
        boxShadow: `0 0 0 4px ${P.parchment}, 0 24px 80px rgba(26,18,16,0.12), 0 8px 24px rgba(26,18,16,0.08)`,
        padding: "36px 32px 32px",
        animation: "cardAppear 0.6s cubic-bezier(0.16,1,0.3,1) both",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            fontSize: 52, lineHeight: 1,
            filter: "drop-shadow(0 4px 12px rgba(26,18,16,0.15))",
            marginBottom: 8,
            animation: "gentleSway 4s ease-in-out infinite alternate",
            display: "inline-block",
          }}>♟</div>
          <h1 style={{
            fontSize: 32, fontWeight: 900, margin: "4px 0 2px",
            fontFamily: "var(--font-playfair), serif",
            color: P.ink, letterSpacing: -0.8,
          }}>ChessWhiz</h1>
          <div style={{
            fontFamily: "'Caveat', cursive", fontSize: 16, color: P.gold,
            marginTop: 2,
          }}>your personal chess coach</div>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 18 }}>
          <label htmlFor="player-name" style={{
            display: "block", fontSize: 12, fontWeight: 700,
            color: P.inkMed, marginBottom: 6, letterSpacing: 0.3,
            textTransform: "uppercase",
          }}>Your name</label>
          <input
            id="player-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            autoComplete="given-name"
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            style={{
              width: "100%", height: 48,
              padding: "0 16px", borderRadius: 12,
              border: `1.5px solid ${nameFocused ? P.emerald : P.inkGhost}`,
              background: nameFocused ? P.emeraldPale : P.creamDeep,
              color: P.ink, fontSize: 15,
              fontFamily: "var(--font-nunito), sans-serif",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s ease, background 0.2s ease",
              boxShadow: nameFocused ? "0 0 0 3px rgba(27,115,64,0.08)" : "none",
            }}
          />
        </div>

        {/* Age group */}
        <div style={{ marginBottom: 18 }}>
          <span style={{
            display: "block", fontSize: 12, fontWeight: 700,
            color: P.inkMed, marginBottom: 6, letterSpacing: 0.3,
            textTransform: "uppercase",
          }}>Age group</span>
          <div style={{ display: "flex", gap: 8 }} role="group" aria-label="Age group">
            {AGE_OPTIONS.map((opt) => {
              const active = age === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setAge(opt.value)}
                  aria-pressed={active}
                  style={{
                    flex: 1, height: 44, borderRadius: 12,
                    border: `1.5px solid ${active ? P.emerald : P.inkGhost}`,
                    background: active ? P.emeraldPale : P.creamDeep,
                    color: active ? P.emerald : P.inkLight,
                    fontSize: 14, fontWeight: 700, cursor: "pointer",
                    fontFamily: "var(--font-nunito), sans-serif",
                    transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                    transform: active ? "scale(1.03)" : "scale(1)",
                    boxShadow: active ? `0 4px 12px rgba(27,115,64,0.15)` : "none",
                  }}
                >{opt.label}</button>
              );
            })}
          </div>
        </div>

        {/* Difficulty */}
        <div style={{ marginBottom: 28 }}>
          <span style={{
            display: "block", fontSize: 12, fontWeight: 700,
            color: P.inkMed, marginBottom: 6, letterSpacing: 0.3,
            textTransform: "uppercase",
          }}>Bot difficulty</span>
          <div style={{ display: "flex", gap: 8 }} role="group" aria-label="Bot difficulty">
            {DIFF_OPTIONS.map((opt) => {
              const active = difficulty === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  aria-pressed={active}
                  style={{
                    flex: 1, height: 56, borderRadius: 12,
                    border: `1.5px solid ${active ? P.emerald : P.inkGhost}`,
                    background: active ? P.emeraldPale : P.creamDeep,
                    color: active ? P.emerald : P.inkLight,
                    cursor: "pointer",
                    fontFamily: "var(--font-nunito), sans-serif",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 3,
                    transition: "all 0.18s cubic-bezier(0.34,1.56,0.64,1)",
                    transform: active ? "scale(1.03)" : "scale(1)",
                    boxShadow: active ? `0 4px 12px rgba(27,115,64,0.15)` : "none",
                  }}
                >
                  <span style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3].map((s) => <StarIcon key={s} filled={s <= opt.stars} />)}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.2 }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => canStart && onStart(name.trim(), age, difficulty)}
          disabled={!canStart}
          aria-label="Start game"
          style={{
            width: "100%", height: 52, borderRadius: 14, border: "none",
            background: canStart ? P.emerald : P.inkGhost,
            color: canStart ? "white" : P.inkFaint,
            fontSize: 17, fontWeight: 800, cursor: canStart ? "pointer" : "not-allowed",
            fontFamily: "var(--font-nunito), sans-serif",
            letterSpacing: 0.3,
            boxShadow: canStart ? "0 8px 28px rgba(27,115,64,0.28), 0 2px 8px rgba(27,115,64,0.15)" : "none",
            transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            transform: "scale(1)",
          }}
          onMouseEnter={e => { if (canStart) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.02)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 36px rgba(27,115,64,0.32), 0 4px 12px rgba(27,115,64,0.2)"; } }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; (e.currentTarget as HTMLElement).style.boxShadow = canStart ? "0 8px 28px rgba(27,115,64,0.28), 0 2px 8px rgba(27,115,64,0.15)" : "none"; }}
          onMouseDown={e => { if (canStart) (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
          onMouseUp={e => { if (canStart) (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
        >
          {canStart ? "Let's Play! ♟" : "Enter your name to start"}
        </button>

        {/* Back to landing */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <a href="/" style={{
            fontSize: 12, color: P.inkFaint,
            textDecoration: "none", fontFamily: "var(--font-nunito), sans-serif",
            transition: "color 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = P.inkMed}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = P.inkFaint}
          >← Back to home</a>
        </div>
      </div>

      <style>{`
        @keyframes cardAppear {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes gentleSway {
          0%   { transform: rotate(-6deg); }
          100% { transform: rotate(6deg); }
        }
        @keyframes driftSlow {
          0%   { transform: translateY(0px); }
          100% { transform: translateY(-30px); }
        }
      `}</style>
    </div>
  );
}
