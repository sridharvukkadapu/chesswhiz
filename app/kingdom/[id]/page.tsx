"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";
import { KINGDOMS, isKingdomLocked } from "@/lib/progression/data";

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
  emeraldPale: "rgba(52,211,153,0.10)",
  gold: "#F5B638",
  goldPale: "rgba(245,182,56,0.10)",
};

export default function KingdomDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const store = useGameStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    store.hydrateProgression();
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kingdom = KINGDOMS.find((k) => k.id === params.id);

  // Tier gate — bounce locked kingdoms back to the map so the
  // upgrade modal surfaces. Hook runs every render but only acts once.
  useEffect(() => {
    if (!hydrated || !kingdom) return;
    if (isKingdomLocked(kingdom.id, store.progression.tier)) {
      router.replace(`/kingdom?upgrade=${kingdom.id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, kingdom?.id]);

  if (!kingdom) return notFound();
  if (!hydrated) return null;
  if (isKingdomLocked(kingdom.id, store.progression.tier)) return null;

  const prog = store.progression;
  const defeated = kingdom.boss ? prog.defeatedBosses.includes(kingdom.boss.name) : false;

  const enterKingdom = () => {
    if (!store.playerName) {
      router.push("/onboard");
      return;
    }
    // Navigate to /play; the existing session continues
    router.push("/play");
  };

  return (
    <div style={{
      minHeight: "100dvh", background: "radial-gradient(ellipse at 50% 30%, #2D1B5C 0%, #15102A 45%, #07050F 100%)", color: P.ink,
      fontFamily: "var(--font-jakarta), sans-serif", position: "relative",
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
        background: "rgba(7,5,15,0.6)",
        backdropFilter: "blur(20px) saturate(1.2)",
        borderBottom: `1px solid ${P.inkGhost}40`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/kingdom" style={{
          display: "flex", alignItems: "center", gap: 8,
          color: P.inkMed, textDecoration: "none", fontSize: 13, fontWeight: 700,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          All kingdoms
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>♟</span>
          <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "var(--font-cormorant), serif", color: P.ink }}>
            ChessWhiz
          </span>
        </div>
        <div style={{ width: 90 }} />
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 20px", position: "relative", zIndex: 1, textAlign: "center" }}>
        <span style={{
          fontFamily: "'Caveat', cursive", fontSize: 19, color: P.gold,
          display: "block", marginBottom: 4,
        }}>kingdom of</span>
        <h1 style={{
          margin: "0 0 10px", fontSize: "clamp(34px, 5.5vw, 50px)", fontWeight: 900,
          fontFamily: "var(--font-cormorant), serif", color: P.ink, letterSpacing: -1,
        }}>{kingdom.name}</h1>
        <p style={{ fontSize: 16, color: P.inkLight, margin: "0 auto 22px", maxWidth: 500, lineHeight: 1.7 }}>
          {kingdom.subtitle}
        </p>

        <div style={{
          padding: "18px 22px",
          background: "rgba(26,18,56,0.85)",
          border: `1px solid ${P.inkGhost}`,
          borderRadius: 18,
          boxShadow: `0 0 0 4px ${P.parchment}, 0 12px 36px rgba(26,18,16,0.08)`,
          textAlign: "left",
        }}>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: P.inkSoft, margin: 0 }}>
            {kingdom.description}
          </p>
        </div>
      </section>

      {/* Boss */}
      {kingdom.boss && (
        <section style={{ maxWidth: 720, margin: "0 auto", padding: "24px 20px", position: "relative", zIndex: 1 }}>
          <h2 style={{
            fontSize: 11, color: P.inkLight, letterSpacing: 1.8,
            textTransform: "uppercase", fontWeight: 800, margin: "0 0 12px",
          }}>The Boss {defeated && <span style={{ color: P.emerald }}>· DEFEATED</span>}</h2>

          <div style={{
            background: "rgba(26,18,56,0.85)",
            border: `1px solid ${P.inkGhost}`,
            borderRadius: 20,
            boxShadow: `0 8px 30px rgba(26,18,16,0.06)`,
            padding: "24px",
            display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start",
          }}>
            <div style={{
              width: 88, height: 88, borderRadius: 20,
              background: `linear-gradient(135deg, ${kingdom.color}22 0%, ${P.parchment} 100%)`,
              border: `1.5px solid ${kingdom.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 48, flexShrink: 0,
            }}>{kingdom.boss.emoji}</div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{
                fontSize: 22, fontWeight: 900, color: P.ink,
                fontFamily: "var(--font-cormorant), serif", letterSpacing: -0.4,
              }}>{kingdom.boss.name}</div>
              <div style={{
                display: "inline-block", marginTop: 6, padding: "3px 10px", borderRadius: 6,
                background: P.goldPale, border: `1px solid ${P.gold}40`,
                fontSize: 11, fontWeight: 800, color: P.gold, letterSpacing: 0.5,
              }}>SIGNATURE STYLE</div>
              <p style={{ fontSize: 14, color: P.inkSoft, lineHeight: 1.7, margin: "6px 0 14px", fontStyle: "italic" }}>
                {kingdom.boss.signature}
              </p>

              <p style={{ fontSize: 14, color: P.inkSoft, lineHeight: 1.7, margin: "0 0 16px" }}>
                {kingdom.boss.personality}
              </p>

              <div style={{
                fontSize: 10, fontWeight: 800, color: P.inkLight, letterSpacing: 1.5,
                textTransform: "uppercase", marginBottom: 6,
              }}>Dialogue</div>
              {kingdom.boss.dialogue.map((line, i) => (
                <div key={i} style={{
                  fontSize: 13.5, color: P.inkSoft, margin: "6px 0",
                  paddingLeft: 12, borderLeft: `3px solid ${kingdom.color}`,
                  fontStyle: "italic", lineHeight: 1.7,
                }}>&ldquo;{line}&rdquo;</div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Strategies */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "8px 20px", position: "relative", zIndex: 1 }}>
        <h2 style={{
          fontSize: 11, color: P.inkLight, letterSpacing: 1.8,
          textTransform: "uppercase", fontWeight: 800, margin: "24px 0 12px",
        }}>Strategies in this Kingdom</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {kingdom.strategies.map((s) => {
            const mastered = prog.masteredStrategies.includes(s.id);
            return (
              <div key={s.id} style={{
                padding: "14px 18px", borderRadius: 14,
                background: mastered ? P.emeraldPale : "white",
                border: `1px solid ${mastered ? P.emerald : P.inkGhost}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: mastered ? P.emerald : P.parchment,
                    color: mastered ? "white" : P.inkLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 900, flexShrink: 0,
                  }}>{mastered ? "✓" : "○"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: P.ink, fontFamily: "var(--font-jakarta), sans-serif" }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: 13, color: P.inkLight, marginTop: 3 }}>{s.description}</div>
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: 800, color: P.gold,
                    padding: "3px 8px", borderRadius: 6,
                    background: P.goldPale, border: `1px solid ${P.gold}33`,
                    flexShrink: 0,
                  }}>+{s.xpReward} XP</span>
                </div>
                <p style={{ margin: "10px 0 0 38px", fontSize: 13, lineHeight: 1.7, color: P.inkSoft, fontStyle: "italic" }}>
                  &ldquo;{s.coachExplanation}&rdquo;
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Enter Kingdom CTA */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 80px", position: "relative", zIndex: 1, textAlign: "center" }}>
        <button
          onClick={enterKingdom}
          style={{
            background: P.emerald, color: "white", border: "none",
            borderRadius: 16, padding: "18px 40px", fontSize: 17,
            fontWeight: 800, cursor: "pointer",
            fontFamily: "var(--font-jakarta), sans-serif",
            boxShadow: "0 8px 32px rgba(27,115,64,0.3), 0 2px 8px rgba(27,115,64,0.2)",
            transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            letterSpacing: 0.2,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px) scale(1.03)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)"; }}
        >
          {defeated ? "Play here again" : `Enter the ${kingdom.name}`}
        </button>
        <div style={{ marginTop: 14, color: P.inkFaint, fontSize: 13 }}>
          Coach Pawn will guide you every step of the way.
        </div>
      </section>
    </div>
  );
}
