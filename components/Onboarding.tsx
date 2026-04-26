"use client";

import { useState } from "react";
import type { Difficulty } from "@/lib/chess/types";

// Matches landing + kingdom palette exactly (Storybook Noir)
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
  goldLight: "#F0D060",
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
  { label: "5–7",  value: 6, hint: "simple words" },
  { label: "8–10", value: 9, hint: "chess terms" },
  { label: "11+",  value: 12, hint: "full strategy" },
];

function FieldLabel({ step, title, hint }: { step: string; title: string; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
      <span style={{
        fontFamily: "var(--font-playfair), serif",
        fontSize: 13, fontWeight: 900, color: P.gold,
        letterSpacing: 0.3,
      }}>{step}</span>
      <span style={{
        fontSize: 12, fontWeight: 800, color: P.inkMed,
        letterSpacing: 1.2, textTransform: "uppercase",
      }}>{title}</span>
      {hint && (
        <span style={{
          marginLeft: "auto",
          fontFamily: "'Caveat', cursive", fontSize: 14, color: P.inkLight,
        }}>{hint}</span>
      )}
    </div>
  );
}

export default function Onboarding({ onStart }: OnboardingProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(9);
  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [nameFocused, setNameFocused] = useState(false);

  const canStart = name.trim().length > 0;
  const firstName = name.trim().split(/\s+/)[0];

  // Selection ring style matches kingdom page's "current quest" treatment
  const activeChip = {
    border: `1.5px solid ${P.gold}`,
    background: P.goldPale,
    color: P.inkSoft,
    boxShadow: `0 0 0 3px ${P.goldPale}, 0 6px 18px rgba(199,148,10,0.18)`,
    transform: "translateY(-1px)",
  } as const;

  const idleChip = {
    border: `1.5px solid ${P.inkGhost}`,
    background: P.creamDeep,
    color: P.inkLight,
    boxShadow: "none",
    transform: "translateY(0)",
  } as const;

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
      {/* Paper grain — identical to landing + kingdom */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.025'/%3E%3C/svg%3E")`,
      }} />

      {/* Warm vignette */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse at 30% 20%, ${P.parchment} 0%, ${P.cream} 70%)`,
      }} />

      {/* Floating chess pieces — same atmosphere as landing */}
      {["♔","♕","♖","♗","♘","♙","♚","♛","♜","♝","♞","♟"].map((sym, i) => (
        <span key={i} aria-hidden style={{
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

      {/* Back-to-home — top-left, matches kingdom header's back link */}
      <a href="/" style={{
        position: "fixed", top: 20, left: 24, zIndex: 2,
        display: "inline-flex", alignItems: "center", gap: 6,
        color: P.inkMed, textDecoration: "none",
        fontSize: 13, fontWeight: 700,
        fontFamily: "var(--font-nunito), sans-serif",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Home
      </a>

      {/* Card */}
      <div style={{
        position: "relative", zIndex: 1,
        width: "100%", maxWidth: 440,
        background: "white",
        borderRadius: 24,
        border: `1px solid ${P.inkGhost}`,
        boxShadow: `0 0 0 4px ${P.parchment}, 0 24px 80px rgba(26,18,16,0.12), 0 8px 24px rgba(26,18,16,0.08)`,
        padding: "32px 32px 28px",
        animation: "cardAppear 0.6s cubic-bezier(0.16,1,0.3,1) both",
      }}>
        {/* Hand-lettered overline — same device as landing sections */}
        <div style={{
          textAlign: "center",
          fontFamily: "'Caveat', cursive", fontSize: 18, color: P.gold,
          transform: "rotate(-2deg)",
          marginBottom: 6,
        }}>3 quick questions →</div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{
            fontSize: 48, lineHeight: 1,
            filter: "drop-shadow(0 4px 12px rgba(26,18,16,0.15))",
            marginBottom: 6,
            animation: "gentleSway 4s ease-in-out infinite alternate",
            display: "inline-block",
          }}>♟</div>
          <h1 style={{
            fontSize: 30, fontWeight: 900, margin: "2px 0 4px",
            fontFamily: "var(--font-playfair), serif",
            color: P.ink, letterSpacing: -0.8,
          }}>Meet Coach Pawn</h1>
          <p style={{
            margin: 0, fontSize: 14, color: P.inkLight, lineHeight: 1.6,
            fontFamily: "var(--font-nunito), sans-serif",
          }}>
            Tell us a little so your coach can <em style={{ color: P.emerald, fontStyle: "normal", fontWeight: 700 }}>speak your language</em>.
          </p>
        </div>

        {/* 01 — Name */}
        <div style={{ marginBottom: 18 }}>
          <FieldLabel step="01" title="Your name" />
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
              border: `1.5px solid ${nameFocused ? P.gold : P.inkGhost}`,
              background: nameFocused ? P.goldPale : P.creamDeep,
              color: P.ink, fontSize: 15,
              fontFamily: "var(--font-nunito), sans-serif",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease",
              boxShadow: nameFocused ? `0 0 0 3px ${P.goldPale}` : "none",
            }}
          />
        </div>

        {/* 02 — Age group */}
        <div style={{ marginBottom: 18 }}>
          <FieldLabel step="02" title="Age group" hint="coach adapts to this" />
          <div style={{ display: "flex", gap: 8 }} role="group" aria-label="Age group">
            {AGE_OPTIONS.map((opt) => {
              const active = age === opt.value;
              const s = active ? activeChip : idleChip;
              return (
                <button
                  key={opt.value}
                  onClick={() => setAge(opt.value)}
                  aria-pressed={active}
                  style={{
                    flex: 1, height: 56, borderRadius: 12,
                    border: s.border, background: s.background, color: s.color,
                    cursor: "pointer",
                    fontFamily: "var(--font-nunito), sans-serif",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 2,
                    transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                    transform: s.transform,
                    boxShadow: s.boxShadow,
                  }}
                >
                  <span style={{
                    fontSize: 15, fontWeight: 800,
                    fontFamily: "var(--font-playfair), serif",
                    color: active ? P.ink : P.inkMed,
                    letterSpacing: -0.2,
                  }}>{opt.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    letterSpacing: 0.2,
                    color: active ? P.gold : P.inkFaint,
                  }}>{opt.hint}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 03 — Difficulty */}
        <div style={{ marginBottom: 22 }}>
          <FieldLabel step="03" title="Bot difficulty" />
          <div style={{ display: "flex", gap: 8 }} role="group" aria-label="Bot difficulty">
            {DIFF_OPTIONS.map((opt) => {
              const active = difficulty === opt.value;
              const s = active ? activeChip : idleChip;
              return (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  aria-pressed={active}
                  style={{
                    flex: 1, height: 64, borderRadius: 12,
                    border: s.border, background: s.background,
                    color: active ? P.gold : P.inkLight,
                    cursor: "pointer",
                    fontFamily: "var(--font-nunito), sans-serif",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 4,
                    transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                    transform: s.transform,
                    boxShadow: s.boxShadow,
                  }}
                >
                  <span style={{ display: "flex", gap: 2 }}>
                    {[1, 2, 3].map((star) => <StarIcon key={star} filled={star <= opt.stars} />)}
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 800, letterSpacing: 0.2,
                    color: active ? P.ink : P.inkMed,
                  }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
          <div style={{
            marginTop: 8, textAlign: "center",
            fontSize: 12, color: P.inkLight,
            fontFamily: "var(--font-nunito), sans-serif",
          }}>
            {DIFF_OPTIONS.find((d) => d.value === difficulty)?.desc}
          </div>
        </div>

        {/* Live coach preview bubble — mirrors praise bubble from landing */}
        <div style={{
          marginBottom: 22,
          padding: "12px 14px 12px 16px",
          borderRadius: "4px 16px 16px 16px",
          background: "#ECFDF5",
          border: `1.5px solid #86EFAC`,
          position: "relative",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: P.emeraldPale,
              border: `1.5px solid ${P.emerald}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13,
            }}>♟</div>
            <span style={{
              fontSize: 12, fontWeight: 800, color: P.ink,
              fontFamily: "var(--font-playfair), serif",
            }}>Coach Pawn</span>
            <span style={{ fontSize: 9, color: P.emerald, fontWeight: 700 }}>● Online</span>
          </div>
          <p style={{
            margin: 0, fontSize: 13.5, lineHeight: 1.65, color: P.inkSoft,
            fontFamily: "var(--font-nunito), sans-serif",
          }}>
            {canStart
              ? <>Hey <strong style={{ color: P.ink }}>{firstName}</strong>! I&apos;m Coach Pawn — your chess coach <em style={{ color: P.emerald, fontStyle: "normal", fontWeight: 700 }}>and</em> adventure buddy. We start in <strong style={{ color: P.ink }}>Pawn Village</strong>, then head to the <strong style={{ color: P.ink }}>Fork Forest</strong> to face the Knight Twins. Ready? ⭐</>
              : <span style={{ color: P.inkLight, fontStyle: "italic" }}>Tell me your name and I&apos;ll introduce myself…</span>}
          </p>
        </div>

        {/* Step 04: Quest preview — appears once name is entered */}
        {canStart && (
          <div style={{
            marginBottom: 22,
            padding: "14px 16px",
            background: P.creamDeep,
            border: `1px solid ${P.gold}40`,
            borderRadius: 14,
            animation: "questAppear 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            <FieldLabel step="04" title="Your quest begins in" />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `linear-gradient(135deg, #8B735525 0%, ${P.parchment} 100%)`,
                border: `1.5px solid #8B735566`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}>🏘️</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontSize: 15, fontWeight: 800, color: P.ink,
                  fontFamily: "var(--font-playfair), serif", letterSpacing: -0.3,
                }}>Pawn Village</div>
                <div style={{ fontSize: 12, color: P.inkLight, marginTop: 1 }}>
                  Learn how every piece moves with the Village Elder
                </div>
              </div>
            </div>
            <div style={{
              marginTop: 10, paddingTop: 10,
              borderTop: `1px dashed ${P.inkGhost}`,
              fontSize: 12, color: P.inkLight,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span>Then →</span>
              <span style={{ fontSize: 14 }}>🌲</span>
              <span style={{ color: P.inkSoft, fontWeight: 700 }}>Fork Forest</span>
              <span style={{ color: P.inkFaint }}>· face the Knight Twins</span>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => canStart && onStart(name.trim(), age, difficulty)}
          disabled={!canStart}
          aria-label="Start game"
          style={{
            width: "100%", height: 54, borderRadius: 14, border: "none",
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
          {canStart ? `Let's Play, ${firstName}! ♟` : "Enter your name to start"}
        </button>

        {/* Trust microcopy — matches landing */}
        <div style={{
          textAlign: "center", marginTop: 14,
          fontSize: 12, color: P.inkFaint,
          fontFamily: "var(--font-nunito), sans-serif",
        }}>
          No signup · No credit card · Ready in 10 seconds
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
        @keyframes questAppear {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
