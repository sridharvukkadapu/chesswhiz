"use client";

import { useEffect, useRef, useState } from "react";
import type { TacticDetection, Power } from "@/lib/progression/types";
import { T, Z } from "@/lib/design/tokens";
import CoachPawn from "@/components/CoachPawn";
import { sfx } from "@/lib/audio/sfx";
import { haptics } from "@/lib/audio/haptics";
import { useSpeech } from "@/lib/speech";

const FRAME_1_DURATION = 300;
const FRAME_2_DURATION = 700;
const FRAME_3_DURATION = 1000;
const FRAME_4_DURATION = 700;
const FRAME_5_DURATION = 300;

type Frame = 0 | 1 | 2 | 3 | 4 | 5;

const TACTIC_WORD: Record<string, string> = {
  fork: "FORK!",
  pin: "PIN!",
  skewer: "SKEWER!",
  discovered_attack: "DISCOVERY!",
  double_check: "CHECK!",
  back_rank_mate: "CHECKMATE!",
  sacrifice: "SACRIFICE!",
  deflection: "DEFLECTION!",
  overloading: "OVERLOAD!",
  zwischenzug: "BRILLIANT!",
};

const TACTIC_LABEL: Record<string, string> = {
  fork: "The Fork",
  pin: "The Pin",
  skewer: "The Skewer",
  discovered_attack: "Discovery",
  double_check: "Double Check",
  back_rank_mate: "Back Rank Mate",
  sacrifice: "Sacrifice",
  deflection: "Deflection",
  overloading: "Overload",
  zwischenzug: "Zwischenzug",
};

interface AhaCelebrationProps {
  celebration: { tactic: TacticDetection; power: Power } | null;
  onDismiss: () => void;
  playerName: string;
  knightCardRef?: React.RefObject<HTMLElement | null>;
}

export default function AhaCelebration({
  celebration,
  onDismiss,
  playerName,
  knightCardRef,
}: AhaCelebrationProps) {
  const [frame, setFrame] = useState<Frame>(0);
  const [crystalPos, setCrystalPos] = useState({ x: 0, y: 0 });
  const [flyingToCard, setFlyingToCard] = useState(false);
  const crystalRef = useRef<HTMLDivElement>(null);
  const { speak } = useSpeech();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!celebration) {
      setFrame(0);
      return;
    }

    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setFrame(0);
    setFlyingToCard(false);

    const t1 = setTimeout(() => { setFrame(1); }, 50);
    const t2 = setTimeout(() => { setFrame(2); }, 50 + FRAME_1_DURATION);
    const t3 = setTimeout(() => {
      setFrame(3);
      const word = TACTIC_WORD[celebration.tactic.type] ?? "BRILLIANT!";
      speak(word);
      sfx.aha();
    }, 50 + FRAME_1_DURATION + FRAME_2_DURATION);
    const t4 = setTimeout(() => {
      setFrame(4);
      sfx.xp();
      haptics.aha();
      if (knightCardRef?.current && crystalRef.current) {
        const cardRect = knightCardRef.current.getBoundingClientRect();
        const crystalRect = crystalRef.current.getBoundingClientRect();
        const dx = cardRect.left + cardRect.width / 2 - (crystalRect.left + crystalRect.width / 2);
        const dy = cardRect.top + cardRect.height / 2 - (crystalRect.top + crystalRect.height / 2);
        setCrystalPos({ x: dx, y: dy });
        setFlyingToCard(true);
      }
    }, 50 + FRAME_1_DURATION + FRAME_2_DURATION + FRAME_3_DURATION);
    const t5 = setTimeout(() => {
      setFrame(5);
    }, 50 + FRAME_1_DURATION + FRAME_2_DURATION + FRAME_3_DURATION + FRAME_4_DURATION);
    const tDismiss = setTimeout(() => {
      onDismiss();
    }, 50 + FRAME_1_DURATION + FRAME_2_DURATION + FRAME_3_DURATION + FRAME_4_DURATION + FRAME_5_DURATION + 200);

    timersRef.current = [t1, t2, t3, t4, t5, tDismiss];

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      timersRef.current.forEach(clearTimeout);
      window.removeEventListener("keydown", onKey);
    };
  }, [celebration, onDismiss, speak, knightCardRef]);

  if (!celebration) return null;

  const tacticWord = TACTIC_WORD[celebration.tactic.type] ?? "BRILLIANT!";
  const tacticLabel = TACTIC_LABEL[celebration.tactic.type] ?? celebration.power.name;

  const coachExpression = "aha";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Power unlocked: ${tacticLabel}`}
      onClick={onDismiss}
      style={{ position: "fixed", inset: 0, zIndex: Z.modal, pointerEvents: frame >= 1 ? "auto" : "none", overflow: "hidden" }}
    >
      {frame >= 1 && (
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "rgba(10,10,20,0.72)", animation: "ahaFadeIn 300ms ease-out both" }} />
      )}
      {frame >= 2 && (
        <div aria-hidden style={{ position: "absolute", left: "50%", top: "38%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, animation: "ahaAnnotationIn 600ms cubic-bezier(0.34,1.56,0.64,1) both", pointerEvents: "none" }}>
          <div style={{ width: "min(260px, 55vw)", height: "min(260px, 55vw)", borderRadius: "50%", border: "4px solid rgba(255,107,90,0.9)", boxShadow: "0 0 60px rgba(255,107,90,0.6)", animation: "ahaPulse 0.8s ease-in-out infinite" }} />
          {celebration.power.icon && (
            <div style={{ fontSize: "clamp(48px,8vw,96px)", filter: "drop-shadow(0 0 20px rgba(242,201,76,0.9))" }}>{celebration.power.icon}</div>
          )}
        </div>
      )}
      {frame >= 3 && (
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, animation: "ahaCoachIn 600ms cubic-bezier(0.34,1.56,0.64,1) both", pointerEvents: "none" }}>
          <CoachPawn size={140} expression={coachExpression as any} />
          <div style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontWeight: 900, fontSize: "clamp(48px,10vw,120px)", letterSpacing: "-0.02em", background: "linear-gradient(135deg, #FF8E70 0%, #F2C94C 50%, #7CB69E 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1, animation: "ahaWordIn 400ms cubic-bezier(0.34,1.56,0.64,1) 200ms both" }}>
            {tacticWord}
          </div>
        </div>
      )}
      {frame >= 4 && (
        <div
          ref={crystalRef}
          aria-hidden
          style={{
            position: "absolute", left: "50%", top: "50%",
            transform: flyingToCard ? `translate(calc(-50% + ${crystalPos.x}px), calc(-50% + ${crystalPos.y}px)) scale(0.2)` : "translate(-50%, -50%) scale(1)",
            transition: flyingToCard ? `transform ${FRAME_4_DURATION}ms cubic-bezier(0.4,0,0.2,1)` : "none",
            animation: !flyingToCard ? "ahaCrystalMat 400ms cubic-bezier(0.34,1.56,0.64,1) both" : undefined,
            pointerEvents: "none", zIndex: 2,
          }}
        >
          <svg width="80" height="96" viewBox="0 0 280 320" aria-hidden>
            <defs><linearGradient id="crystalGradAha" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFDFA8" /><stop offset="50%" stopColor="#FF6B5A" /><stop offset="100%" stopColor="#C8965A" /></linearGradient></defs>
            <path d="M 140 20 L 220 130 L 180 280 L 100 280 L 60 130 Z" fill="url(#crystalGradAha)" stroke="#F2C94C" strokeWidth="3" />
            <path d="M 140 20 L 140 280 M 60 130 L 220 130" stroke="rgba(242,201,76,0.6)" strokeWidth="2" fill="none" />
          </svg>
          <div style={{ position: "absolute", left: "50%", top: "55%", transform: "translate(-50%,-50%)", fontSize: 28 }}>{celebration.power.icon}</div>
        </div>
      )}
      {frame >= 5 && (
        <div style={{ position: "absolute", bottom: "15%", left: "50%", transform: "translateX(-50%)", textAlign: "center", animation: "ahaLabelIn 300ms ease-out both", pointerEvents: "none" }}>
          <div style={{ fontFamily: T.fontUI, fontSize: 11, fontWeight: 700, color: T.coral, letterSpacing: "0.4em", textTransform: "uppercase", marginBottom: 6 }}>✦ Power Unlocked ✦</div>
          <div style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontSize: "clamp(28px,5vw,48px)", color: "#fff", letterSpacing: "-0.01em" }}>{tacticLabel}</div>
          <div style={{ fontFamily: T.fontUI, fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>{playerName}, you earned <strong style={{ color: T.coral }}>{celebration.power.name}</strong> · tap to dismiss</div>
        </div>
      )}
      <style>{`
        @keyframes ahaFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ahaAnnotationIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.4); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        @keyframes ahaPulse { 0%,100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        @keyframes ahaCoachIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.6); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        @keyframes ahaWordIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        @keyframes ahaCrystalMat { from { opacity: 0; transform: translate(-50%,-50%) scale(0); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        @keyframes ahaLabelIn { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      `}</style>
    </div>
  );
}
