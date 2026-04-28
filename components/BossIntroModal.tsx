"use client";
import { useEffect, useState } from "react";
import type { Boss } from "@/lib/progression/types";
import { T, Z } from "@/lib/design/tokens";
import CoachPawn, { SpeechBubble } from "@/components/CoachPawn";
import { useSpeech } from "@/lib/speech";

interface BossIntroModalProps {
  boss: Boss | null;
  onFight: () => void;
  onRetreat: () => void;
}

export default function BossIntroModal({ boss, onFight, onRetreat }: BossIntroModalProps) {
  const [phase, setPhase] = useState<"boss_speaks" | "coach_teaches" | "ready">("boss_speaks");
  const { speak } = useSpeech();

  useEffect(() => {
    if (!boss) return;
    setPhase("boss_speaks");
    const t = setTimeout(() => { speak(boss.voicedIntro); }, 600);
    return () => clearTimeout(t);
  }, [boss, speak]);

  if (!boss) return null;

  const zModal = Z.modal;

  return (
    <div role="dialog" aria-modal="true" aria-label={`Boss encounter: ${boss.name}`}
      style={{ position: "fixed", inset: 0, zIndex: zModal, background: "radial-gradient(ellipse at 50% 30%, rgba(31,42,68,0.96) 0%, rgba(10,10,20,0.98) 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", gap: 24, animation: "bossModalIn 0.5s cubic-bezier(0.22,1,0.36,1) both" }}>
      <div style={{ textAlign: "center", animation: "bossNameIn 0.6s cubic-bezier(0.34,1.56,0.64,1) 200ms both" }}>
        <div style={{ fontSize: "clamp(56px,12vw,100px)" }}>{boss.emoji}</div>
        <div style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontSize: "clamp(28px,5vw,52px)", color: "#fff", lineHeight: 1.1 }}>{boss.name}</div>
        <div style={{ fontSize: "clamp(14px,2vw,20px)", color: "rgba(255,107,90,0.8)", marginTop: 6 }}>{boss.personality}</div>
      </div>
      <div style={{ maxWidth: 480, width: "100%", background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,107,90,0.35)", borderRadius: 20, padding: "20px 24px" }}>
        {phase === "boss_speaks" && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,107,90,0.7)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 10 }}>Boss says:</div>
            <div style={{ fontSize: "clamp(16px,2.2vw,22px)", color: "#fff", lineHeight: 1.6, marginBottom: 16 }}>&ldquo;{boss.dialogue[0]}&rdquo;</div>
            <button type="button" onClick={() => { setPhase("coach_teaches"); speak(boss.signatureLesson); }}
              style={{ padding: "10px 20px", borderRadius: 100, background: "rgba(255,107,90,0.15)", border: "1.5px solid rgba(255,107,90,0.5)", color: "rgba(255,107,90,0.9)", fontFamily: T.fontUI, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              What&apos;s their trick? →
            </button>
          </>
        )}
        {phase === "coach_teaches" && (
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <CoachPawn size={64} expression="talking" mode="kid" />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(124,182,158,0.8)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 8 }}>Coach Pawn explains:</div>
              <div style={{ fontFamily: T.fontUI, fontSize: "clamp(14px,1.8vw,17px)", color: "#fff", lineHeight: 1.6, marginBottom: 16 }}>{boss.signatureLesson}</div>
              <button type="button" onClick={() => setPhase("ready")}
                style={{ padding: "10px 20px", borderRadius: 100, background: "rgba(124,182,158,0.15)", border: "1.5px solid rgba(124,182,158,0.5)", color: "rgba(124,182,158,0.9)", fontFamily: T.fontUI, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Got it — let&apos;s fight! →
              </button>
            </div>
          </div>
        )}
        {phase === "ready" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "clamp(18px,2.5vw,26px)", color: "#fff", marginBottom: 20 }}>
              Use a <strong style={{ color: T.coral }}>{boss.defeatTactic.replace(/_/g, " ")}</strong> to truly defeat {boss.name}!
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button type="button" onClick={onFight} style={{ padding: "14px 28px", borderRadius: 100, background: T.coral, color: "#fff", fontFamily: T.fontUI, fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer" }}>Fight! ⚔️</button>
              <button type="button" onClick={onRetreat} style={{ padding: "14px 24px", borderRadius: 100, background: "transparent", color: "rgba(255,255,255,0.5)", fontFamily: T.fontUI, fontWeight: 600, fontSize: 14, border: "1.5px solid rgba(255,255,255,0.2)", cursor: "pointer" }}>Not yet</button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes bossModalIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bossNameIn { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
