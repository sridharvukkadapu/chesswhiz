"use client";

import { useEffect, useRef, useState } from "react";
import type { LearnerModel } from "@/lib/learner/types";
import { modelToDisplayItems, getMemoryStats } from "@/lib/coaching/memory-display";
import { T, Z } from "@/lib/design/tokens";
import CoachPawn from "@/components/CoachPawn";
import { useSpeech } from "@/lib/speech";

interface ShowParentCardProps {
  open: boolean;
  onClose: () => void;
  playerName: string;
  learnerModel: LearnerModel;
  gameResult: "win" | "loss" | "draw";
}

export default function ShowParentCard({ open, onClose, playerName, learnerModel, gameResult }: ShowParentCardProps) {
  const [voiced, setVoiced] = useState(false);
  const { speak } = useSpeech();
  const speakRef = useRef(speak);
  useEffect(() => { speakRef.current = speak; }, [speak]);

  const stats = getMemoryStats(learnerModel);
  const items = modelToDisplayItems(learnerModel);
  const masteredCount = items.filter((i) => i.type === "mastered").length;
  const latestMastered = items.filter((i) => i.type === "mastered").slice(-1)[0];

  const resultText = gameResult === "win" ? "won" : gameResult === "loss" ? "played well and lost" : "drew";
  const masteryText = latestMastered
    ? `They recently mastered the ${latestMastered.text.replace("knows about the ", "").replace(" (", " — ").replace(")", "")}.`
    : `They've played ${stats.gamesPlayed} game${stats.gamesPlayed === 1 ? "" : "s"} so far.`;

  const voiceScript = `Hi! I'm Coach Pawn. Today, ${playerName} ${resultText} their game. They've spotted ${stats.tacticsSpotted} tactic${stats.tacticsSpotted === 1 ? "" : "s"} so far. ${masteryText} They'd love it if you watched their next game!`;

  useEffect(() => {
    if (open && !voiced) {
      speakRef.current(voiceScript);
      setVoiced(true);
    }
    if (!open) setVoiced(false);
  }, [open, voiced, voiceScript]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: Z.modal, background: "rgba(10,10,20,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 20px", animation: "parentCardIn 0.4s ease-out both" }}>
      <div style={{ maxWidth: 400, width: "100%", background: "#FFFCF5", borderRadius: 24, padding: "32px 28px", boxShadow: "0 24px 80px rgba(10,10,20,0.4)", border: `1.5px solid ${T.border}`, textAlign: "center" }}>
        <CoachPawn size={72} expression="cheer" mode="kid" />
        <div style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontSize: 28, color: T.ink, marginTop: 12, marginBottom: 4 }}>Hi, grown-up! 👋</div>
        <div style={{ fontFamily: T.fontUI, fontSize: 17, color: T.inkLow, marginBottom: 24 }}>I&apos;m Coach Pawn — here&apos;s today&apos;s update:</div>

        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Games played", value: stats.gamesPlayed },
            { label: "Tactics spotted", value: stats.tacticsSpotted },
            { label: "Concepts mastered", value: masteredCount },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, background: "rgba(31,42,68,0.04)", borderRadius: 12, padding: "10px 6px" }}>
              <div style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontSize: 24, color: T.ink }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.inkLow, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: T.fontUI, fontSize: 15, color: T.ink, lineHeight: 1.6, marginBottom: 20 }}>
          Today, <strong>{playerName}</strong> {resultText} their game. {masteryText} They&apos;d love it if you watched their next game!
        </div>

        <button onClick={onClose} style={{ width: "100%", padding: "14px", borderRadius: 100, background: T.coral, color: "#fff", fontFamily: T.fontUI, fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer" }}>
          Thanks, Coach Pawn!
        </button>
      </div>
      <style>{`@keyframes parentCardIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}
