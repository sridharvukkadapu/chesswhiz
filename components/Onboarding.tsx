"use client";

import { useState } from "react";
import Link from "next/link";
import type { Difficulty } from "@/lib/chess/types";
import { T } from "@/lib/design/tokens";
import { WarmDust, MoteField } from "@/lib/design/atmosphere";
import CoachPawn, { SpeechBubble } from "@/components/CoachPawn";

interface OnboardingProps {
  onStart: (name: string, age: number, difficulty: Difficulty) => void;
}

const AGE_OPTIONS = [
  { label: "5–7", value: 6 },
  { label: "8–10", value: 9 },
  { label: "11+", value: 12 },
];

const DIFF_OPTIONS: { label: string; value: Difficulty; color: string; bg: string }[] = [
  { label: "Gentle", value: 1, color: T.sage,   bg: "rgba(124,182,158,0.12)" },
  { label: "Steady", value: 2, color: T.sky,    bg: "rgba(127,191,232,0.12)" },
  { label: "Fierce", value: 3, color: T.coral,  bg: "rgba(255,107,90,0.12)"  },
];

export default function Onboarding({ onStart }: OnboardingProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(9);
  const [difficulty, setDifficulty] = useState<Difficulty>(2);

  const canStart = name.trim().length > 0;
  const firstName = name.trim().split(/\s+/)[0] || "friend";

  const coachMessage = !canStart
    ? "Hi! I'm Coach Pawn — what should I call you?"
    : `Nice to meet you, ${firstName}! Ready for the Chess Kingdom?`;

  const coachExpression = canStart ? "cheer" : "talking";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: T.bgRadial,
        color: T.ink,
        fontFamily: T.fontUI,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Warm ambient */}
      <MoteField count={10} seed={4} color={T.coral} />
      <WarmDust count={18} seed={12} opacity={0.03} />

      {/* Back link */}
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
          color: T.inkLow,
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
          color: T.inkDim,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        onboarding · /onboard
      </div>

      {/* Two-column layout */}
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
        {/* Coach + speech bubble */}
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
          <CoachPawn size={200} expression={coachExpression} mode="kid" />
          <div className="onboard-bubble-desktop" style={{ minWidth: 0, flexShrink: 1 }}>
            <SpeechBubble text={coachMessage} width={260} tail="left" />
          </div>
        </div>

        {/* Form card */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canStart) onStart(name.trim(), age, difficulty);
          }}
          style={{
            width: "min(520px, 100%)",
            background: "#FFFCF5",
            borderRadius: 28,
            padding: "36px 32px 32px",
            border: `1.5px solid ${T.borderCard}`,
            boxShadow: T.shadowDeep,
            animation: "onboardCardIn 0.6s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* Heading */}
          <div style={{ marginBottom: 4 }}>
            <span
              style={{
                fontFamily: T.fontDisplay,
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: 40,
                letterSpacing: "-0.02em",
                color: T.ink,
                lineHeight: 1.05,
              }}
            >
              Begin your quest
            </span>
          </div>
          <div
            style={{
              fontFamily: T.fontHand,
              fontSize: 20,
              color: T.inkLow,
              marginBottom: 28,
            }}
          >
            The Chess Kingdom awaits, brave one.
          </div>

          {/* Name */}
          <div style={{ marginBottom: 22 }}>
            <Label>Your name</Label>
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
                background: canStart ? "rgba(255,107,90,0.04)" : "rgba(31,42,68,0.03)",
                border: `1.5px solid ${canStart ? T.coral : T.border}`,
                borderRadius: 14,
                fontFamily: T.fontUI,
                fontSize: 20,
                fontWeight: 500,
                color: T.ink,
                outline: "none",
                boxShadow: canStart ? "0 0 0 4px rgba(255,107,90,0.12)" : "none",
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
                      background: active ? "rgba(255,107,90,0.10)" : "rgba(31,42,68,0.03)",
                      border: `1.5px solid ${active ? T.coral : T.border}`,
                      borderRadius: 12,
                      fontFamily: T.fontUI,
                      fontSize: 18,
                      fontWeight: 600,
                      color: active ? T.coral : T.inkLow,
                      boxShadow: active ? "0 0 0 3px rgba(255,107,90,0.12)" : "none",
                      transform: active ? "scale(1.04)" : "scale(1)",
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
                      background: active ? d.bg : "rgba(31,42,68,0.03)",
                      border: `1.5px solid ${active ? d.color : T.border}`,
                      borderRadius: 12,
                      fontFamily: T.fontUI,
                      fontSize: 17,
                      fontWeight: 600,
                      color: active ? (d.color === T.butter ? T.butterDeep : d.color) : T.inkLow,
                      boxShadow: active ? `0 0 0 3px ${d.color}1E` : "none",
                      transform: active ? "scale(1.04)" : "scale(1)",
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

          {/* Quest preview */}
          {canStart && (
            <div
              style={{
                marginBottom: 22,
                padding: "14px 16px",
                background: "rgba(255,107,90,0.06)",
                border: `1.5px solid rgba(255,107,90,0.22)`,
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
                      color: T.coral,
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
                      fontSize: 20,
                      color: T.ink,
                      lineHeight: 1.2,
                    }}
                  >
                    Pawn Village
                  </div>
                  <div style={{ fontFamily: T.fontHand, fontSize: 16, color: T.inkLow, marginTop: 2 }}>
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
              background: canStart ? T.coral : "rgba(31,42,68,0.06)",
              borderRadius: 100,
              border: "none",
              fontFamily: T.fontUI,
              fontSize: 17,
              fontWeight: 800,
              color: canStart ? "#FFFCF5" : T.inkDim,
              letterSpacing: "0.04em",
              boxShadow: canStart ? T.glowCoral : "none",
              cursor: canStart ? "pointer" : "not-allowed",
              transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onMouseEnter={(e) => { if (canStart) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.02)"; }}
            onFocus={(e) => { if (canStart) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.02)"; }}
            onMouseLeave={(e) => { if (canStart) (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"; }}
            onBlur={(e) => { if (canStart) (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"; }}
            onMouseDown={(e) => { if (canStart) (e.currentTarget as HTMLElement).style.transform = "scale(0.97)"; }}
          >
            {canStart ? `Enter Pawn Village, ${firstName} →` : "Type your name to begin"}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes onboardCardIn {
          from { opacity: 0; transform: translateY(36px); }
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
        color: T.inkLow,
        textTransform: "uppercase",
        letterSpacing: "0.16em",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}
