"use client";

import Link from "next/link";
import { KINGDOMS, POWERS, RANKS } from "@/lib/progression/data";

import { StarField, MoteField } from "@/lib/design/atmosphere";
const P = {
  cream: "#1A1238",
  creamDeep: "rgba(36,24,69,0.85)",
  parchment: "rgba(245,230,200,0.12)",
  ink: "#FBF6E8",
  inkSoft: "#FBF6E8",
  inkMed: "#D6C8A8",
  inkLight: "#9A8FB5",
  inkFaint: "#6B6285",
  inkGhost: "rgba(245,230,200,0.22)",
  emerald: "#34D399",
  emeraldBright: "#6EE7B7",
  emeraldPale: "rgba(52,211,153,0.10)",
  gold: "#F5B638",
  goldLight: "#FCD34D",
  goldPale: "rgba(245,182,56,0.10)",
};

const KINGDOM_ICONS: Record<string, string> = {
  village: "🏘️",
  fork_forest: "🌲",
  pin_palace: "🏰",
  skewer_spire: "🗼",
  discovery_depths: "⛰️",
  strategy_summit: "🏔️",
  endgame_throne: "👑",
};

export default function JourneyPage() {
  return (
    <div style={{
      minHeight: "100dvh", background: "radial-gradient(ellipse at 50% 30%, #2D1B5C 0%, #15102A 45%, #07050F 100%)", color: P.ink,
      fontFamily: "var(--font-jakarta), sans-serif",
      position: "relative", overflowX: "hidden",
    }}>
      <StarField count={70} seed={11} opacity={0.45} />
      <MoteField count={14} seed={12} color="#FCD34D" />
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.022'/%3E%3C/svg%3E")`,
      }} />

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        padding: "12px 20px",
        background: "rgba(7,5,15,0.6)",
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
          <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "var(--font-cormorant), serif", letterSpacing: -0.4 }}>The Chess Kingdom</span>
        </div>
        <Link href="/onboard" style={{
          background: P.emerald, color: "white", borderRadius: 10,
          padding: "8px 18px", fontSize: 13, fontWeight: 700,
          textDecoration: "none",
        }}>Play free</Link>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "56px 20px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <span style={{
          fontFamily: "'Caveat', cursive", fontSize: 22, color: P.gold,
          display: "block", marginBottom: 8,
        }}>the full journey →</span>
        <h1 style={{
          fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 900,
          fontFamily: "var(--font-cormorant), serif",
          letterSpacing: -1.2, margin: "0 0 16px", color: P.ink,
        }}>From Pawn to King</h1>
        <p style={{
          fontSize: 17, lineHeight: 1.8, color: P.inkLight,
          maxWidth: 560, margin: "0 auto",
        }}>
          7 kingdoms. 7 bosses. {POWERS.length} Powers. One quest. Here&apos;s the whole map — every region, every boss, every strategy your kid will master.
        </p>
      </section>

      {/* Rank ladder */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "16px 20px 8px", position: "relative", zIndex: 1 }}>
        <div style={{
          background: "rgba(26,18,56,0.85)", borderRadius: 18,
          border: `1px solid ${P.inkGhost}`,
          boxShadow: `0 0 0 4px ${P.parchment}, 0 8px 24px rgba(26,18,16,0.06)`,
          padding: "20px 22px",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: P.inkLight,
            letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 12,
          }}>Rank ladder</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 6 }}>
            {RANKS.map((r) => (
              <div key={r.id} style={{ textAlign: "center", flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", margin: "0 auto 6px",
                  background: `radial-gradient(circle at 35% 30%, ${r.color} 0%, ${P.parchment} 90%)`,
                  border: `2px solid ${r.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, color: P.ink,
                }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: r.color, fontFamily: "var(--font-cormorant), serif", fontStyle: "italic" }}>{r.name}</div>
                <div style={{ fontSize: 11, color: P.inkLight, fontVariantNumeric: "tabular-nums" }}>{r.xpRequired} XP</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kingdoms */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 80px", position: "relative", zIndex: 1 }}>
        <h2 style={{
          fontSize: 11, color: P.inkLight, letterSpacing: 1.8,
          textTransform: "uppercase", fontWeight: 800, margin: "12px 0 16px",
        }}>The 7 Kingdoms</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {KINGDOMS.map((k, idx) => (
            <article key={k.id} style={{
              background: "rgba(26,18,56,0.85)",
              border: `1px solid ${P.inkGhost}`,
              borderRadius: 18,
              boxShadow: `0 4px 16px rgba(26,18,16,0.05)`,
              overflow: "hidden",
            }}>
              <div style={{
                padding: "20px 22px",
                display: "flex", alignItems: "center", gap: 16,
                background: `linear-gradient(135deg, ${k.color}10 0%, transparent 60%)`,
                borderBottom: `1px solid ${P.parchment}`,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: `linear-gradient(135deg, ${k.color}25 0%, ${P.parchment} 100%)`,
                  border: `1.5px solid ${k.color}66`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, flexShrink: 0,
                }}>{KINGDOM_ICONS[k.id] ?? "♟"}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 800, color: k.color,
                    letterSpacing: 1.5, textTransform: "uppercase",
                  }}>Region {idx + 1} of {KINGDOMS.length}</div>
                  <div style={{
                    fontSize: 22, fontWeight: 900, color: P.ink,
                    fontFamily: "var(--font-cormorant), serif", letterSpacing: -0.4,
                    marginTop: 2,
                  }}>{k.name}</div>
                  <div style={{ fontSize: 13, color: P.inkLight, marginTop: 2 }}>{k.subtitle}</div>
                </div>
              </div>

              <div style={{ padding: "18px 22px 22px" }}>
                <p style={{ fontSize: 14, lineHeight: 1.75, color: P.inkSoft, margin: "0 0 16px" }}>
                  {k.description}
                </p>

                {k.boss && (
                  <div style={{
                    background: P.creamDeep, border: `1px solid ${P.inkGhost}`,
                    borderRadius: 12, padding: "12px 14px", marginBottom: 16,
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{k.boss.emoji}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#DC2626", letterSpacing: 1.5, textTransform: "uppercase" }}>Boss</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: P.ink, fontFamily: "var(--font-cormorant), serif" }}>{k.boss.name}</div>
                      <div style={{ fontSize: 12, color: P.inkLight, fontStyle: "italic", marginTop: 2 }}>{k.boss.signature}</div>
                    </div>
                  </div>
                )}

                <div style={{
                  fontSize: 10, fontWeight: 800, color: P.inkLight,
                  letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8,
                }}>What you&apos;ll learn</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {k.strategies.map((s) => (
                    <span key={s.id} style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "4px 10px", borderRadius: 8,
                      background: P.creamDeep, border: `1px solid ${P.inkGhost}`,
                      fontSize: 12, color: P.inkSoft, fontWeight: 600,
                    }}>{s.name} <span style={{ color: P.gold, fontWeight: 800 }}>+{s.xpReward}</span></span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Powers grid */}
        <h2 style={{
          fontSize: 11, color: P.inkLight, letterSpacing: 1.8,
          textTransform: "uppercase", fontWeight: 800, margin: "44px 0 16px",
        }}>{POWERS.length} Powers to collect</h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 10,
        }}>
          {POWERS.map((p) => {
            const ringColor = p.rarity === "legendary" ? P.gold
              : p.rarity === "epic" ? "#A855F7"
              : p.rarity === "rare" ? P.emerald
              : P.inkGhost;
            return (
              <div key={p.id} style={{
                background: "rgba(26,18,56,0.85)",
                border: `1.5px solid ${ringColor}55`,
                borderRadius: 12, padding: "12px 10px",
                textAlign: "center",
                boxShadow: `0 2px 8px rgba(26,18,16,0.04)`,
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{p.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: P.ink, lineHeight: 1.3 }}>{p.name}</div>
                <div style={{
                  fontSize: 9, fontWeight: 800, color: ringColor,
                  letterSpacing: 1, textTransform: "uppercase", marginTop: 4,
                }}>{p.rarity}</div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 56 }}>
          <Link href="/onboard" style={{
            background: P.emerald, color: "white",
            borderRadius: 16, padding: "16px 36px",
            fontSize: 16, fontWeight: 800,
            textDecoration: "none", display: "inline-block",
            boxShadow: "0 8px 28px rgba(27,115,64,0.25)",
            letterSpacing: 0.3,
          }}>Begin in Pawn Village →</Link>
          <div style={{ marginTop: 12, fontSize: 12, color: P.inkFaint }}>
            No signup · No credit card · Ready in 10 seconds
          </div>
        </div>
      </section>
    </div>
  );
}
