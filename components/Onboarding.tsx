"use client";

import { useState } from "react";
import Link from "next/link";
import type { Difficulty } from "@/lib/chess/types";
import { T } from "@/lib/design/tokens";
import { WarmDust, MoteField } from "@/lib/design/atmosphere";
import CoachPawn, { SpeechBubble } from "@/components/CoachPawn";
import { computeDifficulty } from "@/lib/progression/adaptive-difficulty";
import { useGameStore } from "@/stores/gameStore";
import {
  getNextStep,
  getAgeValue,
  type OnboardingState,
} from "@/lib/onboarding/steps";
import TheTrial from "@/components/TheTrial";
import type { TrialResult } from "@/lib/trial/types";

interface OnboardingProps {
  onStart: (name: string, age: number, difficulty: Difficulty, trialResult?: TrialResult) => void;
  firstSessionComplete?: boolean;
}

const COACH_MESSAGES: Record<string, string> = {
  name: "Hi! I'm Coach Pawn — what should I call you?",
  age: "Great to meet you! How old are you?",
  trial: "Let's find out what you already know!",
  ready: "You're all set! Let the adventure begin!",
};

export default function Onboarding({ onStart, firstSessionComplete }: OnboardingProps) {
  const progression = useGameStore((s) => s.progression);
  const [wizardState, setWizardState] = useState<OnboardingState>({
    step: "name",
    name: null,
    ageBand: null,
  });
  const [nameInput, setNameInput] = useState("");
  const [trialResult, setTrialResultRef] = useState<TrialResult | null>(null);

  const firstName = (wizardState.name ?? nameInput).trim().split(/\s+/)[0] || "friend";
  const coachMsg = wizardState.step === "ready"
    ? `Welcome to Pawn Village, ${firstName}! Your quest begins now!`
    : COACH_MESSAGES[wizardState.step] ?? COACH_MESSAGES.name;
  const coachExpression =
    wizardState.step === "ready" ? "cheer" : "talking";

  function advance(patch: Partial<OnboardingState>, result?: TrialResult) {
    const next: OnboardingState = { ...wizardState, ...patch };
    next.step = getNextStep(next);
    setWizardState(next);
    if (result) setTrialResultRef(result);
  }

  // Step: name
  if (wizardState.step === "name") {
    const canAdvance = nameInput.trim().length > 0;
    return (
      <Shell coachMsg={coachMsg} coachExpression={coachExpression}>
        <StepCard>
          <StepHeading>What&apos;s your name?</StepHeading>
          <StepSub>The Chess Kingdom needs a hero!</StepSub>
          <input
            id="onboard-name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value.slice(0, 24))}
            placeholder="Type your name…"
            autoComplete="given-name"
            maxLength={24}
            autoFocus
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "14px 18px",
              background: canAdvance ? "rgba(255,107,90,0.04)" : "rgba(31,42,68,0.03)",
              border: `1.5px solid ${canAdvance ? T.coral : T.border}`,
              borderRadius: 14,
              fontFamily: T.fontUI,
              fontSize: 20,
              fontWeight: 500,
              color: T.ink,
              outline: "none",
              boxShadow: canAdvance ? "0 0 0 4px rgba(255,107,90,0.12)" : "none",
              transition: "all 200ms ease",
              marginBottom: 20,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canAdvance) {
                advance({ name: nameInput.trim() });
              }
            }}
          />
          <CTAButton
            disabled={!canAdvance}
            onClick={() => { if (canAdvance) advance({ name: nameInput.trim() }); }}
          >
            {canAdvance ? `Nice to meet you, ${nameInput.trim().split(/\s+/)[0]}! →` : "Type your name to begin"}
          </CTAButton>
        </StepCard>
      </Shell>
    );
  }

  // Step: age
  if (wizardState.step === "age") {
    const bands: Array<"5-7" | "8-10" | "11+"> = ["5-7", "8-10", "11+"];
    return (
      <Shell coachMsg={coachMsg} coachExpression={coachExpression}>
        <StepCard>
          <StepHeading>How old are you?</StepHeading>
          <StepSub>I&apos;ll teach you in the right way!</StepSub>
          <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
            {bands.map((band) => (
              <ChoiceButton
                key={band}
                active={false}
                onClick={() => advance({ ageBand: band })}
              >
                {band}
              </ChoiceButton>
            ))}
          </div>
        </StepCard>
      </Shell>
    );
  }

  // Step: trial
  if (wizardState.step === "trial") {
    return (
      <Shell coachMsg="Let's find out what you already know!" coachExpression="talking">
        <TheTrial
          playerName={wizardState.name ?? "friend"}
          ageBand={wizardState.ageBand ?? "8-10"}
          onComplete={(result: TrialResult) => {
            advance({}, result);
          }}
        />
      </Shell>
    );
  }

  // Step: ready
  const difficulty: Difficulty = firstSessionComplete
    ? computeDifficulty(progression)
    : 1;
  const age = wizardState.ageBand ? getAgeValue(wizardState.ageBand) : 9;

  return (
    <Shell coachMsg={coachMsg} coachExpression={coachExpression}>
      <StepCard>
        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <span style={{ fontSize: 48 }}>🏘️</span>
        </div>
        <StepHeading>Welcome to Pawn Village!</StepHeading>
        <StepSub>
          Your quest through the Chess Kingdom begins here, {firstName}. Defeat the boss to unlock the next realm!
        </StepSub>

        <div
          style={{
            marginBottom: 22,
            padding: "14px 16px",
            background: "rgba(255,107,90,0.06)",
            border: `1.5px solid rgba(255,107,90,0.22)`,
            borderRadius: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🌲</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: T.coral,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  fontFamily: T.fontUI,
                }}
              >
                Then comes
              </div>
              <div
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  fontSize: 18,
                  color: T.ink,
                  lineHeight: 1.2,
                }}
              >
                Fork Forest
              </div>
              <div style={{ fontFamily: T.fontHand, fontSize: 15, color: T.inkLow, marginTop: 2 }}>
                Face the Knight Twins!
              </div>
            </div>
          </div>
        </div>

        <CTAButton onClick={() => onStart(wizardState.name ?? firstName, age, difficulty, trialResult ?? undefined)}>
          Enter Pawn Village, {firstName} →
        </CTAButton>
      </StepCard>
    </Shell>
  );
}

// ── Shell: full-screen background with coach pawn ──
function Shell({
  children,
  coachMsg,
  coachExpression,
  minimal = false,
}: {
  children: React.ReactNode;
  coachMsg: string;
  coachExpression: "idle" | "talking" | "cheer" | "sad" | "aha";
  minimal?: boolean;
}) {
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
      <MoteField count={10} seed={4} color={T.coral} />
      <WarmDust count={18} seed={12} opacity={0.03} />

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

      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexWrap: "wrap",
          gap: minimal ? 24 : 56,
          alignItems: "center",
          justifyContent: "center",
          padding: "100px 24px 60px",
          position: "relative",
          zIndex: 1,
        }}
      >
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
            <SpeechBubble text={coachMsg} width={260} tail="left" />
          </div>
        </div>

        {children}
      </div>

      <style>{`
        @keyframes onboardCardIn {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .onboard-bubble-desktop { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ── Step card wrapper ──
function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "min(520px, 100%)",
        background: T.bgCard,
        borderRadius: 28,
        padding: "36px 32px 32px",
        border: `1.5px solid ${T.borderCard}`,
        boxShadow: T.shadowDeep,
        animation: "onboardCardIn 0.6s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      {children}
    </div>
  );
}

// ── Step heading ──
function StepHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <span
        style={{
          fontFamily: T.fontDisplay,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 36,
          letterSpacing: "-0.02em",
          color: T.ink,
          lineHeight: 1.1,
        }}
      >
        {children}
      </span>
    </div>
  );
}

// ── Step sub-heading ──
function StepSub({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: T.fontHand,
        fontSize: 18,
        color: T.inkLow,
        marginBottom: 24,
      }}
    >
      {children}
    </div>
  );
}

// ── Primary CTA button ──
function CTAButton({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%",
        padding: "16px 24px",
        textAlign: "center",
        background: disabled ? "rgba(31,42,68,0.06)" : T.coral,
        borderRadius: 100,
        border: "none",
        fontFamily: T.fontUI,
        fontSize: 17,
        fontWeight: 800,
        color: disabled ? T.inkDim : "#FFFCF5",
        letterSpacing: "0.04em",
        boxShadow: disabled ? "none" : T.glowCoral,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      {children}
    </button>
  );
}

// ── Choice button (age band / experience) ──
function ChoiceButton({
  children,
  active,
  onClick,
  wide = false,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        flex: wide ? undefined : 1,
        width: wide ? "100%" : undefined,
        padding: "14px 12px",
        textAlign: "center",
        background: active ? "rgba(255,107,90,0.10)" : "rgba(31,42,68,0.03)",
        border: `1.5px solid ${active ? T.coral : T.border}`,
        borderRadius: 12,
        fontFamily: T.fontUI,
        fontSize: 17,
        fontWeight: 600,
        color: active ? T.coral : T.inkLow,
        boxShadow: active ? "0 0 0 3px rgba(255,107,90,0.12)" : "none",
        transform: active ? "scale(1.04)" : "scale(1)",
        transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
