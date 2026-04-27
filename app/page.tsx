"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { T, KINGDOM_COLORS } from "@/lib/design/tokens";
import { GoldFoilText, StarField, MoteField, useTime, animate, Easing } from "@/lib/design/atmosphere";
import { Piece } from "@/components/ChessPieces";
import CoachPawn, { SpeechBubble } from "@/components/CoachPawn";

// ─── Reveal: fade + slide on intersection ────────────────────────
function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible] as const;
}

function Reveal({
  children, delay = 0, direction = "up", style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
  style?: React.CSSProperties;
}) {
  const [ref, visible] = useInView();
  const transforms: Record<string, string> = {
    up: "translateY(40px)",
    down: "translateY(-30px)",
    left: "translateX(50px)",
    right: "translateX(-50px)",
    scale: "scale(0.95)",
  };
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0) scale(1)" : transforms[direction],
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Hero — port of scene 1 ──────────────────────────────────────
const Hero = React.memo(function Hero() {
  const time = useTime();
  const bgPulse = 1 + Math.sin(time * 0.6) * 0.02;
  const kingY = Math.sin(time * 1.2) * 6;
  const kingRot = Math.sin(time * 0.4) * 3;

  return (
    <section
      style={{
        position: "relative",
        minHeight: "min(820px, 100dvh)",
        padding: "100px 24px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        zIndex: 1,
      }}
    >
      {/* center vignette aura */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(${bgPulse})`,
          width: "min(95vw, 900px)",
          height: "min(95vw, 900px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245,182,56,0.30) 0%, rgba(192,132,252,0.15) 40%, transparent 70%)",
          filter: "blur(20px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* King piece */}
      <Reveal delay={100} direction="scale">
        <div
          style={{
            transform: `translateY(${kingY}px) rotate(${kingRot}deg)`,
            filter: "drop-shadow(0 0 60px rgba(245,182,56,0.55))",
            marginBottom: 18,
            zIndex: 1,
          }}
        >
          <Piece type="king" color="white" size={180} />
        </div>
      </Reveal>

      {/* Brand wordmark */}
      <Reveal delay={400} style={{ zIndex: 1 }}>
        <h1 style={{ margin: 0, lineHeight: 0.95 }}>
          <GoldFoilText fontSize={92} italic>
            ChessWhiz
          </GoldFoilText>
        </h1>
      </Reveal>

      {/* Tagline */}
      <Reveal delay={700} style={{ zIndex: 1 }}>
        <div
          style={{
            marginTop: 20,
            fontFamily: T.fontUI,
            fontSize: 16,
            fontWeight: 400,
            color: T.textMed,
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            paddingLeft: "0.5em",
          }}
        >
          Every move is a lesson
        </div>
      </Reveal>

      {/* Sub-pitch */}
      <Reveal delay={900} style={{ zIndex: 1 }}>
        <p
          style={{
            marginTop: 26,
            maxWidth: 560,
            fontSize: 17,
            lineHeight: 1.7,
            color: T.textMed,
            fontFamily: T.fontUI,
          }}
        >
          The chess coach your kid always wanted — patient, encouraging, and powered by Claude. Plays alongside your child, explains every move in their language, and adapts to their age.
        </p>
      </Reveal>

      {/* CTA */}
      <Reveal delay={1100} style={{ zIndex: 1 }}>
        <div
          style={{
            marginTop: 36,
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Link
            href="/onboard"
            style={{
              display: "inline-block",
              padding: "18px 40px",
              background: T.goldFoil,
              borderRadius: 16,
              fontFamily: T.fontUI,
              fontSize: 17,
              fontWeight: 800,
              color: T.inkDeep,
              letterSpacing: "0.06em",
              textDecoration: "none",
              boxShadow: T.glowAmber,
            }}
          >
            ✦ Start playing free ✦
          </Link>
          <span
            style={{
              fontSize: 13,
              color: T.textLo,
              fontFamily: T.fontUI,
            }}
          >
            No signup · Ready in 10 seconds
          </span>
        </div>
      </Reveal>

      {/* Hero badges */}
      <Reveal delay={1300} style={{ zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            gap: 32,
            marginTop: 44,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { icon: "♔", label: "Pawn → King in 60 days" },
            { icon: "✨", label: "Explains every move" },
            { icon: "🛡", label: "No ads · No strangers" },
          ].map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18, color: T.amberGlow }}>{b.icon}</span>
              <span
                style={{
                  fontSize: 13,
                  color: T.textMed,
                  fontWeight: 600,
                  fontFamily: T.fontUI,
                }}
              >
                {b.label}
              </span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
});

// ─── Coaching showcase — Coach Pawn + a sample message ───────────
const CoachingShowcase = React.memo(function CoachingShowcase() {
  return (
    <section
      style={{
        padding: "100px 24px",
        position: "relative",
        zIndex: 1,
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <span
            style={{
              fontFamily: T.fontUI,
              fontSize: 13,
              fontWeight: 700,
              color: T.amberGlow,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              paddingLeft: "0.5em",
            }}
          >
            Real-time coaching
          </span>
        </div>
      </Reveal>
      <Reveal delay={100}>
        <h2
          style={{
            textAlign: "center",
            margin: "0 0 16px",
            fontSize: "clamp(36px, 5.5vw, 60px)",
          }}
        >
          <GoldFoilText fontSize={56} italic>
            Coach Pawn talks back
          </GoldFoilText>
        </h2>
      </Reveal>
      <Reveal delay={200}>
        <p
          style={{
            textAlign: "center",
            margin: "0 auto 56px",
            maxWidth: 560,
            fontFamily: T.fontUI,
            fontSize: 16,
            lineHeight: 1.7,
            color: T.textMed,
          }}
        >
          Not pre-recorded. Not template lookup. Real AI that watches every move and explains why it mattered — at your kid&apos;s level.
        </p>
      </Reveal>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 56,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Reveal delay={300}>
          <CoachPawn size={240} expression="talking" />
        </Reveal>
        <Reveal delay={500} direction="left">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 460 }}>
            <SpeechBubble
              text={
                <>
                  <strong style={{ color: T.emerald }}>Nice!</strong> Your bishop on c4 is aiming right at f7 — the square next to the black king. That&apos;s smart pressure!
                </>
              }
              width={460}
              tail="left"
            />
            <div
              style={{
                background: "linear-gradient(180deg, rgba(255,107,107,0.10) 0%, rgba(255,107,107,0.04) 100%)",
                border: "1.5px solid rgba(255,107,107,0.28)",
                borderRadius: 18,
                padding: "16px 22px",
                position: "relative",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: -10,
                  top: 18,
                  width: 0,
                  height: 0,
                  borderTop: "10px solid transparent",
                  borderBottom: "10px solid transparent",
                  borderRight: "12px solid rgba(255,107,107,0.28)",
                }}
              />
              <p style={{ margin: 0, fontFamily: T.fontUI, fontSize: 15, lineHeight: 1.55, color: T.textHi }}>
                <strong style={{ color: T.rubyGlow }}>Uh oh!</strong> The black knight is eyeing your e5 pawn. Defend or move it.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
});

// ─── Journey section — direct port of scene 5's energy ───────────
const JourneySection = React.memo(function JourneySection() {
  const time = useTime();
  const KINGDOMS_PREVIEW = [
    { id: "village", emoji: "🏘️", label: "Village" },
    { id: "fork_forest", emoji: "🌲", label: "Forks" },
    { id: "pin_palace", emoji: "🏰", label: "Pins" },
    { id: "skewer_spire", emoji: "🗼", label: "Skewers" },
    { id: "discovery_depths", emoji: "⛏️", label: "Discovery" },
    { id: "strategy_summit", emoji: "🏔️", label: "Strategy" },
    { id: "endgame_throne", emoji: "👑", label: "Endgame" },
  ];

  return (
    <section
      style={{
        padding: "100px 24px",
        position: "relative",
        zIndex: 1,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <span
              style={{
                fontFamily: T.fontUI,
                fontSize: 13,
                fontWeight: 700,
                color: T.amberGlow,
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                paddingLeft: "0.5em",
              }}
            >
              More than a chess app
            </span>
          </div>
        </Reveal>
        <Reveal delay={100}>
          <h2
            style={{
              textAlign: "center",
              margin: "0 0 16px",
              fontSize: "clamp(36px, 5.5vw, 64px)",
            }}
          >
            <GoldFoilText fontSize={60} italic>
              An adventure from Pawn to King
            </GoldFoilText>
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p
            style={{
              textAlign: "center",
              margin: "0 auto 56px",
              maxWidth: 580,
              fontFamily: T.fontUI,
              fontSize: 16,
              lineHeight: 1.7,
              color: T.textMed,
            }}
          >
            Your kid travels through 7 kingdoms, defeats boss characters, earns Powers, and levels up — all while learning real chess.
          </p>
        </Reveal>

        {/* Kingdom path — pill cards with connector lines */}
        <Reveal delay={300}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 56,
            }}
          >
            {KINGDOMS_PREVIEW.map((k, i) => {
              const active = i === 0;
              const accent = KINGDOM_COLORS[k.id] ?? T.amber;
              return (
                <React.Fragment key={k.id}>
                  <div
                    style={{
                      borderRadius: 14,
                      padding: "14px 16px",
                      background: active
                        ? `linear-gradient(180deg, ${accent}33 0%, ${accent}11 100%)`
                        : "rgba(26,18,56,0.6)",
                      border: `2px solid ${active ? accent : T.border}`,
                      boxShadow: active ? `0 0 24px ${accent}55` : "none",
                      textAlign: "center",
                      minWidth: 88,
                      opacity: active ? 1 : 0.55,
                      animation: active ? "kingdomPulse 2.4s ease-in-out infinite" : "none",
                    }}
                  >
                    <div style={{ fontSize: 26, lineHeight: 1 }}>{k.emoji}</div>
                    <div
                      style={{
                        marginTop: 4,
                        fontFamily: T.fontUI,
                        fontSize: 11,
                        fontWeight: 700,
                        color: active ? accent : T.textLo,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {k.label}
                    </div>
                  </div>
                  {i < KINGDOMS_PREVIEW.length - 1 && (
                    <div
                      aria-hidden
                      style={{
                        width: 18,
                        height: 2,
                        background: i === 0 ? T.amberGlow : T.border,
                        opacity: i === 0 ? 0.8 : 0.4,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </Reveal>

        {/* Three pillars */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {[
            {
              title: "Boss Battles",
              tone: T.ruby,
              icon: "♞♞",
              copy: "Each region has a boss who uses that tactic against your kid. Defeat them to master the skill.",
              quote: "Hehe! We got your rook AND your queen!",
              quoteSpeaker: "The Knight Twins",
            },
            {
              title: "Earn Powers",
              tone: T.amber,
              icon: "⚡",
              copy: "Apply a tactic in a real game to earn a Power — not a badge, an ability you proved.",
              chips: [
                { icon: "🍴", label: "Fork Master", color: T.emerald },
                { icon: "📌", label: "Pin Wizard", color: T.sapphire },
                { icon: "💀", label: "Back Rank Hero", color: T.ruby },
                { icon: "⚡", label: "Double Trouble", color: T.amber },
              ],
            },
            {
              title: "Knight Card",
              tone: T.amethyst,
              icon: "🃏",
              copy: "Your kid's shareable chess identity — rank, bosses defeated, powers earned. The new playground flex.",
              card: { name: "Aarav", rank: "Knight" },
            },
          ].map((p, i) => (
            <Reveal key={p.title} delay={100 * i}>
              <div
                style={{
                  background: "rgba(26,18,56,0.70)",
                  border: `1.5px solid ${p.tone}55`,
                  borderRadius: 22,
                  padding: 24,
                  height: "100%",
                  backdropFilter: "blur(8px)",
                  boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
                }}
              >
                <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 12 }}>{p.icon}</div>
                <h3
                  style={{
                    fontFamily: T.fontDisplay,
                    fontStyle: "italic",
                    fontSize: 24,
                    fontWeight: 600,
                    color: p.tone,
                    margin: "0 0 10px",
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontFamily: T.fontUI,
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: T.textMed,
                    margin: "0 0 16px",
                  }}
                >
                  {p.copy}
                </p>
                {p.quote && (
                  <div
                    style={{
                      background: "rgba(7,5,15,0.5)",
                      borderRadius: 12,
                      padding: 12,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <div style={{ fontFamily: T.fontUI, fontSize: 13, fontWeight: 700, color: T.textHi }}>
                      {p.quoteSpeaker}
                    </div>
                    <div
                      style={{
                        fontFamily: T.fontUI,
                        fontSize: 12,
                        color: T.textLo,
                        fontStyle: "italic",
                        marginTop: 4,
                      }}
                    >
                      &ldquo;{p.quote}&rdquo;
                    </div>
                  </div>
                )}
                {p.chips && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {p.chips.map((c) => (
                      <span
                        key={c.label}
                        style={{
                          padding: "5px 9px",
                          borderRadius: 8,
                          background: `${c.color}18`,
                          border: `1px solid ${c.color}55`,
                          fontFamily: T.fontUI,
                          fontSize: 11,
                          fontWeight: 700,
                          color: c.color,
                          letterSpacing: "0.04em",
                        }}
                      >
                        {c.icon} {c.label}
                      </span>
                    ))}
                  </div>
                )}
                {p.card && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, #FBF6E8 0%, #F5E9C9 100%)",
                      borderRadius: 12,
                      padding: 12,
                      border: `1px solid ${T.amberGlow}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
                    }}
                  >
                    <Piece type="knight" color="white" size={36} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontFamily: T.fontUI,
                          fontSize: 9,
                          fontWeight: 800,
                          color: "#7A5418",
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                        }}
                      >
                        {p.card.rank} · Level 2
                      </div>
                      <div
                        style={{
                          fontFamily: T.fontDisplay,
                          fontStyle: "italic",
                          fontSize: 18,
                          fontWeight: 600,
                          color: T.inkDeep,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {p.card.name}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={500}>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link
              href="/journey"
              style={{
                color: T.amberGlow,
                fontFamily: T.fontUI,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              See the full kingdom map →
            </Link>
          </div>
        </Reveal>
      </div>
      <style>{`
        @keyframes kingdomPulse {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
      `}</style>
    </section>
  );
});

// ─── Comparison ──────────────────────────────────────────────────
const ComparisonSection = React.memo(function ComparisonSection() {
  return (
    <section style={{ padding: "100px 24px", maxWidth: 980, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <Reveal>
        <h2
          style={{
            textAlign: "center",
            margin: "0 0 48px",
            fontSize: "clamp(28px, 4vw, 44px)",
          }}
        >
          <GoldFoilText fontSize={42} italic>
            The moment that matters most
          </GoldFoilText>
        </h2>
      </Reveal>

      <Reveal delay={150}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 18,
          }}
        >
          {/* Other apps */}
          <div
            style={{
              background: "rgba(26,18,56,0.6)",
              border: `1px solid ${T.border}`,
              borderRadius: 22,
              padding: "26px 24px",
              opacity: 0.75,
            }}
          >
            <div
              style={{
                fontFamily: T.fontUI,
                fontSize: 11,
                fontWeight: 700,
                color: T.textLo,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Other chess apps
            </div>
            <div
              style={{
                background: "rgba(7,5,15,0.5)",
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: "14px 16px",
                fontFamily: T.fontUI,
                fontSize: 14,
                lineHeight: 1.6,
                color: T.textMed,
                fontStyle: "italic",
              }}
            >
              &ldquo;I can&apos;t explain it, but this move is actually the right one here.&rdquo;
            </div>
            <div
              style={{
                marginTop: 14,
                fontFamily: T.fontUI,
                fontSize: 12,
                color: T.textDim,
              }}
            >
              🤷 Same canned response. Every time.
            </div>
          </div>

          {/* ChessWhiz */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(52,211,153,0.10) 0%, rgba(245,182,56,0.06) 100%)",
              border: `2px solid ${T.emerald}`,
              borderRadius: 22,
              padding: "26px 24px",
              boxShadow: T.glowEmerald,
            }}
          >
            <div
              style={{
                fontFamily: T.fontUI,
                fontSize: 11,
                fontWeight: 700,
                color: T.emeraldGlow,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>✓</span> ChessWhiz
            </div>
            <div
              style={{
                background: "rgba(7,5,15,0.5)",
                border: "1px solid rgba(52,211,153,0.4)",
                borderRadius: 12,
                padding: "14px 16px",
                fontFamily: T.fontUI,
                fontSize: 14,
                lineHeight: 1.65,
                color: T.textHi,
              }}
            >
              &ldquo;Your knight is doing two jobs at once — protecting your pawn AND watching the center. That&apos;s called coordination! 🤝&rdquo;
            </div>
            <div
              style={{
                marginTop: 14,
                fontFamily: T.fontUI,
                fontSize: 12,
                color: T.emeraldGlow,
                fontWeight: 600,
              }}
            >
              ✨ AI-generated. Unique. Actually teaches.
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
});

// ─── Note from the maker ────────────────────────────────────────
const MakerNote = React.memo(function MakerNote() {
  return (
    <section style={{ padding: "80px 24px", maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <Reveal>
        <div
          style={{
            background: "rgba(26,18,56,0.7)",
            border: `1.5px solid ${T.border}`,
            borderRadius: 24,
            padding: "44px 36px",
            textAlign: "center",
            boxShadow: T.shadowCard,
          }}
        >
          <span
            style={{
              fontFamily: T.fontHand,
              fontSize: 20,
              color: T.amberGlow,
              transform: "rotate(-1.5deg)",
              display: "inline-block",
              marginBottom: 8,
            }}
          >
            a note from the maker →
          </span>
          <p
            style={{
              fontFamily: T.fontUI,
              fontSize: 17,
              lineHeight: 1.8,
              color: T.textHi,
              margin: "8px 0 22px",
            }}
          >
            ChessWhiz launched in <strong style={{ color: T.amberGlow }}>April 2026</strong>. Built by a chess dad in Texas for his own kids — and now for yours. No fake testimonials. No paid reviews. Just a tool I wish I&apos;d had.
          </p>
          <Link
            href="/onboard"
            style={{
              display: "inline-block",
              background: T.goldFoil,
              color: T.inkDeep,
              borderRadius: 14,
              padding: "14px 32px",
              fontSize: 15,
              fontWeight: 800,
              textDecoration: "none",
              fontFamily: T.fontUI,
              letterSpacing: "0.05em",
              boxShadow: T.glowAmber,
            }}
          >
            Try it free — be an early family
          </Link>
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: T.textLo,
              fontFamily: T.fontUI,
            }}
          >
            <a href="mailto:hello@chesswhiz.com" style={{ color: T.textLo, textDecoration: "underline" }}>
              hello@chesswhiz.com
            </a>{" "}
            · I read every email
          </div>
        </div>
      </Reveal>
    </section>
  );
});

// ─── Pricing ────────────────────────────────────────────────────
const Pricing = React.memo(function Pricing() {
  return (
    <section style={{ padding: "80px 24px", maxWidth: 580, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <Reveal>
        <h2
          style={{
            textAlign: "center",
            margin: "0 0 12px",
            fontSize: "clamp(28px, 4vw, 40px)",
          }}
        >
          <GoldFoilText fontSize={36} italic>
            Start free. Unlock the kingdom.
          </GoldFoilText>
        </h2>
        <p
          style={{
            textAlign: "center",
            color: T.textLo,
            fontSize: 14,
            margin: "0 0 36px",
            fontFamily: T.fontUI,
          }}
        >
          No credit card required. No tricks.
        </p>
      </Reveal>

      <Reveal delay={150}>
        <div
          style={{
            background: "rgba(26,18,56,0.85)",
            borderRadius: 26,
            overflow: "hidden",
            border: `1.5px solid ${T.borderStrong}`,
            boxShadow: T.shadowDeep,
          }}
        >
          {/* Free */}
          <div style={{ padding: "26px 30px", borderBottom: `1px solid ${T.border}` }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 14,
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: T.fontDisplay,
                    fontStyle: "italic",
                    fontSize: 22,
                    fontWeight: 600,
                    color: T.textHi,
                    margin: "0 0 4px",
                  }}
                >
                  Free
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontFamily: T.fontUI,
                    fontSize: 13,
                    color: T.textLo,
                  }}
                >
                  A taste of the kingdom — perfect for getting started
                </p>
              </div>
              <span
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  fontWeight: 700,
                  fontSize: 32,
                  color: T.textHi,
                  lineHeight: 1,
                }}
              >
                $0
              </span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
              {[
                { ok: true, t: "3 games per day" },
                { ok: true, t: "Basic AI coaching (text only)" },
                { ok: true, t: "Easy & Medium bots" },
                { ok: true, t: "Pawn Village (first kingdom)" },
                { ok: false, t: "Boss battles · Powers · Knight Card" },
                { ok: false, t: "Mission system · Hard bot" },
              ].map((f, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: T.fontUI,
                    fontSize: 13,
                    color: f.ok ? T.textHi : T.textDim,
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: f.ok ? T.emerald : "rgba(255,255,255,0.06)",
                      color: f.ok ? T.obsidian : T.textDim,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    {f.ok ? "✓" : "✕"}
                  </span>
                  {f.t}
                </li>
              ))}
            </ul>
          </div>

          {/* Champion */}
          <div
            style={{
              padding: "32px",
              background: "linear-gradient(135deg, rgba(245,182,56,0.18) 0%, rgba(192,132,252,0.14) 100%)",
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: T.goldFoil,
                color: T.inkDeep,
                borderRadius: 8,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 800,
                marginBottom: 16,
                fontFamily: T.fontUI,
                letterSpacing: "0.18em",
              }}
            >
              UNLOCK THE FULL JOURNEY
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: T.fontDisplay,
                    fontStyle: "italic",
                    fontSize: 22,
                    fontWeight: 600,
                    color: T.textHi,
                    margin: "0 0 4px",
                  }}
                >
                  Champion
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontFamily: T.fontUI,
                    fontSize: 13,
                    color: T.textLo,
                  }}
                >
                  The full Chess Kingdom — all 7 regions, all bosses
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 20 }}>
                <span
                  style={{
                    fontFamily: T.fontDisplay,
                    fontStyle: "italic",
                    fontWeight: 700,
                    fontSize: 36,
                    color: T.amberGlow,
                  }}
                >
                  $4.99
                </span>
                <span style={{ fontSize: 13, color: T.textLo, fontFamily: T.fontUI }}>/mo</span>
              </div>
            </div>
            <ul style={{ margin: "18px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
              {[
                "Unlimited games",
                "All 3 difficulty levels",
                "Full Chess Kingdom · 7 regions · 7 bosses",
                "20 Powers to collect",
                "Knight Card (shareable profile)",
                "Mission system + Aha! celebrations",
                "Game review & analysis",
                "Parent dashboard",
                "Priority AI coaching",
              ].map((t, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontFamily: T.fontUI,
                    fontSize: 13,
                    color: T.textHi,
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: T.emerald,
                      color: T.obsidian,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <Link
              href="/onboard?from=upgrade"
              style={{
                display: "block",
                width: "100%",
                marginTop: 22,
                padding: "16px 0",
                borderRadius: 14,
                background: T.goldFoil,
                color: T.inkDeep,
                border: "none",
                fontSize: 16,
                fontWeight: 800,
                fontFamily: T.fontUI,
                textDecoration: "none",
                textAlign: "center",
                boxShadow: T.glowAmber,
                letterSpacing: "0.05em",
              }}
            >
              ✦ Start 7-day free trial ✦
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
});

// ─── FAQ ────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, padding: "16px 0" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          textAlign: "left",
        }}
      >
        <span
          style={{
            color: T.textHi,
            fontSize: 15,
            fontWeight: 600,
            fontFamily: T.fontUI,
            paddingRight: 16,
          }}
        >
          {q}
        </span>
        <span
          style={{
            color: T.amberGlow,
            fontSize: 18,
            transform: open ? "rotate(45deg)" : "rotate(0)",
            transition: "0.2s",
            flexShrink: 0,
          }}
        >
          +
        </span>
      </button>
      {open && (
        <p
          style={{
            margin: "10px 0 0",
            fontSize: 14,
            color: T.textMed,
            lineHeight: 1.7,
            fontFamily: T.fontUI,
          }}
        >
          {a}
        </p>
      )}
    </div>
  );
}

const FAQ = React.memo(function FAQ() {
  return (
    <section style={{ padding: "60px 24px 80px", maxWidth: 680, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <Reveal>
        <h2
          style={{
            textAlign: "center",
            margin: "0 0 24px",
            fontSize: "clamp(24px, 3.5vw, 32px)",
          }}
        >
          <GoldFoilText fontSize={28} italic>
            Questions? We&apos;ve got answers.
          </GoldFoilText>
        </h2>
      </Reveal>
      {[
        { q: "How does the progression system work?", a: "Your kid starts as a Pawn and travels through 7 regions of the Chess Kingdom — from Pawn Village to the Endgame Throne. Each region has a Boss character who teaches a family of tactics. The Knight Twins teach forks. The Shadow Bishop teaches pins. Apply the tactic in a real game to earn a Power. Climb from Pawn to King and build your shareable Knight Card." },
        { q: "What age is ChessWhiz for?", a: "Ages 5–12. Coach Pawn adapts its language automatically — simpler words for younger kids, real chess vocabulary for older ones." },
        { q: "Does my kid need to know chess already?", a: "Nope. Complete beginners start in Pawn Village. Coach Pawn explains piece movement, captures, check, and more as you play." },
        { q: "Will this replace their chess lessons?", a: "Complement, not replace. For most beginners it provides the same benefit as a $60/hour tutor — real-time feedback adapted to their level. Many families use it between weekly lessons." },
        { q: "How is this different from ChessKid or Dr. Wolf?", a: "ChessKid doesn't coach during gameplay. Dr. Wolf uses pre-written templates and often says 'I can't explain this move.' ChessWhiz uses real AI to generate unique, contextual explanations for every move." },
        { q: "Is it safe for kids?", a: "Yes. No ads, no social features, no chat with strangers, no data collection. The only 'conversation' is with Coach Pawn." },
      ].map((item, i) => (
        <Reveal key={i} delay={i * 50}>
          <FAQItem q={item.q} a={item.a} />
        </Reveal>
      ))}
    </section>
  );
});

// ─── Final CTA — port of scene 7 ────────────────────────────────
const FinalCTA = React.memo(function FinalCTA() {
  const time = useTime();
  const kingY = Math.sin(time * 1.2) * 4;
  return (
    <section
      style={{
        padding: "120px 24px 100px",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}
    >
      <Reveal>
        <div style={{ display: "inline-block", marginBottom: 22, transform: `translateY(${kingY}px)`, filter: "drop-shadow(0 0 32px rgba(252,211,77,0.6))" }}>
          <Piece type="king" color="white" size={140} />
        </div>
      </Reveal>
      <Reveal delay={150}>
        <h2 style={{ margin: "0 0 18px" }}>
          <GoldFoilText fontSize={86} italic>
            ChessWhiz
          </GoldFoilText>
        </h2>
      </Reveal>
      <Reveal delay={300}>
        <p
          style={{
            color: T.textMed,
            fontSize: 18,
            margin: "0 auto 36px",
            maxWidth: 560,
            lineHeight: 1.7,
            fontFamily: T.fontUI,
            letterSpacing: "0.06em",
          }}
        >
          The chess coach your kid always wanted.
        </p>
      </Reveal>
      <Reveal delay={450}>
        <Link
          href="/onboard"
          style={{
            display: "inline-block",
            background: T.goldFoil,
            color: T.inkDeep,
            borderRadius: 16,
            padding: "20px 44px",
            fontSize: 18,
            fontWeight: 800,
            textDecoration: "none",
            fontFamily: T.fontUI,
            letterSpacing: "0.06em",
            boxShadow: T.glowAmber,
          }}
        >
          ✦ Start playing free ✦
        </Link>
        <div
          style={{
            marginTop: 18,
            fontFamily: T.fontHand,
            fontSize: 22,
            color: T.amberSoft,
            transform: "rotate(-1deg)",
          }}
        >
          $4.99/mo · cancel anytime · safe for kids
        </div>
      </Reveal>
    </section>
  );
});

// ─── Top nav ─────────────────────────────────────────────────────
function Nav({ scrolled }: { scrolled: boolean }) {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: "all 500ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: scrolled ? "10px 24px" : "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: scrolled ? "rgba(7,5,15,0.78)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "none",
          borderBottom: scrolled ? `1px solid ${T.border}` : "none",
          borderRadius: scrolled ? "0 0 18px 18px" : 0,
          transition: "all 500ms cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: T.goldFoil,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: T.glowAmber,
            }}
          >
            <Piece type="king" color="white" size={26} />
          </div>
          <GoldFoilText fontSize={22} italic>
            ChessWhiz
          </GoldFoilText>
        </Link>
        <Link
          href="/onboard"
          style={{
            background: T.goldFoil,
            color: T.inkDeep,
            border: "none",
            borderRadius: 12,
            padding: "10px 22px",
            fontSize: 13,
            fontWeight: 800,
            textDecoration: "none",
            fontFamily: T.fontUI,
            boxShadow: "0 4px 14px rgba(245,182,56,0.4)",
            letterSpacing: "0.05em",
          }}
        >
          ✦ Play Free
        </Link>
      </div>
    </nav>
  );
}

// ─── Main page ───────────────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        background: T.bgRadial,
        color: T.textHi,
        fontFamily: T.fontUI,
        minHeight: "100vh",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Schema.org structured data — improves Google rich snippets
          and gives AI search crawlers (GPTBot, ClaudeBot, PerplexityBot)
          a structured product description to cite. */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "ChessWhiz",
            applicationCategory: "EducationalApplication",
            operatingSystem: "Web",
            description:
              "Free AI chess coach that plays alongside your child and explains every move in their language. Ages 5–12.",
            url: "https://chesswhiz.vercel.app",
            audience: { "@type": "PeopleAudience", suggestedMinAge: 5, suggestedMaxAge: 12 },
            offers: [
              {
                "@type": "Offer",
                name: "Free",
                price: "0",
                priceCurrency: "USD",
                description: "3 games per day, basic coaching, Pawn Village kingdom.",
              },
              {
                "@type": "Offer",
                name: "Champion",
                price: "4.99",
                priceCurrency: "USD",
                description:
                  "Unlimited games, all 7 kingdoms, 20 Powers, Knight Card, missions, parent dashboard.",
                eligibleDuration: { "@type": "QuantitativeValue", unitCode: "MON", value: 1 },
              },
            ],
            featureList: [
              "Real-time AI coaching from Coach Pawn (powered by Claude)",
              "Voice narration via ElevenLabs",
              "Visual board annotations synced to coach voice",
              "7-region Chess Kingdom progression",
              "Boss battles and collectible Powers",
              "Shareable Knight Card profile",
            ],
          }),
        }}
      />

      {/* Cosmic atmosphere — global, behind everything */}
      <StarField count={120} seed={1} opacity={0.55} />
      <MoteField count={20} seed={2} color={T.amberGlow} />

      <Nav scrolled={scrolled} />
      <Hero />
      <CoachingShowcase />
      <JourneySection />
      <ComparisonSection />
      <MakerNote />
      <Pricing />
      <FAQ />
      <FinalCTA />

      {/* Footer */}
      <footer
        style={{
          padding: "40px 24px 32px",
          maxWidth: 1100,
          margin: "0 auto",
          borderTop: `1px solid ${T.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Piece type="king" color="white" size={26} />
          <GoldFoilText fontSize={18} italic>
            ChessWhiz
          </GoldFoilText>
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          <Link href="/journey" style={{ color: T.textLo, fontSize: 13, textDecoration: "none", fontFamily: T.fontUI }}>
            Journey
          </Link>
          <Link href="/how-it-works" style={{ color: T.textLo, fontSize: 13, textDecoration: "none", fontFamily: T.fontUI }}>
            How it works
          </Link>
          <Link href="/privacy" style={{ color: T.textLo, fontSize: 13, textDecoration: "none", fontFamily: T.fontUI }}>
            Privacy
          </Link>
          <Link href="/terms" style={{ color: T.textLo, fontSize: 13, textDecoration: "none", fontFamily: T.fontUI }}>
            Terms
          </Link>
          <a
            href="mailto:hello@chesswhiz.com"
            style={{ color: T.textLo, fontSize: 13, textDecoration: "none", fontFamily: T.fontUI }}
          >
            Contact
          </a>
        </div>
        <div style={{ color: T.textDim, fontSize: 12, fontFamily: T.fontUI }}>
          Made with ♟ in Texas · © 2026
        </div>
      </footer>
    </div>
  );
}
