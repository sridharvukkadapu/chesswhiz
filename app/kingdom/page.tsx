"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";
import { KINGDOMS, POWERS, getRankByXP, getNextRank, isKingdomLocked } from "@/lib/progression/data";
import type { Kingdom, PlayerProgression } from "@/lib/progression/types";
import BottomNav from "@/components/BottomNav";
import UpgradeModal from "@/components/UpgradeModal";

// Matches the landing page (Storybook Noir) palette exactly.
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
  emeraldBright: "#22C55E",
  emeraldPale: "#E6F4EC",
  gold: "#C7940A",
  goldLight: "#F0D060",
  goldPale: "#FDF6E3",
};

function kingdomStatus(k: Kingdom, prog: PlayerProgression, rankLevel: number): "conquered" | "current" | "locked" | "tier_locked" {
  if (prog.completedKingdoms.includes(k.id)) return "conquered";
  // Tier gate takes precedence over rank — even a max-rank free user
  // can't enter Fork Forest. This is the conversion trigger.
  if (isKingdomLocked(k.id, prog.tier)) return "tier_locked";
  if (k.level > rankLevel) return "locked";
  if (k.id === prog.currentKingdom) return "current";
  return "locked";
}

export default function KingdomPage() {
  return (
    <Suspense fallback={null}>
      <KingdomPageInner />
    </Suspense>
  );
}

function KingdomPageInner() {
  const store = useGameStore();
  const searchParams = useSearchParams();
  const [hydrated, setHydrated] = useState(false);
  const [upgradeFor, setUpgradeFor] = useState<Kingdom | null>(null);

  useEffect(() => {
    store.hydrateProgression();
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-open upgrade modal if redirected here from a locked kingdom URL
  useEffect(() => {
    if (!hydrated) return;
    const upgradeId = searchParams.get("upgrade");
    if (upgradeId) {
      const k = KINGDOMS.find((kk) => kk.id === upgradeId);
      if (k) setUpgradeFor(k);
    }
  }, [hydrated, searchParams]);

  if (!hydrated) return null;

  const prog = store.progression;
  const rank = getRankByXP(prog.xp);
  const nextRank = getNextRank(rank.id);
  const floor = rank.xpRequired;
  const ceil = nextRank ? nextRank.xpRequired : rank.xpRequired + 1;
  const pct = nextRank ? Math.min(100, Math.max(0, ((prog.xp - floor) / (ceil - floor)) * 100)) : 100;

  return (
    <div style={{
      minHeight: "100dvh", background: P.cream, color: P.ink,
      fontFamily: "var(--font-nunito), sans-serif",
      position: "relative",
    }}>
      {/* Paper grain overlay */}
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
        <Link href="/play" style={{
          display: "flex", alignItems: "center", gap: 8,
          color: P.inkMed, textDecoration: "none", fontSize: 13, fontWeight: 700,
          fontFamily: "var(--font-nunito), sans-serif",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to game
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>♟</span>
          <span style={{
            fontSize: 16, fontWeight: 900,
            fontFamily: "var(--font-playfair), serif",
            color: P.ink, letterSpacing: -0.4,
          }}>The Kingdoms</span>
        </div>
        <Link href="/card" style={{
          color: P.gold, textDecoration: "none", fontSize: 13, fontWeight: 700,
          fontFamily: "var(--font-nunito), sans-serif",
        }}>Your Card →</Link>
      </header>

      {/* Hero: player rank + streak */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 20px", position: "relative", zIndex: 1 }}>
        <span style={{
          fontFamily: "'Caveat', cursive", fontSize: 19, color: P.gold,
          display: "block", textAlign: "center", marginBottom: 4,
        }}>your journey so far</span>
        <h1 style={{
          textAlign: "center", margin: "0 0 24px",
          fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 900,
          fontFamily: "var(--font-playfair), serif",
          color: P.ink, letterSpacing: -0.8,
        }}>The Chess Kingdom</h1>

        <div style={{
          padding: "24px",
          background: "white",
          border: `1px solid ${P.inkGhost}`,
          borderRadius: 20,
          boxShadow: `0 0 0 4px ${P.parchment}, 0 12px 40px rgba(26,18,16,0.08)`,
          display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
        }}>
          <div style={{
            width: 68, height: 68, borderRadius: "50%",
            background: `radial-gradient(circle at 35% 30%, ${rank.color} 0%, #f5efe4 85%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40, color: P.ink,
            border: `2px solid ${rank.color}`,
            boxShadow: `0 0 0 4px ${P.parchment}, 0 0 24px ${rank.color}30`,
            flexShrink: 0,
          }}>{rank.icon}</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: P.inkLight,
              letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 4,
            }}>Current Rank</div>
            <div style={{
              fontSize: 24, fontWeight: 900, color: P.ink,
              fontFamily: "var(--font-playfair), serif", letterSpacing: -0.4,
            }}>{rank.name}</div>
            <div style={{ fontSize: 13, color: P.inkLight, marginTop: 4 }}>
              {prog.xp} XP {nextRank ? `· ${ceil - prog.xp} to ${nextRank.name}` : "· max rank"}
            </div>
            <div style={{ marginTop: 10, height: 6, borderRadius: 3, background: P.parchment, overflow: "hidden" }}>
              <div style={{
                width: `${pct}%`, height: "100%",
                background: `linear-gradient(90deg, ${rank.color}, ${nextRank?.color ?? rank.color})`,
                transition: "width 0.6s ease-out",
              }} />
            </div>
          </div>
          <div style={{ textAlign: "center", flexShrink: 0, paddingLeft: 12, borderLeft: `1px solid ${P.inkGhost}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: P.inkLight, letterSpacing: 1.8, textTransform: "uppercase" }}>Streak</div>
            <div style={{
              fontSize: 28, fontWeight: 900, color: P.gold,
              fontFamily: "var(--font-playfair), serif", lineHeight: 1.1, marginTop: 4,
            }}>{prog.streak}</div>
            <div style={{ fontSize: 10, color: P.inkLight, fontWeight: 600 }}>{prog.streak === 1 ? "day" : "days"}</div>
          </div>
        </div>

        {/* Powers strip */}
        <div style={{
          marginTop: 14, padding: "12px 18px",
          background: P.creamDeep, border: `1px solid ${P.inkGhost}`, borderRadius: 14,
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: P.inkLight, letterSpacing: 1.5, textTransform: "uppercase" }}>Powers</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: P.ink }}>
            {prog.earnedPowers.length} / {POWERS.length}
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
            {POWERS.filter((p) => prog.earnedPowers.includes(p.id)).slice(0, 10).map((p) => (
              <span key={p.id} title={p.name} style={{
                fontSize: 15, lineHeight: 1,
                padding: "5px 8px", borderRadius: 8,
                background: "white", border: `1px solid ${P.gold}55`,
              }}>{p.icon}</span>
            ))}
            {prog.earnedPowers.length === 0 && (
              <span style={{ fontSize: 12, color: P.inkLight, fontStyle: "italic" }}>Complete a Battle Test to earn your first Power</span>
            )}
          </div>
        </div>
      </section>

      {/* Kingdom cards */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "8px 20px 32px", position: "relative", zIndex: 1 }}>
        <h2 style={{
          fontSize: 11, color: P.inkLight, letterSpacing: 1.8,
          textTransform: "uppercase", fontWeight: 800, margin: "28px 0 14px",
          fontFamily: "var(--font-nunito), sans-serif",
        }}>Realms to Conquer</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {KINGDOMS.map((k) => {
            const status = kingdomStatus(k, prog, rank.level);
            return (
              <KingdomRow
                key={k.id}
                kingdom={k}
                status={status}
                progression={prog}
                onTierLockedClick={() => setUpgradeFor(k)}
              />
            );
          })}
        </div>

        {/* Visitor CTA — shows for new players (no XP yet, default progression) */}
        {prog.xp === 0 && prog.completedKingdoms.length === 0 && prog.earnedPowers.length === 0 && (
          <div style={{
            marginTop: 32, padding: "24px 22px",
            background: "white", borderRadius: 18,
            border: `1px solid ${P.gold}40`,
            boxShadow: `0 0 0 4px ${P.goldPale}, 0 8px 24px rgba(199,148,10,0.12)`,
            textAlign: "center",
          }}>
            <span style={{
              fontFamily: "'Caveat', cursive", fontSize: 18, color: P.gold,
              display: "block", marginBottom: 4,
            }}>start your quest →</span>
            <h3 style={{
              fontSize: 20, fontWeight: 900, color: P.ink,
              fontFamily: "var(--font-playfair), serif",
              margin: "0 0 8px", letterSpacing: -0.4,
            }}>Pawn Village awaits</h3>
            <p style={{
              margin: "0 0 18px", fontSize: 14, lineHeight: 1.7,
              color: P.inkLight, maxWidth: 380, marginLeft: "auto", marginRight: "auto",
              fontFamily: "var(--font-nunito), sans-serif",
            }}>
              Play your first game to begin. Defeat the Knight Twins, earn Powers, and climb from Pawn to King.
            </p>
            <Link href="/onboard" style={{
              display: "inline-block",
              background: P.emerald, color: "white",
              borderRadius: 14, padding: "14px 32px",
              fontSize: 15, fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 6px 22px rgba(27,115,64,0.25)",
              letterSpacing: 0.3,
              fontFamily: "var(--font-nunito), sans-serif",
            }}>Play your first game free</Link>
          </div>
        )}

        <div style={{ height: 80 }} />
      </section>

      <BottomNav />

      <UpgradeModal
        open={!!upgradeFor}
        onClose={() => setUpgradeFor(null)}
        blockedKingdomName={upgradeFor?.name}
        blockedKingdomIcon={upgradeFor?.boss?.emoji?.slice(0, 2)}
      />
    </div>
  );
}

function KingdomRow({
  kingdom, status, progression, onTierLockedClick,
}: {
  kingdom: Kingdom;
  status: "conquered" | "current" | "locked" | "tier_locked";
  progression: PlayerProgression;
  onTierLockedClick: () => void;
}) {
  const [expanded, setExpanded] = useState(status === "current");

  const badge = {
    conquered:   { label: "CONQUERED", color: P.emerald, bg: P.emeraldPale, icon: "✓" },
    current:     { label: "CURRENT QUEST", color: P.gold, bg: P.goldPale, icon: "⚑" },
    locked:      { label: "LOCKED", color: P.inkFaint, bg: "#F5F0E5", icon: "🔒" },
    tier_locked: { label: "CHAMPION", color: P.gold, bg: P.goldPale, icon: "🔒" },
  }[status];

  const mastered = kingdom.strategies.filter((s) =>
    progression.masteredStrategies.includes(s.id)
  ).length;

  const isInert = status === "locked"; // rank-locked, no upgrade path
  const isTierLocked = status === "tier_locked";

  return (
    <div style={{
      background: "white",
      border: `${status === "current" || isTierLocked ? 2 : 1}px solid ${
        status === "current" ? P.gold : isTierLocked ? `${P.gold}80` : P.inkGhost
      }`,
      borderRadius: 18,
      boxShadow: status === "current"
        ? `0 0 0 4px ${P.goldPale}, 0 12px 36px rgba(199,148,10,0.18)`
        : isTierLocked
        ? `0 0 0 3px ${P.goldPale}, 0 6px 20px rgba(199,148,10,0.10)`
        : `0 4px 14px rgba(26,18,16,0.05)`,
      opacity: isInert ? 0.62 : 1,
      transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      overflow: "hidden",
    }}>
      <button
        onClick={() => {
          if (isTierLocked) { onTierLockedClick(); return; }
          if (isInert) return;
          setExpanded((v) => !v);
        }}
        disabled={isInert}
        aria-label={isTierLocked ? `Unlock ${kingdom.name} with Champion` : undefined}
        style={{
          width: "100%", padding: "18px 20px",
          background: "transparent", border: "none",
          display: "flex", alignItems: "center", gap: 16,
          cursor: isInert ? "not-allowed" : "pointer",
          textAlign: "left", color: "inherit", fontFamily: "inherit",
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: `linear-gradient(135deg, ${kingdom.color}22 0%, ${P.parchment} 100%)`,
          border: `1.5px solid ${kingdom.color}66`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, flexShrink: 0,
        }}>{kingdom.boss?.emoji?.slice(0, 2) ?? "♟"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 6,
              background: badge.bg, border: `1px solid ${badge.color}44`,
              fontSize: 10, fontWeight: 800, color: badge.color,
              letterSpacing: 1, textTransform: "uppercase",
            }}>
              <span>{badge.icon}</span> {badge.label}
            </span>
            {!isInert && (
              <span style={{ fontSize: 11, color: P.inkLight, fontWeight: 600 }}>
                {isTierLocked
                  ? `${kingdom.strategies.length} strategies · 1 boss`
                  : `${mastered}/${kingdom.strategies.length} strategies`}
              </span>
            )}
          </div>
          <div style={{
            fontSize: 18, fontWeight: 800, color: P.ink,
            fontFamily: "var(--font-playfair), serif", letterSpacing: -0.3,
          }}>{kingdom.name}</div>
          <div style={{ fontSize: 13, color: P.inkLight, marginTop: 2 }}>{kingdom.subtitle}</div>
        </div>
        {!isInert && !isTierLocked && (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={P.inkLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        )}
        {isTierLocked && (
          <span style={{
            fontSize: 11, fontWeight: 800, color: P.gold,
            letterSpacing: 0.4, flexShrink: 0,
            display: "inline-flex", alignItems: "center", gap: 4,
          }}>
            Unlock
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </span>
        )}
      </button>

      {expanded && !isInert && !isTierLocked && (
        <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${P.parchment}` }}>
          <p style={{
            fontSize: 14, lineHeight: 1.75, color: P.inkSoft, margin: "16px 0 18px",
          }}>{kingdom.description}</p>

          {kingdom.boss && (
            <div style={{
              padding: "14px 16px", borderRadius: 14,
              background: P.creamDeep, border: `1px solid ${P.inkGhost}`,
              marginBottom: 18,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: "#DC2626",
                letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8,
              }}>Boss</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                <span style={{ fontSize: 26 }}>{kingdom.boss.emoji}</span>
                <div>
                  <div style={{
                    fontSize: 16, fontWeight: 800, color: P.ink,
                    fontFamily: "var(--font-playfair), serif",
                  }}>{kingdom.boss.name}</div>
                  <div style={{ fontSize: 12, color: P.inkLight, fontStyle: "italic" }}>{kingdom.boss.signature}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: P.inkSoft, margin: "0 0 10px" }}>
                {kingdom.boss.personality}
              </p>
              <div style={{ fontSize: 10, color: P.inkLight, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, marginTop: 10, marginBottom: 4 }}>
                Dialogue
              </div>
              {kingdom.boss.dialogue.map((line, i) => (
                <div key={i} style={{
                  fontSize: 13, color: P.inkSoft, margin: "4px 0", paddingLeft: 10,
                  borderLeft: `2px solid ${kingdom.color}`, fontStyle: "italic",
                }}>&ldquo;{line}&rdquo;</div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 11, fontWeight: 800, color: P.inkLight, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
            Strategies
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {kingdom.strategies.map((s) => {
              const done = progression.masteredStrategies.includes(s.id);
              return (
                <div key={s.id} style={{
                  padding: "10px 12px", borderRadius: 10,
                  background: done ? P.emeraldPale : P.creamDeep,
                  border: `1px solid ${done ? P.emerald : P.inkGhost}`,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{
                    fontSize: 13, color: done ? P.emerald : P.inkLight,
                    width: 20, textAlign: "center", flexShrink: 0, fontWeight: 800,
                  }}>{done ? "✓" : "○"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: done ? P.ink : P.inkSoft }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: P.inkLight, marginTop: 2 }}>{s.description}</div>
                  </div>
                  <span style={{ fontSize: 11, color: P.gold, fontWeight: 800 }}>+{s.xpReward}</span>
                </div>
              );
            })}
          </div>

          <Link href={`/kingdom/${kingdom.id}`} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            marginTop: 16, padding: "10px 20px", borderRadius: 12,
            background: P.ink, color: P.cream,
            fontSize: 13, fontWeight: 800, textDecoration: "none",
            letterSpacing: 0.3, fontFamily: "var(--font-nunito), sans-serif",
            boxShadow: "0 4px 14px rgba(26,18,16,0.15)",
            transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
          }}>Enter Kingdom →</Link>
        </div>
      )}
    </div>
  );
}
