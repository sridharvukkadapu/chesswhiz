"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSpeech } from "@/lib/speech";
import { getRankByXP, getNextRank, RANKS } from "@/lib/progression/data";
import AhaCelebration from "@/components/AhaCelebration";
import { Chess } from "chess.js";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";
import { getLegalMoves, applyMove, getGameStatus, moveToSAN } from "@/lib/chess/engine";
import { analyzeMoveQuality } from "@/lib/coaching/analyzer";
import { shouldCoach } from "@/lib/coaching/triggers";
import { FALLBACKS } from "@/lib/coaching/prompts";
import { findBestMove } from "@/lib/chess/ai";
import Board from "@/components/Board";
import CoachPanel from "@/components/CoachPanel";
import MoveHistory from "@/components/MoveHistory";
import PlayerBar from "@/components/PlayerBar";
import GameStatusBar from "@/components/GameStatus";
import type { Move } from "@/lib/chess/types";

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
  goldLight: "#F0D060",
  goldPale: "#FDF6E3",
};

// ── Floating chess pieces atmosphere (matches landing + onboarding) ──
function ChessAtmosphere() {
  const syms = ["♔","♕","♖","♗","♘","♙","♚","♛","♜","♝","♞","♟"];
  return (
    <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {Array.from({ length: 14 }, (_, i) => (
        <span key={i} style={{
          position: "absolute",
          left: `${(i * 7.3) % 95}%`,
          top: `${(i * 9.1) % 95}%`,
          fontSize: 20 + (i * 2.1) % 26,
          opacity: 0.016 + (i * 0.0015) % 0.022,
          color: P.ink,
          transform: `rotate(${-18 + (i * 4.1) % 36}deg)`,
          animation: `drift ${20 + (i * 1.3) % 18}s ease-in-out ${(i * 0.7) % 8}s infinite alternate`,
        }}>{syms[i % syms.length]}</span>
      ))}
    </div>
  );
}

// ── Captured pieces + material advantage strip ──
function CapturedStrip({ chess, perspective }: { chess: Chess; perspective: "w" | "b" }) {
  // Start counts = 8 pawns, 2 knights, 2 bishops, 2 rooks, 1 queen per side.
  const start: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  const alive = { w: { ...start }, b: { ...start } } as Record<"w" | "b", Record<string, number>>;
  for (const row of chess.board()) {
    for (const sq of row) {
      if (sq && sq.type !== "k") alive[sq.color][sq.type] -= 1;
    }
  }
  // Pieces `perspective` has captured = pieces missing from the OTHER side.
  const opp: "w" | "b" = perspective === "w" ? "b" : "w";
  const captured: Array<{ type: string; count: number }> = [];
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  const icons: Record<"w" | "b", Record<string, string>> = {
    w: { p: "♙", n: "♘", b: "♗", r: "♖", q: "♕" },
    b: { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛" },
  };
  let ownMaterial = 0;
  let oppMaterial = 0;
  for (const t of ["q", "r", "b", "n", "p"]) {
    const c = start[t] - alive[opp][t];
    if (c > 0) captured.push({ type: t, count: c });
    ownMaterial += alive[perspective][t] * values[t];
    oppMaterial += alive[opp][t] * values[t];
  }
  const diff = ownMaterial - oppMaterial;

  if (captured.length === 0 && diff === 0) {
    return (
      <div style={{
        minHeight: 24, display: "flex", alignItems: "center",
        fontSize: 11, color: P.inkFaint, fontStyle: "italic",
        fontFamily: "var(--font-nunito), sans-serif",
        paddingLeft: 4,
      }}>no captures yet</div>
    );
  }

  return (
    <div style={{
      minHeight: 24, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
      paddingLeft: 4,
    }}>
      {captured.map((c, i) => (
        <span key={i} style={{
          display: "inline-flex", alignItems: "center", gap: 1,
          fontSize: 16, lineHeight: 1,
          color: opp === "w" ? "#C9BCA0" : P.inkSoft,
          filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.08))",
        }}>
          {Array.from({ length: c.count }, (_, j) => (
            <span key={j} style={{ marginLeft: j === 0 ? 0 : -6 }}>{icons[opp][c.type]}</span>
          ))}
        </span>
      ))}
      {diff !== 0 && (
        <span style={{
          fontSize: 11, fontWeight: 800,
          color: diff > 0 ? P.emerald : "#B45309",
          fontFamily: "var(--font-nunito), sans-serif",
          background: diff > 0 ? P.emeraldPale : "#FEF3C7",
          border: `1px solid ${diff > 0 ? P.emerald : "#B45309"}30`,
          padding: "2px 6px", borderRadius: 6,
          marginLeft: "auto",
          letterSpacing: 0.3,
        }}>{diff > 0 ? `+${diff}` : diff}</span>
      )}
    </div>
  );
}

// ── Section label (matches kingdom page's small-caps headers) ──
function SectionLabel({ num, text, accent }: { num: string; text: string; accent?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "2px 4px 6px" }}>
      <span style={{
        fontFamily: "var(--font-playfair), serif",
        fontSize: 12, fontWeight: 900,
        color: accent ? P.gold : P.inkLight,
        letterSpacing: 0.3,
      }}>{num}</span>
      <span style={{
        fontSize: 10, fontWeight: 800,
        color: accent ? P.gold : P.inkLight,
        letterSpacing: 1.6, textTransform: "uppercase",
      }}>{text}</span>
    </div>
  );
}

// ── Rank badge with XP progress ──
function RankBadge({ progression }: { progression: import("@/lib/progression/types").PlayerProgression }) {
  const rank = getRankByXP(progression.xp);
  const next = getNextRank(rank.id);
  const floor = rank.xpRequired;
  const ceil = next ? next.xpRequired : rank.xpRequired + 1;
  const pct = next ? Math.min(100, Math.max(0, ((progression.xp - floor) / (ceil - floor)) * 100)) : 100;

  return (
    <Link href="/kingdom" style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "4px 12px 4px 8px", borderRadius: 10,
      background: "white", border: `1.5px solid ${P.inkGhost}`,
      textDecoration: "none",
      transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
      boxShadow: `0 1px 4px rgba(26,18,16,0.05)`,
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = rank.color; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = P.inkGhost; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
      aria-label={`Rank: ${rank.name}. ${progression.xp} XP. ${next ? `${ceil - progression.xp} XP to ${next.name}.` : "Max rank."}`}
    >
      <span style={{ fontSize: 20, color: rank.color, lineHeight: 1 }}>{rank.icon}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: rank.color, fontFamily: "var(--font-nunito), sans-serif", letterSpacing: 0.3, lineHeight: 1 }}>
          {rank.name.toUpperCase()}
        </span>
        <div style={{ width: 80, height: 4, borderRadius: 2, background: P.parchment, overflow: "hidden" }}>
          <div style={{
            width: `${pct}%`, height: "100%",
            background: `linear-gradient(90deg, ${rank.color}, ${next?.color ?? rank.color})`,
            transition: "width 0.5s ease-out",
          }} />
        </div>
      </div>
      <span style={{ fontSize: 10, color: P.inkLight, fontFamily: "var(--font-nunito), sans-serif", fontWeight: 600 }}>
        {progression.xp}
      </span>
    </Link>
  );
}

// ── Floating +XP toast ──
function XPToast({ gain, onDone }: { gain: { amount: number; source: string; timestamp: number }; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [gain.timestamp, onDone]);
  return (
    <div style={{
      position: "fixed", top: 72, left: "50%",
      transform: "translateX(-50%)",
      zIndex: 50, pointerEvents: "none",
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 20px", borderRadius: 14,
      background: P.emerald, color: "white",
      fontFamily: "var(--font-nunito), sans-serif",
      fontWeight: 800, fontSize: 15,
      boxShadow: `0 10px 32px rgba(27,115,64,0.3), 0 2px 8px rgba(27,115,64,0.2)`,
      animation: "xpToast 2.2s cubic-bezier(0.34,1.56,0.64,1) forwards",
    }}>
      <span style={{ fontSize: 18 }}>✦</span>
      <span>+{gain.amount} XP</span>
      <span style={{ opacity: 0.85, fontWeight: 600, fontSize: 13 }}>· {gain.source}</span>
      <style>{`
        @keyframes xpToast {
          0%   { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.9); }
          15%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          85%  { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}

// ── Mission banner ──
function MissionBanner({ mission }: { mission: import("@/lib/progression/types").Mission }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px", borderRadius: 14,
      background: `linear-gradient(135deg, ${P.goldPale} 0%, ${P.emeraldPale} 100%)`,
      border: `1.5px solid ${P.gold}60`,
      boxShadow: `0 2px 10px ${P.gold}30`,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: "white", border: `1.5px solid ${P.gold}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        color: P.gold,
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, color: P.gold, letterSpacing: 1.2,
          textTransform: "uppercase", fontFamily: "var(--font-nunito), sans-serif",
        }}>Battle Test</span>
        <span style={{
          fontSize: 13, fontWeight: 700, color: P.ink,
          fontFamily: "var(--font-nunito), sans-serif",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{mission.description}</span>
      </div>
    </div>
  );
}

// ── Rank-up toast ──
function RankUpToast({ rankId, onDone }: { rankId: import("@/lib/progression/types").RankId; onDone: () => void }) {
  const rank = RANKS.find((r) => r.id === rankId)!;
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [rankId, onDone]);
  return (
    <div style={{
      position: "fixed", top: "50%", left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 60, pointerEvents: "none",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "28px 44px", borderRadius: 24,
      background: "white", border: `2px solid ${rank.color}`,
      boxShadow: `0 0 0 6px rgba(255,255,255,0.8), 0 24px 64px rgba(26,18,16,0.25), 0 0 40px ${rank.color}50`,
      animation: "rankUp 4s cubic-bezier(0.34,1.56,0.64,1) forwards",
    }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: P.inkLight, letterSpacing: 2, fontFamily: "var(--font-nunito), sans-serif" }}>RANK UP!</span>
      <span style={{ fontSize: 64, lineHeight: 1, margin: "8px 0", color: rank.color, filter: `drop-shadow(0 4px 12px ${rank.color}60)` }}>{rank.icon}</span>
      <span style={{ fontSize: 24, fontWeight: 900, color: P.ink, fontFamily: "var(--font-playfair), serif", letterSpacing: -0.5 }}>{rank.name}</span>
      <style>{`
        @keyframes rankUp {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          12%  { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
          18%  { transform: translate(-50%, -50%) scale(1); }
          85%  { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
        }
      `}</style>
    </div>
  );
}

export default function PlayPage() {
  const router = useRouter();
  const store = useGameStore();
  const {
    chess, selected, legalHighlights, lastMove, moveHistory,
    stateHistory, status, playerName, playerAge, difficulty,
    coachMessages, coachLoading, showPromo, botThinking, screen,
    progression, lastXPGain, justRankedUp, ahaCelebration,
  } = store;

  useEffect(() => {
    if (screen === "onboarding") router.push("/");
  }, [screen, router]);

  // Hydrate progression from localStorage on mount
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    store.hydrateProgression();
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Voice: speak each new coach message when enabled ──
  const speech = useSpeech();
  const spokenCount = useRef(0);
  useEffect(() => {
    if (coachMessages.length > spokenCount.current) {
      const latest = coachMessages[coachMessages.length - 1];
      if (latest) speech.speak(latest.text);
      spokenCount.current = coachMessages.length;
    }
  }, [coachMessages, speech]);

  const requestCoaching = useCallback(async (analysis: ReturnType<typeof analyzeMoveQuality>) => {
    if (!analysis) return;
    store.setCoachLoading(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...analysis,
          moveHistory,
          playerName,
          age: playerAge,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) fullText += parsed.text;
              } catch {}
            }
          }
        }
      }

      if (fullText) {
        const msgType = analysis.severity <= 1 ? "praise" : analysis.severity <= 2 ? "tip" : "correction";
        store.addCoachMessage({ type: msgType, text: fullText });
      } else {
        throw new Error("Empty response");
      }
    } catch {
      const fallbacks = FALLBACKS[analysis.trigger] ?? FALLBACKS.OK_MOVE;
      const text = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      store.addCoachMessage({
        type: analysis.severity <= 1 ? "praise" : "correction",
        text,
      });
    }

    store.setCoachLoading(false);
  }, [chess, moveHistory, playerName, playerAge, store]);

  const executeMove = useCallback((move: Move) => {
    const prevChess = new Chess(chess.fen());
    const san = moveToSAN(chess, move);
    const newChess = applyMove(chess, move);
    const newStatus = getGameStatus(newChess);

    store.makeMove(san, newChess, prevChess, { from: move.from, to: move.to }, newStatus);

    if (newStatus !== "playing") {
      const text =
        newStatus === "white_wins"
          ? `CHECKMATE! You did it, ${playerName}! 🏆 What an incredible game!`
          : newStatus === "black_wins"
          ? `The bot got you this time! But every loss is a lesson. You'll get it next time, ${playerName}! 💪`
          : `It's a draw! That takes skill to achieve — nice defense! 🤝`;
      store.addCoachMessage({
        type: newStatus === "white_wins" ? "celebration" : newStatus === "black_wins" ? "correction" : "tip",
        text,
      });
      store.grantGameEndXP(newStatus);
      return;
    }

    const analysis = analyzeMoveQuality(prevChess, newChess, move);
    if (analysis && shouldCoach(analysis, store.moveCount, store.lastCoachMove)) {
      requestCoaching(analysis);
      if (analysis.severity === 0) {
        store.addXP(5, "Great move!");
      }
    }

    // Check detected tactics against the active mission. Only fire the
    // first matching one — the celebration is single-slot and chained
    // fires would clobber each other.
    if (analysis?.tactics && analysis.tactics.length > 0) {
      for (const t of analysis.tactics) {
        const before = store.ahaCelebration;
        store.handleTacticDetected(t);
        if (store.ahaCelebration && store.ahaCelebration !== before) break;
      }
    }

    if (newChess.turn() === "b") {
      store.setBotThinking(true);
      const tacticPref = progression.activeMission?.targetTactic;
      findBestMove(newChess, difficulty, tacticPref).then((botMove) => {
        if (botMove) {
          const botSAN = moveToSAN(newChess, botMove);
          const afterBot = applyMove(newChess, botMove);
          const botStatus = getGameStatus(afterBot);
          store.makeMove(botSAN, afterBot, newChess, { from: botMove.from, to: botMove.to }, botStatus);

          if (botStatus !== "playing") {
            const text =
              botStatus === "black_wins"
                ? `Checkmate by the bot! Don't worry, ${playerName} — even grandmasters lose sometimes. Ready to try again?`
                : "Draw! Solid game from both sides. 🤝";
            store.addCoachMessage({
              type: botStatus === "black_wins" ? "correction" : "tip",
              text,
            });
            store.grantGameEndXP(botStatus);
          }
        }
        store.setBotThinking(false);
      });
    }
  }, [chess, difficulty, playerName, store, requestCoaching]);

  const handleSquareClick = useCallback((r: number, c: number) => {
    if (status !== "playing" || botThinking || chess.turn() !== "w") return;

    const COLS = "abcdefgh";
    const sq = COLS[c] + (8 - r);
    const board = chess.board();
    const piece = board[r][c];

    if (selected) {
      const move = legalHighlights.find((m) => m.to === sq);
      if (move) {
        const selectedPiece = board[selected.r][selected.c];
        if (selectedPiece?.type === "p" && (r === 0 || r === 7)) {
          store.showPromoModal(move);
          return;
        }
        executeMove(move);
        return;
      }
      if (piece?.color === "w") {
        const moves = getLegalMoves(chess, sq);
        store.selectSquare({ r, c }, moves);
        return;
      }
      store.clearSelection();
      return;
    }

    if (piece?.color === "w") {
      const moves = getLegalMoves(chess, sq);
      store.selectSquare({ r, c }, moves);
    }
  }, [chess, selected, legalHighlights, status, botThinking, executeMove, store]);

  const handlePromo = (pieceType: string) => {
    if (showPromo) {
      store.hidePromoModal();
      executeMove({ ...showPromo, promotion: pieceType as "q" | "r" | "b" | "n" });
    }
  };

  if (screen === "onboarding") return null;
  if (!hydrated) return null;

  const diffLabel = ["Easy", "Medium", "Hard"][difficulty - 1];

  return (
    <div style={{ minHeight: "100dvh", background: P.cream, color: P.ink, position: "relative" }}>
      {/* Aha! celebration — highest-priority overlay */}
      <AhaCelebration
        celebration={ahaCelebration}
        onDismiss={() => store.dismissAha()}
        playerName={playerName}
      />

      {/* XP + rank-up toasts */}
      {lastXPGain && <XPToast gain={lastXPGain} onDone={() => store.clearXPGain()} />}
      {justRankedUp && <RankUpToast rankId={justRankedUp} onDone={() => store.clearRankUp()} />}

      {/* Paper grain */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.022'/%3E%3C/svg%3E")`,
      }} />

      {/* Warm vignette — ties back to onboarding */}
      <div aria-hidden style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse at 20% 10%, ${P.parchment} 0%, ${P.cream} 65%)`,
      }} />

      {/* Floating chess atmosphere */}
      <ChessAtmosphere />

      {/* Header */}
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px",
        background: "rgba(251,247,240,0.88)",
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
        borderBottom: `1px solid ${P.inkGhost}40`,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>♟</span>
          <span style={{
            fontSize: 18, fontWeight: 900, color: P.ink,
            fontFamily: "var(--font-playfair), serif", letterSpacing: -0.4,
          }}>ChessWhiz</span>
        </div>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Rank + XP badge */}
          <RankBadge progression={progression} />

          {/* Difficulty badge */}
          <span style={{
            fontSize: 12, fontWeight: 700, color: P.inkLight,
            fontFamily: "var(--font-nunito), sans-serif",
            background: P.parchment,
            border: `1px solid ${P.inkGhost}`,
            borderRadius: 8, padding: "4px 10px",
            letterSpacing: 0.3,
          }}>{diffLabel}</span>

          {/* Voice toggle */}
          {speech.supported && (
            <button
              onClick={speech.toggle}
              aria-label={speech.enabled ? "Turn off coach voice" : "Turn on coach voice"}
              aria-pressed={speech.enabled}
              title={speech.enabled ? "Coach voice: on" : "Coach voice: off"}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 36, height: 36, borderRadius: 10,
                background: speech.enabled ? P.emeraldPale : "white",
                border: `1.5px solid ${speech.enabled ? P.emerald : P.inkGhost}`,
                color: speech.enabled ? P.emerald : P.inkLight,
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                boxShadow: speech.enabled
                  ? `0 2px 10px rgba(27,115,64,0.15)`
                  : `0 2px 6px rgba(26,18,16,0.05)`,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.94)"; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            >
              {speech.enabled ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>
          )}

          {/* New Game */}
          <button
            onClick={() => store.resetGame()}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: P.ink, color: P.cream, border: "none",
              borderRadius: 10, padding: "8px 16px",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-nunito), sans-serif",
              boxShadow: "0 2px 8px rgba(26,18,16,0.12)",
              transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(26,18,16,0.18)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(26,18,16,0.12)"; }}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            New Game
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main
        id="main-content"
        style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center",
          alignItems: "flex-start", gap: 16,
          maxWidth: 1000, margin: "0 auto",
          padding: "16px 12px",
          position: "relative", zIndex: 1,
        }}
      >
        {/* Left: Board column */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
          width: "100%", maxWidth: "min(calc(100vw - 24px), 480px)",
        }}>
          {/* Hand-lettered overline — same device as landing/onboarding */}
          <div style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between",
            padding: "0 4px 2px",
          }}>
            <span style={{
              fontFamily: "'Caveat', cursive", fontSize: 17, color: P.gold,
              transform: "rotate(-2deg)", display: "inline-block",
            }}>your game →</span>
            <span style={{
              fontSize: 10, fontWeight: 800, color: P.inkLight,
              letterSpacing: 1.4, textTransform: "uppercase",
              fontFamily: "var(--font-nunito), sans-serif",
            }}>
              Move <span style={{
                fontFamily: "var(--font-playfair), serif",
                fontSize: 13, color: P.ink, fontWeight: 900,
                letterSpacing: 0, marginLeft: 2,
              }}>{Math.ceil((moveHistory.length + 1) / 2)}</span>
            </span>
          </div>

          <PlayerBar
            name="ChessBot"
            colorLabel="Black"
            isActive={chess.turn() === "b" && status === "playing"}
            isBotThinking={botThinking}
            isBot={true}
          />
          {/* What the bot has captured from you */}
          <CapturedStrip chess={chess} perspective="b" />

          <Board
            chess={chess}
            selected={selected}
            legalHighlights={legalHighlights}
            lastMove={lastMove}
            showPromo={showPromo}
            status={status}
            botThinking={botThinking}
            onSquareClick={handleSquareClick}
            onPromo={handlePromo}
          />

          {/* What you have captured from the bot */}
          <CapturedStrip chess={chess} perspective="w" />
          <PlayerBar
            name={playerName}
            colorLabel="White"
            isActive={chess.turn() === "w" && status === "playing"}
            isBotThinking={false}
            isBot={false}
          />
          <GameStatusBar status={status} playerName={playerName} onReset={() => store.resetGame()} />
        </div>

        {/* Right: Coach + moves + actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 280px", maxWidth: 480 }}>
          {progression.activeMission && (
            <MissionBanner mission={progression.activeMission} />
          )}
          <div>
            <SectionLabel num="01" text="Coach Pawn" accent />
            <CoachPanel messages={coachMessages} loading={coachLoading} />
          </div>
          <div>
            <SectionLabel num="02" text={`Move history · ${moveHistory.length} ply`} />
            <MoveHistory moves={moveHistory} />
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => store.resetGame()}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: "white", border: `1.5px solid ${P.inkGhost}`,
                borderRadius: 12, minHeight: 44,
                fontSize: 13, fontWeight: 700, color: P.inkMed, cursor: "pointer",
                fontFamily: "var(--font-nunito), sans-serif",
                boxShadow: `0 2px 8px rgba(26,18,16,0.06)`,
                transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = P.emerald; (e.currentTarget as HTMLElement).style.color = P.emerald; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = P.inkGhost; (e.currentTarget as HTMLElement).style.color = P.inkMed; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              New Game
            </button>
            <button
              onClick={() => store.undo()}
              disabled={stateHistory.length < 2 || status !== "playing"}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                background: "white", border: `1.5px solid ${P.inkGhost}`,
                borderRadius: 12, minHeight: 44,
                fontSize: 13, fontWeight: 700, color: P.inkMed, cursor: "pointer",
                fontFamily: "var(--font-nunito), sans-serif",
                boxShadow: `0 2px 8px rgba(26,18,16,0.06)`,
                transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                opacity: stateHistory.length < 2 || status !== "playing" ? 0.35 : 1,
              }}
              onMouseEnter={e => { if (!(stateHistory.length < 2 || status !== "playing")) { (e.currentTarget as HTMLElement).style.borderColor = P.gold; (e.currentTarget as HTMLElement).style.color = P.gold; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = P.inkGhost; (e.currentTarget as HTMLElement).style.color = P.inkMed; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              onMouseDown={e => { if (!(stateHistory.length < 2 || status !== "playing")) (e.currentTarget as HTMLElement).style.transform = "scale(0.96)"; }}
              onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 14 4 9l5-5" />
                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
              </svg>
              Undo
            </button>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes drift {
          0%   { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-36px) rotate(8deg); }
        }
      `}</style>
    </div>
  );
}
