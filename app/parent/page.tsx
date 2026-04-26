"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGameStore } from "@/stores/gameStore";
import { KINGDOMS, POWERS, getRankByXP, getNextRank } from "@/lib/progression/data";

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
  emeraldPale: "#E6F4EC",
  gold: "#C7940A",
  goldPale: "#FDF6E3",
};

const PIN_KEY = "chesswhiz.parentPIN";
const UNLOCK_WINDOW_MS = 1000 * 60 * 15; // 15 min session

export default function ParentPage() {
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [mode, setMode] = useState<"enter" | "set">("enter");
  const [input, setInput] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      setUnlocked(true);
    } else {
      setError("Incorrect PIN");
      setInput("");
    }
  };

  if (!hydrated) return null;

  return (
    <div style={{
      minHeight: "100dvh", background: P.cream, color: P.ink,
      fontFamily: "var(--font-nunito), sans-serif", position: "relative",
    }}>
      {/* Paper grain */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.022'/%3E%3C/svg%3E")`,
      }} />

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        padding: "10px 20px",
        background: "rgba(251,247,240,0.88)",
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
          <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "var(--font-playfair), serif", color: P.ink }}>
            Parent Dashboard
          </span>
        </div>
        <div style={{ width: 60 }} />
      </header>

      {!unlocked ? (
        <section style={{ maxWidth: 420, margin: "60px auto 0", padding: "0 20px", position: "relative", zIndex: 1 }}>
          <div style={{
            padding: "32px 28px",
            background: "white",
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
              fontFamily: "var(--font-playfair), serif",
              margin: "0 0 8px", letterSpacing: -0.5,
            }}>{mode === "set" ? "Set a PIN" : "Enter PIN"}</h2>
            <p style={{ fontSize: 14, color: P.inkLight, textAlign: "center", margin: "0 0 22px", lineHeight: 1.6 }}>
              {mode === "set"
                ? "Choose a 4-digit PIN so only you can view your child's progress."
                : "Enter your 4-digit PIN to view progress."}
            </p>

            <PinInput value={input} setValue={setInput} label="PIN" />

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

            <button
              onClick={handleSubmit}
              style={{
                marginTop: 18, width: "100%", padding: "14px", borderRadius: 14,
                background: P.emerald, color: "white", border: "none",
                fontSize: 15, fontWeight: 800, cursor: "pointer",
                boxShadow: "0 6px 22px rgba(27,115,64,0.28)",
                transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              {mode === "set" ? "Set PIN & Continue" : "Unlock"}
            </button>
          </div>
        </section>
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

function PinInput({
  value, setValue, label,
}: { value: string; setValue: (v: string) => void; label: string }) {
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
        onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
        style={{
          width: "100%", height: 52, padding: "0 18px", borderRadius: 12,
          border: `1.5px solid ${P.inkGhost}`,
          background: P.creamDeep,
          fontSize: 20, fontWeight: 800, letterSpacing: 8,
          color: P.ink, textAlign: "center",
          outline: "none", boxSizing: "border-box",
          fontFamily: "var(--font-nunito), sans-serif",
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
        fontFamily: "var(--font-playfair), serif", color: P.ink, letterSpacing: -0.8,
        textAlign: "center",
      }}>{store.playerName ? `${store.playerName}'s Progress` : "Chess Progress"}</h1>

      {/* Rank + XP */}
      <div style={{
        padding: "20px 22px", background: "white",
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
          <div style={{ fontSize: 22, fontWeight: 900, color: P.ink, fontFamily: "var(--font-playfair), serif" }}>
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
        <Metric label="Powers Earned" value={`${prog.earnedPowers.length}/${POWERS.length}`} color="#3B82F6" />
        <Metric label="Current Streak" value={`${prog.streak} ${prog.streak === 1 ? "day" : "days"}`} color="#9333EA" />
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
                background: "white", border: `1px solid ${P.inkGhost}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: P.ink, fontFamily: "var(--font-playfair), serif" }}>
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
                  <div style={{ fontSize: 14, fontWeight: 800, color: P.ink, fontFamily: "var(--font-playfair), serif" }}>
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
              background: "white", border: `2px solid ${P.emerald}66`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>♟</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: P.emerald, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                Focus Area
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: P.ink, fontFamily: "var(--font-playfair), serif" }}>
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

      {/* Subscription tier — gated by parent PIN, so it's safe to show here.
          Stripe wires up here once we ship payments; for now this is a
          dev-only manual toggle for testing. */}
      <div style={{
        marginTop: 24, padding: "20px 22px",
        background: "white", border: `1px solid ${P.inkGhost}`,
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
              fontFamily: "var(--font-playfair), serif", letterSpacing: -0.3,
            }}>{prog.tier === "champion" ? "Champion" : "Free"}</div>
            <div style={{ fontSize: 12, color: P.inkLight, marginTop: 2 }}>
              {prog.tier === "champion"
                ? "All 7 kingdoms, all powers, knight card unlocked."
                : "Pawn Village only. Upgrade to unlock the rest."}
            </div>
          </div>
          <button
            onClick={() => store.setTier(prog.tier === "champion" ? "free" : "champion")}
            style={{
              background: prog.tier === "champion" ? "white" : P.emerald,
              color: prog.tier === "champion" ? P.inkSoft : "white",
              border: `1.5px solid ${prog.tier === "champion" ? P.inkGhost : P.emerald}`,
              borderRadius: 12, padding: "10px 18px",
              fontSize: 13, fontWeight: 800, cursor: "pointer",
              fontFamily: "var(--font-nunito), sans-serif",
              boxShadow: prog.tier === "champion"
                ? `0 2px 8px rgba(26,18,16,0.06)`
                : `0 6px 20px rgba(27,115,64,0.22)`,
              letterSpacing: 0.3,
            }}
          >
            {prog.tier === "champion" ? "Switch to Free" : "Activate Champion"}
          </button>
        </div>
        <div style={{
          marginTop: 10, fontSize: 11, color: P.inkFaint,
          fontFamily: "var(--font-nunito), sans-serif",
        }}>
          Local toggle for testing. Stripe Checkout will replace this in v2.
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 14,
      background: "white", border: `1px solid ${P.inkGhost}`,
      textAlign: "center",
    }}>
      <div style={{
        fontSize: 24, fontWeight: 900, color,
        fontFamily: "var(--font-playfair), serif",
      }}>{value}</div>
      <div style={{
        fontSize: 10, fontWeight: 800, color: P.inkLight,
        letterSpacing: 1.2, textTransform: "uppercase", marginTop: 3,
      }}>{label}</div>
    </div>
  );
}
