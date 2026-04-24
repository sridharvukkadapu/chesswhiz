"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Power, TacticDetection } from "@/lib/progression/types";

const P = {
  cream: "#FBF7F0",
  parchment: "#F0E8D8",
  ink: "#1A1210",
  inkSoft: "#2E2620",
  inkLight: "#8A8278",
  inkGhost: "#D0C8BC",
  emerald: "#1B7340",
  emeraldBright: "#22C55E",
  gold: "#C7940A",
  goldLight: "#F0D060",
};

interface AhaCelebrationProps {
  celebration: { tactic: TacticDetection; power: Power } | null;
  onDismiss: () => void;
  playerName: string;
}

const CONFETTI_COLORS = [
  P.gold, P.goldLight, P.emerald, P.emeraldBright, "#E8B04B", "#F97316", "#DC2626", "#3B82F6",
];

function makeConfetti(count = 28) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 12,
    dx: (Math.random() - 0.5) * 180,
    dy: 60 + Math.random() * 160,
    rotate: Math.random() * 720 - 360,
    size: 6 + Math.random() * 10,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    shape: Math.random() > 0.5 ? "square" : "circle",
    delay: Math.random() * 0.25,
  }));
}

// Play a short ascending chime using Web Audio (no asset required)
function playChime() {
  if (typeof window === "undefined") return;
  try {
    const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctx = W.AudioContext ?? W.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 — major triad
    const now = ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.start(t);
      osc.stop(t + 0.5);
    });
    // Cleanup after the sound finishes.
    setTimeout(() => ctx.close().catch(() => {}), 1000);
  } catch {}
}

const RARITY_COLORS: Record<string, string> = {
  common: "#64748B",
  rare: "#3B82F6",
  epic: "#9333EA",
  legendary: "#C7940A",
};

function tacticLabel(type: TacticDetection["type"]): string {
  return ({
    fork: "FORK",
    pin: "PIN",
    skewer: "SKEWER",
    discovered_attack: "DISCOVERED ATTACK",
    double_check: "DOUBLE CHECK",
    back_rank_mate: "BACK RANK MATE",
    sacrifice: "SACRIFICE",
    deflection: "DEFLECTION",
    overloading: "OVERLOAD",
    zwischenzug: "ZWISCHENZUG",
  } as Record<string, string>)[type] ?? "TACTIC";
}

export default function AhaCelebration({ celebration, onDismiss, playerName }: AhaCelebrationProps) {
  const confetti = useMemo(() => makeConfetti(32), [celebration?.tactic.type]);
  const dismissed = useRef(false);

  useEffect(() => {
    if (!celebration) {
      dismissed.current = false;
      return;
    }
    playChime();
    const t = setTimeout(() => {
      if (!dismissed.current) {
        dismissed.current = true;
        onDismiss();
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [celebration, onDismiss]);

  const handleTap = () => {
    if (dismissed.current) return;
    dismissed.current = true;
    onDismiss();
  };

  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          key="aha-backdrop"
          role="dialog"
          aria-live="assertive"
          aria-label={`Tactic detected: ${celebration.power.name}`}
          onClick={handleTap}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "radial-gradient(ellipse at center, rgba(26,18,16,0.72) 0%, rgba(26,18,16,0.92) 80%)",
            backdropFilter: "blur(6px)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "24px", cursor: "pointer",
            fontFamily: "var(--font-nunito), sans-serif",
          }}
        >
          {/* Phase 1: "TACTIC DETECTED" banner */}
          <motion.div
            initial={{ opacity: 0, letterSpacing: "0.2em" }}
            animate={{ opacity: 1, letterSpacing: "0.45em" }}
            transition={{ duration: 0.45, delay: 0 }}
            style={{
              fontSize: "clamp(12px, 1.8vw, 15px)",
              fontWeight: 900,
              color: P.goldLight,
              textShadow: `0 0 24px ${P.gold}, 0 0 2px ${P.gold}`,
              marginBottom: 8,
              fontFamily: "var(--font-playfair), serif",
            }}
          >
            ⚡ TACTIC DETECTED ⚡
          </motion.div>

          {/* Phase 2: tactic name + icon + details */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.4 }}
            style={{
              fontSize: 88, lineHeight: 1,
              textShadow: `0 0 40px ${celebration.power.rarity === "legendary" ? P.gold : P.emerald}80`,
              marginBottom: 12,
            }}
          >
            {celebration.power.icon}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            style={{
              fontSize: "clamp(34px, 6vw, 64px)",
              fontWeight: 900,
              color: "white",
              textAlign: "center",
              margin: 0,
              fontFamily: "var(--font-playfair), serif",
              letterSpacing: -1,
              textShadow: `0 0 40px ${P.gold}, 0 4px 20px rgba(0,0,0,0.6)`,
            }}
          >
            {tacticLabel(celebration.tactic.type)}!
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            style={{
              fontSize: "clamp(14px, 2vw, 17px)",
              color: P.cream,
              textAlign: "center",
              margin: "12px 0 0",
              maxWidth: 520,
              lineHeight: 1.6,
              opacity: 0.9,
            }}
          >
            {celebration.tactic.details}
          </motion.p>

          {/* Phase 3: confetti burst + coach bubble */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
            {confetti.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, top: "50%", left: `${c.x}%`, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  top: ["50%", `calc(50% + ${c.dy}px)`],
                  left: [`${c.x}%`, `calc(${c.x}% + ${c.dx}px)`],
                  rotate: c.rotate,
                }}
                transition={{ duration: 2.0, delay: 1.5 + c.delay, ease: "easeOut" }}
                style={{
                  position: "absolute",
                  width: c.size, height: c.size,
                  borderRadius: c.shape === "circle" ? "50%" : 2,
                  background: c.color,
                  boxShadow: `0 0 8px ${c.color}`,
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22, delay: 1.9 }}
            style={{
              marginTop: 32, padding: "16px 22px", borderRadius: 18,
              background: "white", maxWidth: 480,
              boxShadow: `0 24px 60px rgba(0,0,0,0.4), 0 0 0 1px ${P.inkGhost}`,
              display: "flex", alignItems: "flex-start", gap: 12,
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "#E6F4EC",
              border: `2px solid ${P.emerald}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>♟</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: P.ink, fontFamily: "var(--font-playfair), serif", marginBottom: 4 }}>
                Coach Pawn
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: P.inkSoft }}>
                {celebration.power.coachCelebration}{" "}
                <span style={{ color: P.emerald, fontWeight: 700 }}>{playerName}, you nailed it!</span>
              </p>
            </div>
          </motion.div>

          {/* Phase 4: XP + power badges */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 3.4 }}
            style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 14,
              background: P.gold, color: "white",
              fontWeight: 800, fontSize: 15,
              boxShadow: `0 8px 24px ${P.gold}66`,
            }}>
              <span style={{ fontSize: 18 }}>✦</span>
              +20 XP
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 14,
              background: RARITY_COLORS[celebration.power.rarity] ?? P.emerald,
              color: "white",
              fontWeight: 800, fontSize: 15,
              boxShadow: `0 8px 24px ${(RARITY_COLORS[celebration.power.rarity] ?? P.emerald)}66`,
            }}>
              <span style={{ fontSize: 18 }}>{celebration.power.icon}</span>
              {celebration.power.name} Unlocked!
            </div>
          </motion.div>

          {/* Dismiss hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ duration: 0.4, delay: 4.0 }}
            style={{ position: "absolute", bottom: 24, left: 0, right: 0, textAlign: "center", color: P.cream, fontSize: 12, fontWeight: 600, letterSpacing: 1 }}
          >
            tap anywhere to continue
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
