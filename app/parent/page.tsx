"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/stores/gameStore";
import { KINGDOMS, POWERS, getRankByXP, getNextRank } from "@/lib/progression/data";

import { StarField, MoteField } from "@/lib/design/atmosphere";
import { sfx, getSfxEnabled, setSfxEnabled } from "@/lib/audio/sfx";
import { haptics, getHapticsEnabled, setHapticsEnabled } from "@/lib/audio/haptics";
const P = {
  cream: "#FBF6EC",
  creamDeep: "#FFFCF5",
  parchment: "rgba(31,42,68,0.06)",
  ink: "#1F2A44",
  inkSoft: "#1F2A44",
  inkMed: "#5C6580",
  inkLight: "#9BA1B5",
  inkFaint: "#B8BDD0",
  inkGhost: "rgba(31,42,68,0.12)",
  emerald: "#7CB69E",
  emeraldPale: "rgba(124,182,158,0.12)",
  gold: "#FF6B5A",
  goldPale: "rgba(255,107,90,0.10)",
};

const PIN_KEY = "chesswhiz.parentPIN";
const UNLOCK_WINDOW_MS = 1000 * 60 * 15; // 15 min session
const PIN_FAIL_KEY = "chesswhiz.parentPinFails";
const PIN_LOCK_UNTIL_KEY = "chesswhiz.parentPinLockUntil";
const PIN_MAX_FAILS = 5;
const PIN_LOCK_MS = 30_000;

export default function ParentPage() {
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [mode, setMode] = useState<"enter" | "set">("enter");
  const [input, setInput] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lockUntil, setLockUntil] = useState<number>(0);
  const [now, setNow] = useState<number>(() => Date.now());

  // Tick once a second while locked so the countdown updates.
  useEffect(() => {
    if (lockUntil <= 0) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [lockUntil]);

  // Hydrate lock state from sessionStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const until = Number(sessionStorage.getItem(PIN_LOCK_UNTIL_KEY) || "0");
    if (until > Date.now()) setLockUntil(until);
  }, []);

  const locked = lockUntil > now;
  const lockSecondsRemaining = locked ? Math.ceil((lockUntil - now) / 1000) : 0;

  useEffect(() => {
    store.hydrateProgression();
    setHydrated(true);
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(PIN_KEY);
    if (!stored) {
      setMode("set");
    } else {
      // Check if there's a recent unlock
      const unlockedAt = Number(sessionStorage.getItem("chesswhiz.parentUnlockedAt") || "0");
      if (Date.now() - unlockedAt < UNLOCK_WINDOW_MS) {
        setUnlocked(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = () => {
    setError(null);
    if (locked) return;
    if (mode === "set") {
      if (input.length !== 4 || !/^\d{4}$/.test(input)) {
        setError("PIN must be exactly 4 digits");
        return;
      }
      if (input !== confirm) {
        setError("PINs don't match");
        return;
      }
      localStorage.setItem(PIN_KEY, input);
      sessionStorage.setItem("chesswhiz.parentUnlockedAt", String(Date.now()));
      setUnlocked(true);
      return;
    }
    // mode === "enter"
    const stored = localStorage.getItem(PIN_KEY);
    if (input === stored) {
      sessionStorage.setItem("chesswhiz.parentUnlockedAt", String(Date.now()));
      sessionStorage.removeItem(PIN_FAIL_KEY);
      sessionStorage.removeItem(PIN_LOCK_UNTIL_KEY);
      setUnlocked(true);
    } else {
      const fails = Number(sessionStorage.getItem(PIN_FAIL_KEY) || "0") + 1;
      sessionStorage.setItem(PIN_FAIL_KEY, String(fails));
      if (fails >= PIN_MAX_FAILS) {
        const until = Date.now() + PIN_LOCK_MS;
        sessionStorage.setItem(PIN_LOCK_UNTIL_KEY, String(until));
        setLockUntil(until);
        setNow(Date.now());
        setError(`Too many tries. Locked for ${PIN_LOCK_MS / 1000}s.`);
      } else {
        setError(`Incorrect PIN (${PIN_MAX_FAILS - fails} left)`);
      }
      setInput("");
    }
  };

  if (!hydrated) return null;

  return (
    <div style={{
      minHeight: "100dvh", background: "radial-gradient(ellipse at 50% 20%, #FFF8E8 0%, #F5ECDC 45%, #FBF6EC 100%)", color: P.ink,
      fontFamily: "var(--font-jakarta), sans-serif", position: "relative",
    }}>
      <StarField count={70} seed={11} opacity={0.45} />
      <MoteField count={14} seed={12} color={P.gold} />
      {/* Paper grain */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.022'/%3E%3C/svg%3E")`,
      }} />

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        padding: `calc(10px + env(safe-area-inset-top)) 20px 10px 20px`,
        background: "rgba(251,246,236,0.92)",
        backdropFilter: "blur(20px) saturate(1.2)",
        borderBottom: `1px solid ${P.inkGhost}40`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 8,
          color: P.inkMed, textDecoration: "none", fontSize: 13, fontWeight: 700,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Home
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>♟</span>
          <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "var(--font-dm-serif), serif", fontStyle: "italic", color: P.ink }}>
            Parent Dashboard
          </span>
        </div>
        <div style={{ width: 60 }} />
      </header>

      {!unlocked ? (
        <section style={{ maxWidth: 420, margin: "60px auto 0", padding: "0 20px", position: "relative", zIndex: 1 }}>
          <div style={{
            padding: "32px 28px",
            background: "rgba(255,252,245,0.92)",
            border: `1px solid ${P.inkGhost}`,
            borderRadius: 24,
            boxShadow: `0 0 0 4px ${P.parchment}, 0 24px 60px rgba(26,18,16,0.12)`,
          }}>
            <span style={{
              fontFamily: "'Caveat', cursive", fontSize: 18, color: P.gold,
              display: "block", textAlign: "center", marginBottom: 6,
            }}>grown-ups only</span>
            <h2 style={{
              fontSize: 26, fontWeight: 900, textAlign: "center",
              fontFamily: "var(--font-dm-serif), serif", fontStyle: "italic",
              margin: "0 0 8px", letterSpacing: -0.5,
            }}>{mode === "set" ? "Set a PIN" : "Enter PIN"}</h2>
            <p style={{ fontSize: 14, color: P.inkLight, textAlign: "center", margin: "0 0 22px", lineHeight: 1.6 }}>
              {mode === "set"
                ? "Choose a 4-digit PIN so only you can view your child's progress."
                : "Enter your 4-digit PIN to view progress."}
            </p>

            <PinInput value={input} setValue={setInput} label="PIN" disabled={locked} />

            {mode === "set" && (
              <div style={{ marginTop: 12 }}>
                <PinInput value={confirm} setValue={setConfirm} label="Confirm" />
              </div>
            )}

            {error && (
              <div style={{
                marginTop: 12, padding: "8px 12px", borderRadius: 10,
                background: "#FEF2F2", border: "1px solid #FCA5A5",
                color: "#B91C1C", fontSize: 13, fontWeight: 600,
                textAlign: "center",
              }}>{error}</div>
            )}

            {locked && (
              <div style={{
                marginTop: 12, padding: "10px 12px", borderRadius: 10,
                background: "rgba(255,107,107,0.10)",
                border: "1px solid rgba(255,107,107,0.4)",
                color: "#FCA5A5", fontSize: 13, fontWeight: 700,
                textAlign: "center", fontFamily: "var(--font-jakarta), sans-serif",
              }}>
                Locked. Try again in {lockSecondsRemaining}s.
              </div>
            )}

            <button type="button"
              onClick={handleSubmit}
              disabled={locked}
              style={{
                marginTop: 18, width: "100%", padding: "14px", borderRadius: 14,
                background: P.emerald, color: "#FFFCF5", border: "none",
                fontSize: 15, fontWeight: 800, cursor: locked ? "not-allowed" : "pointer",
                boxShadow: "0 6px 22px rgba(124,182,158,0.28)",
                transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                opacity: locked ? 0.55 : 1,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onFocus={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              onBlur={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              {mode === "set" ? "Set PIN & Continue" : "Unlock"}
            </button>

            {mode === "enter" && (
              <button type="button"
                onClick={() => {
                  const ok = typeof window !== "undefined" && window.confirm(
                    "Reset PIN?\n\nThis will clear the parent PIN. " +
                    "You'll be asked to set a new one. Your child's progress " +
                    "(rank, XP, kingdoms, powers, knight card) is NOT affected."
                  );
                  if (!ok) return;
                  localStorage.removeItem(PIN_KEY);
                  sessionStorage.removeItem("chesswhiz.parentUnlockedAt");
                  setMode("set");
                  setInput("");
                  setConfirm("");
                  setError(null);
                }}
                style={{
                  marginTop: 14, width: "100%", padding: "8px",
                  background: "transparent", border: "none",
                  fontSize: 12, color: P.inkLight, cursor: "pointer",
                  fontFamily: "var(--font-jakarta), sans-serif",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Forgot PIN? Reset it
              </button>
            )}
          </div>
        </section>
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

function PinInput({
  value, setValue, label, disabled,
}: { value: string; setValue: (v: string) => void; label: string; disabled?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label style={{
        display: "block", fontSize: 11, fontWeight: 800, color: P.inkMed,
        letterSpacing: 1, textTransform: "uppercase", marginBottom: 6,
      }}>{label}</label>
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
        style={{
          width: "100%", height: 52, padding: "0 18px", borderRadius: 12,
          border: `1.5px solid ${P.inkGhost}`,
          background: P.creamDeep,
          fontSize: 20, fontWeight: 800, letterSpacing: 8,
          color: P.ink, textAlign: "center",
          outline: "none", boxSizing: "border-box",
          fontFamily: "var(--font-jakarta), sans-serif",
        }}
        onFocus={(e) => (e.target.style.borderColor = P.emerald)}
        onBlur={(e) => (e.target.style.borderColor = P.inkGhost)}
      />
    </div>
  );
}

function Dashboard() {
  const store = useGameStore();
  const prog = store.progression;
  const rank = getRankByXP(prog.xp);
  const next = getNextRank(rank.id);
  const floor = rank.xpRequired;
  const ceil = next ? next.xpRequired : rank.xpRequired + 1;
  const pct = next ? Math.min(100, ((prog.xp - floor) / (ceil - floor)) * 100) : 100;

  const masteredCount = prog.masteredStrategies.length;
  const totalStrategies = KINGDOMS.reduce((n, k) => n + k.strategies.length, 0);

  // Recent Aha! moments — proxy via earned powers (most recent first)
  const recent = [...prog.earnedPowers].reverse().slice(0, 5)
    .map((id) => POWERS.find((p) => p.id === id))
    .filter(Boolean);

  // Coach's recommended focus — first kingdom with unmastered strategies
  const focusKingdom = KINGDOMS.find((k) =>
    k.strategies.some((s) => !prog.masteredStrategies.includes(s.id))
  );
  const focusStrategy = focusKingdom?.strategies.find((s) => !prog.masteredStrategies.includes(s.id));

  return (
    <section style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 80px", position: "relative", zIndex: 1 }}>
      <span style={{
        fontFamily: "'Caveat', cursive", fontSize: 19, color: P.gold,
        display: "block", textAlign: "center", marginBottom: 4,
      }}>at a glance</span>
      <h1 style={{
        margin: "0 0 24px", fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 900,
        fontFamily: "var(--font-dm-serif), serif", fontStyle: "italic", color: P.ink, letterSpacing: -0.8,
        textAlign: "center",
      }}>{store.playerName ? `${store.playerName}'s Progress` : "Chess Progress"}</h1>

      {/* Rank + XP */}
      <div style={{
        padding: "20px 22px", background: "rgba(255,252,245,0.92)",
        border: `1px solid ${P.inkGhost}`, borderRadius: 18,
        boxShadow: `0 0 0 4px ${P.parchment}, 0 10px 30px rgba(26,18,16,0.06)`,
        display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: P.parchment, color: rank.color,
          fontSize: 34, display: "flex", alignItems: "center", justifyContent: "center",
          border: `2px solid ${rank.color}`, flexShrink: 0,
        }}>{rank.icon}</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: P.inkLight, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Current Rank
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: P.ink, fontFamily: "var(--font-dm-serif), serif", fontStyle: "italic" }}>
            {rank.name}
          </div>
          <div style={{ fontSize: 13, color: P.inkLight, marginTop: 2 }}>
            {prog.xp} XP {next ? `· ${ceil - prog.xp} to ${next.name}` : "· max rank"}
          </div>
          <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: P.parchment, overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`, height: "100%",
              background: `linear-gradient(90deg, ${rank.color}, ${next?.color ?? rank.color})`,
            }} />
          </div>
        </div>
      </div>

      {/* Key metrics */}
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
        <Metric label="Strategies Mastered" value={`${masteredCount}/${totalStrategies}`} color={P.emerald} />
        <Metric label="Bosses Defeated" value={String(prog.defeatedBosses.length)} color={P.gold} />
        <Metric label="Powers Earned" value={`${prog.earnedPowers.length}/${POWERS.length}`} color={P.emerald} />
        <Metric label="Current Streak" value={`${prog.streak} ${prog.streak === 1 ? "day" : "days"}`} color={P.gold} />
      </div>

      {/* Skill tree */}
      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 11, color: P.inkLight, letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 800, margin: "0 0 10px" }}>
          Strategies by Kingdom
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {KINGDOMS.map((k) => {
            const inside = k.strategies;
            const done = inside.filter((s) => prog.masteredStrategies.includes(s.id));
            return (
              <div key={k.id} style={{
                padding: "14px 16px", borderRadius: 14,
                background: "rgba(255,252,245,0.92)", border: `1px solid ${P.inkGhost}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: P.ink, fontFamily: "var(--font-dm-serif), serif", fontStyle: "italic" }}>
                    {k.name}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: P.inkLight }}>
                    {done.length}/{inside.length}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {inside.map((s) => {
                    const m = prog.masteredStrategies.includes(s.id);
                    return (
                      <div key={s.id} title={s.name} style={{
                        flex: 1, height: 8, borderRadius: 4,
                        background: m ? P.emerald : P.parchment,
                      }} />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Aha moments */}
      {recent.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 11, color: P.inkLight, letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 800, margin: "0 0 10px" }}>
            Recent Aha! Moments
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recent.map((power) => power && (
              <div key={power.id} style={{
                padding: "12px 14px", borderRadius: 12,
                background: P.goldPale, border: `1px solid ${P.gold}44`,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 22 }}>{power.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: P.ink, fontFamily: "var(--font-dm-serif), serif", fontStyle: "italic" }}>
                    {power.name}
                  </div>
                  <div style={{ fontSize: 12, color: P.inkLight }}>{power.howToEarn}</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 800, color: P.gold, letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}>{power.rarity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coach's recommendation */}
      {focusStrategy && focusKingdom && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 11, color: P.inkLight, letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 800, margin: "0 0 10px" }}>
            Coach Pawn&apos;s Recommendation
          </h2>
          <div style={{
            padding: "18px 22px", borderRadius: 18,
            background: `linear-gradient(135deg, ${P.emeraldPale} 0%, ${P.goldPale} 100%)`,
            border: `1px solid ${P.emerald}44`,
            display: "flex", gap: 14, alignItems: "flex-start",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,252,245,0.92)", border: `2px solid ${P.emerald}66`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>♟</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: P.emerald, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                Focus Area
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: P.ink, fontFamily: "var(--font-dm-serif), serif", fontStyle: "italic" }}>
                {focusStrategy.name}
              </div>
              <p style={{ fontSize: 13, color: P.inkSoft, margin: "4px 0 0", lineHeight: 1.6, fontStyle: "italic" }}>
                &ldquo;{focusStrategy.coachExplanation}&rdquo;
              </p>
              <div style={{ fontSize: 11, color: P.inkLight, marginTop: 8, fontWeight: 600 }}>
                From: {focusKingdom.name}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voice usage meter — ElevenLabs cost sanity check.
          Creator plan ships 100,000 chars/month; we show the daily burn
          and the projected monthly so a parent (or the dev) can spot
          runaway usage early. */}
      <VoiceUsageCard />

      {/* Subscription tier — gated by parent PIN, so it's safe to show here.
          Stripe wires up here once we ship payments; for now this is a
          dev-only manual toggle for testing. */}
      <div style={{
        marginTop: 24, padding: "20px 22px",
        background: "rgba(255,252,245,0.92)", border: `1px solid ${P.inkGhost}`,
        borderRadius: 18,
        boxShadow: `0 4px 14px rgba(26,18,16,0.05)`,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 800, color: P.inkLight,
          letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 10,
        }}>Subscription</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 17, fontWeight: 900, color: P.ink,
              fontFamily: "var(--font-dm-serif), serif", fontStyle: "italic", letterSpacing: -0.3,
            }}>{prog.tier === "champion" ? "Champion" : "Free"}</div>
            <div style={{ fontSize: 12, color: P.inkLight, marginTop: 2 }}>
              {prog.tier === "champion"
                ? "All 7 kingdoms, all powers, knight card unlocked."
                : "Pawn Village only. Upgrade to unlock the rest."}
            </div>
          </div>
          <button type="button"
            onClick={() => store.setTier(prog.tier === "champion" ? "free" : "champion")}
            style={{
              background: prog.tier === "champion" ? P.creamDeep : P.emerald,
              color: prog.tier === "champion" ? P.inkSoft : "#FFFCF5",
              border: `1.5px solid ${prog.tier === "champion" ? P.inkGhost : P.emerald}`,
              borderRadius: 12, padding: "10px 18px",
              fontSize: 13, fontWeight: 800, cursor: "pointer",
              fontFamily: "var(--font-jakarta), sans-serif",
              boxShadow: prog.tier === "champion"
                ? `0 2px 8px rgba(26,18,16,0.06)`
                : `0 6px 20px rgba(124,182,158,0.22)`,
              letterSpacing: 0.3,
            }}
          >
            {prog.tier === "champion" ? "Switch to Free" : "Activate Champion"}
          </button>
        </div>
        <div style={{
          marginTop: 10, fontSize: 11, color: P.inkFaint,
          fontFamily: "var(--font-jakarta), sans-serif",
        }}>
          Local toggle for testing. Stripe Checkout will replace this in v2.
        </div>
      </div>

      <ChallengeLevelCard />

      <SoundAndFeelCard />
    </section>
  );
}

function ChallengeLevelCard() {
  const store = useGameStore();
  const bias = store.progression.challengeBias ?? "balanced";

  const options: Array<{ value: "relaxed" | "balanced" | "sharp"; label: string; hint: string }> = [
    { value: "relaxed", label: "Relaxed", hint: "Bot stays a bit easier" },
    { value: "balanced", label: "Balanced", hint: "Bot adjusts automatically" },
    { value: "sharp", label: "Sharp", hint: "Bot stays a bit harder" },
  ];

  return (
    <div style={{
      marginTop: 24, padding: "20px 22px",
      background: "rgba(255,252,245,0.92)", border: `1px solid ${P.inkGhost}`,
      borderRadius: 18,
      boxShadow: `0 4px 14px rgba(26,18,16,0.05)`,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: P.inkLight,
        letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 6,
      }}>Challenge Level</div>
      <div style={{ fontSize: 13, color: P.inkLight, marginBottom: 14, lineHeight: 1.5 }}>
        Nudge the bot difficulty up or down. The app still adapts to your child&apos;s win/loss history — this just shifts the baseline.
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {options.map((opt) => {
          const active = bias === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => store.setChallengeLevel(opt.value)}
              style={{
                flex: 1,
                padding: "12px 8px",
                borderRadius: 14,
                border: `1.5px solid ${active ? P.emerald : P.inkGhost}`,
                background: active ? P.emeraldPale : "transparent",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s ease",
                boxShadow: active ? `0 0 0 3px ${P.emerald}22` : "none",
              }}
            >
              <div style={{
                fontSize: 14, fontWeight: 800,
                color: active ? P.emerald : P.inkMed,
                fontFamily: "var(--font-dm-serif), serif", fontStyle: "italic",
              }}>{opt.label}</div>
              <div style={{
                fontSize: 11, color: active ? P.emerald : P.inkLight,
                marginTop: 3, lineHeight: 1.4,
                fontFamily: "var(--font-jakarta), sans-serif",
              }}>{opt.hint}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SoundAndFeelCard() {
  const [sfxOn, setSfxOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);
  // Hydrate from localStorage on mount
  useEffect(() => {
    setSfxOn(getSfxEnabled());
    setHapticsOn(getHapticsEnabled());
  }, []);

  const toggleSfx = () => {
    const next = !sfxOn;
    setSfxEnabled(next);
    setSfxOn(next);
    if (next) {
      sfx.click();
      // Voice preview cue — let parents hear the kid-facing voice when
      // they flip audio on, so they know what's coming. Kept short (~1s).
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance("Hi there! I'm Coach Pawn.");
          u.rate = 1.05;
          u.pitch = 1.15;
          u.volume = 0.9;
          window.speechSynthesis.speak(u);
        } catch {}
      }
    }
  };
  const toggleHaptics = () => {
    const next = !hapticsOn;
    setHapticsEnabled(next);
    setHapticsOn(next);
    if (next) haptics.tap();
  };

  return (
    <div style={{
      marginTop: 24, padding: "20px 22px",
      background: "rgba(255,252,245,0.92)", border: `1px solid ${P.inkGhost}`,
      borderRadius: 18,
      boxShadow: `0 4px 14px rgba(0,0,0,0.32)`,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: P.inkLight,
        letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 14,
      }}>Sound &amp; feel</div>

      <ToggleRow
        label="Sound effects"
        hint="Move clicks, captures, coach chimes, win/lose cues."
        on={sfxOn}
        onChange={toggleSfx}
      />
      <div style={{ height: 12 }} />
      <ToggleRow
        label="Haptic feedback"
        hint="Vibration on moves, captures, and Aha! moments. (Android Chrome only.)"
        on={hapticsOn}
        onChange={toggleHaptics}
      />
    </div>
  );
}

function ToggleRow({
  label, hint, on, onChange,
}: { label: string; hint: string; on: boolean; onChange: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: "var(--font-jakarta), sans-serif",
          fontSize: 14, fontWeight: 700, color: P.ink,
        }}>{label}</div>
        <div style={{
          fontFamily: "var(--font-jakarta), sans-serif",
          fontSize: 12, color: P.inkLight, marginTop: 2,
        }}>{hint}</div>
      </div>
      <button type="button"
        role="switch"
        aria-checked={on}
        aria-label={`${label}: ${on ? "on" : "off"}`}
        onClick={onChange}
        style={{
          width: 52, height: 30,
          borderRadius: 15,
          background: on ? P.emerald : P.parchment,
          border: `1px solid ${on ? P.emerald : P.inkGhost}`,
          position: "relative",
          cursor: "pointer",
          transition: "background 200ms ease, border-color 200ms ease",
          flexShrink: 0,
          padding: 0,
        }}
      >
        <span aria-hidden style={{
          position: "absolute",
          top: 3,
          left: on ? 24 : 3,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: P.creamDeep,
          boxShadow: "0 2px 6px rgba(31,42,68,0.18)",
          transition: "left 200ms cubic-bezier(0.34,1.56,0.64,1)",
        }} />
      </button>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 14,
      background: "rgba(255,252,245,0.92)", border: `1px solid ${P.inkGhost}`,
      textAlign: "center",
    }}>
      <div style={{
        fontSize: 24, fontWeight: 900, color,
        fontFamily: "var(--font-dm-serif), serif", fontStyle: "italic",
      }}>{value}</div>
      <div style={{
        fontSize: 10, fontWeight: 800, color: P.inkLight,
        letterSpacing: 1.2, textTransform: "uppercase", marginTop: 3,
      }}>{label}</div>
    </div>
  );
}

function VoiceUsageCard() {
  const usage = useGameStore((s) => s.voiceUsage);

  // Creator plan: 100,000 chars/month included. Override via prop later
  // if/when the user is on Pro/Scale.
  const MONTHLY_QUOTA = 100_000;
  const monthPct = Math.min(100, Math.round((usage.charsMonth / MONTHLY_QUOTA) * 100));

  // Project month-end usage by day-of-month rate (1-31).
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const projected = dayOfMonth > 0
    ? Math.round((usage.charsMonth / dayOfMonth) * daysInMonth)
    : 0;
  const projectedPct = Math.min(100, Math.round((projected / MONTHLY_QUOTA) * 100));
  const overProjected = projected > MONTHLY_QUOTA;

  // ElevenLabs Turbo v2.5 list price ~$0.15 per 1k chars (Creator overage).
  const overageChars = Math.max(0, usage.charsMonth - MONTHLY_QUOTA);
  const overageDollars = (overageChars / 1000) * 0.15;

  const barColor = monthPct > 90 ? "#DC2626" : monthPct > 70 ? P.gold : P.emerald;

  return (
    <div style={{
      marginTop: 24, padding: "20px 22px",
      background: "rgba(255,252,245,0.92)", border: `1px solid ${P.inkGhost}`,
      borderRadius: 18,
      boxShadow: `0 4px 14px rgba(26,18,16,0.05)`,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{
          fontSize: 11, fontWeight: 800, color: P.inkLight,
          letterSpacing: 1.6, textTransform: "uppercase",
        }}>Coach Pawn voice · this month</span>
        <span style={{ fontSize: 11, color: P.inkFaint, fontWeight: 600 }}>
          {usage.monthKey || "—"}
        </span>
      </div>

      {/* Monthly bar */}
      <div style={{
        height: 8, borderRadius: 4,
        background: P.parchment, overflow: "hidden", marginBottom: 8,
      }}>
        <div style={{
          width: `${monthPct}%`, height: "100%",
          background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
          transition: "width 0.6s ease-out",
        }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 12, color: P.inkLight, marginBottom: 16,
      }}>
        <span>
          <strong style={{ color: P.ink }}>{usage.charsMonth.toLocaleString()}</strong> / {MONTHLY_QUOTA.toLocaleString()} chars
        </span>
        <span>{monthPct}% of plan</span>
      </div>

      {/* Today's stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14,
      }}>
        <Metric label="Today" value={usage.charsToday.toLocaleString()} color={P.ink} />
        <Metric label="Calls today" value={String(usage.callsToday)} color={P.emerald} />
        <Metric label="Fallbacks" value={String(usage.fallbacksToday)} color={usage.fallbacksToday > 0 ? P.gold : P.inkLight} />
      </div>

      {/* Projection */}
      <div style={{
        padding: "12px 14px", borderRadius: 12,
        background: overProjected ? "#FEF2F2" : P.creamDeep,
        border: `1px solid ${overProjected ? "#FCA5A5" : P.inkGhost}`,
        fontSize: 12, lineHeight: 1.6, color: P.inkSoft,
      }}>
        At today's rate, projected month-end:{" "}
        <strong style={{ color: overProjected ? "#DC2626" : P.ink }}>
          {projected.toLocaleString()} chars ({projectedPct}%)
        </strong>
        {overProjected && (
          <>
            <br />
            Estimated overage cost:{" "}
            <strong style={{ color: "#DC2626" }}>+${overageDollars.toFixed(2)}</strong>
            {" "}— or upgrade the ElevenLabs plan.
          </>
        )}
        {usage.fallbacksToday > 0 && (
          <>
            <br />
            <span style={{ color: P.inkLight, fontStyle: "italic" }}>
              {usage.fallbacksToday} fallback{usage.fallbacksToday === 1 ? "" : "s"} to browser voice today (free, but check the API key).
            </span>
          </>
        )}
      </div>
    </div>
  );
}

