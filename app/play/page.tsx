"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSpeech } from "@/lib/speech";
import { getRankByXP, getNextRank, RANKS } from "@/lib/progression/data";
// AhaCelebration is heavy (80-particle confetti + crystal + spinning
// rays) and only fires when the kid earns a Power. Lazy-load it so the
// initial /play bundle is lighter.
const AhaCelebration = dynamic(() => import("@/components/AhaCelebration"), {
  ssr: false,
  loading: () => null,
});
import PostGameScreen from "@/components/PostGameScreen";
import ProgressStrip from "@/components/ProgressStrip";
import BottomNav from "@/components/BottomNav";
import { Chess } from "chess.js";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";
import { getLegalMoves, applyMove, getGameStatus, moveToSAN } from "@/lib/chess/engine";
import { analyzeMoveQuality } from "@/lib/coaching/analyzer";
import { shouldCoach } from "@/lib/coaching/triggers";
import { FALLBACKS } from "@/lib/coaching/prompts";
import { generateAnnotation } from "@/lib/coaching/annotations";
import { findBestMove } from "@/lib/chess/ai";
import Board from "@/components/Board";
import CoachPanel from "@/components/CoachPanel";
import MoveHistory from "@/components/MoveHistory";
import PlayerBar from "@/components/PlayerBar";
import GameStatusBar from "@/components/GameStatus";
import { Piece } from "@/components/ChessPieces";
import { GoldFoilText, StarField, MoteField, useTime } from "@/lib/design/atmosphere";
import { sfx } from "@/lib/audio/sfx";
import { haptics } from "@/lib/audio/haptics";
import { T } from "@/lib/design/tokens";
import type { Move } from "@/lib/chess/types";
import type { PlayerProgression, RankId } from "@/lib/progression/types";

// ── Floating XP +amount toast ──
function XPToast({
  gain,
  onDone,
}: {
  gain: { amount: number; source: string; timestamp: number };
  onDone: () => void;
}) {
  useEffect(() => {
    sfx.xp();
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [gain.timestamp, onDone]);
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Earned ${gain.amount} XP from ${gain.source}`}
      style={{
        position: "fixed",
        top: 84,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 22px",
        borderRadius: 14,
        background: T.goldFoil,
        color: T.inkDeep,
        fontFamily: T.fontUI,
        fontWeight: 800,
        fontSize: 15,
        letterSpacing: "0.06em",
        boxShadow: T.glowAmber,
        animation: "xpToast 2.2s cubic-bezier(0.34,1.56,0.64,1) forwards",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <span aria-hidden style={{ fontSize: 18 }}>✦</span>
      <span>+{gain.amount} XP</span>
      <span style={{ opacity: 0.75, fontWeight: 600, fontSize: 13 }}>· {gain.source}</span>
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

// ── Mid-screen rank-up celebration ──
function RankUpToast({ rankId, onDone }: { rankId: RankId; onDone: () => void }) {
  const rank = RANKS.find((r) => r.id === rankId)!;
  useEffect(() => {
    sfx.unlock();
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, [rankId, onDone]);
  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 60,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 48px",
        borderRadius: 26,
        background: "linear-gradient(180deg, rgba(36,24,69,0.95) 0%, rgba(14,10,31,0.99) 100%)",
        border: `2px solid ${T.amber}`,
        boxShadow: `0 0 0 6px rgba(245,182,56,0.18), ${T.shadowDeep}, 0 0 60px rgba(252,211,77,0.4)`,
        animation: "rankUp 4s cubic-bezier(0.34,1.56,0.64,1) forwards",
      }}
    >
      <span
        style={{
          fontFamily: T.fontUI,
          fontSize: 11,
          fontWeight: 800,
          color: T.amberGlow,
          letterSpacing: "0.4em",
        }}
      >
        RANK UP!
      </span>
      <div style={{ margin: "8px 0", filter: `drop-shadow(0 0 18px ${rank.color}90)` }}>
        <Piece type={rankId === "knight" ? "knight" : rankId === "bishop" ? "bishop" : rankId === "rook" ? "rook" : rankId === "queen" ? "queen" : rankId === "king" ? "king" : "pawn"} color="white" size={84} />
      </div>
      <span
        style={{
          fontFamily: T.fontDisplay,
          fontStyle: "italic",
          fontSize: 28,
          fontWeight: 600,
          color: T.textHi,
        }}
      >
        {rank.name}
      </span>
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

// ── Voice toggle button (header chip) ──
function VoiceToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={enabled ? "Turn off coach voice" : "Turn on coach voice"}
      aria-pressed={enabled}
      title={enabled ? "Coach voice: on" : "Coach voice: off"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 44,
        height: 44,
        borderRadius: 12,
        background: enabled ? "rgba(245,182,56,0.15)" : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${enabled ? T.amber : T.border}`,
        color: enabled ? T.amberGlow : T.textLo,
        cursor: "pointer",
        transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: enabled ? T.glowAmber : "none",
      }}
    >
      {enabled ? (
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
  );
}

// ── Mission banner — gold-accented quest pill ──
function MissionBanner({ mission }: { mission: import("@/lib/progression/types").Mission }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 18px",
        borderRadius: 16,
        background: "linear-gradient(135deg, rgba(245,182,56,0.14) 0%, rgba(192,132,252,0.10) 100%)",
        border: `1.5px solid rgba(245,182,56,0.4)`,
        boxShadow: `0 0 24px rgba(245,182,56,0.18)`,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: "rgba(7,5,15,0.4)",
          border: `1.5px solid ${T.amber}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: T.amberGlow,
          boxShadow: T.glowAmber,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily: T.fontUI,
            fontSize: 10,
            fontWeight: 800,
            color: T.amberGlow,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Battle Test
        </span>
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontStyle: "italic",
            fontSize: 16,
            color: T.textHi,
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {mission.description}
        </div>
      </div>
    </div>
  );
}

// ── Captured pieces (below opponent's PlayerBar / above yours) ──
function CapturedStrip({ chess, perspective }: { chess: Chess; perspective: "w" | "b" }) {
  const start: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  const alive = { w: { ...start }, b: { ...start } } as Record<"w" | "b", Record<string, number>>;
  for (const row of chess.board()) {
    for (const sq of row) {
      if (sq && sq.type !== "k") alive[sq.color][sq.type] -= 1;
    }
  }
  const opp: "w" | "b" = perspective === "w" ? "b" : "w";
  const captured: Array<{ type: string; count: number }> = [];
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
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
      <div
        style={{
          minHeight: 22,
          display: "flex",
          alignItems: "center",
          fontFamily: T.fontUI,
          fontSize: 11,
          color: T.textDim,
          fontStyle: "italic",
          paddingLeft: 4,
        }}
      >
        no captures yet
      </div>
    );
  }

  const TYPE_TO_PIECE: Record<string, "pawn" | "knight" | "bishop" | "rook" | "queen"> = {
    p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen",
  };

  return (
    <div
      style={{
        minHeight: 26,
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "wrap",
        paddingLeft: 4,
      }}
    >
      {captured.map((c, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
          {Array.from({ length: c.count }, (_, j) => (
            <span key={j} style={{ marginLeft: j === 0 ? 0 : -6, opacity: 0.85 }}>
              <Piece type={TYPE_TO_PIECE[c.type]} color={opp === "w" ? "white" : "black"} size={20} />
            </span>
          ))}
        </span>
      ))}
      {diff !== 0 && (
        <span
          style={{
            fontFamily: T.fontMono,
            fontSize: 11,
            fontWeight: 800,
            color: diff > 0 ? T.emeraldGlow : T.rubyGlow,
            background: diff > 0 ? "rgba(52,211,153,0.10)" : "rgba(255,107,107,0.10)",
            border: `1px solid ${diff > 0 ? "rgba(52,211,153,0.4)" : "rgba(255,107,107,0.4)"}`,
            padding: "2px 8px",
            borderRadius: 6,
            marginLeft: "auto",
            letterSpacing: 0.3,
          }}
        >
          {diff > 0 ? `+${diff}` : diff}
        </span>
      )}
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
    progression, lastXPGain, justRankedUp, ahaCelebration, boardAnnotation, voicePlayback,
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

  // Voice-synced annotation reveal
  const pendingAnnotationRef = useRef<typeof boardAnnotation>(null);
  const annotationFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const annotationClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (voicePlayback !== "playing") return;
    const a = pendingAnnotationRef.current;
    if (!a) return;
    pendingAnnotationRef.current = null;
    if (annotationFallbackTimerRef.current) {
      clearTimeout(annotationFallbackTimerRef.current);
      annotationFallbackTimerRef.current = null;
    }
    store.setBoardAnnotation(a);
    if (annotationClearTimerRef.current) clearTimeout(annotationClearTimerRef.current);
    annotationClearTimerRef.current = setTimeout(
      () => store.setBoardAnnotation(null),
      a.duration ?? 5000,
    );
  }, [voicePlayback, store]);

  useEffect(() => {
    return () => {
      if (annotationFallbackTimerRef.current) clearTimeout(annotationFallbackTimerRef.current);
      if (annotationClearTimerRef.current) clearTimeout(annotationClearTimerRef.current);
    };
  }, []);

  // Post-game screen: show after 2s so the Aha! celebration has a beat
  const [showPostGame, setShowPostGame] = useState(false);
  useEffect(() => {
    if (status === "playing") {
      setShowPostGame(false);
      return;
    }
    const t = setTimeout(() => setShowPostGame(true), 2000);
    return () => clearTimeout(t);
  }, [status]);

  // Voice
  const speech = useSpeech();
  const spokenCount = useRef(0);
  useEffect(() => {
    if (coachMessages.length > spokenCount.current) {
      const latest = coachMessages[coachMessages.length - 1];
      if (latest) {
        speech.speak(latest.text);
        // Cue: gentle chime for each new coach message (skip the first
        // intro on game start so the kid doesn't get a chime out of nowhere)
        if (spokenCount.current > 0 || latest.type !== "intro") {
          sfx.coach();
        }
      }
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
                if (typeof parsed.replace === "string") fullText = parsed.replace;
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

    // Pick the most "important" sound for what just happened.
    // Order matters: end-of-game and check trump capture trump castle
    // trump promotion trump plain move.
    if (newStatus === "white_wins" || newStatus === "black_wins") {
      // The win/lose cue is fired below from grantGameEndXP path.
    } else if (newChess.isCheck()) {
      sfx.check();
      haptics.check();
    } else if (san.includes("O-O")) {
      sfx.castle();
      haptics.capture();
    } else if (san.includes("=")) {
      sfx.promotion();
      haptics.aha();
    } else if (san.includes("x")) {
      sfx.capture();
      haptics.capture();
    } else {
      sfx.move();
      haptics.tap();
    }

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
      // End-game cue
      if (newStatus === "white_wins") sfx.win();
      else if (newStatus === "black_wins") sfx.lose();
      else sfx.draw();
      return;
    }

    const analysis = analyzeMoveQuality(prevChess, newChess, move);
    const willCoach = !!analysis && shouldCoach(analysis, store.moveCount, store.lastCoachMove);
    if (willCoach && analysis) {
      requestCoaching(analysis);
      if (analysis.severity === 0) {
        store.addXP(5, "Great move!");
      }
    }

    if (analysis) {
      const hasTactic = analysis.tactics?.some((t) => t.detected);
      if (hasTactic || willCoach) {
        const annotation = generateAnnotation(analysis, analysis.tactics ?? [], move);
        if (annotation) {
          pendingAnnotationRef.current = annotation;
          if (annotationFallbackTimerRef.current) {
            clearTimeout(annotationFallbackTimerRef.current);
          }
          annotationFallbackTimerRef.current = setTimeout(() => {
            if (pendingAnnotationRef.current) {
              const a = pendingAnnotationRef.current;
              pendingAnnotationRef.current = null;
              store.setBoardAnnotation(a);
              if (annotationClearTimerRef.current) clearTimeout(annotationClearTimerRef.current);
              annotationClearTimerRef.current = setTimeout(
                () => store.setBoardAnnotation(null),
                a.duration ?? 5000,
              );
            }
          }, 1600);
        }
      }
    }

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

          // Bot move cue (same priority order as the player's path)
          if (botStatus === "playing") {
            if (afterBot.isCheck()) sfx.check();
            else if (botSAN.includes("O-O")) sfx.castle();
            else if (botSAN.includes("=")) sfx.promotion();
            else if (botSAN.includes("x")) sfx.capture();
            else sfx.move();
          }

          const botAnalysis = analyzeMoveQuality(newChess, afterBot, botMove);
          const botTactics = botAnalysis?.tactics?.filter((t) => t.detected) ?? [];
          if (botTactics.length > 0 && botAnalysis) {
            const annotation = generateAnnotation(botAnalysis, botTactics, botMove);
            if (annotation) {
              pendingAnnotationRef.current = annotation;
              if (annotationFallbackTimerRef.current) clearTimeout(annotationFallbackTimerRef.current);
              annotationFallbackTimerRef.current = setTimeout(() => {
                if (pendingAnnotationRef.current) {
                  const a = pendingAnnotationRef.current;
                  pendingAnnotationRef.current = null;
                  store.setBoardAnnotation(a);
                  if (annotationClearTimerRef.current) clearTimeout(annotationClearTimerRef.current);
                  annotationClearTimerRef.current = setTimeout(
                    () => store.setBoardAnnotation(null),
                    a.duration ?? 5000,
                  );
                }
              }, 1600);
            }
          }

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
            if (botStatus === "black_wins") sfx.lose();
            else sfx.draw();
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
    <div
      style={{
        minHeight: "100dvh",
        background: T.bgRadial,
        color: T.textHi,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Aha celebration overlay */}
      <AhaCelebration
        celebration={ahaCelebration}
        onDismiss={() => store.dismissAha()}
        playerName={playerName}
      />

      {/* Toasts */}
      {lastXPGain && <XPToast gain={lastXPGain} onDone={() => store.clearXPGain()} />}
      {justRankedUp && <RankUpToast rankId={justRankedUp} onDone={() => store.clearRankUp()} />}

      {/* Cosmic atmosphere */}
      <StarField count={70} seed={5} opacity={0.5} />
      <MoteField count={14} seed={6} color={T.amberGlow} />

      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `calc(12px + env(safe-area-inset-top)) 24px 12px 24px`,
          background: "rgba(7,5,15,0.6)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: T.goldFoil,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: T.glowAmber,
            }}
          >
            <Piece type="king" color="white" size={28} />
          </div>
          <GoldFoilText fontSize={24} italic>
            ChessWhiz
          </GoldFoilText>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Difficulty chip */}
          <span
            style={{
              fontFamily: T.fontUI,
              fontSize: 11,
              fontWeight: 700,
              color: T.textMed,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: "5px 12px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {diffLabel}
          </span>

          {/* Voice toggle */}
          {speech.supported && <VoiceToggle enabled={speech.enabled} onToggle={speech.toggle} />}

          {/* New Game */}
          <button
            onClick={() => store.resetGame()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: T.amethystBg,
              color: T.textHi,
              border: `1.5px solid ${T.border}`,
              borderRadius: 10,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: T.fontUI,
              transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = T.amber;
              (e.currentTarget as HTMLElement).style.color = T.amberGlow;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = T.border;
              (e.currentTarget as HTMLElement).style.color = T.textHi;
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            New Game
          </button>
        </div>
      </header>

      {/* Persistent progress strip */}
      <ProgressStrip progression={progression} />

      {/* Main two-column layout */}
      <main
        id="main-content"
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 24,
          maxWidth: 1180,
          margin: "0 auto",
          padding: "20px 16px 100px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* LEFT — board column / post-game takeover */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            width: "100%",
            maxWidth: 680,
          }}
        >
          {showPostGame ? (
            <PostGameScreen
              status={status}
              playerName={playerName}
              moveHistory={moveHistory}
              coachMessages={coachMessages}
              progression={progression}
              onPlayAgain={() => store.resetGame()}
            />
          ) : (
            <>
              {/* Move counter overline */}
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  padding: "0 4px",
                }}
              >
                <span
                  style={{
                    fontFamily: T.fontHand,
                    fontSize: 18,
                    color: T.amberGlow,
                    transform: "rotate(-2deg)",
                    display: "inline-block",
                  }}
                >
                  your game →
                </span>
                <span
                  style={{
                    fontFamily: T.fontUI,
                    fontSize: 10,
                    fontWeight: 800,
                    color: T.textLo,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  Move{" "}
                  <span
                    style={{
                      fontFamily: T.fontDisplay,
                      fontStyle: "italic",
                      fontSize: 14,
                      color: T.textHi,
                      fontWeight: 700,
                      marginLeft: 2,
                    }}
                  >
                    {Math.ceil((moveHistory.length + 1) / 2)}
                  </span>
                </span>
              </div>

              <PlayerBar
                name="ChessBot"
                colorLabel="Black"
                isActive={chess.turn() === "b" && status === "playing"}
                isBotThinking={botThinking}
                isBot={true}
              />
              <CapturedStrip chess={chess} perspective="b" />

              {/* Camera zoom on coaching beats — board scales up ~5% when
                  Coach Pawn is actively speaking AND an annotation is on
                  the board. Settles back when voice ends or annotation
                  clears. Long transition on the way out so it doesn't snap. */}
              <div
                style={{
                  transform:
                    voicePlayback === "playing" && boardAnnotation
                      ? "scale(1.05)"
                      : "scale(1)",
                  transformOrigin: "center",
                  transition: "transform 600ms cubic-bezier(0.16,1,0.3,1)",
                  willChange: "transform",
                }}
              >
                <Board
                  chess={chess}
                  selected={selected}
                  legalHighlights={legalHighlights}
                  lastMove={lastMove}
                  showPromo={showPromo}
                  status={status}
                  botThinking={botThinking}
                  annotation={boardAnnotation}
                  voicePlaying={voicePlayback === "playing"}
                  onSquareClick={handleSquareClick}
                  onPromo={handlePromo}
                />
              </div>

              <CapturedStrip chess={chess} perspective="w" />
              <PlayerBar
                name={playerName}
                colorLabel="White"
                isActive={chess.turn() === "w" && status === "playing"}
                isBotThinking={false}
                isBot={false}
              />
              <GameStatusBar status={status} playerName={playerName} onReset={() => store.resetGame()} />
            </>
          )}
        </div>

        {/* RIGHT — coach + moves + actions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: "1 1 320px",
            maxWidth: 460,
          }}
        >
          {progression.activeMission && <MissionBanner mission={progression.activeMission} />}

          <CoachPanel
            messages={coachMessages}
            loading={coachLoading}
            voicePlaying={voicePlayback === "playing"}
          />

          <MoveHistory moves={moveHistory} />

          {/* Action row — sticky bottom so New Game / Undo are always
              within thumb reach without scrolling to the end of the
              right column. Sits above the 64px bottom nav. */}
          <div
            style={{
              display: "flex",
              gap: 8,
              position: "sticky",
              bottom: "calc(72px + env(safe-area-inset-bottom))",
              zIndex: 5,
              padding: "8px 0",
              background:
                "linear-gradient(180deg, transparent 0%, rgba(7,5,15,0.65) 30%, rgba(7,5,15,0.85) 100%)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              marginInline: -4,
              paddingInline: 4,
              borderRadius: 14,
            }}
          >
            <button
              onClick={() => store.resetGame()}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "rgba(255,255,255,0.04)",
                border: `1.5px solid ${T.border}`,
                borderRadius: 12,
                minHeight: 52,
                fontSize: 13,
                fontWeight: 700,
                color: T.textMed,
                cursor: "pointer",
                fontFamily: T.fontUI,
                transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = T.emerald;
                (e.currentTarget as HTMLElement).style.color = T.emeraldGlow;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = T.border;
                (e.currentTarget as HTMLElement).style.color = T.textMed;
              }}
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
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "rgba(255,255,255,0.04)",
                border: `1.5px solid ${T.border}`,
                borderRadius: 12,
                minHeight: 52,
                fontSize: 13,
                fontWeight: 700,
                color: T.textMed,
                cursor: "pointer",
                fontFamily: T.fontUI,
                transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
                opacity: stateHistory.length < 2 || status !== "playing" ? 0.4 : 1,
              }}
              onMouseEnter={(e) => {
                if (stateHistory.length >= 2 && status === "playing") {
                  (e.currentTarget as HTMLElement).style.borderColor = T.amber;
                  (e.currentTarget as HTMLElement).style.color = T.amberGlow;
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = T.border;
                (e.currentTarget as HTMLElement).style.color = T.textMed;
              }}
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

      <BottomNav />
    </div>
  );
}
