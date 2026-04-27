"use client";

import Link from "next/link";

import { StarField, MoteField } from "@/lib/design/atmosphere";
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
  emeraldBright: "#A8D4C2",
  emeraldPale: "rgba(124,182,158,0.12)",
  gold: "#FF6B5A",
  goldLight: "#FF8E70",
  goldPale: "rgba(255,107,90,0.10)",
};

const STEPS = [
  {
    n: "01", title: "Learn", icon: "📖", color: P.emerald,
    line: "Coach Pawn introduces a tactic in plain language.",
    detail: "When your kid starts a new region, Coach Pawn teaches one tactic with a kid-friendly analogy. (\"A fork is like attacking two snacks at once with one fork.\") No videos. No homework. Just a short, friendly intro.",
  },
  {
    n: "02", title: "Practice", icon: "♟", color: P.emerald,
    line: "Play real games. Make real mistakes. Hear real feedback.",
    detail: "Your kid plays a game against the AI bot. After each move, Coach Pawn watches: did they spot the tactic? Did they hang a piece? When something interesting happens — good or bad — Coach Pawn explains it on the spot.",
  },
  {
    n: "03", title: "Battle Test", icon: "⚔️", color: "#FF6B5A",
    line: "Face the kingdom's boss. Apply what you learned.",
    detail: "When your kid is ready, they battle the region's boss — like the Knight Twins (forks) or the Shadow Bishop (pins). The boss uses that tactic against them. To defeat the boss, your kid has to use the tactic too.",
  },
  {
    n: "04", title: "Earn a Power", icon: "✨", color: P.gold,
    line: "Beat the boss → unlock a Power.",
    detail: "Each Power is a permanent ability your kid earns. Fork Master. Pin Wizard. Back Rank Hero. Powers go on the Knight Card — your kid's shareable chess identity.",
  },
  {
    n: "05", title: "Reinforce", icon: "🔁", color: "#F4A6B8",
    line: "Coach Pawn keeps watching for the tactic in future games.",
    detail: "When your kid uses the tactic in a later game, Coach Pawn calls it out — \"That's a Pin & Pile On! 📌\" — to lock the pattern in. Mastery comes from repetition, not one lesson.",
  },
];

export default function HowItWorksPage() {
  return (
    <div style={{
      minHeight: "100dvh", background: "radial-gradient(ellipse at 50% 20%, #FFF8E8 0%, #F5ECDC 45%, #FBF6EC 100%)", color: P.ink,
      fontFamily: "var(--font-jakarta), sans-serif",
      position: "relative", overflowX: "hidden",
    }}>
      <StarField count={70} seed={11} opacity={0.45} />
      <MoteField count={14} seed={12} color={P.gold} />
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.022'/%3E%3C/svg%3E")`,
      }} />

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        padding: `calc(12px + env(safe-area-inset-top)) 20px 12px 20px`,
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
          <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "var(--font-dm-serif), serif", letterSpacing: -0.4 }}>How it works</span>
        </div>
        <Link href="/onboard" style={{
          background: P.emerald, color: "#FFFCF5", borderRadius: 10,
          padding: "8px 18px", fontSize: 13, fontWeight: 700,
          textDecoration: "none",
        }}>Play free</Link>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "56px 20px 32px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <span style={{
          fontFamily: "'Caveat', cursive", fontSize: 22, color: P.gold,
          display: "block", marginBottom: 8,
        }}>the 5-step learning loop →</span>
        <h1 style={{
          fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 900,
          fontFamily: "var(--font-dm-serif), serif",
          letterSpacing: -1.2, margin: "0 0 16px", color: P.ink,
        }}>How ChessWhiz works</h1>
        <p style={{
          fontSize: 17, lineHeight: 1.8, color: P.inkLight,
          maxWidth: 560, margin: "0 auto",
        }}>
          Most chess apps just let kids play. ChessWhiz uses a simple, repeatable learning loop that turns games into mastery.
        </p>
      </section>

      {/* Steps */}
      <section style={{ maxWidth: 720, margin: "0 auto", padding: "12px 20px 60px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {STEPS.map((s, i) => (
            <article key={s.n} style={{
              background: "rgba(255,252,245,0.92)",
              border: `1px solid ${P.inkGhost}`,
              borderRadius: 18,
              boxShadow: `0 4px 16px rgba(26,18,16,0.05)`,
              padding: "22px 24px",
              display: "flex", gap: 18,
              alignItems: "flex-start",
              position: "relative",
            }}>
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div aria-hidden style={{
                  position: "absolute", left: 49, bottom: -16, width: 2, height: 16,
                  background: P.inkGhost,
                }} />
              )}
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: `linear-gradient(135deg, ${s.color}25 0%, ${P.parchment} 100%)`,
                border: `2px solid ${s.color}66`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, flexShrink: 0,
              }}>{s.icon}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4,
                }}>
                  <span style={{
                    fontFamily: "var(--font-dm-serif), serif",
                    fontSize: 14, fontWeight: 900, color: s.color, letterSpacing: 0.3,
                  }}>{s.n}</span>
                  <h2 style={{
                    fontSize: 20, fontWeight: 900, color: P.ink,
                    fontFamily: "var(--font-dm-serif), serif", margin: 0, letterSpacing: -0.3,
                  }}>{s.title}</h2>
                </div>
                <p style={{
                  margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: P.inkSoft,
                }}>{s.line}</p>
                <p style={{
                  margin: 0, fontSize: 14, lineHeight: 1.75, color: P.inkLight,
                }}>{s.detail}</p>
              </div>
            </article>
          ))}
        </div>

        {/* Why it works */}
        <div style={{
          marginTop: 40, padding: "28px 28px",
          background: P.goldPale, border: `1px solid ${P.gold}40`,
          borderRadius: 18,
        }}>
          <h3 style={{
            fontSize: 18, fontWeight: 900, color: P.ink,
            fontFamily: "var(--font-dm-serif), serif",
            margin: "0 0 8px", letterSpacing: -0.3,
          }}>Why this loop works</h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: P.inkSoft }}>
            Most kids learn chess by losing a thousand games and slowly noticing patterns. ChessWhiz collapses that timeline. Coach Pawn names the pattern in real time. The kid feels the &ldquo;aha!&rdquo;. The boss battle forces them to use it. The Power makes it stick. The next game reinforces it. That&apos;s how mastery actually works — short loops, fast feedback, immediate application.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 48 }}>
          <Link href="/onboard" style={{
            background: P.emerald, color: "#FFFCF5",
            borderRadius: 16, padding: "16px 36px",
            fontSize: 16, fontWeight: 800,
            textDecoration: "none", display: "inline-block",
            boxShadow: "0 8px 28px rgba(124,182,158,0.25)",
            letterSpacing: 0.3,
          }}>Try the loop — play free</Link>
        </div>
      </section>
    </div>
  );
}
