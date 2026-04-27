"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { T, KINGDOM_COLORS } from "@/lib/design/tokens";
import { GoldFoilText, MoteField, WarmDust, useTime, animate, Easing, usePrefersReducedMotion } from "@/lib/design/atmosphere";
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
  const reducedMotion = usePrefersReducedMotion();
  const transforms: Record<string, string> = {
    up: "translateY(32px)",
    down: "translateY(-24px)",
    left: "translateX(40px)",
    right: "translateX(-40px)",
    scale: "scale(0.96)",
  };
  if (reducedMotion) {
    return <div ref={ref} style={style}>{children}</div>;
  }
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0) scale(1)" : transforms[direction],
        transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────
const Hero = React.memo(function Hero() {
  const time = useTime();
  const knightY = Math.sin(time * 1.1) * 7;
  const knightRot = Math.sin(time * 0.45) * 4;
  const queenY = Math.sin(time * 1.3 + 1) * 6;

  return (
    <section
      style={{
        position: "relative",
        minHeight: "min(860px, 100dvh)",
        padding: "110px 24px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      {/* Warm radial glow behind content */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "45%",
          transform: "translate(-50%, -50%)",
          width: "min(95vw, 800px)",
          height: "min(95vw, 600px)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,180,122,0.22) 0%, rgba(255,107,90,0.10) 45%, transparent 70%)",
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      {/* Floating pieces — left and right decoration */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "max(5%, 24px)",
          top: "28%",
          transform: `translateY(${-knightY}px) rotate(${-knightRot - 8}deg)`,
          opacity: 0.65,
        }}
      >
        <Piece type="knight" color="white" size={110} />
      </div>
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: "max(5%, 24px)",
          top: "34%",
          transform: `translateY(${queenY}px) rotate(${knightRot + 6}deg)`,
          opacity: 0.65,
        }}
      >
        <Piece type="bishop" color="black" size={95} />
      </div>

      {/* Eyebrow */}
      <Reveal delay={100}>
        <span
          style={{
            display: "inline-block",
            fontFamily: T.fontUI,
            fontSize: 12,
            fontWeight: 800,
            color: T.coral,
            letterSpacing: "0.36em",
            textTransform: "uppercase",
            paddingLeft: "0.4em",
            marginBottom: 18,
            background: "rgba(255,107,90,0.09)",
            border: "1.5px solid rgba(255,107,90,0.28)",
            borderRadius: 100,
            padding: "6px 18px",
          }}
        >
          Story Mode · 7 Kingdoms
        </span>
      </Reveal>

      {/* Brand wordmark */}
      <Reveal delay={250} style={{ zIndex: 1 }}>
        <h1 style={{ margin: "0 0 4px", lineHeight: 0.95 }}>
          <span
            style={{
              fontFamily: T.fontDisplay,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(72px, 11vw, 140px)",
              letterSpacing: "-0.03em",
              color: T.ink,
              lineHeight: 1,
              display: "inline",
            }}
          >
            Chess
          </span>
          <span
            style={{
              fontFamily: T.fontDisplay,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(72px, 11vw, 140px)",
              letterSpacing: "-0.03em",
              color: T.coral,
              lineHeight: 1,
              display: "inline",
            }}
          >
            Whiz
          </span>
        </h1>
      </Reveal>

      {/* Handwritten tagline */}
      <Reveal delay={500} style={{ zIndex: 1 }}>
        <div
          style={{
            fontFamily: T.fontHand,
            fontSize: "clamp(22px, 3.5vw, 40px)",
            color: T.sageDeep,
            marginTop: 8,
            transform: "rotate(-1.5deg)",
            display: "inline-block",
          }}
        >
          a coach for every age, every level.
        </div>
      </Reveal>

      {/* Sub-pitch */}
      <Reveal delay={700} style={{ zIndex: 1 }}>
        <p
          style={{
            marginTop: 22,
            maxWidth: 540,
            fontSize: 17,
            lineHeight: 1.72,
            color: T.inkLow,
            fontFamily: T.fontUI,
          }}
        >
          The chess coach your kid always wanted — patient, encouraging, and powered by Claude. Plays alongside your child, explains every move in their language, and adapts to their age.
        </p>
      </Reveal>

      {/* CTA */}
      <Reveal delay={900} style={{ zIndex: 1 }}>
        <div
          style={{
            marginTop: 34,
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
              padding: "18px 44px",
              background: T.coral,
              borderRadius: 100,
              fontFamily: T.fontUI,
              fontSize: 17,
              fontWeight: 800,
              color: "#FFFCF5",
              letterSpacing: "0.02em",
              textDecoration: "none",
              boxShadow: T.glowCoral,
              transition: "transform 150ms ease, box-shadow 150ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 28px rgba(255,107,90,0.65), 0 0 60px rgba(255,107,90,0.30)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = T.glowCoral;
            }}
          >
            Start playing free →
          </Link>
          <span
            style={{
              fontSize: 13,
              color: T.inkDim,
              fontFamily: T.fontUI,
            }}
          >
            No signup · Ready in 10 seconds
          </span>
        </div>
      </Reveal>

      {/* Trust badges */}
      <Reveal delay={1100} style={{ zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            gap: 28,
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
              <span style={{ fontSize: 18, color: T.coral }}>{b.icon}</span>
              <span
                style={{
                  fontSize: 13,
                  color: T.inkLow,
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

// ─── Coaching showcase ─────────────────────────────────────────────
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
      {/* Section divider */}
      <div
        style={{
          width: 60,
          height: 3,
          background: T.coral,
          borderRadius: 2,
          margin: "0 auto 24px",
          opacity: 0.7,
        }}
      />
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 10 }}>
          <span
            style={{
              fontFamily: T.fontUI,
              fontSize: 12,
              fontWeight: 800,
              color: T.coral,
              letterSpacing: "0.38em",
              textTransform: "uppercase",
              paddingLeft: "0.4em",
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
            fontFamily: T.fontDisplay,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(34px, 5vw, 58px)",
            letterSpacing: "-0.02em",
            color: T.ink,
          }}
        >
          Coach Pawn talks back
        </h2>
      </Reveal>
      <Reveal delay={200}>
        <p
          style={{
            textAlign: "center",
            margin: "0 auto 56px",
            maxWidth: 540,
            fontFamily: T.fontUI,
            fontSize: 16,
            lineHeight: 1.72,
            color: T.inkLow,
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
          <CoachPawn size={240} expression="talking" mode="kid" />
        </Reveal>
        <Reveal delay={500} direction="left">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 460 }}>
            <SpeechBubble
              text={
                <>
                  <strong style={{ color: T.sageDeep }}>Nice!</strong> Your bishop on c4 is aiming right at f7 — the square next to the black king. That&apos;s smart pressure!
                </>
              }
              width={460}
              tail="left"
            />
            {/* Correction bubble */}
            <div
              style={{
                background: "#FFFCF5",
                border: `1.5px solid rgba(255,107,90,0.35)`,
                borderRadius: 18,
                padding: "16px 22px",
                position: "relative",
                boxShadow: "0 4px 14px rgba(255,107,90,0.12)",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  left: -11,
                  top: 18,
                  width: 0,
                  height: 0,
                  borderTop: "10px solid transparent",
                  borderBottom: "10px solid transparent",
                  borderRight: "13px solid rgba(255,107,90,0.35)",
                }}
              />
              <p style={{ margin: 0, fontFamily: T.fontUI, fontSize: 15, lineHeight: 1.55, color: T.ink }}>
                <strong style={{ color: T.coral }}>Uh oh!</strong> The black knight is eyeing your e5 pawn. Defend or move it.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
});

// ─── Journey section ───────────────────────────────────────────────
const JourneySection = React.memo(function JourneySection() {
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
        background: "linear-gradient(180deg, #FBF6EC 0%, #F5ECDC 100%)",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            width: 60,
            height: 3,
            background: T.sage,
            borderRadius: 2,
            margin: "0 auto 24px",
            opacity: 0.7,
          }}
        />
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <span
              style={{
                fontFamily: T.fontUI,
                fontSize: 12,
                fontWeight: 800,
                color: T.sageDeep,
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                paddingLeft: "0.4em",
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
              fontFamily: T.fontDisplay,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(32px, 5vw, 60px)",
              letterSpacing: "-0.02em",
              color: T.ink,
            }}
          >
            An adventure from Pawn to King
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
              lineHeight: 1.72,
              color: T.inkLow,
            }}
          >
            Your kid travels through 7 kingdoms, defeats boss characters, earns Powers, and levels up — all while learning real chess.
          </p>
        </Reveal>

        {/* Kingdom path */}
        <Reveal delay={300}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 56,
            }}
          >
            {KINGDOMS_PREVIEW.map((k, i) => {
              const active = i === 0;
              const accent = KINGDOM_COLORS[k.id] ?? T.coral;
              return (
                <React.Fragment key={k.id}>
                  <div
                    style={{
                      borderRadius: 14,
                      padding: "14px 16px",
                      background: active ? "#FFFCF5" : "rgba(31,42,68,0.04)",
                      border: `2px solid ${active ? accent : T.border}`,
                      boxShadow: active ? `0 0 18px ${accent}40` : "none",
                      textAlign: "center",
                      minWidth: 88,
                      opacity: active ? 1 : 0.5,
                    }}
                  >
                    <div style={{ fontSize: 26, lineHeight: 1 }}>{k.emoji}</div>
                    <div
                      style={{
                        marginTop: 4,
                        fontFamily: T.fontUI,
                        fontSize: 11,
                        fontWeight: 700,
                        color: active ? accent : T.inkDim,
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
                        width: 16,
                        height: 2,
                        background: i === 0 ? T.coral : T.border,
                        opacity: i === 0 ? 0.7 : 0.35,
                        borderRadius: 1,
                      }}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </Reveal>

        {/* Three feature pillars */}
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
              tone: T.coral,
              icon: "♞",
              copy: "Each region has a boss who uses that tactic against your kid. Defeat them to master the skill.",
              quote: "Hehe! We got your rook AND your queen!",
              quoteSpeaker: "The Knight Twins",
            },
            {
              title: "Earn Powers",
              tone: T.butter,
              icon: "⚡",
              copy: "Apply a tactic in a real game to earn a Power — not a badge, an ability you proved.",
              chips: [
                { icon: "🍴", label: "Fork Master", color: T.sage },
                { icon: "📌", label: "Pin Wizard", color: T.sky },
                { icon: "💀", label: "Back Rank Hero", color: T.coral },
                { icon: "⚡", label: "Double Trouble", color: T.butter },
              ],
            },
            {
              title: "Knight Card",
              tone: T.sage,
              icon: "🃏",
              copy: "Your kid's shareable chess identity — rank, bosses defeated, powers earned. The new playground flex.",
              card: { name: "Aarav", rank: "Knight" },
            },
          ].map((p, i) => (
            <Reveal key={p.title} delay={100 * i}>
              <div
                style={{
                  background: "#FFFCF5",
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 24,
                  padding: 26,
                  height: "100%",
                  boxShadow: T.shadowSoft,
                }}
              >
                <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 10 }}>{p.icon}</div>
                <h3
                  style={{
                    fontFamily: T.fontDisplay,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: 24,
                    color: p.tone,
                    margin: "0 0 10px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontFamily: T.fontUI,
                    fontSize: 14,
                    lineHeight: 1.68,
                    color: T.inkLow,
                    margin: "0 0 16px",
                  }}
                >
                  {p.copy}
                </p>
                {p.quote && (
                  <div
                    style={{
                      background: "rgba(255,107,90,0.07)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    <div style={{ fontFamily: T.fontUI, fontSize: 12, fontWeight: 700, color: T.ink }}>
                      {p.quoteSpeaker}
                    </div>
                    <div
                      style={{
                        fontFamily: T.fontHand,
                        fontSize: 17,
                        color: T.inkLow,
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
                          padding: "5px 10px",
                          borderRadius: 100,
                          background: `${c.color}22`,
                          border: `1.5px solid ${c.color}66`,
                          fontFamily: T.fontUI,
                          fontSize: 11,
                          fontWeight: 700,
                          color: c.color === T.butter ? T.butterDeep : c.color,
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
                      background: "linear-gradient(160deg, #FFFCF5 0%, #F5E9C9 100%)",
                      borderRadius: 14,
                      padding: "12px 14px",
                      border: `1px solid ${T.borderCard}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      boxShadow: T.shadowSoft,
                    }}
                  >
                    <Piece type="knight" color="white" size={36} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontFamily: T.fontUI,
                          fontSize: 9,
                          fontWeight: 800,
                          color: T.inkLow,
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
                          fontSize: 20,
                          fontWeight: 400,
                          color: T.ink,
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
                color: T.coral,
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
    </section>
  );
});

// ─── Comparison section ────────────────────────────────────────────
const ComparisonSection = React.memo(function ComparisonSection() {
  return (
    <section style={{ padding: "100px 24px", maxWidth: 960, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <div
        style={{
          width: 60,
          height: 3,
          background: T.sky,
          borderRadius: 2,
          margin: "0 auto 24px",
          opacity: 0.7,
        }}
      />
      <Reveal>
        <h2
          style={{
            textAlign: "center",
            margin: "0 0 48px",
            fontFamily: T.fontDisplay,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(28px, 4vw, 46px)",
            letterSpacing: "-0.02em",
            color: T.ink,
          }}
        >
          The moment that matters most
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
              background: "rgba(31,42,68,0.04)",
              border: `1px solid ${T.border}`,
              borderRadius: 22,
              padding: "26px 24px",
              opacity: 0.72,
            }}
          >
            <div
              style={{
                fontFamily: T.fontUI,
                fontSize: 11,
                fontWeight: 700,
                color: T.inkDim,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Other chess apps
            </div>
            <div
              style={{
                background: "#FFFCF5",
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: "14px 16px",
                fontFamily: T.fontUI,
                fontSize: 14,
                lineHeight: 1.6,
                color: T.inkLow,
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
                color: T.inkDim,
              }}
            >
              🤷 Same canned response. Every time.
            </div>
          </div>

          {/* ChessWhiz */}
          <div
            style={{
              background: "linear-gradient(160deg, rgba(124,182,158,0.08) 0%, rgba(124,182,158,0.04) 100%)",
              border: `2px solid ${T.sage}`,
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
                color: T.sageDeep,
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
                background: "#FFFCF5",
                border: `1px solid rgba(124,182,158,0.4)`,
                borderRadius: 12,
                padding: "14px 16px",
                fontFamily: T.fontUI,
                fontSize: 14,
                lineHeight: 1.65,
                color: T.ink,
              }}
            >
              &ldquo;Your knight is doing two jobs at once — protecting your pawn AND watching the center. That&apos;s called coordination! 🤝&rdquo;
            </div>
            <div
              style={{
                marginTop: 14,
                fontFamily: T.fontUI,
                fontSize: 12,
                color: T.sageDeep,
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

// ─── Note from the maker ───────────────────────────────────────────
const MakerNote = React.memo(function MakerNote() {
  return (
    <section style={{ padding: "80px 24px", maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <Reveal>
        <div
          style={{
            background: "#FFFCF5",
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
              fontSize: 22,
              color: T.coral,
              transform: "rotate(-1.5deg)",
              display: "inline-block",
              marginBottom: 10,
            }}
          >
            a note from the maker →
          </span>
          <p
            style={{
              fontFamily: T.fontUI,
              fontSize: 17,
              lineHeight: 1.8,
              color: T.ink,
              margin: "8px 0 22px",
            }}
          >
            ChessWhiz launched in <strong style={{ color: T.coral }}>April 2026</strong>. Built by a chess dad in Texas for his own kids — and now for yours. No fake testimonials. No paid reviews. Just a tool I wish I&apos;d had.
          </p>
          <Link
            href="/onboard"
            style={{
              display: "inline-block",
              background: T.coral,
              color: "#FFFCF5",
              borderRadius: 100,
              padding: "14px 32px",
              fontSize: 15,
              fontWeight: 800,
              textDecoration: "none",
              fontFamily: T.fontUI,
              letterSpacing: "0.03em",
              boxShadow: T.glowCoral,
            }}
          >
            Try it free — be an early family
          </Link>
          <div
            style={{
              marginTop: 14,
              fontSize: 12,
              color: T.inkDim,
              fontFamily: T.fontUI,
            }}
          >
            <a href="mailto:hello@chesswhiz.com" style={{ color: T.inkLow, textDecoration: "underline" }}>
              hello@chesswhiz.com
            </a>{" "}
            · I read every email
          </div>
        </div>
      </Reveal>
    </section>
  );
});

// ─── Pricing ──────────────────────────────────────────────────────
const Pricing = React.memo(function Pricing() {
  return (
    <section style={{ padding: "80px 24px", maxWidth: 580, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <Reveal>
        <h2
          style={{
            textAlign: "center",
            margin: "0 0 10px",
            fontFamily: T.fontDisplay,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(28px, 4vw, 40px)",
            letterSpacing: "-0.02em",
            color: T.ink,
          }}
        >
          Start free. Unlock the kingdom.
        </h2>
        <p
          style={{
            textAlign: "center",
            color: T.inkDim,
            fontSize: 14,
            margin: "0 0 34px",
            fontFamily: T.fontUI,
          }}
        >
          No credit card required. No tricks.
        </p>
      </Reveal>

      <Reveal delay={150}>
        <div
          style={{
            background: "#FFFCF5",
            borderRadius: 26,
            overflow: "hidden",
            border: `1.5px solid ${T.border}`,
            boxShadow: T.shadowDeep,
          }}
        >
          {/* Free tier */}
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
                    fontWeight: 400,
                    fontSize: 22,
                    color: T.ink,
                    margin: "0 0 4px",
                  }}
                >
                  Free
                </h3>
                <p style={{ margin: 0, fontFamily: T.fontUI, fontSize: 13, color: T.inkLow }}>
                  A taste of the kingdom — perfect for getting started
                </p>
              </div>
              <span
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  fontWeight: 400,
                  fontSize: 32,
                  color: T.ink,
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
                    color: f.ok ? T.ink : T.inkDim,
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: f.ok ? T.sage : "rgba(31,42,68,0.07)",
                      color: f.ok ? "#FFFCF5" : T.inkDim,
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

          {/* Champion tier */}
          <div
            style={{
              padding: "32px",
              background: "linear-gradient(160deg, rgba(255,107,90,0.07) 0%, rgba(242,201,76,0.06) 100%)",
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: T.coral,
                color: "#FFFCF5",
                borderRadius: 100,
                padding: "4px 14px",
                fontSize: 11,
                fontWeight: 800,
                marginBottom: 16,
                fontFamily: T.fontUI,
                letterSpacing: "0.14em",
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
                    fontWeight: 400,
                    fontSize: 22,
                    color: T.ink,
                    margin: "0 0 4px",
                  }}
                >
                  Champion
                </h3>
                <p style={{ margin: 0, fontFamily: T.fontUI, fontSize: 13, color: T.inkLow }}>
                  The full Chess Kingdom — all 7 regions, all bosses
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 20 }}>
                <span
                  style={{
                    fontFamily: T.fontDisplay,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: 36,
                    color: T.coral,
                  }}
                >
                  $4.99
                </span>
                <span style={{ fontSize: 13, color: T.inkLow, fontFamily: T.fontUI }}>/mo</span>
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
                    color: T.ink,
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: T.coral,
                      color: "#FFFCF5",
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
                borderRadius: 100,
                background: T.coral,
                color: "#FFFCF5",
                border: "none",
                fontSize: 16,
                fontWeight: 800,
                fontFamily: T.fontUI,
                textDecoration: "none",
                textAlign: "center",
                boxShadow: T.glowCoral,
                letterSpacing: "0.04em",
              }}
            >
              Start 7-day free trial →
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
});

// ─── FAQ ──────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${T.border}`, padding: "16px 0" }}>
      <button type="button"
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
            color: T.ink,
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
            color: T.coral,
            fontSize: 20,
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
            color: T.inkLow,
            lineHeight: 1.72,
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
            margin: "0 0 28px",
            fontFamily: T.fontDisplay,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(24px, 3.5vw, 34px)",
            letterSpacing: "-0.02em",
            color: T.ink,
          }}
        >
          Questions? We&apos;ve got answers.
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

// ─── Final CTA ─────────────────────────────────────────────────────
const FinalCTA = React.memo(function FinalCTA() {
  const time = useTime();
  const knightY = Math.sin(time * 1.1) * 5;
  return (
    <section
      style={{
        padding: "120px 24px 100px",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
        background: "linear-gradient(180deg, #FBF6EC 0%, #F5ECDC 100%)",
      }}
    >
      <Reveal>
        <div
          style={{
            display: "inline-block",
            marginBottom: 20,
            transform: `translateY(${knightY}px)`,
            filter: "drop-shadow(0 6px 20px rgba(255,107,90,0.35))",
          }}
        >
          <Piece type="king" color="white" size={130} />
        </div>
      </Reveal>
      <Reveal delay={150}>
        <h2
          style={{
            margin: "0 0 6px",
            fontFamily: T.fontDisplay,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(60px, 10vw, 120px)",
            letterSpacing: "-0.03em",
            color: T.ink,
            lineHeight: 1,
          }}
        >
          Chess<span style={{ color: T.coral }}>Whiz</span>
        </h2>
      </Reveal>
      <Reveal delay={300}>
        <div
          style={{
            fontFamily: T.fontHand,
            fontSize: "clamp(22px, 3vw, 38px)",
            color: T.sageDeep,
            marginBottom: 36,
            transform: "rotate(-1deg)",
            display: "inline-block",
          }}
        >
          Chess that meets you where you are.
        </div>
      </Reveal>
      <Reveal delay={450}>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/onboard"
            style={{
              display: "inline-block",
              background: T.coral,
              color: "#FFFCF5",
              borderRadius: 100,
              padding: "18px 44px",
              fontSize: 18,
              fontWeight: 800,
              textDecoration: "none",
              fontFamily: T.fontUI,
              letterSpacing: "0.03em",
              boxShadow: T.glowCoral,
            }}
          >
            Start free →
          </Link>
          <Link
            href="/journey"
            style={{
              display: "inline-block",
              border: `2px solid ${T.ink}`,
              color: T.ink,
              borderRadius: 100,
              padding: "18px 44px",
              fontSize: 18,
              fontWeight: 800,
              textDecoration: "none",
              fontFamily: T.fontUI,
            }}
          >
            Watch a lesson
          </Link>
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: T.fontHand,
            fontSize: 22,
            color: T.inkLow,
            transform: "rotate(-1deg)",
            display: "inline-block",
          }}
        >
          $4.99/mo · cancel anytime · safe for kids
        </div>
      </Reveal>
    </section>
  );
});

// ─── Nav ───────────────────────────────────────────────────────────
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
          background: scrolled ? "rgba(251,246,236,0.88)" : "transparent",
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
              background: T.coral,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: T.glowCoral,
            }}
          >
            <Piece type="king" color="white" size={24} />
          </div>
          <span
            style={{
              fontFamily: T.fontDisplay,
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 22,
              letterSpacing: "-0.02em",
              color: T.ink,
              lineHeight: 1,
            }}
          >
            Chess<span style={{ color: T.coral }}>Whiz</span>
          </span>
        </Link>
        <Link
          href="/onboard"
          style={{
            background: T.coral,
            color: "#FFFCF5",
            border: "none",
            borderRadius: 100,
            padding: "10px 22px",
            fontSize: 13,
            fontWeight: 800,
            textDecoration: "none",
            fontFamily: T.fontUI,
            boxShadow: "0 4px 14px rgba(255,107,90,0.35)",
            letterSpacing: "0.04em",
          }}
        >
          Play Free →
        </Link>
      </div>
    </nav>
  );
}

// ─── Main page ──────────────────────────────────────────────────────
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
        color: T.ink,
        fontFamily: T.fontUI,
        minHeight: "100vh",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Schema.org structured data */}
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

      {/* Warm ambient floating motes */}
      <MoteField count={16} seed={2} color={T.coral} />
      <WarmDust count={25} seed={8} opacity={0.035} />

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
          <Piece type="king" color="white" size={24} />
          <span
            style={{
              fontFamily: T.fontDisplay,
              fontStyle: "italic",
              fontSize: 20,
              color: T.ink,
              letterSpacing: "-0.02em",
            }}
          >
            Chess<span style={{ color: T.coral }}>Whiz</span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          {[
            { href: "/journey", label: "Journey" },
            { href: "/how-it-works", label: "How it works" },
            { href: "/privacy", label: "Privacy" },
            { href: "/terms", label: "Terms" },
            { href: "mailto:hello@chesswhiz.com", label: "Contact" },
          ].map((l) => (
            <Link key={l.href} href={l.href} style={{ color: T.inkDim, fontSize: 13, textDecoration: "none", fontFamily: T.fontUI }}>
              {l.label}
            </Link>
          ))}
        </div>
        <div style={{ color: T.inkDim, fontSize: 12, fontFamily: T.fontUI }}>
          Made with ♟ in Texas · © 2026
        </div>
      </footer>
    </div>
  );
}
