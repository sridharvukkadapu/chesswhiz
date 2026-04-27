"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Flame } from "lucide-react";
import { useGameStore } from "@/stores/gameStore";
import { KINGDOMS, POWERS, getRankByXP, getNextRank, isKingdomLocked } from "@/lib/progression/data";
import type { Kingdom, PlayerProgression } from "@/lib/progression/types";
import BottomNav from "@/components/BottomNav";
import UpgradeModal from "@/components/UpgradeModal";
import { T, KINGDOM_COLORS } from "@/lib/design/tokens";
import { StarField, MoteField, GoldFoilText, useTime } from "@/lib/design/atmosphere";
import { Piece, type PieceType } from "@/components/ChessPieces";

// Visual layout for the world map (8 control points across a wide canvas).
// These are tuned to feel like a winding fantasy path, not a grid.
type Layout = { x: number; y: number; bossPiece: PieceType; emoji: string };

const KINGDOM_LAYOUT: Record<string, Layout> = {
  village:          { x: 240,  y: 720, bossPiece: "pawn",   emoji: "🏘️" },
  fork_forest:      { x: 520,  y: 580, bossPiece: "knight", emoji: "🌲" },
  pin_palace:       { x: 820,  y: 700, bossPiece: "bishop", emoji: "🏰" },
  skewer_spire:     { x: 1080, y: 480, bossPiece: "rook",   emoji: "🗼" },
  discovery_depths: { x: 1340, y: 660, bossPiece: "rook",   emoji: "⛏️" },
  strategy_summit:  { x: 1620, y: 380, bossPiece: "queen",  emoji: "🏔️" },
  endgame_throne:   { x: 1860, y: 580, bossPiece: "king",   emoji: "👑" },
};

function kingdomStatus(
  k: Kingdom,
  prog: PlayerProgression,
  rankLevel: number,
): "conquered" | "current" | "locked" | "tier_locked" {
  if (prog.completedKingdoms.includes(k.id)) return "conquered";
  if (isKingdomLocked(k.id, prog.tier)) return "tier_locked";
  if (k.level > rankLevel) return "locked";
  if (k.id === prog.currentKingdom) return "current";
  return "locked";
}

const RANK_PIECE: Record<string, PieceType> = {
  pawn: "pawn", knight: "knight", bishop: "bishop", rook: "rook", queen: "queen", king: "king",
};

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
  const time = useTime();

  useEffect(() => {
    store.hydrateProgression();
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: T.bgRadial,
        color: T.textHi,
        fontFamily: T.fontUI,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <StarField count={130} seed={11} opacity={0.7} />
      <MoteField count={22} seed={12} color={T.amberGlow} />

      {/* Atmospheric fog at the bottom of the map */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "60%",
          bottom: 0,
          background:
            "linear-gradient(180deg, transparent 0%, rgba(125,168,255,0.04) 40%, rgba(125,168,255,0.10) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(7,5,15,0.6)",
          backdropFilter: "blur(20px) saturate(1.4)",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <Link
          href="/play"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: T.textLo,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: T.fontUI,
            letterSpacing: "0.08em",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          BACK TO GAME
        </Link>
        <Link
          href="/card"
          style={{
            color: T.amberGlow,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: T.fontUI,
            letterSpacing: "0.08em",
          }}
        >
          YOUR CARD →
        </Link>
      </header>

      {/* Title */}
      <section
        style={{
          textAlign: "center",
          padding: "44px 20px 16px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            fontFamily: T.fontUI,
            fontSize: 13,
            fontWeight: 700,
            color: T.amberGlow,
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            marginBottom: 8,
            paddingLeft: "0.5em",
          }}
        >
          Your journey so far
        </div>
        <GoldFoilText fontSize={56} italic>
          The Chess Kingdom
        </GoldFoilText>
      </section>

      {/* Progress strip */}
      <section
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "0 16px 24px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            padding: "14px 28px",
            background: "rgba(26,18,56,0.7)",
            border: `1px solid ${T.borderStrong}`,
            backdropFilter: "blur(12px)",
            borderRadius: 100,
            boxShadow: T.shadowCard,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: T.goldFoil,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: T.glowAmber,
              }}
            >
              <Piece type={RANK_PIECE[rank.id] ?? "pawn"} color="white" size={28} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: T.fontUI,
                  fontSize: 11,
                  color: T.textLo,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Rank
              </div>
              <div
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  fontSize: 20,
                  color: T.textHi,
                  fontWeight: 600,
                }}
              >
                {rank.name}
              </div>
            </div>
          </div>
          <div style={{ width: 1, height: 30, background: T.border }} />
          <Stat label="XP" value={prog.xp.toLocaleString()} />
          <div style={{ width: 1, height: 30, background: T.border }} />
          <Stat
            label="Powers"
            value={
              <>
                {prog.earnedPowers.length}
                <span style={{ color: T.textDim, fontSize: 16 }}> / {POWERS.length}</span>
              </>
            }
          />
          <div style={{ width: 1, height: 30, background: T.border }} />
          <Stat
            label="Realms"
            value={
              <>
                {prog.completedKingdoms.length}
                <span style={{ color: T.textDim, fontSize: 16 }}> / {KINGDOMS.length}</span>
              </>
            }
          />
          <div style={{ width: 1, height: 30, background: T.border }} />
          <Stat
            label="Streak"
            value={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: T.amberGlow }}>
                <Flame aria-hidden size={18} strokeWidth={2.4} fill={T.amberGlow} fillOpacity={0.3} />
                <span className="tabular-nums">{prog.streak}</span>
                <span style={{ color: T.textDim, fontSize: 14 }}>d</span>
              </span>
            }
          />
        </div>
      </section>

      {/* World map — horizontally scrollable on narrow viewports.
          Camera entrance: slow pan from left to center + slight zoom
          on first mount. Tracks elapsed time since mount, settles
          after ~3.5s. */}
      <section
        aria-label="Kingdom map"
        style={{
          position: "relative",
          zIndex: 1,
          padding: "8px 0 100px",
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        <CameraView>
          <svg
            width="2200"
            height="900"
            viewBox="0 0 2200 900"
            style={{
              display: "block",
              margin: "0 auto",
              minWidth: 1100,
            }}
          >
          <defs>
            <linearGradient id="kmMtnGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5B4488" />
              <stop offset="60%" stopColor="#2A1B4A" />
              <stop offset="100%" stopColor="#15102A" />
            </linearGradient>
            <linearGradient id="kmSnow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#E0BBFF" />
              <stop offset="100%" stopColor="#7DA8FF" />
            </linearGradient>
            {KINGDOMS.map((k) => (
              <radialGradient key={k.id} id={`kmRegion-${k.id}`} cx="0.4" cy="0.35" r="0.7">
                <stop offset="0%" stopColor={KINGDOM_COLORS[k.id] ?? T.amber} stopOpacity="0.7" />
                <stop offset="100%" stopColor="#15102A" stopOpacity="1" />
              </radialGradient>
            ))}
          </defs>

          {/* Distant mountains */}
          <g opacity="0.5">
            <polygon
              points="0,650 200,400 380,580 540,420 720,560 900,470 1080,580 1280,440 1480,540 1660,400 1860,580 2200,470 2200,900 0,900"
              fill="url(#kmMtnGrad)"
            />
          </g>
          <g opacity="0.85">
            <polygon
              points="0,750 180,540 340,680 500,540 680,660 880,600 1080,700 1280,560 1500,660 1680,540 1900,680 2200,600 2200,900 0,900"
              fill="#1A1238"
            />
            <polygon points="500,540 525,560 545,568 565,552" fill="url(#kmSnow)" opacity="0.7" />
            <polygon points="1280,560 1305,580 1325,588 1345,572" fill="url(#kmSnow)" opacity="0.7" />
            <polygon points="1680,540 1705,560 1725,568 1745,552" fill="url(#kmSnow)" opacity="0.7" />
          </g>

          {/* Path connecting regions */}
          {KINGDOMS.slice(0, -1).map((k, i) => {
            const next = KINGDOMS[i + 1];
            const a = KINGDOM_LAYOUT[k.id];
            const b = KINGDOM_LAYOUT[next.id];
            if (!a || !b) return null;
            const status = kingdomStatus(k, prog, rank.level);
            const nextStatus = kingdomStatus(next, prog, rank.level);
            const isUnlockedSegment =
              (status === "conquered" || status === "current") &&
              nextStatus !== "tier_locked";
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2 - 40 + i * 8;
            const path = `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
            return (
              <g key={`path-${i}`}>
                <path
                  d={path}
                  stroke={isUnlockedSegment ? "#FCD34D" : "rgba(155,145,180,0.35)"}
                  strokeWidth="6"
                  strokeDasharray={isUnlockedSegment ? "none" : "14 10"}
                  strokeLinecap="round"
                  fill="none"
                  opacity={isUnlockedSegment ? 0.75 : 0.4}
                  style={isUnlockedSegment ? { filter: "drop-shadow(0 0 8px rgba(252,211,77,0.6))" } : undefined}
                />
                {isUnlockedSegment &&
                  [...Array(5)].map((_, j) => {
                    const t = (j + 1) / 6;
                    const px = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x;
                    const py = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y;
                    const pulse = 0.5 + 0.5 * Math.sin(time * 3 - j * 0.6);
                    return <circle key={j} cx={px} cy={py} r={3} fill="#FCD34D" opacity={pulse} />;
                  })}
              </g>
            );
          })}

          {/* Region nodes */}
          {KINGDOMS.map((k) => {
            const layout = KINGDOM_LAYOUT[k.id];
            if (!layout) return null;
            const status = kingdomStatus(k, prog, rank.level);
            const isCurrent = status === "current";
            const isCompleted = status === "conquered";
            const isLocked = status !== "current" && status !== "conquered";
            const isTierLocked = status === "tier_locked";
            const baseRadius = 60;
            const haloPulse = isCurrent ? 1.1 + 0.1 * Math.sin(time * 2.5) : 1;
            const accent = KINGDOM_COLORS[k.id] ?? T.amber;
            const handleClick = () => {
              if (isTierLocked) {
                setUpgradeFor(k);
              }
            };

            return (
              <g
                key={k.id}
                transform={`translate(${layout.x} ${layout.y})`}
                onClick={handleClick}
                style={{ cursor: isTierLocked ? "pointer" : isCurrent || isCompleted ? "pointer" : "default" }}
              >
                {/* Halo */}
                {!isLocked && (
                  <circle
                    r={baseRadius * 1.6 * haloPulse}
                    fill={accent}
                    opacity={isCurrent ? 0.2 : 0.1}
                    style={{ filter: "blur(10px)" }}
                  />
                )}
                {/* Outer ring */}
                <circle
                  r={baseRadius + 8}
                  fill="none"
                  stroke={isLocked ? "rgba(155,145,180,0.35)" : accent}
                  strokeWidth={isCurrent ? 4 : 2.5}
                  strokeDasharray={isLocked ? "6 6" : "none"}
                  opacity={0.9}
                  style={{ filter: `drop-shadow(0 0 ${isCurrent ? 14 : 6}px ${accent}88)` }}
                />
                {/* Plinth shadow */}
                <ellipse cx="0" cy={baseRadius + 14} rx={baseRadius * 0.85} ry="6" fill="rgba(0,0,0,0.45)" filter="blur(2px)" />
                {/* Plinth */}
                <circle r={baseRadius} fill={isLocked ? "rgba(40,30,70,0.85)" : `url(#kmRegion-${k.id})`} />
                {/* Boss icon (chess piece) */}
                <g
                  transform={`translate(-30 -32)`}
                  opacity={isLocked ? 0.35 : 1}
                  style={isLocked ? { filter: "grayscale(1) brightness(0.5)" } : undefined}
                >
                  <foreignObject x="0" y="0" width="60" height="60">
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Piece type={layout.bossPiece} color="white" size={56} />
                    </div>
                  </foreignObject>
                </g>
                {/* Lock badge */}
                {isLocked && (
                  <g transform="translate(0 8)">
                    <rect x="-12" y="0" width="24" height="22" rx="3" fill="#FCD34D" stroke="#7A5418" strokeWidth="1.5" />
                    <path
                      d="M -8 0 L -8 -6 Q -8 -14 0 -14 Q 8 -14 8 -6 L 8 0"
                      fill="none"
                      stroke="#FCD34D"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="0" cy="10" r="2.5" fill="#7A5418" />
                  </g>
                )}
                {/* Conquered checkmark */}
                {isCompleted && (
                  <g transform="translate(48 -48)">
                    <circle r="14" fill={T.emerald} stroke="#FFF" strokeWidth="2" />
                    <path d="M -6 0 L -2 4 L 6 -4" stroke="#FFF" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}
                {/* Current quest banner */}
                {isCurrent && (
                  <g transform="translate(0 -90)" opacity={0.5 + 0.5 * Math.sin(time * 3)}>
                    <rect x="-50" y="-14" width="100" height="28" rx="14" fill="#FCD34D" stroke="#7A5418" strokeWidth="1.5" />
                    <text
                      x="0"
                      y="5"
                      fontSize="13"
                      fontWeight="700"
                      fontFamily='"Plus Jakarta Sans", sans-serif'
                      textAnchor="middle"
                      fill="#1A1210"
                      letterSpacing="0.1em"
                    >
                      QUEST
                    </text>
                  </g>
                )}
                {/* Region name */}
                <text
                  x="0"
                  y={baseRadius + 38}
                  fontSize="22"
                  fontFamily='"Cormorant Garamond", serif'
                  fontStyle="italic"
                  fontWeight="600"
                  textAnchor="middle"
                  fill={isLocked ? "#9A8FB5" : T.textHi}
                  style={isLocked ? undefined : { filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.7))" }}
                >
                  {k.name}
                </text>
                {/* CHAMPION pill on tier-locked regions */}
                {isTierLocked && (
                  <g transform={`translate(0 ${baseRadius + 60})`}>
                    <rect
                      x="-44"
                      y="-10"
                      width="88"
                      height="20"
                      rx="10"
                      fill="rgba(192,132,252,0.2)"
                      stroke="rgba(192,132,252,0.5)"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="4"
                      fontSize="10"
                      fontWeight="700"
                      fontFamily='"Plus Jakarta Sans", sans-serif'
                      textAnchor="middle"
                      fill="#C084FC"
                      letterSpacing="0.15em"
                    >
                      ✦ CHAMPION
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Player avatar — flag on current kingdom */}
          {(() => {
            const currentLayout = KINGDOM_LAYOUT[prog.currentKingdom];
            if (!currentLayout) return null;
            const yOff = -60 + Math.sin(time * 2) * 4;
            return (
              <g transform={`translate(${currentLayout.x} ${currentLayout.y + yOff})`}>
                <circle r="32" fill="#FCD34D" opacity="0.3" style={{ filter: "blur(8px)" }} />
                <line x1="0" y1="0" x2="0" y2="-50" stroke="#7A5418" strokeWidth="2" />
                <path
                  d="M 0 -50 L 24 -42 L 18 -32 L 24 -22 L 0 -28 Z"
                  fill={T.amber}
                  stroke="#7A5418"
                  strokeWidth="1"
                />
                <text
                  x="12"
                  y="-32"
                  fontSize="12"
                  textAnchor="middle"
                  fontFamily='"Cormorant Garamond"'
                  fill="#1A1210"
                  fontWeight="800"
                >
                  {rank.name.charAt(0)}
                </text>
                <ellipse cx="0" cy="0" rx="14" ry="4" fill="rgba(0,0,0,0.5)" />
                <circle r="6" fill="#FCD34D" stroke="#7A5418" strokeWidth="1.5" />
              </g>
            );
          })()}
          </svg>
        </CameraView>
      </section>

      {/* Visitor CTA — only shown for unauthenticated players */}
      {prog.xp === 0 && prog.completedKingdoms.length === 0 && prog.earnedPowers.length === 0 && (
        <section
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 520,
            margin: "0 auto 100px",
            padding: "24px",
            textAlign: "center",
            background: "rgba(26,18,56,0.85)",
            border: `1.5px solid ${T.amber}`,
            borderRadius: 22,
            boxShadow: T.glowAmber,
          }}
        >
          <span
            style={{
              fontFamily: T.fontHand,
              fontSize: 19,
              color: T.amberGlow,
              transform: "rotate(-2deg)",
              display: "inline-block",
              marginBottom: 4,
            }}
          >
            start your quest →
          </span>
          <h3
            style={{
              fontFamily: T.fontDisplay,
              fontStyle: "italic",
              fontSize: 26,
              fontWeight: 600,
              color: T.textHi,
              margin: "4px 0 10px",
            }}
          >
            Pawn Village awaits
          </h3>
          <p
            style={{
              fontFamily: T.fontUI,
              fontSize: 14,
              lineHeight: 1.7,
              color: T.textMed,
              maxWidth: 380,
              margin: "0 auto 18px",
            }}
          >
            Play your first game to begin. Defeat the Knight Twins, earn Powers, and climb from Pawn to King.
          </p>
          <Link
            href="/onboard"
            style={{
              display: "inline-block",
              background: T.goldFoil,
              color: T.inkDeep,
              borderRadius: 14,
              padding: "14px 30px",
              fontSize: 15,
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: T.glowAmber,
              letterSpacing: "0.05em",
              fontFamily: T.fontUI,
            }}
          >
            ✦ Play your first game free ✦
          </Link>
        </section>
      )}

      <BottomNav />

      <UpgradeModal
        open={!!upgradeFor}
        onClose={() => setUpgradeFor(null)}
        blockedKingdomName={upgradeFor?.name}
        blockedKingdomIcon={upgradeFor ? KINGDOM_LAYOUT[upgradeFor.id]?.emoji : undefined}
      />
    </div>
  );
}

// Camera entrance: slow pan from x=+60 → -120 with a slight 1.0 → 1.06 zoom
// over the first ~3.5s after mount, then settles. Honors reduced motion.
function CameraView({ children }: { children: React.ReactNode }) {
  const [t, setT] = useState(0);
  const startRef = useRef<number | null>(null);
  const reduced = useReducedMotionPref();

  useEffect(() => {
    if (reduced) return;
    let raf: number | null = null;
    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const elapsed = (now - startRef.current) / 1000;
      setT(elapsed);
      if (elapsed < 3.6) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  // Camera curve: pan + zoom over 3.5s, then hold
  const p = Math.min(1, t / 3.5);
  const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
  const camX = reduced ? 0 : 60 + (-180) * eased; // 60 → -120 px
  const camScale = reduced ? 1 : 1.0 + 0.06 * eased; // 1.0 → 1.06

  return (
    <div
      style={{
        transform: `translateX(${camX}px) scale(${camScale})`,
        transformOrigin: "center",
        transition: "none",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

// Local hook to avoid an extra import roundtrip
function useReducedMotionPref(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const update = () => setReduced(mq.matches);
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontFamily: T.fontUI,
          fontSize: 11,
          color: T.textLo,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: T.fontDisplay,
          fontSize: 22,
          color: T.textHi,
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}
