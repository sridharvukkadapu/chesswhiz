"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSpeech } from "@/lib/speech";
import { getRankByXP, getNextRank, RANKS, KINGDOMS } from "@/lib/progression/data";
// AhaCelebration is heavy (80-particle confetti + crystal + spinning
// rays) and only fires when the kid earns a Power. Lazy-load it so the
// initial /play bundle is lighter.
const AhaCelebration = dynamic(() => import("@/components/AhaCelebration"), {
  ssr: false,
  loading: () => null,
});
import BossIntroModal from "@/components/BossIntroModal";
import PostGameScreen from "@/components/PostGameScreen";
import ProgressStrip from "@/components/ProgressStrip";
import BottomNav from "@/components/BottomNav";
import { Chess } from "chess.js";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/stores/gameStore";
import { getLegalMoves, applyMove, getGameStatus, moveToSAN, classifyMoveSound } from "@/lib/chess/engine";
import { analyzeMoveQuality } from "@/lib/coaching/analyzer";
import { shouldCoach } from "@/lib/coaching/triggers";
import { FALLBACKS } from "@/lib/coaching/prompts";
import { generateAnnotation } from "@/lib/coaching/annotations";
import { findBestMove } from "@/lib/chess/ai";
import { ageToBand } from "@/lib/coaching/schema";
import { getDeviceId } from "@/lib/identity/device";
import type { FollowUpChip } from "@/lib/coaching/schema";
import type { ReplayStep } from "@/lib/coaching/schema";
import MoveReplayOverlay from "@/components/MoveReplayOverlay";
import { buildReplaySequence } from "@/lib/coaching/replay";
import Board from "@/components/Board";
import CoachPanel from "@/components/CoachPanel";
import CoachErrorBoundary from "@/components/CoachErrorBoundary";
import MoveHistory from "@/components/MoveHistory";
import ImStuckOverlay from "@/components/ImStuckOverlay";
import PlayerBar from "@/components/PlayerBar";
import GameStatusBar from "@/components/GameStatus";
import { Piece } from "@/components/ChessPieces";
import { GoldFoilText, StarField, MoteField, useTime, useAtmosphereScale } from "@/lib/design/atmosphere";
import { sfx } from "@/lib/audio/sfx";
import { haptics } from "@/lib/audio/haptics";
import { Target, RefreshCw, Undo2, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { T, Z } from "@/lib/design/tokens";
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
        background: T.butter,
        color: T.butterDeep,
        fontFamily: T.fontUI,
        fontWeight: 800,
        fontSize: 15,
        letterSpacing: "0.06em",
        boxShadow: "0 0 20px rgba(242,201,76,0.40)",
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
        background: "linear-gradient(180deg, #FFFCF5 0%, #F5ECDC 100%)",
        border: `2px solid ${T.butter}`,
        boxShadow: `0 0 0 6px rgba(242,201,76,0.18), ${T.shadowDeep}, 0 0 60px rgba(242,201,76,0.30)`,
        animation: "rankUp 4s cubic-bezier(0.34,1.56,0.64,1) forwards",
      }}
    >
      <span
        style={{
          fontFamily: T.fontUI,
          fontSize: 11,
          fontWeight: 800,
          color: T.butterDeep,
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
          color: T.ink,
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
    <button type="button"
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
        background: enabled ? "rgba(255,107,90,0.10)" : "#FFFCF5",
        border: `1.5px solid ${enabled ? T.coral : T.border}`,
        color: enabled ? T.coral : T.inkLow,
        cursor: "pointer",
        transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: enabled ? T.glowCoral : "none",
      }}
    >
      {enabled ? <Volume2 aria-hidden size={18} strokeWidth={2.2} /> : <VolumeX aria-hidden size={18} strokeWidth={2.2} />}
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
        background: "linear-gradient(135deg, rgba(242,201,76,0.12) 0%, rgba(124,182,158,0.08) 100%)",
        border: `1.5px solid rgba(242,201,76,0.45)`,
        boxShadow: `0 0 24px rgba(242,201,76,0.18)`,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: "rgba(242,201,76,0.12)",
          border: `1.5px solid ${T.butter}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          color: T.butterDeep,
          boxShadow: "none",
        }}
      >
        <Target aria-hidden size={20} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily: T.fontUI,
            fontSize: 10,
            fontWeight: 800,
            color: T.butterDeep,
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
            color: T.ink,
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
          color: T.inkDim,
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

  // Build a screen-reader summary so the captured strip isn't an
  // opaque pile of glyphs to assistive tech.
  const PIECE_NAME: Record<string, string> = { p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen" };
  const summary = captured
    .map((c) => `${c.count} ${PIECE_NAME[c.type]}${c.count > 1 ? "s" : ""}`)
    .join(", ");
  const ariaLabel = perspective === "w"
    ? `You have captured: ${summary || "nothing"}${diff !== 0 ? `. Material ${diff > 0 ? "advantage" : "deficit"}: ${Math.abs(diff)}.` : ""}`
    : `The bot has captured: ${summary || "nothing"}${diff !== 0 ? `. Material ${diff > 0 ? "advantage" : "deficit"}: ${Math.abs(diff)}.` : ""}`;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
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
        <span key={i} aria-hidden style={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
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
            color: diff > 0 ? T.sageDeep : T.coralDeep,
            background: diff > 0 ? "rgba(124,182,158,0.12)" : "rgba(255,107,90,0.10)",
            border: `1px solid ${diff > 0 ? "rgba(124,182,158,0.40)" : "rgba(255,107,90,0.35)"}`,
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
    currentCoachResponse, learnerModel, lastCoachMove, moveCount,
  } = store;

  const { isFirstSession, firstSessionComplete, markFirstSessionComplete } = store;
  const setBossKingdom = useGameStore((s) => s.setBossKingdom);
  const bossTacticAppliedThisGame = useGameStore((s) => s.bossTacticAppliedThisGame);
  const currentBossKingdom = useGameStore((s) => s.currentBossKingdom);
  const [showFirstGameCelebration, setShowFirstGameCelebration] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [showStuck, setShowStuck] = useState(false);
  const [replaySteps, setReplaySteps] = useState<ReplayStep[]>([]);
  const knightCardRef = useRef<HTMLDivElement>(null);
  const [showBossIntro, setShowBossIntro] = useState(false);
  const [pendingBoss, setPendingBoss] = useState<import("@/lib/progression/types").Boss | null>(null);
  const requestReset = () => {
    if (moveHistory.length > 0 && status === "playing") {
      setResetConfirmOpen(true);
    } else {
      store.resetGame();
    }
  };

  // Cmd/Ctrl+Z undo — global, but ignore typing inside inputs.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.key === "z" || e.key === "Z")) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || (document.activeElement as HTMLElement | null)?.isContentEditable) return;
      if (stateHistory.length < 2 || status !== "playing") return;
      e.preventDefault();
      store.undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stateHistory.length, status, store]);

  useEffect(() => {
    if (screen === "onboarding") router.push("/");
  }, [screen, router]);

  // Hydrate progression from localStorage on mount
  const [hydrated, setHydrated] = useState(false);
  const atmosphereScale = useAtmosphereScale();
  useEffect(() => {
    store.hydrateProgression();
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Boss intro — show once per kingdom session when entering a boss kingdom
  useEffect(() => {
    if (screen !== "playing") return;
    const kingdom = KINGDOMS.find((k) => k.id === progression.currentKingdom);
    if (!kingdom?.boss) return;
    const alreadyDefeated = progression.defeatedBosses.includes(kingdom.boss.name);
    if (alreadyDefeated) return;
    const shownKey = `boss_intro_shown_${kingdom.id}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(shownKey)) return;
    setPendingBoss(kingdom.boss);
    setShowBossIntro(true);
    setBossKingdom(kingdom.id);
    if (typeof window !== "undefined") sessionStorage.setItem(shownKey, "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, progression.currentKingdom]);

  // Game-start: fetch personalized welcome-back callback from /api/coach/session
  useEffect(() => {
    if (screen !== "playing") return;
    const deviceId = getDeviceId();
    if (!deviceId) return;
    fetch("/api/coach/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        playerName,
        ageBand: ageToBand(playerAge),
        phase: "game_start",
      }),
    })
      .then((r) => r.json())
      .then((data: { message?: string }) => {
        if (data.message) {
          // Replace the first coach message (intro) with the personalized callback
          store.addCoachMessage({ type: "intro", text: data.message });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Game-end: send result to /api/coach/session for memory storage
  const gameEndFiredRef = useRef(false);
  useEffect(() => {
    if (status === "playing") { gameEndFiredRef.current = false; return; }
    if (gameEndFiredRef.current) return;
    gameEndFiredRef.current = true;
    const deviceId = getDeviceId();
    if (!deviceId) return;
    const gameResult = status === "white_wins" ? "win" : status === "black_wins" ? "loss" : "draw";
    fetch("/api/coach/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId,
        playerName,
        ageBand: ageToBand(playerAge),
        phase: "game_end",
        gameResult,
        moveCount,
        tacticsSpotted: learnerModel.stats.tacticsSpotted,
        model: learnerModel,
      }),
    })
      .then((r) => r.json())
      .then((data: { narrative?: string }) => {
        if (data.narrative) {
          localStorage.setItem("chesswhiz.lastNarrative", data.narrative);
        }
      })
      .catch(() => {});

    // Boss defeat check
    if (currentBossKingdom && status === "white_wins") {
      const bossKingdom = KINGDOMS.find((k) => k.id === currentBossKingdom);
      if (bossKingdom?.boss) {
        if (!bossTacticAppliedThisGame) {
          store.addCoachMessage({
            type: "tip",
            text: `Great win! But ${bossKingdom.boss.name} is still standing — use a ${bossKingdom.boss.defeatTactic.replace(/_/g, " ")} to truly defeat them!`,
          });
        } else {
          store.defeatBoss(bossKingdom.boss.name);
          setBossKingdom(null);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // First-game Pawn Village celebration — fires at most once per game end
  const celebrationFiredRef = useRef(false);
  useEffect(() => {
    if (status === "playing") { celebrationFiredRef.current = false; return; }
    if (celebrationFiredRef.current) return;
    if (isFirstSession && !firstSessionComplete) {
      celebrationFiredRef.current = true;
      setShowFirstGameCelebration(true);
      markFirstSessionComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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

  const handlePostMoveCoaching = useCallback(async (
    fen: string,
    lastMoveSan: string,
    lastMoveFrom: string,
    lastMoveTo: string,
    mover: "player" | "bot",
    analysis: ReturnType<typeof analyzeMoveQuality>
  ) => {
    if (!analysis) return;
    store.setCoachLoading(true);

    try {
      const { summarizeForPrompt } = await import("@/lib/learner/model");
      const summary = summarizeForPrompt(learnerModel);

      const res = await fetch("/api/coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": getDeviceId() ?? "",
        },
        body: JSON.stringify({
          fen,
          lastMove: { from: lastMoveFrom, to: lastMoveTo, san: lastMoveSan },
          mover,
          trigger: analysis.trigger,
          centipawnDelta: analysis.diff,
          tacticsAvailableForKid: mover === "player"
            ? (analysis.tactics?.filter((t) => t.detected).map((t) => t.type) ?? [])
            : [],
          tacticsAvailableForBot: mover === "bot"
            ? (analysis.tactics?.filter((t) => t.detected).map((t) => t.type) ?? [])
            : [],
          playerName,
          ageBand: ageToBand(playerAge),
          learnerSummary: summary,
          activeMissionConcept: progression.activeMission?.targetTactic,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      if (data.shouldSpeak !== undefined) {
        // Visual-first: set annotation BEFORE response
        if (data.annotation && data.annotation.type !== "none") {
          const legacyAnnotation = generateAnnotation(analysis, analysis.tactics ?? [], {
            from: lastMoveFrom,
            to: lastMoveTo,
          });
          if (legacyAnnotation) {
            store.setBoardAnnotation(legacyAnnotation);
            if (annotationClearTimerRef.current) clearTimeout(annotationClearTimerRef.current);
            annotationClearTimerRef.current = setTimeout(
              () => store.setBoardAnnotation(null),
              legacyAnnotation.duration ?? 5000,
            );
          }
        }
        store.setCoachResponse(data);

        // Replay trigger for significant tactical events
        const REPLAY_TRIGGERS = ["BLUNDER", "BOT_TACTIC_INCOMING", "TACTIC_AVAILABLE"];
        if (REPLAY_TRIGGERS.includes(analysis.trigger)) {
          const steps: ReplayStep[] = (data as { replay?: ReplayStep[] }).replay?.length
            ? (data as { replay?: ReplayStep[] }).replay!
            : buildReplaySequence(moveHistory, moveHistory.length - 1);
          if (steps.length > 0) {
            setTimeout(() => setReplaySteps(steps), 800);
          }
        }
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
  }, [learnerModel, playerName, playerAge, progression, store]);

  const handleChipTap = useCallback((chip: FollowUpChip) => {
    switch (chip.intent) {
      case "got_it":
      case "i_see_it":
        store.setCoachResponse(null);
        break;
      case "show_me":
        // Re-trigger annotation for current position
        store.setCoachResponse(null);
        break;
      case "try_again":
        store.undo();
        store.setCoachResponse(null);
        break;
      default:
        // tell_me_more / what_if — no-op for now, coach will elaborate on next move
        break;
    }
  }, [store]);

  const executeMove = useCallback((move: Move) => {
    const prevChess = new Chess(chess.fen());
    const san = moveToSAN(chess, move);
    const newChess = applyMove(chess, move);
    const newStatus = getGameStatus(newChess);

    store.makeMove(san, newChess, prevChess, { from: move.from, to: move.to }, newStatus);

    // Pick the most "important" sound for what just happened.
    // Order matters: end-of-game and check trump capture trump castle
    // trump promotion trump plain move.
    // Pick the cue centrally so player + bot paths and tests share
    // the same priority logic.
    const playerSound = classifyMoveSound({
      san,
      status: newStatus,
      inCheck: newChess.isCheck(),
    });
    if (playerSound === "check") { sfx.check(); haptics.check(); }
    else if (playerSound === "castle") { sfx.castle(); haptics.capture(); }
    else if (playerSound === "promotion") { sfx.promotion(); haptics.aha(); }
    else if (playerSound === "capture") { sfx.capture(); haptics.capture(); }
    else if (playerSound === "move") { sfx.move(); haptics.tap(); }
    // win/lose/draw are handled in the game-end branch below

    if (newStatus !== "playing") {
      const drawText = newStatus === "stalemate"
        ? `Stalemate! The game ends in a draw — you ran out of moves without being in check. Sneaky! 🤝`
        : newChess.isThreefoldRepetition()
        ? `Draw by repetition! The same position appeared three times. A clever defense tactic! 🔄`
        : newChess.isInsufficientMaterial()
        ? `Draw! Neither side has enough pieces to checkmate. That's called insufficient material. 🤝`
        : `It's a draw! That takes skill to achieve — nice defense! 🤝`;
      const text =
        newStatus === "white_wins"
          ? `CHECKMATE! You did it, ${playerName}! 🏆 What an incredible game!`
          : newStatus === "black_wins"
          ? `The bot got you this time! But every loss is a lesson. You'll get it next time, ${playerName}! 💪`
          : drawText;
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
      handlePostMoveCoaching(newChess.fen(), san, move.from, move.to, "player", analysis);
      if (analysis.severity === 0) {
        store.addXP(5, "Great move!");
      }
    } else if (analysis) {
      // No coaching but may still want annotation for tactics
      const hasTactic = analysis.tactics?.some((t) => t.detected);
      if (hasTactic) {
        const annotation = generateAnnotation(analysis, analysis.tactics ?? [], move);
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

          // Bot move cue (same priority logic, no haptic — only player
          // actions deserve haptic feedback)
          if (botStatus === "playing") {
            const botSound = classifyMoveSound({
              san: botSAN,
              status: botStatus,
              inCheck: afterBot.isCheck(),
            });
            if (botSound === "check") sfx.check();
            else if (botSound === "castle") sfx.castle();
            else if (botSound === "promotion") sfx.promotion();
            else if (botSound === "capture") sfx.capture();
            else if (botSound === "move") sfx.move();
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

          // 20% chance Coach Pawn narrates the bot's tactic as a teaching moment
          if (botStatus === "playing" && botTactics.length > 0 && Math.random() < 0.20 && botAnalysis) {
            handlePostMoveCoaching(afterBot.fen(), botSAN, botMove.from, botMove.to, "bot", botAnalysis);
          }

          if (botStatus !== "playing") {
            const botDrawText = botStatus === "stalemate"
              ? `Stalemate! The game ends in a draw — you had no legal moves left. A clever escape! 🤝`
              : afterBot.isThreefoldRepetition()
              ? `Draw by repetition! The same position came up three times. Smart defense! 🔄`
              : afterBot.isInsufficientMaterial()
              ? `Draw! Not enough pieces on the board to force checkmate. That's insufficient material. 🤝`
              : "Draw! Solid game from both sides. 🤝";
            const text =
              botStatus === "black_wins"
                ? `Checkmate by the bot! Don't worry, ${playerName} — even grandmasters lose sometimes. Ready to try again?`
                : botDrawText;
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
  }, [chess, difficulty, playerName, store, handlePostMoveCoaching]);

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
        color: T.ink,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Boss intro modal */}
      <BossIntroModal
        boss={showBossIntro ? pendingBoss : null}
        onFight={() => setShowBossIntro(false)}
        onRetreat={() => { setShowBossIntro(false); router.push("/journey"); }}
      />

      <MoveReplayOverlay
        steps={replaySteps}
        onDismiss={() => setReplaySteps([])}
      />

      {/* Aha celebration overlay */}
      <AhaCelebration
        celebration={ahaCelebration}
        onDismiss={() => store.dismissAha()}
        playerName={playerName}
        knightCardRef={knightCardRef}
      />

      {/* Toasts */}
      {lastXPGain && <XPToast gain={lastXPGain} onDone={() => store.clearXPGain()} />}
      {justRankedUp && <RankUpToast rankId={justRankedUp} onDone={() => store.clearRankUp()} />}

      {/* Cosmic atmosphere */}
      <StarField count={Math.round(70 * atmosphereScale)} seed={5} opacity={0.5} />
      <MoteField count={Math.round(14 * atmosphereScale)} seed={6} color={T.coral} />

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
          background: "rgba(251,246,236,0.88)",
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
              background: T.coral,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: T.glowCoral,
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
              color: T.inkLow,
              background: "rgba(31,42,68,0.04)",
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
          <button type="button"
            onClick={requestReset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(31,42,68,0.04)",
              color: T.ink,
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
              (e.currentTarget as HTMLElement).style.borderColor = T.coral;
              (e.currentTarget as HTMLElement).style.color = T.coral;
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = T.coral;
              (e.currentTarget as HTMLElement).style.color = T.coral;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = T.border;
              (e.currentTarget as HTMLElement).style.color = T.ink;
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = T.border;
              (e.currentTarget as HTMLElement).style.color = T.ink;
            }}
          >
            <RefreshCw aria-hidden size={13} strokeWidth={2.5} />
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
                    color: T.coral,
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
                    color: T.inkDim,
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
                      color: T.ink,
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
                  position: "relative",
                  transform:
                    voicePlayback === "playing" && boardAnnotation
                      ? "scale(1.05)"
                      : "scale(1)",
                  transformOrigin: "center",
                  transition: "transform 600ms cubic-bezier(0.16,1,0.3,1)",
                  willChange: "transform",
                }}
              >
                {botThinking && status === "playing" && (
                  <>
                    <div
                      aria-hidden
                      style={{
                        position: "absolute",
                        inset: -4,
                        borderRadius: 14,
                        pointerEvents: "none",
                        zIndex: 5,
                        boxShadow: `0 0 0 2px ${T.coral}66, 0 0 28px 4px ${T.coral}44`,
                        animation: "botThinkPulse 1.4s ease-in-out infinite",
                      }}
                    />
                    <style>{`
                      @keyframes botThinkPulse {
                        0%, 100% { opacity: 0.45; }
                        50% { opacity: 1; }
                      }
                    `}</style>
                  </>
                )}
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
                  onCancelPromo={() => store.hidePromoModal()}
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
          ref={knightCardRef}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            flex: "1 1 320px",
            maxWidth: 460,
          }}
        >
          {progression.activeMission && <MissionBanner mission={progression.activeMission} />}

          <CoachErrorBoundary>
            <CoachPanel
              messages={coachMessages}
              response={currentCoachResponse}
              loading={coachLoading}
              voicePlaying={voicePlayback === "playing"}
              onChipTap={handleChipTap}
            />
          </CoachErrorBoundary>

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
                "linear-gradient(180deg, transparent 0%, rgba(251,246,236,0.65) 30%, rgba(251,246,236,0.92) 100%)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              marginInline: -4,
              paddingInline: 4,
              borderRadius: 14,
            }}
          >
            <button type="button"
              onClick={requestReset}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "#FFFCF5",
                border: `1.5px solid ${T.border}`,
                borderRadius: 12,
                minHeight: 52,
                fontSize: 13,
                fontWeight: 700,
                color: T.inkLow,
                cursor: "pointer",
                fontFamily: T.fontUI,
                transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = T.sage;
                (e.currentTarget as HTMLElement).style.color = T.sageDeep;
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = T.sage;
                (e.currentTarget as HTMLElement).style.color = T.sageDeep;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = T.border;
                (e.currentTarget as HTMLElement).style.color = T.inkLow;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = T.border;
                (e.currentTarget as HTMLElement).style.color = T.inkLow;
              }}
            >
              <RefreshCw aria-hidden size={14} strokeWidth={2.5} />
              New Game
            </button>
            <button type="button"
              onClick={() => store.undo()}
              disabled={stateHistory.length < 2 || status !== "playing"}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "#FFFCF5",
                border: `1.5px solid ${T.border}`,
                borderRadius: 12,
                minHeight: 52,
                fontSize: 13,
                fontWeight: 700,
                color: T.inkLow,
                cursor: "pointer",
                fontFamily: T.fontUI,
                transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
                opacity: stateHistory.length < 2 || status !== "playing" ? 0.4 : 1,
              }}
              onMouseEnter={(e) => {
                if (stateHistory.length >= 2 && status === "playing") {
                  (e.currentTarget as HTMLElement).style.borderColor = T.coral;
                  (e.currentTarget as HTMLElement).style.color = T.coral;
                }
              }}
              onFocus={(e) => {
                if (stateHistory.length >= 2 && status === "playing") {
                  (e.currentTarget as HTMLElement).style.borderColor = T.coral;
                  (e.currentTarget as HTMLElement).style.color = T.coral;
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = T.border;
                (e.currentTarget as HTMLElement).style.color = T.inkLow;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = T.border;
                (e.currentTarget as HTMLElement).style.color = T.inkLow;
              }}
            >
              <Undo2 aria-hidden size={14} strokeWidth={2.5} />
              Undo
            </button>
            {status === "playing" && (
              <button type="button"
                onClick={() => setShowStuck(true)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  background: "#FFFCF5",
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 12,
                  minHeight: 52,
                  fontSize: 13,
                  fontWeight: 700,
                  color: T.inkLow,
                  cursor: "pointer",
                  fontFamily: T.fontUI,
                  transition: "all 200ms cubic-bezier(0.34,1.56,0.64,1)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = T.butter;
                  (e.currentTarget as HTMLElement).style.color = T.butterDeep;
                }}
                onFocus={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = T.butter;
                  (e.currentTarget as HTMLElement).style.color = T.butterDeep;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = T.border;
                  (e.currentTarget as HTMLElement).style.color = T.inkLow;
                }}
                onBlur={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = T.border;
                  (e.currentTarget as HTMLElement).style.color = T.inkLow;
                }}
              >
                I&apos;m Stuck
              </button>
            )}
          </div>
        </div>
      </main>

      <ImStuckOverlay
        open={showStuck}
        onClose={() => setShowStuck(false)}
        playerName={playerName}
        onShowHint={() => {
          store.addCoachMessage({ type: "tip", text: "Look carefully at all your pieces — is any of them able to attack something valuable?" });
          setShowStuck(false);
        }}
        onLearnTrick={() => {
          store.addCoachMessage({ type: "tip", text: "Remember: always check if your pieces are safe before moving! Look for forks, pins, and hanging pieces." });
          setShowStuck(false);
        }}
        onStartOver={() => {
          setShowStuck(false);
          requestReset();
        }}
      />

      <BottomNav />

      {showFirstGameCelebration && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "radial-gradient(ellipse at 50% 40%, #FFF8E3 0%, #F5ECDC 60%, #FBF6EC 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
            padding: 24,
            animation: "ahaIn 0.5s ease-out",
          }}
          onClick={() => setShowFirstGameCelebration(false)}
        >
          <div style={{ fontSize: 64, animation: "ahaCrystalIn 1s cubic-bezier(0.34,1.56,0.64,1) both" }}>🏘️</div>
          <div style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontSize: "clamp(36px,7vw,72px)", color: T.ink, textAlign: "center", lineHeight: 1.1 }}>
            Welcome to<br />Pawn Village!
          </div>
          <div style={{ fontFamily: T.fontHand, fontSize: "clamp(18px,2.5vw,28px)", color: T.coral, textAlign: "center" }}>
            {playerName}, you&apos;re officially on your quest! 🎉
          </div>
          <div style={{ marginTop: 12, fontFamily: T.fontUI, fontSize: 14, color: T.inkLow }}>
            Tap to continue
          </div>
          <style>{`@keyframes ahaIn { from { opacity: 0; } to { opacity: 1; } } @keyframes ahaCrystalIn { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }`}</style>
        </div>
      )}

      {resetConfirmOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Restart game?"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: Z.modal,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(31,42,68,0.55)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setResetConfirmOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 360,
              width: "calc(100% - 40px)",
              padding: "24px 26px",
              borderRadius: 22,
              background: "#FFFCF5",
              border: `1.5px solid ${T.border}`,
              boxShadow: T.shadowDeep,
              fontFamily: T.fontUI,
              color: T.ink,
            }}
          >
            <div style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              Restart this game?
            </div>
            <div style={{ fontSize: 14, color: T.inkLow, lineHeight: 1.5, marginBottom: 18 }}>
              You'll lose your current position and start a fresh board. Your XP and progress are safe.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                style={{
                  background: "rgba(31,42,68,0.04)",
                  color: T.inkLow,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 12,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: T.fontUI,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetConfirmOpen(false);
                  store.resetGame();
                }}
                style={{
                  background: T.coral,
                  color: "#FFFCF5",
                  border: "none",
                  borderRadius: 12,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: T.glowCoral,
                  fontFamily: T.fontUI,
                  letterSpacing: "0.04em",
                }}
              >
                Yes, restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
