"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";

// ── Palette ──────────────────────────────────────────
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
  emeraldGlow: "rgba(27,115,64,0.12)",
  gold: "#C7940A",
  goldLight: "#F0D060",
  goldPale: "#FDF6E3",
  board1: "#F0D9B5",
  board2: "#B58863",
};

// ── Intersection observer hook ───────────────────────
function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible] as const;
}

// ── Reveal wrapper ────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  direction = "up",
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
  style?: React.CSSProperties;
}) {
  const [ref, visible] = useInView();
  const transforms: Record<string, string> = {
    up: "translateY(50px)",
    down: "translateY(-30px)",
    left: "translateX(60px)",
    right: "translateX(-60px)",
    scale: "scale(0.92)",
  };
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translate(0) scale(1)" : transforms[direction],
      transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      willChange: "opacity, transform",
      ...style,
    }}>{children}</div>
  );
}

// ── Animated counter ─────────────────────────────────
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const [ref, visible] = useInView();
  const started = useRef(false);
  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    const dur = 2000;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── Floating chess pieces background ─────────────────
function ChessAtmosphere() {
  const pieces = useMemo(() => {
    const syms = ["♔","♕","♖","♗","♘","♙","♚","♛","♜","♝","♞","♟"];
    return Array.from({ length: 22 }, (_, i) => ({
      sym: syms[i % syms.length],
      x: 3 + (i * 4.3) % 94,
      y: (i * 4.7) % 100,
      size: 16 + (i * 3.1) % 32,
      opacity: 0.015 + (i * 0.0013) % 0.03,
      speed: 15 + (i * 1.1) % 25,
      delay: (i * 0.47) % 10,
      rotate: -20 + (i * 3.7) % 40,
    }));
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {pieces.map((p, i) => (
        <span key={i} style={{
          position: "absolute",
          left: `${p.x}%`,
          top: `${p.y}%`,
          fontSize: p.size,
          opacity: p.opacity,
          color: P.ink,
          transform: `rotate(${p.rotate}deg)`,
          animation: `drift ${p.speed}s ease-in-out ${p.delay}s infinite alternate`,
        }}>{p.sym}</span>
      ))}
    </div>
  );
}

// ── Hero puzzle (interactive: tap the knight to fork king + queen) ──
function HeroPuzzle() {
  // Initial position: white knight on f3 (r=5,c=5), white pawn e4 (r=4,c=4),
  // black king g8 (r=0,c=6), black queen f8 (r=0,c=5).
  // Solving move: Ne5 lands on r=3,c=4 — forks king (g8) and queen (f8).
  // (Educational simplification: the visual focus is the L-jump + dual attack,
  //  not strict legality of every surrounding piece.)
  const initial = [
    [null,null,null,null,null,"♛","♚",null],
    ["♟","♟",null,null,null,"♟","♟","♟"],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null],
    [null,null,null,null,"♙",null,null,null],
    [null,null,null,null,null,"♘",null,null],
    ["♙","♙","♙",null,null,"♙","♙","♙"],
    ["♖",null,null,null,"♔",null,null,"♖"],
  ];

  const [solved, setSolved] = useState(false);
  const [knightSelected, setKnightSelected] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  // Auto-show hint after 2s if user hasn't engaged
  useEffect(() => {
    const t = setTimeout(() => { if (!solved) setShowHint(true); }, 2000);
    return () => clearTimeout(t);
  }, [solved]);

  const KNIGHT_FROM = { r: 5, c: 5 };
  const KNIGHT_TO   = { r: 3, c: 4 };

  const reset = () => {
    setSolved(false);
    setKnightSelected(false);
    setShowCoach(false);
    setShowHint(true);
  };

  const onSquareClick = (r: number, c: number) => {
    if (solved) return;
    if (!knightSelected && r === KNIGHT_FROM.r && c === KNIGHT_FROM.c) {
      setKnightSelected(true);
      return;
    }
    if (knightSelected && r === KNIGHT_TO.r && c === KNIGHT_TO.c) {
      setSolved(true);
      setKnightSelected(false);
      setTimeout(() => setShowCoach(true), 350);
      return;
    }
    // Click anywhere else cancels selection
    if (knightSelected) setKnightSelected(false);
  };

  // Build current board state
  const board = initial.map((row) => row.slice());
  if (solved) {
    board[KNIGHT_FROM.r][KNIGHT_FROM.c] = null;
    board[KNIGHT_TO.r][KNIGHT_TO.c] = "♘";
  }

  // Legal-move dots for the knight (just the L hops that land on empty squares)
  const knightHops: Array<[number, number]> = [
    [3, 4], [3, 6], [4, 3], [4, 7], [6, 3], [6, 7], [7, 4], [7, 6],
  ];
  const showHops = knightSelected && !solved;

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(8, 40px)",
        gridTemplateRows: "repeat(8, 40px)",
        width: 320, height: 320,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: `0 0 0 2px ${P.parchment}, 0 0 0 4px ${P.inkGhost}, 0 24px 80px rgba(26,18,16,0.25), 0 8px 24px rgba(26,18,16,0.15)`,
      }}>
        {Array.from({ length: 64 }, (_, i) => {
          const r = Math.floor(i / 8), c = i % 8;
          const isLight = (r + c) % 2 === 0;
          const piece = board[r][c];
          const isKnightSquare = !solved && r === KNIGHT_FROM.r && c === KNIGHT_FROM.c;
          const isLanding = solved && r === KNIGHT_TO.r && c === KNIGHT_TO.c;
          const isTarget = !solved && r === KNIGHT_TO.r && c === KNIGHT_TO.c;
          const isHop = showHops && knightHops.some(([hr, hc]) => hr === r && hc === c);
          const isAttacked = solved && ((r === 0 && c === 5) || (r === 0 && c === 6));
          const isHov = hovered === i;

          let bg = isLight ? P.board1 : P.board2;
          if (isKnightSquare) bg = isLight ? "#b5d87a" : "#8cad50";
          if (isLanding) bg = isLight ? "#ffe79e" : "#e8c46d";

          const clickable = !solved && (isKnightSquare || (knightSelected && isHop));

          return (
            <div key={i}
              onClick={() => onSquareClick(r, c)}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              role={clickable ? "button" : undefined}
              aria-label={clickable ? (isKnightSquare ? "Select the white knight" : "Move knight here to fork the king and queen") : undefined}
              style={{
                background: bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
                cursor: clickable ? "pointer" : "default",
                transition: "background 0.3s ease",
              }}
            >
              {isTarget && showHint && !knightSelected && (
                <div aria-hidden style={{
                  position: "absolute", inset: "15%",
                  borderRadius: "50%",
                  background: "rgba(34,197,94,0.2)",
                  border: "2px solid rgba(34,197,94,0.4)",
                  animation: "targetPulse 1.5s ease-in-out infinite",
                }} />
              )}
              {isHop && (
                <div aria-hidden style={{
                  position: "absolute",
                  width: 12, height: 12, borderRadius: "50%",
                  background: r === KNIGHT_TO.r && c === KNIGHT_TO.c ? "rgba(34,197,94,0.7)" : "rgba(26,18,16,0.25)",
                  pointerEvents: "none",
                }} />
              )}
              {isAttacked && (
                <div aria-hidden style={{
                  position: "absolute", inset: 2,
                  borderRadius: 4,
                  border: "2px solid rgba(239,68,68,0.85)",
                  animation: "attackedFlash 0.6s ease-out",
                }} />
              )}
              {piece && (
                <span style={{
                  fontSize: 28, lineHeight: 1,
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.25))",
                  transform: isHov && clickable
                    ? "scale(1.18)"
                    : isKnightSquare && knightSelected
                    ? "scale(1.12)"
                    : isLanding
                    ? "scale(1.1)"
                    : "scale(1)",
                  transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                  display: "block",
                }}>{piece}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Hint annotation — pre-solve */}
      {showHint && !solved && (
        <div style={{
          position: "absolute", top: -28, right: -16,
          animation: "annotationAppear 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",
          opacity: 0,
        }}>
          <span style={{
            fontFamily: "'Caveat', cursive", fontSize: 17, color: P.emerald,
            transform: "rotate(8deg)", display: "inline-block",
            background: `linear-gradient(to right, ${P.emeraldPale}, transparent)`,
            padding: "2px 10px", borderRadius: 6,
          }}>{knightSelected ? "now hop to the green dot!" : "tap the knight! →"}</span>
        </div>
      )}

      {/* Coach Pawn celebration bubble — post-solve */}
      {showCoach && (
        <div style={{
          position: "absolute", bottom: -88, left: -8, right: -8,
          background: "white",
          border: `1.5px solid ${P.emerald}40`,
          borderRadius: "16px 16px 16px 4px",
          padding: "12px 14px",
          boxShadow: "0 12px 32px rgba(26,18,16,0.18)",
          animation: "coachPop 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: P.emeraldPale, border: `1.5px solid ${P.emerald}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, flexShrink: 0,
          }}>♟</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: P.emerald, fontFamily: "var(--font-playfair), serif", letterSpacing: 0.2 }}>Coach Pawn</div>
            <p style={{
              margin: "2px 0 0", fontSize: 13.5, lineHeight: 1.55, color: P.inkSoft,
              fontFamily: "var(--font-nunito), sans-serif",
            }}>
              <strong style={{ color: P.emerald }}>DOUBLE ATTACK!</strong> Your knight checks the king AND attacks the queen at once. That&apos;s a fork! 🍴
            </p>
            <button onClick={reset} style={{
              marginTop: 6, background: "none", border: "none", padding: 0,
              fontSize: 12, color: P.inkLight, cursor: "pointer", fontWeight: 600,
              fontFamily: "var(--font-nunito), sans-serif",
              textDecoration: "underline",
            }}>Try again</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Animated coaching conversation ────────────────────
function CoachConversation() {
  const [step, setStep] = useState(0);
  const [ref, visible] = useInView();

  const msgs = [
    { speaker: "move" as const, text: "You played Bxf7+..." },
    { speaker: "coach" as const, type: "correction", text: "Hold on — your bishop captured the pawn, but now it's stuck deep in enemy territory with no backup! Patience wins games! 🧘" },
    { speaker: "move" as const, text: "You played Nf3 — developing!" },
    { speaker: "coach" as const, type: "praise", text: "Love it! ⭐ Your knight jumped to the perfect square. From f3, it controls the center AND protects your king. Two jobs at once! 🦸" },
  ];

  useEffect(() => {
    if (!visible) return;
    const timers = msgs.map((_, i) =>
      setTimeout(() => setStep(i + 1), [0, 1800, 7000, 8800][i])
    );
    const reset = setTimeout(() => setStep(0), 14000);
    return () => { timers.forEach(clearTimeout); clearTimeout(reset); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const bubbleStyle = (type?: string) => ({
    correction: { bg: "#FFF5EB", border: "#FDBA74" },
    praise: { bg: "#ECFDF5", border: "#86EFAC" },
  })[type as "correction" | "praise"] ?? { bg: P.creamDeep, border: P.inkGhost };

  return (
    <div ref={ref} style={{
      background: "white", borderRadius: 20, padding: "20px",
      boxShadow: `0 8px 40px ${P.inkGhost}40, 0 0 0 1px ${P.inkGhost}`,
      maxWidth: 400, minHeight: 200,
      display: "flex", flexDirection: "column", gap: 12,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: 8, borderBottom: `1px solid ${P.parchment}` }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: P.emeraldPale, display: "flex", alignItems: "center", justifyContent: "center",
          border: `2px solid ${P.emerald}30`, fontSize: 16,
        }}>♟</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: P.ink, fontFamily: "var(--font-baloo), sans-serif" }}>Coach Pawn</div>
          <div style={{ fontSize: 10, color: P.emerald }}>● Online</div>
        </div>
      </div>
      {msgs.slice(0, step).map((msg, i) => {
        if (msg.speaker === "move") {
          return (
            <div key={i} style={{
              alignSelf: "flex-end",
              background: P.ink, color: P.cream,
              borderRadius: "14px 14px 4px 14px",
              padding: "8px 14px", fontSize: 13,
              fontFamily: "var(--font-nunito), sans-serif",
              fontWeight: 500, maxWidth: "70%",
              animation: "msgPop 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            }}>{msg.text}</div>
          );
        }
        const s = bubbleStyle(msg.type);
        return (
          <div key={i} style={{
            background: s.bg, border: `1.5px solid ${s.border}`,
            borderRadius: "4px 14px 14px 14px", padding: "12px 16px",
            maxWidth: "85%", animation: "msgPop 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: P.inkSoft, fontFamily: "var(--font-nunito), sans-serif" }}>{msg.text}</p>
          </div>
        );
      })}
      {step > 0 && step <= msgs.length && msgs[step - 1]?.speaker === "move" && (
        <div style={{ display: "flex", gap: 4, paddingLeft: 4 }}>
          {[0, 1, 2].map(d => (
            <div key={d} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: P.inkFaint,
              animation: `typingDot 1s ease-in-out ${d * 0.2}s infinite`,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Journey kingdom map ───────────────────────────────
const JOURNEY = [
  { id: "village",          icon: "🏘️", name: "Pawn Village",     color: "#8B7355" },
  { id: "fork_forest",      icon: "🌲", name: "Fork Forest",      color: "#22C55E" },
  { id: "pin_palace",       icon: "🏰", name: "Pin Palace",       color: "#3B82F6" },
  { id: "skewer_spire",     icon: "🗼", name: "Skewer Spire",     color: "#EF4444" },
  { id: "discovery_depths", icon: "⛰️", name: "Discovery Depths", color: "#F97316" },
  { id: "strategy_summit",  icon: "🏔️", name: "Strategy Summit",  color: "#A855F7" },
  { id: "endgame_throne",   icon: "👑", name: "Endgame Throne",   color: "#EAB308" },
];

const JOURNEY_POWERS = [
  { icon: "🍴", name: "Fork Master",    rarity: "rare" },
  { icon: "📌", name: "Pin Wizard",     rarity: "rare" },
  { icon: "🗡️", name: "Skewer King",    rarity: "rare" },
  { icon: "💀", name: "Back Rank Hero", rarity: "epic" },
  { icon: "⚡", name: "Double Trouble", rarity: "legendary" },
];

function JourneySection() {
  const [activeKingdom, setActiveKingdom] = useState(1); // Fork Forest preselected
  const cur = JOURNEY[activeKingdom];

  return (
    <section style={{
      padding: "80px 20px 100px",
      background: "linear-gradient(180deg, #0B1120 0%, #131C30 100%)",
      position: "relative", zIndex: 1,
      overflow: "hidden",
    }}>
      {/* Starfield-style atmosphere */}
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `radial-gradient(circle at 20% 30%, rgba(199,148,10,0.12) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(27,115,64,0.10) 0%, transparent 45%)`,
      }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <span style={{
              fontFamily: "'Caveat', cursive", fontSize: 19, color: P.goldLight,
              display: "block", marginBottom: 8,
            }}>the real product →</span>
            <h2 style={{
              fontSize: "clamp(32px, 5vw, 50px)", fontWeight: 900,
              fontFamily: "var(--font-playfair), serif",
              color: "#FBF7F0", margin: 0, letterSpacing: -1,
            }}>The Chess Kingdom</h2>
            <p style={{
              fontFamily: "'Caveat', cursive", fontSize: 22,
              color: P.goldLight, margin: "8px 0 0",
            }}>a quest from Pawn to King</p>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <p style={{
            textAlign: "center",
            color: "rgba(251,247,240,0.65)", fontSize: 16, lineHeight: 1.7,
            maxWidth: 580, margin: "20px auto 56px",
            fontFamily: "var(--font-nunito), sans-serif",
          }}>
            Your kid doesn&apos;t just play games. They travel through 7 regions, defeat boss characters who use real chess tactics against them, earn collectible Powers, and level up from Pawn to King.
          </p>
        </Reveal>

        {/* Kingdom map — connected nodes */}
        <Reveal delay={250}>
          <div style={{
            position: "relative",
            padding: "20px 0 40px",
          }}>
            {/* Connecting line */}
            <div aria-hidden style={{
              position: "absolute", left: "5%", right: "5%", top: 56,
              height: 2, background: `linear-gradient(90deg, ${JOURNEY[0].color}40, ${JOURNEY[3].color}40, ${JOURNEY[6].color}40)`,
              zIndex: 0,
            }} />
            <div style={{
              position: "relative",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              gap: 4, flexWrap: "nowrap",
              overflowX: "auto", paddingBottom: 8,
            }}>
              {JOURNEY.map((k, i) => {
                const isCur = i === activeKingdom;
                return (
                  <button
                    key={k.id}
                    onClick={() => setActiveKingdom(i)}
                    aria-pressed={isCur}
                    aria-label={`${k.name} — region ${i + 1} of 7`}
                    style={{
                      flex: "0 0 auto",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                      background: "transparent", border: "none", cursor: "pointer",
                      padding: 4,
                      fontFamily: "inherit", color: "inherit",
                    }}
                  >
                    <div style={{
                      width: 56, height: 56, borderRadius: "50%",
                      background: isCur
                        ? `radial-gradient(circle at 35% 30%, ${k.color}, #0B1120 90%)`
                        : "#1A2540",
                      border: `2px solid ${isCur ? k.color : "#2C3956"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 26, lineHeight: 1,
                      boxShadow: isCur ? `0 0 0 4px ${k.color}25, 0 0 30px ${k.color}50` : "none",
                      transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                      transform: isCur ? "scale(1.08)" : "scale(1)",
                      animation: isCur ? "kingdomPulse 2.4s ease-in-out infinite" : "none",
                    }}>{k.icon}</div>
                    <span style={{
                      fontSize: 10, fontWeight: 800,
                      color: isCur ? k.color : "rgba(251,247,240,0.45)",
                      letterSpacing: 0.5, textTransform: "uppercase",
                      fontFamily: "var(--font-nunito), sans-serif",
                      textAlign: "center", maxWidth: 80,
                      transition: "color 0.3s ease",
                    }}>{k.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        {/* Three pillars: Bosses · Powers · Knight Card */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20, marginTop: 32,
        }}>
          {/* BOSSES */}
          <Reveal delay={100}>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${cur.color}40`,
              borderRadius: 18, padding: "24px 22px",
              backdropFilter: "blur(8px)",
              minHeight: 240,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: cur.color,
                letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 10,
              }}>01 · Bosses</div>
              <h3 style={{
                fontSize: 20, fontWeight: 900, color: "#FBF7F0",
                fontFamily: "var(--font-playfair), serif", margin: "0 0 10px",
              }}>Each region has a boss.</h3>
              <p style={{
                fontSize: 14, lineHeight: 1.7, color: "rgba(251,247,240,0.65)",
                margin: "0 0 16px", fontFamily: "var(--font-nunito), sans-serif",
              }}>They use that region&apos;s tactic against your kid. Defeat them to master the skill.</p>
              <div style={{
                background: "rgba(0,0,0,0.25)",
                border: `1px solid ${cur.color}30`,
                borderRadius: 12, padding: "12px 14px",
                display: "flex", alignItems: "flex-start", gap: 10,
              }}>
                <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>♞♞</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 800, color: "#FBF7F0",
                    fontFamily: "var(--font-playfair), serif",
                  }}>The Knight Twins</div>
                  <div style={{
                    fontSize: 12, lineHeight: 1.55, color: "rgba(251,247,240,0.55)",
                    fontStyle: "italic", marginTop: 4,
                    fontFamily: "var(--font-nunito), sans-serif",
                  }}>&ldquo;Hehe! We got your rook AND your queen!&rdquo;</div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* POWERS */}
          <Reveal delay={200}>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${P.goldLight}40`,
              borderRadius: 18, padding: "24px 22px",
              backdropFilter: "blur(8px)",
              minHeight: 240,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: P.goldLight,
                letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 10,
              }}>02 · Powers</div>
              <h3 style={{
                fontSize: 20, fontWeight: 900, color: "#FBF7F0",
                fontFamily: "var(--font-playfair), serif", margin: "0 0 10px",
              }}>Apply tactics, earn Powers.</h3>
              <p style={{
                fontSize: 14, lineHeight: 1.7, color: "rgba(251,247,240,0.65)",
                margin: "0 0 16px", fontFamily: "var(--font-nunito), sans-serif",
              }}>Not badges — abilities. Use a fork in a real game and you earn Fork Master.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {JOURNEY_POWERS.map((p) => (
                  <span key={p.name} title={p.name} style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "5px 9px", borderRadius: 8,
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${p.rarity === "legendary" ? P.goldLight : p.rarity === "epic" ? "#A855F7" : "rgba(255,255,255,0.15)"}50`,
                    fontSize: 12, color: "#FBF7F0", fontWeight: 700,
                    fontFamily: "var(--font-nunito), sans-serif",
                  }}>
                    <span style={{ fontSize: 13 }}>{p.icon}</span>{p.name}
                  </span>
                ))}
                <span style={{
                  fontSize: 11, color: "rgba(251,247,240,0.4)", padding: "6px 4px",
                  fontFamily: "var(--font-nunito), sans-serif",
                }}>+15 more</span>
              </div>
              <div style={{
                marginTop: 14, height: 4, borderRadius: 2,
                background: "rgba(255,255,255,0.08)", overflow: "hidden",
              }}>
                <div style={{
                  width: "30%", height: "100%",
                  background: `linear-gradient(90deg, ${P.goldLight}, ${P.gold})`,
                }} />
              </div>
              <div style={{
                fontSize: 11, color: P.goldLight, marginTop: 6, fontWeight: 700,
                fontFamily: "var(--font-nunito), sans-serif",
              }}>6 / 20 Powers earned</div>
            </div>
          </Reveal>

          {/* KNIGHT CARD */}
          <Reveal delay={300}>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${P.emeraldBright}40`,
              borderRadius: 18, padding: "24px 22px",
              backdropFilter: "blur(8px)",
              minHeight: 240,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 800, color: P.emeraldBright,
                letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 10,
              }}>03 · Knight Card</div>
              <h3 style={{
                fontSize: 20, fontWeight: 900, color: "#FBF7F0",
                fontFamily: "var(--font-playfair), serif", margin: "0 0 10px",
              }}>A shareable chess identity.</h3>
              <p style={{
                fontSize: 14, lineHeight: 1.7, color: "rgba(251,247,240,0.65)",
                margin: "0 0 16px", fontFamily: "var(--font-nunito), sans-serif",
              }}>Screenshot it. Share it. Flex it at school.</p>
              {/* Mini knight card preview */}
              <div style={{
                background: "linear-gradient(135deg, #FBF7F0 0%, #F5EFE4 100%)",
                borderRadius: 12, padding: "14px 16px",
                border: `1px solid ${P.goldLight}80`,
                boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: `radial-gradient(circle at 35% 30%, ${P.emeraldBright}, ${P.cream} 90%)`,
                  border: `2px solid ${P.emerald}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}>♘</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 9, fontWeight: 800, color: P.inkLight,
                    letterSpacing: 1.4, textTransform: "uppercase",
                  }}>Knight · Level 2</div>
                  <div style={{
                    fontSize: 16, fontWeight: 900, color: P.ink,
                    fontFamily: "var(--font-playfair), serif", letterSpacing: -0.3,
                  }}>Aarav K.</div>
                  <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                    {["🍴","📌","🗡️"].map((e) => (
                      <span key={e} style={{ fontSize: 11 }}>{e}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* CTA */}
        <Reveal delay={400}>
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <Link href="/onboard" style={{
              background: P.emeraldBright, color: "#0B1120", border: "none",
              borderRadius: 16, padding: "16px 36px", fontSize: 16,
              fontWeight: 800, cursor: "pointer",
              fontFamily: "var(--font-nunito), sans-serif",
              boxShadow: "0 8px 32px rgba(34,197,94,0.35)",
              textDecoration: "none", display: "inline-block",
              letterSpacing: 0.3,
            }}>
              Start your quest — it&apos;s free
            </Link>
            <div style={{ marginTop: 14 }}>
              <Link href="/journey" style={{
                color: "rgba(251,247,240,0.7)", fontSize: 13, fontWeight: 600,
                textDecoration: "underline",
                fontFamily: "var(--font-nunito), sans-serif",
              }}>
                See the full kingdom map →
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Navigation ────────────────────────────────────────
function Nav({ scrolled }: { scrolled: boolean }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: scrolled ? "8px 28px" : "20px 28px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: scrolled ? "rgba(251,247,240,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(1.2)" : "none",
        borderBottom: scrolled ? `1px solid ${P.inkGhost}40` : "none",
        borderRadius: scrolled ? "0 0 20px 20px" : 0,
        transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 28, display: "inline-block", animation: "gentleSway 4s ease-in-out infinite alternate" }}>♟</span>
          <span style={{ fontSize: 22, fontWeight: 900, fontFamily: "var(--font-playfair), serif", color: P.ink, letterSpacing: -0.5 }}>ChessWhiz</span>
        </div>
        <Link href="/onboard" style={{
          background: P.ink, color: P.cream, border: "none",
          borderRadius: 12, padding: "10px 28px",
          fontSize: 14, fontWeight: 700, cursor: "pointer",
          fontFamily: "var(--font-nunito), sans-serif",
          boxShadow: "0 4px 16px rgba(26,18,16,0.15)",
          textDecoration: "none", display: "inline-block",
          transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        }}>Play Free</Link>
      </div>
    </nav>
  );
}

// ── Hero section ──────────────────────────────────────
function Hero() {
  return (
    <section style={{
      padding: "160px 28px 120px", maxWidth: 1100, margin: "0 auto",
      display: "flex", alignItems: "center", gap: 72,
      flexWrap: "wrap", justifyContent: "center",
      position: "relative", zIndex: 1,
    }}>
      <div style={{ flex: "1 1 400px", maxWidth: 500 }}>
        <Reveal delay={0}>
          <div style={{
            fontFamily: "'Caveat', cursive", fontSize: 18, color: P.gold,
            transform: "rotate(-3deg)", marginBottom: 16, display: "inline-block",
          }}>no more &ldquo;I can&apos;t explain this move&rdquo; →</div>
        </Reveal>
        <Reveal delay={150}>
          <h1 style={{
            fontSize: "clamp(38px, 5.5vw, 62px)", fontWeight: 900,
            fontFamily: "var(--font-playfair), serif",
            lineHeight: 1.08, margin: "0 0 28px", color: P.ink, letterSpacing: -1.5,
          }}>
            Every move<br />
            is a{" "}
            <span style={{ position: "relative", display: "inline-block" }}>
              <span style={{ position: "relative", zIndex: 1, color: P.emerald }}>lesson</span>
              <svg style={{ position: "absolute", bottom: -2, left: -4, width: "calc(100% + 8px)", height: 14, zIndex: 0 }} viewBox="0 0 200 14" preserveAspectRatio="none">
                <path d="M2,10 Q40,2 100,8 T198,6" fill="none" stroke={P.goldLight} strokeWidth="4" strokeLinecap="round" opacity="0.45" />
              </svg>
            </span>
          </h1>
        </Reveal>
        <Reveal delay={300}>
          <p style={{
            fontSize: 18, lineHeight: 1.85, color: P.inkLight,
            margin: "0 0 40px", maxWidth: 430,
            fontFamily: "var(--font-nunito), sans-serif",
          }}>
            ChessWhiz is an AI coach that plays alongside your child — praising smart moves, gently explaining mistakes, and teaching real chess thinking in words they understand.
          </p>
        </Reveal>
        <Reveal delay={450}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/onboard" style={{
              background: P.emerald, color: "white", border: "none",
              borderRadius: 16, padding: "18px 40px", fontSize: 17,
              fontWeight: 800, cursor: "pointer",
              fontFamily: "var(--font-nunito), sans-serif",
              boxShadow: "0 8px 32px rgba(27,115,64,0.3), 0 2px 8px rgba(27,115,64,0.2)",
              textDecoration: "none", display: "inline-block",
              transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              letterSpacing: 0.2,
            }}>
              Start playing free
            </Link>
            <span style={{ color: P.inkFaint, fontSize: 13, fontFamily: "var(--font-nunito), sans-serif" }}>No signup · No credit card</span>
          </div>
        </Reveal>
        <Reveal delay={600}>
          <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
            {[
              { icon: "👑", label: "Pawn → King in 60 days" },
              { icon: "🧠", label: "Explains every move, kid-friendly" },
              { icon: "🛡", label: "No ads · No strangers · No data" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: P.inkMed, fontWeight: 600, fontFamily: "var(--font-nunito), sans-serif" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
      <Reveal delay={300} direction="left">
        <HeroPuzzle />
      </Reveal>
    </section>
  );
}

// ── Problem section ───────────────────────────────────
function ProblemSection() {
  return (
    <section style={{
      padding: "100px 28px", position: "relative", zIndex: 1,
      background: `linear-gradient(180deg, transparent 0%, ${P.parchment} 100%)`,
    }}>
      <div style={{ maxWidth: 660, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <span style={{ fontFamily: "'Caveat', cursive", fontSize: 19, color: P.gold, display: "block", marginBottom: 14 }}>the quiet problem</span>
        </Reveal>
        <Reveal delay={100}>
          <h2 style={{
            fontSize: "clamp(30px, 4.5vw, 48px)", fontWeight: 900,
            fontFamily: "var(--font-playfair), serif", lineHeight: 1.15,
            margin: "0 0 32px", letterSpacing: -1, color: P.ink,
          }}>
            Your kid plays chess every day.<br />
            <span style={{ fontStyle: "italic", color: P.inkLight, fontWeight: 400 }}>They&apos;re not getting better.</span>
          </h2>
        </Reveal>
        <Reveal delay={200}>
          <p style={{ fontSize: 17, lineHeight: 1.9, color: P.inkLight, maxWidth: 520, margin: "0 auto 20px", fontFamily: "var(--font-nunito), sans-serif" }}>
            Playing without coaching is like practicing piano by mashing keys — you&apos;re making noise, not music.
          </p>
        </Reveal>
        <Reveal delay={300}>
          <p style={{ fontSize: 17, lineHeight: 1.9, color: P.inkLight, maxWidth: 520, margin: "0 auto 28px", fontFamily: "var(--font-nunito), sans-serif" }}>
            Kids need someone to whisper <em style={{ color: P.emerald }}>&quot;see how your knight could&apos;ve forked both pieces?&quot;</em> right when it happens — not three hours later in a lesson.
          </p>
        </Reveal>
        <Reveal delay={400}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: P.goldPale, border: `1px solid ${P.gold}30`,
            borderRadius: 12, padding: "10px 20px",
          }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <span style={{ fontSize: 15, color: P.inkSoft, fontFamily: "var(--font-nunito), sans-serif", fontWeight: 600 }}>
              That kind of coaching used to cost $60/hour. Now it&apos;s free.
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Coaching showcase ─────────────────────────────────
function CoachingShowcase() {
  return (
    <section style={{ padding: "80px 28px 100px", maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <Reveal>
        <h2 style={{
          fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900,
          fontFamily: "var(--font-playfair), serif", textAlign: "center",
          margin: "0 0 16px", letterSpacing: -0.8, color: P.ink,
        }}>Coaching in action</h2>
        <p style={{ textAlign: "center", color: P.inkLight, fontSize: 16, margin: "0 0 56px", fontFamily: "var(--font-nunito), sans-serif" }}>
          Watch Coach Pawn respond to real chess moves
        </p>
      </Reveal>
      <div style={{ display: "flex", gap: 56, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        <Reveal delay={100}><CoachConversation /></Reveal>
        <Reveal delay={250} direction="left">
          <div style={{ flex: "1 1 280px", maxWidth: 380 }}>
            {[
              { icon: "✨", title: "Not templates — real AI", desc: "Every response is generated fresh by Claude, understanding the exact position, your kid's level, and what they need to hear." },
              { icon: "🎯", title: "Adapts to their age", desc: "Simple encouragement for 6-year-olds. Chess terminology for 11-year-olds. The language grows with them." },
              { icon: "⏱", title: "Right-time coaching", desc: "Not every move — that'd be annoying. Coach Pawn speaks up on blunders, great plays, and missed tactics." },
            ].map((f, i) => (
              <div key={i} style={{
                marginBottom: 28, padding: "0 0 0 20px",
                borderLeft: `3px solid ${[P.emerald, P.gold, P.ink][i]}20`,
              }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: "0 0 6px", fontFamily: "var(--font-nunito), sans-serif", color: P.ink }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: P.inkLight, margin: 0, fontFamily: "var(--font-nunito), sans-serif" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Comparison section ────────────────────────────────
function ComparisonSection() {
  return (
    <section style={{ padding: "80px 28px", maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <Reveal>
        <h2 style={{
          fontSize: 32, fontWeight: 900, fontFamily: "var(--font-playfair), serif",
          textAlign: "center", margin: "0 0 40px", letterSpacing: -0.5, color: P.ink,
        }}>The moment that matters most</h2>
      </Reveal>
      <Reveal delay={150}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div style={{
            background: "#F8F5F0", borderRadius: 20, padding: "28px 24px",
            border: `1px solid ${P.inkGhost}`, opacity: 0.75,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: P.inkFaint, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16, fontFamily: "var(--font-nunito), sans-serif" }}>Other chess apps</div>
            <div style={{
              background: "white", borderRadius: 14, padding: "16px 18px",
              border: `1px solid ${P.inkGhost}`, fontSize: 15, lineHeight: 1.7,
              color: P.inkLight, fontStyle: "italic", fontFamily: "var(--font-nunito), sans-serif",
            }}>&quot;I can&apos;t explain it, but this move is actually the right one here.&quot;</div>
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>🤷</span>
              <span style={{ fontSize: 12, color: P.inkFaint, fontFamily: "var(--font-nunito), sans-serif" }}>Same canned response. Every time.</span>
            </div>
          </div>
          <div style={{
            background: P.emeraldPale, borderRadius: 20, padding: "28px 24px",
            border: `2px solid ${P.emerald}35`,
            boxShadow: `0 8px 32px ${P.emeraldGlow}`,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: P.emerald, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 16, fontFamily: "var(--font-nunito), sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>✓</span> ChessWhiz
            </div>
            <div style={{
              background: "white", borderRadius: 14, padding: "16px 18px",
              border: `1px solid ${P.emerald}25`, fontSize: 15, lineHeight: 1.7,
              color: P.inkSoft, fontFamily: "var(--font-nunito), sans-serif",
            }}>
              &quot;Your knight is doing two jobs at once — protecting your pawn AND watching the center. That&apos;s called coordination! Great players make their pieces work together. 🤝&quot;
            </div>
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 14 }}>✨</span>
              <span style={{ fontSize: 12, color: P.emerald, fontWeight: 600, fontFamily: "var(--font-nunito), sans-serif" }}>AI-generated. Unique. Actually teaches.</span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ── Stats strip ───────────────────────────────────────
function StatsStrip() {
  return (
    <section style={{ padding: "60px 28px", position: "relative", zIndex: 1, background: P.parchment }}>
      <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "center", gap: 64, flexWrap: "wrap" }}>
        {[
          { target: 2847, suffix: "+", label: "Games played" },
          { target: 94, suffix: "%", label: "Kids love it" },
          { target: 50000, suffix: "+", label: "Coach messages" },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: P.ink, fontFamily: "var(--font-playfair), serif" }}>
              <Counter target={s.target} suffix={s.suffix} />
            </div>
            <div style={{ fontSize: 13, color: P.inkLight, marginTop: 4, fontFamily: "var(--font-nunito), sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────
function Testimonials() {
  return (
    <section style={{ padding: "80px 28px", maxWidth: 720, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <Reveal>
        <div style={{
          background: "white", borderRadius: 24,
          padding: "44px 36px",
          border: `1px solid ${P.inkGhost}`,
          boxShadow: `0 0 0 4px ${P.parchment}, 0 8px 32px rgba(26,18,16,0.08)`,
          textAlign: "center",
        }}>
          <span style={{
            fontFamily: "'Caveat', cursive", fontSize: 19, color: P.gold,
            display: "block", marginBottom: 6,
          }}>a note from the maker →</span>
          <p style={{
            fontSize: 18, lineHeight: 1.8, color: P.inkSoft,
            margin: "8px 0 18px",
            fontFamily: "var(--font-nunito), sans-serif",
          }}>
            ChessWhiz launched in <strong style={{ color: P.ink }}>April 2026</strong>. It&apos;s built by a chess dad in Texas for his own kids — and now for yours. No fake testimonials. No paid reviews. Just a tool I wish I&apos;d had.
          </p>
          <p style={{
            fontSize: 14, lineHeight: 1.7, color: P.inkLight,
            margin: 0,
            fontFamily: "var(--font-nunito), sans-serif",
          }}>
            Try it with your kid this weekend. If Coach Pawn doesn&apos;t make them smile in the first 5 minutes, I&apos;d love to know why.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

// ── Pricing ───────────────────────────────────────────
function Pricing() {
  return (
    <section style={{ padding: "80px 28px", maxWidth: 580, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <Reveal>
        <h2 style={{ fontSize: 34, fontWeight: 900, fontFamily: "var(--font-playfair), serif", textAlign: "center", margin: "0 0 8px", color: P.ink }}>
          Start free. Upgrade if you love it.
        </h2>
        <p style={{ textAlign: "center", color: P.inkLight, fontSize: 15, margin: "0 0 44px", fontFamily: "var(--font-nunito), sans-serif" }}>
          No credit card required. No tricks.
        </p>
      </Reveal>
      <Reveal delay={150}>
        <div style={{
          background: "white", borderRadius: 24, overflow: "hidden",
          border: `1px solid ${P.inkGhost}`,
          boxShadow: `0 8px 40px ${P.inkGhost}40`,
        }}>
          {/* Free tier */}
          <div style={{ padding: "28px 32px", borderBottom: `1px solid ${P.parchment}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px", fontFamily: "var(--font-nunito), sans-serif", color: P.ink }}>Free</h3>
                <p style={{ margin: 0, fontSize: 13, color: P.inkLight, fontFamily: "var(--font-nunito), sans-serif" }}>A taste of the kingdom — perfect for getting started</p>
              </div>
              <span style={{ fontSize: 30, fontWeight: 900, fontFamily: "var(--font-playfair), serif", color: P.ink }}>$0</span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
              {[
                { ok: true,  text: "3 games per day" },
                { ok: true,  text: "Basic AI coaching (text only)" },
                { ok: true,  text: "Easy & Medium bots" },
                { ok: true,  text: "Pawn Village (first kingdom)" },
                { ok: false, text: "Boss battles · Powers · Knight Card" },
                { ok: false, text: "Mission system · Hard bot" },
              ].map((f, i) => (
                <li key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13, color: f.ok ? P.inkSoft : P.inkFaint,
                  fontFamily: "var(--font-nunito), sans-serif",
                }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                    background: f.ok ? P.emeraldPale : P.parchment,
                    color: f.ok ? P.emerald : P.inkFaint,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800,
                  }}>{f.ok ? "✓" : "✕"}</span>
                  {f.text}
                </li>
              ))}
            </ul>
          </div>

          {/* Champion tier */}
          <div style={{ padding: "32px", background: `linear-gradient(135deg, ${P.emeraldPale} 0%, ${P.goldPale} 100%)` }}>
            <div style={{
              display: "inline-block", background: P.emerald, color: "white",
              borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 700,
              marginBottom: 16, fontFamily: "var(--font-nunito), sans-serif", letterSpacing: 0.5,
            }}>UNLOCK THE FULL JOURNEY</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px", fontFamily: "var(--font-nunito), sans-serif", color: P.ink }}>Champion</h3>
                <p style={{ margin: 0, fontSize: 13, color: P.inkLight, fontFamily: "var(--font-nunito), sans-serif" }}>
                  The full Chess Kingdom — all 7 regions, all bosses
                </p>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 20 }}>
                <span style={{ fontSize: 34, fontWeight: 900, fontFamily: "var(--font-playfair), serif", color: P.emerald }}>$4.99</span>
                <span style={{ fontSize: 14, color: P.inkLight, fontFamily: "var(--font-nunito), sans-serif" }}>/mo</span>
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
              ].map((f, i) => (
                <li key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13, color: P.inkSoft,
                  fontFamily: "var(--font-nunito), sans-serif",
                }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                    background: P.emerald, color: "white",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800,
                  }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/onboard" style={{
              display: "block", width: "100%", marginTop: 22, padding: "16px 0", borderRadius: 14,
              background: P.ink, color: P.cream, border: "none",
              fontSize: 16, fontWeight: 800, cursor: "pointer",
              fontFamily: "var(--font-nunito), sans-serif",
              boxShadow: "0 4px 20px rgba(26,18,16,0.2)",
              textDecoration: "none", textAlign: "center",
              transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            }}>Start 7-Day Free Trial</Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ── FAQ ───────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${P.inkGhost}`, padding: "16px 0" }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
      }}>
        <span style={{ color: P.ink, fontSize: 15, fontWeight: 600, fontFamily: "var(--font-nunito), sans-serif", paddingRight: 16 }}>{q}</span>
        <span style={{ color: P.inkLight, fontSize: 18, transform: open ? "rotate(45deg)" : "rotate(0)", transition: "0.2s", flexShrink: 0 }}>+</span>
      </button>
      {open && (
        <p style={{ margin: "10px 0 0", fontSize: 14, color: P.inkLight, lineHeight: 1.7, fontFamily: "var(--font-nunito), sans-serif", animation: "msgPop 0.25s ease-out" }}>{a}</p>
      )}
    </div>
  );
}

function FAQ() {
  return (
    <section style={{ padding: "60px 28px 80px", maxWidth: 650, margin: "0 auto", position: "relative", zIndex: 1 }}>
      <Reveal>
        <h2 style={{ fontSize: 28, fontWeight: 900, fontFamily: "var(--font-playfair), serif", textAlign: "center", margin: "0 0 32px", color: P.ink }}>
          Questions? We&apos;ve got answers.
        </h2>
      </Reveal>
      {[
        { q: "How does the progression system work?", a: "Your kid starts as a Pawn and travels through 7 regions of the Chess Kingdom, each teaching a family of tactics. Each region has a Boss character — like the Knight Twins who teach forks, or the Shadow Bishop who teaches pins. Defeat the boss by applying the tactic in a real game. Collect Powers, level up from Pawn to King, and share your Knight Card with friends." },
        { q: "What age is ChessWhiz for?", a: "ChessWhiz works best for kids ages 5-12. The AI coach adapts its language automatically — simpler words for younger kids, strategic chess terminology for older ones." },
        { q: "Does my kid need to know chess already?", a: "Nope! Complete beginners can start with Easy mode. Coach Pawn explains the basics as you play — piece movement, captures, check, and more." },
        { q: "Will this replace their chess lessons?", a: "ChessWhiz is a complement to human coaching, not a replacement. But for most kids just starting out, it provides the same benefit as a $60/hour tutor — real-time feedback on every move, adapted to their level. Many families use it between weekly lessons to reinforce what their coach taught." },
        { q: "How much screen time does it take?", a: "A typical game takes 5–15 minutes. We recommend 1–3 games per day. The free tier's 3-game limit is actually designed as a built-in screen time boundary." },
        { q: "How is this different from ChessKid or Dr. Wolf?", a: "ChessKid doesn't coach during gameplay. Dr. Wolf uses pre-written templates — it often says 'I can't explain this move.' ChessWhiz uses real AI to generate unique, contextual explanations for every move." },
        { q: "Is it safe for kids?", a: "Yes. No ads, no social features, no chat with strangers, no data collection. The only 'conversation' is with Coach Pawn, the AI coach." },
        { q: "Does it work on phones and tablets?", a: "ChessWhiz works in any modern browser — Chrome, Safari, Firefox, Edge. Works great on mobile too." },
      ].map((item, i) => (
        <Reveal key={i} delay={i * 50}>
          <FAQItem q={item.q} a={item.a} />
        </Reveal>
      ))}
    </section>
  );
}

// ── Final CTA ─────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ padding: "120px 28px 100px", textAlign: "center", position: "relative", zIndex: 1 }}>
      <Reveal>
        <div style={{ fontSize: 72, marginBottom: 20, filter: "drop-shadow(0 6px 16px rgba(26,18,16,0.12))", animation: "gentleSway 5s ease-in-out infinite alternate", display: "inline-block" }}>♟</div>
      </Reveal>
      <Reveal delay={150}>
        <h2 style={{
          fontSize: "clamp(30px, 4.5vw, 50px)", fontWeight: 900,
          fontFamily: "var(--font-playfair), serif", margin: "0 0 20px",
          lineHeight: 1.15, letterSpacing: -1, color: P.ink,
        }}>
          Every grandmaster<br />started as a beginner
        </h2>
      </Reveal>
      <Reveal delay={300}>
        <p style={{
          color: P.inkLight, fontSize: 18, margin: "0 auto 36px",
          maxWidth: 440, lineHeight: 1.8, fontFamily: "var(--font-nunito), sans-serif",
        }}>
          Your kid&apos;s journey starts with one move. Make it with a coach who&apos;ll be there for every one after.
        </p>
      </Reveal>
      <Reveal delay={450}>
        <Link href="/onboard" style={{
          background: P.emerald, color: "white", border: "none",
          borderRadius: 18, padding: "20px 52px", fontSize: 19,
          fontWeight: 800, cursor: "pointer",
          fontFamily: "var(--font-nunito), sans-serif",
          boxShadow: "0 8px 36px rgba(27,115,64,0.3)",
          textDecoration: "none", display: "inline-block",
          transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          letterSpacing: 0.3,
        }}>
          Play your first game free
        </Link>
        <div style={{ marginTop: 16, color: P.inkFaint, fontSize: 13, fontFamily: "var(--font-nunito), sans-serif" }}>
          No signup · No credit card · Ready in 10 seconds
        </div>
      </Reveal>
    </section>
  );
}

// ── Main page ─────────────────────────────────────────
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{
      background: P.cream, minHeight: "100vh",
      fontFamily: "var(--font-nunito), sans-serif",
      color: P.ink, overflowX: "hidden", position: "relative",
    }}>
      {/* Paper grain texture overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.025'/%3E%3C/svg%3E")`,
      }} />

      <ChessAtmosphere />
      <Nav scrolled={scrolled} />
      <Hero />
      <ProblemSection />
      <CoachingShowcase />
      <JourneySection />
      <ComparisonSection />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />

      <footer style={{
        padding: "36px 28px 28px", maxWidth: 1000, margin: "0 auto",
        borderTop: `1px solid ${P.inkGhost}40`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 16, position: "relative", zIndex: 1,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18 }}>♟</span>
          <span style={{ fontSize: 15, fontWeight: 900, fontFamily: "var(--font-playfair), serif", color: P.ink }}>ChessWhiz</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <Link href="/journey" style={{ color: P.inkFaint, fontSize: 13, textDecoration: "none", fontFamily: "var(--font-nunito), sans-serif" }}>Journey</Link>
          <Link href="/how-it-works" style={{ color: P.inkFaint, fontSize: 13, textDecoration: "none", fontFamily: "var(--font-nunito), sans-serif" }}>How it works</Link>
          <Link href="/privacy" style={{ color: P.inkFaint, fontSize: 13, textDecoration: "none", fontFamily: "var(--font-nunito), sans-serif" }}>Privacy</Link>
          <Link href="/terms" style={{ color: P.inkFaint, fontSize: 13, textDecoration: "none", fontFamily: "var(--font-nunito), sans-serif" }}>Terms</Link>
          <a href="mailto:hello@chesswhiz.com" style={{ color: P.inkFaint, fontSize: 13, textDecoration: "none", fontFamily: "var(--font-nunito), sans-serif" }}>Contact</a>
        </div>
        <div style={{ color: P.inkFaint, fontSize: 12 }}>Made with ♟ in Texas · © 2026</div>
      </footer>

      <style>{`
        html { scroll-behavior: smooth; }
        body { -webkit-font-smoothing: antialiased; }
        * { box-sizing: border-box; margin: 0; }

        @keyframes drift {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-40px) rotate(10deg); }
        }
        @keyframes gentleSway {
          0% { transform: rotate(-6deg); }
          100% { transform: rotate(6deg); }
        }
        @keyframes targetPulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes annotationAppear {
          0% { opacity: 0; transform: translateY(10px) rotate(8deg); }
          100% { opacity: 1; transform: translateY(0) rotate(8deg); }
        }
        @keyframes msgPop {
          0% { opacity: 0; transform: translateY(12px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes typingDot {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }
        @keyframes kingdomPulse {
          0%, 100% { transform: scale(1.08); }
          50%      { transform: scale(1.14); }
        }
        @keyframes coachPop {
          0%   { opacity: 0; transform: translateY(8px) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes attackedFlash {
          0%   { opacity: 0; transform: scale(1.1); }
          50%  { opacity: 1; transform: scale(1); }
          100% { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 768px) {
          section { padding-left: 20px !important; padding-right: 20px !important; }
        }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #F5EFE4; }
        ::-webkit-scrollbar-thumb { background: #D0C8BC; border-radius: 4px; border: 2px solid #F5EFE4; }
        ::-webkit-scrollbar-thumb:hover { background: #B0A898; }
      `}</style>
    </div>
  );
}
