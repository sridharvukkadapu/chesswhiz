"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/stores/gameStore";
import { modelToDisplayItems, getMemoryStats, type MemoryDisplayItem } from "@/lib/coaching/memory-display";
import CoachPawn, { SpeechBubble } from "@/components/CoachPawn";
import { T } from "@/lib/design/tokens";

const TYPE_COLORS: Record<MemoryDisplayItem["type"], string> = {
  mastered: T.sage,
  learning: "#7FBFE8",
  struggling: T.coral,
  error: "rgba(255,107,90,0.75)",
};

const TYPE_LABELS: Record<MemoryDisplayItem["type"], string> = {
  mastered: "✓ Mastered",
  learning: "→ Learning",
  struggling: "⚠ Needs work",
  error: "Pattern noticed",
};

export default function MemoryPage() {
  const learnerModel = useGameStore((s) => s.learnerModel);
  const playerName = useGameStore((s) => s.playerName);
  const forgetConcept = useGameStore((s) => s.forgetConcept);
  const forgetErrorPattern = useGameStore((s) => s.forgetErrorPattern);
  const [forgetting, setForgetting] = useState<string | null>(null);
  const [justForgotten, setJustForgotten] = useState<string[]>([]);
  const forgetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (forgetTimerRef.current) clearTimeout(forgetTimerRef.current); }, []);

  const items = modelToDisplayItems(learnerModel).filter((item) => !justForgotten.includes(item.id));
  const stats = getMemoryStats(learnerModel);

  const name = playerName || "friend";

  function handleForget(item: MemoryDisplayItem) {
    setForgetting(item.id);
    forgetTimerRef.current = setTimeout(() => {
      if (item.conceptId) forgetConcept(item.conceptId);
      if (item.errorPatternId) forgetErrorPattern(item.errorPatternId);
      setJustForgotten((prev) => [...prev, item.id]);
      setForgetting(null);
    }, 400);
  }

  const coachMessage = items.length === 0
    ? `I don't remember anything special about you yet, ${name} — let's play and I'll learn!`
    : `Here's what I remember about you, ${name}. Tap "forget this" to remove anything you'd like.`;

  return (
    <div style={{ minHeight: "100dvh", background: T.bgRadial, fontFamily: T.fontUI, padding: "0 0 60px" }}>
      <div style={{ padding: "24px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <Link href="/play" style={{ color: T.inkLow, textDecoration: "none", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em" }}>
          ← BACK
        </Link>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 28 }}>
          <CoachPawn size={80} expression="talking" mode="kid" />
          <SpeechBubble text={coachMessage} width={320} tail="left" />
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Games played", value: stats.gamesPlayed },
            { label: "Tactics spotted", value: stats.tacticsSpotted },
            { label: "Concepts mastered", value: stats.masteredCount },
          ].map((stat) => (
            <div key={stat.label} style={{ flex: 1, background: "#FFFCF5", border: `1.5px solid ${T.border}`, borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
              <div style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontSize: 28, color: T.ink, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: T.inkLow, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: T.inkLow, fontStyle: "italic" }}>
              Nothing to show yet — play some games first!
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#FFFCF5",
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  opacity: forgetting === item.id ? 0.3 : 1,
                  transition: "opacity 400ms",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLORS[item.type], textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>
                    {TYPE_LABELS[item.type]}
                  </div>
                  <div style={{ fontSize: 15, color: T.ink, lineHeight: 1.4 }}>
                    Coach Pawn {item.text}.
                  </div>
                </div>
                {item.canForget && (
                  <button
                    type="button"
                    onClick={() => handleForget(item)}
                    disabled={forgetting !== null}
                    style={{
                      padding: "7px 13px",
                      borderRadius: 20,
                      border: `1.5px solid ${T.border}`,
                      background: "transparent",
                      color: T.inkLow,
                      fontFamily: T.fontUI,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    forget this
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
