"use client";

import { useState } from "react";
import Link from "next/link";
import type { Difficulty } from "@/lib/chess/types";
import { T } from "@/lib/design/tokens";
import { GoldFoilText, StarField, MoteField, useTime } from "@/lib/design/atmosphere";
import CoachPawn, { SpeechBubble } from "@/components/CoachPawn";

interface OnboardingProps {
  onStart: (name: string, age: number, difficulty: Difficulty) => void;
}

const AGE_OPTIONS = [
  { label: "5–7", value: 6 },
  { label: "8–10", value: 9 },
  { label: "11+", value: 12 },
];

const DIFF_OPTIONS: { label: string; value: Difficulty; color: string; glow: string }[] = [
  { label: "Gentle", value: 1, color: T.emerald, glow: T.glowEmerald },
  { label: "Steady", value: 2, color: T.sapphire, glow: T.glowSapphire },
  { label: "Fierce", value: 3, color: T.ruby, glow: T.glowRuby },
];

export default function Onboarding({ onStart }: OnboardingProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(9);
  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const time = useTime();

  const canStart = name.trim().length > 0;
  const firstName = name.trim().split(/\s+/)[0] || "friend";

  // Coach Pawn says different things based on form state
  const coachMessage = !canStart
    ? "Hi! I'm Coach Pawn — what should I call you?"
    : `Nice to meet you, ${firstName}! Ready for the Chess Kingdom?`;

  const coachExpression = canStart ? "cheer" : "talking";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: T.bgRadial,
        color: T.textHi,
        fontFamily: T.fontUI,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Cosmic atmosphere */}
      <StarField count={50} seed={3} opacity={0.5} />
      <MoteField count={12} seed={4} color={T.amethystGlow} />

      {/* Top-left back link */}
      <Link
        href="/"
        style={{
          position: "fixed",
          top: 24,
          left: 28,
          zIndex: 5,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: T.textLo,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: T.fontUI,
          letterSpacing: "0.08em",
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        HOME
      </Link>

      {/* Scene label */}
      <div
        style={{
          position: "fixed",
          left: 60,
          top: 60,
          fontFamily: T.fontMono,
          fontSize: 11,
          color: T.textDim,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        onboarding · /onboard
      </div>

      {/* Two-column layout: Coach Pawn left, form card right.
          On narrow screens the coach floats above the card. */}
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexWrap: "wrap",
          gap: 56,
          alignItems: "center",
          justifyContent: "center",
          padding: "100px 24px 60px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Coach + speech bubble — inline so they share a flex track and
            never overflow the page or the form card. The bubble hides on
            narrow viewports (≤900px) where the coach already stacks above
            the form card and a side-bubble would point at empty space. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexShrink: 1,
            minWidth: 0,
            maxWidth: "100%",
          }}
        >
          <CoachPawn size={200} expression={coachExpression} />
          <div className="onboard-bubble-desktop" style={{ minWidth: 0, flexShrink: 1 }}>
            <SpeechBubble text={coachMessage} width={260} tail="left" />
          </div>
        </div>

        {/* Form card — wrapped in <form> so the keyboard "Go" button on
            iOS Safari + Enter on desktop submits the quest. */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canStart) onStart(name.trim(), age, difficulty);
          }}
          style={{
            width: "min(540px, 100%)",
            background: "linear-gradient(180deg, rgba(26,18,56,0.95) 0%, rgba(14,10,31,0.95) 100%)",
            borderRadius: 28,
            padding: "36px 32px 32px",
            border: `1.5px solid ${T.borderStrong}`,
            boxShadow: `${T.shadowDeep}, inset 0 1px 0 rgba(252,211,77,0.15)`,
            backdropFilter: "blur(12px)",
            animation: "onboardCardIn 0.7s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* Heading */}
          <div style={{ marginBottom: 4 }}>
            <GoldFoilText fontSize={42} italic>
              Begin your quest
            </GoldFoilText>
          </div>
          <div
            style={{
              fontFamily: T.fontUI,
              fontSize: 15,
              color: T.textLo,
              marginBottom: 28,
            }}
          >
            The Chess Kingdom awaits, brave one.
          </div>

          {/* Name */}
          <div style={{ marginBottom: 22 }}>
            <label htmlFor="onboard-name" style={{
              display: "block",
              fontFamily: T.fontUI,
              fontSize: 12,
              fontWeight: 700,
              color: T.textLo,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              marginBottom: 8,
            }}>Your name</label>
            <input
              id="onboard-name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 24))}
              placeholder="Type your name…"
              autoComplete="given-name"
              maxLength={24}
              required
              aria-required="true"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px 18px",
                background: "rgba(255,255,255,0.04)",
                border: `1.5px solid ${canStart ? T.amber : T.border}`,
                borderRadius: 14,
                fontFamily: T.fontUI,
                fontSize: 20,
                fontWeight: 500,
                color: T.textHi,
                outline: "none",
                boxShadow: canStart ? "0 0 0 4px rgba(245,182,56,0.15)" : "none",
                transition: "all 200ms ease",
              }}
            />
          </div>

          {/* Age */}
          <div style={{ marginBottom: 22 }}>
            <Label>How old are you?</Label>
            <div style={{ display: "flex", gap: 10 }}>
              {AGE_OPTIONS.map((opt) => {
                const active = age === opt.value;
                return (
                  <button type="button"
                    key={opt.value}
                    onClick={() => setAge(opt.value)}
                    aria-pressed={active}
                    style={{
                      flex: 1,
                      padding: "14px 8px",
                      textAlign: "center",
                      background: active
                        ? "linear-gradient(180deg, rgba(245,182,56,0.25) 0%, rgba(245,182,56,0.10) 100%)"
                        : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${active ? T.amber : T.border}`,
                      borderRadius: 12,
                      fontFamily: T.fontUI,
                      fontSize: 18,
                      fontWeight: 600,
                      color: active ? T.amberGlow : T.textMed,
                      boxShadow: active ? T.glowAmber : "none",
                      transform: active ? "scale(1.03)" : "scale(1)",
                      transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
                      cursor: "pointer",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div style={{ marginBottom: 28 }}>
            <Label>Bot challenge</Label>
            <div style={{ display: "flex", gap: 10 }}>
              {DIFF_OPTIONS.map((d) => {
                const active = difficulty === d.value;
                return (
                  <button type="button"
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    aria-pressed={active}
                    style={{
                      flex: 1,
                      padding: "14px 8px",
                      textAlign: "center",
                      background: active
                        ? `linear-gradient(180deg, ${d.color}33 0%, ${d.color}11 100%)`
                        : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${active ? d.color : T.border}`,
                      borderRadius: 12,
                      fontFamily: T.fontUI,
                      fontSize: 17,
                      fontWeight: 600,
                      color: active ? d.color : T.textMed,
                      boxShadow: active ? d.glow : "none",
                      transform: active ? "scale(1.03)" : "scale(1)",
                      transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
                      cursor: "pointer",
                    }}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quest preview — only when name entered */}
          {canStart && (
            <div
              style={{
                marginBottom: 22,
                padding: "14px 16px",
                background: "rgba(245,182,56,0.08)",
                border: `1.5px solid rgba(245,182,56,0.32)`,
                borderRadius: 14,
                animation: "questIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28 }}>🏘️</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: T.amberGlow,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >
                    Your quest begins in
                  </div>
                  <div
                    style={{
                      fontFamily: T.fontDisplay,
                      fontStyle: "italic",
                      fontSize: 18,
                      color: T.textHi,
                      lineHeight: 1.2,
                    }}
                  >
                    Pawn Village
                  </div>
                  <div style={{ fontSize: 12, color: T.textLo, marginTop: 2 }}>
                    Then the Fork Forest 🌲 — face the Knight Twins
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <button type="submit"
            disabled={!canStart}
            aria-label="Begin your quest"
            style={{
              width: "100%",
              padding: "16px 24px",
              textAlign: "center",
              background: canStart ? T.goldFoil : "rgba(255,255,255,0.06)",
              borderRadius: 14,
              border: "none",
              fontFamily: T.fontUI,
              fontSize: 17,
              fontWeight: 800,
              color: canStart ? T.inkDeep : T.textDim,
              letterSpacing: "0.06em",
              boxShadow: canStart ? `0 8px 24px rgba(245,182,56,0.5), inset 0 1px 0 rgba(255,255,255,0.4)` : "none",
              cursor: canStart ? "pointer" : "not-allowed",
              transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
              transform: "scale(1)",
            }}
            onMouseEnter={(e) => { if (canStart) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.02)"; }}
            onFocus={(e) => { if (canStart) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.02)"; }}
            onMouseLeave={(e) => { if (canStart) (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"; }}
            onBlur={(e) => { if (canStart) (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"; }}
            onMouseDown={(e) => { if (canStart) (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
          >
            {canStart ? `✦  Enter Pawn Village, ${firstName}  ✦` : "Type your name to begin"}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes onboardCardIn {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes questIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .onboard-bubble-desktop { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: T.fontUI,
        fontSize: 12,
        fontWeight: 700,
        color: T.textLo,
        textTransform: "uppercase",
        letterSpacing: "0.16em",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}
