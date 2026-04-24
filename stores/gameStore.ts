"use client";

import { create } from "zustand";
import { Chess } from "chess.js";
import type { Move, LastMove, GameStatus, CoachMessage, Difficulty, Square } from "@/lib/chess/types";
import type { PlayerProgression, Mission, RankId } from "@/lib/progression/types";
import { getRankByXP, XP_REWARDS, getStreakMultiplier, POWERS } from "@/lib/progression/data";

const PROGRESSION_KEY = "chesswhiz.progression";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

const DEFAULT_PROGRESSION: PlayerProgression = {
  rank: "pawn",
  xp: 0,
  currentKingdom: "village",
  completedKingdoms: [],
  defeatedBosses: [],
  masteredStrategies: [],
  earnedPowers: [],
  activeMission: null,
  streak: 0,
  lastPlayedDate: "",
};

function loadProgression(): PlayerProgression {
  if (typeof window === "undefined") return DEFAULT_PROGRESSION;
  try {
    const raw = localStorage.getItem(PROGRESSION_KEY);
    if (!raw) return DEFAULT_PROGRESSION;
    const parsed = JSON.parse(raw) as Partial<PlayerProgression>;
    return { ...DEFAULT_PROGRESSION, ...parsed };
  } catch {
    return DEFAULT_PROGRESSION;
  }
}

function saveProgression(prog: PlayerProgression): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESSION_KEY, JSON.stringify(prog));
  } catch {}
}

interface GameStore {
  // Chess state
  chess: Chess;
  selected: Square | null;
  legalHighlights: Move[];
  lastMove: LastMove | null;
  moveHistory: string[];
  stateHistory: Chess[];
  status: GameStatus;

  // Player settings
  playerName: string;
  playerAge: number;
  difficulty: Difficulty;

  // Coaching state
  coachMessages: CoachMessage[];
  coachLoading: boolean;
  lastCoachMove: number;
  moveCount: number;

  // UI state
  screen: "onboarding" | "playing";
  showPromo: Move | null;
  botThinking: boolean;

  // Progression state
  progression: PlayerProgression;
  lastXPGain: { amount: number; source: string; timestamp: number } | null;
  justRankedUp: RankId | null;

  // Actions
  setSettings: (name: string, age: number, difficulty: Difficulty) => void;
  selectSquare: (square: Square, moves: Move[]) => void;
  clearSelection: () => void;
  makeMove: (san: string, newChess: Chess, prevChess: Chess, lastMove: LastMove, status: GameStatus) => void;
  showPromoModal: (move: Move) => void;
  hidePromoModal: () => void;
  setBotThinking: (val: boolean) => void;
  addCoachMessage: (msg: Omit<CoachMessage, "id">) => void;
  setCoachLoading: (val: boolean) => void;
  resetGame: () => void;
  undo: () => void;

  // Progression actions
  addXP: (amount: number, source: string) => void;
  completeMission: () => void;
  startMission: (mission: Mission) => void;
  defeatBoss: (bossName: string) => void;
  masterStrategy: (strategyId: string) => void;
  grantGameEndXP: (status: GameStatus) => void;
  clearXPGain: () => void;
  clearRankUp: () => void;
  hydrateProgression: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  chess: new Chess(),
  selected: null,
  legalHighlights: [],
  lastMove: null,
  moveHistory: [],
  stateHistory: [],
  status: "playing",
  playerName: "",
  playerAge: 9,
  difficulty: 2,
  coachMessages: [],
  coachLoading: false,
  lastCoachMove: -3,
  moveCount: 0,
  screen: "onboarding",
  showPromo: null,
  botThinking: false,

  progression: DEFAULT_PROGRESSION,
  lastXPGain: null,
  justRankedUp: null,

  setSettings: (name, age, difficulty) => {
    // Update streak on session start
    const prog = get().progression;
    const today = todayISO();
    let nextStreak = prog.streak;
    if (prog.lastPlayedDate) {
      const diff = daysBetween(prog.lastPlayedDate, today);
      if (diff === 0) {
        // same day, no change
      } else if (diff === 1) {
        nextStreak = prog.streak + 1;
      } else {
        nextStreak = 1;
      }
    } else {
      nextStreak = 1;
    }
    const nextProg: PlayerProgression = {
      ...prog,
      streak: nextStreak,
      lastPlayedDate: today,
    };
    saveProgression(nextProg);

    set({
      playerName: name,
      playerAge: age,
      difficulty,
      screen: "playing",
      chess: new Chess(),
      moveHistory: [],
      stateHistory: [],
      status: "playing",
      lastMove: null,
      moveCount: 0,
      lastCoachMove: -3,
      progression: nextProg,
      coachMessages: [
        {
          id: crypto.randomUUID(),
          type: "intro",
          text: `Hey ${name}! I'm Coach Pawn 🐾 — let's play some chess! You're White, so you go first. Try moving a center pawn to start!`,
        },
      ],
    });
  },

  selectSquare: (square, moves) =>
    set({ selected: square, legalHighlights: moves }),

  clearSelection: () =>
    set({ selected: null, legalHighlights: [] }),

  makeMove: (san, newChess, prevChess, lastMove, status) =>
    set((state) => ({
      chess: newChess,
      moveHistory: [...state.moveHistory, san],
      stateHistory: [...state.stateHistory, prevChess],
      lastMove,
      selected: null,
      legalHighlights: [],
      status,
      moveCount: state.moveCount + 1,
      showPromo: null,
    })),

  showPromoModal: (move) => set({ showPromo: move }),
  hidePromoModal: () => set({ showPromo: null }),

  setBotThinking: (val) => set({ botThinking: val }),

  addCoachMessage: (msg) =>
    set((state) => ({
      coachMessages: [
        ...state.coachMessages,
        { id: crypto.randomUUID(), ...msg },
      ],
      lastCoachMove: state.moveCount,
    })),

  setCoachLoading: (val) => set({ coachLoading: val }),

  resetGame: () => {
    const { playerName } = get();
    set({
      chess: new Chess(),
      selected: null,
      legalHighlights: [],
      lastMove: null,
      moveHistory: [],
      stateHistory: [],
      status: "playing",
      moveCount: 0,
      lastCoachMove: -3,
      botThinking: false,
      showPromo: null,
      coachMessages: [
        {
          id: crypto.randomUUID(),
          type: "intro",
          text: `New game! Let's go, ${playerName}! Show me what you've learned! ♟`,
        },
      ],
    });
  },

  undo: () => {
    const { stateHistory, moveHistory, status } = get();
    if (stateHistory.length < 2 || status !== "playing") return;
    const prevChess = stateHistory[stateHistory.length - 2];
    set({
      chess: new Chess(prevChess.fen()),
      stateHistory: stateHistory.slice(0, -2),
      moveHistory: moveHistory.slice(0, -2),
      lastMove: null,
      selected: null,
      legalHighlights: [],
    });
    set((state) => ({
      coachMessages: [
        ...state.coachMessages,
        {
          id: crypto.randomUUID(),
          type: "tip",
          text: "Let's try that again! Think it through — what are all your options? 🤔",
        },
      ],
    }));
  },

  // ───── Progression actions ─────
  addXP: (amount, source) => {
    const { progression } = get();
    const multiplier = getStreakMultiplier(progression.streak);
    const finalAmount = Math.round(amount * multiplier);
    const newXP = progression.xp + finalAmount;
    const newRank = getRankByXP(newXP);
    const rankedUp = newRank.id !== progression.rank;

    const nextProg: PlayerProgression = {
      ...progression,
      xp: newXP,
      rank: newRank.id,
    };
    saveProgression(nextProg);

    set({
      progression: nextProg,
      lastXPGain: { amount: finalAmount, source, timestamp: Date.now() },
      justRankedUp: rankedUp ? newRank.id : null,
    });
  },

  grantGameEndXP: (status) => {
    const { difficulty } = get();
    if (status === "white_wins") {
      get().addXP(XP_REWARDS.winGame[difficulty], `Won a ${["Easy","Medium","Hard"][difficulty-1]} game`);
    } else if (status === "stalemate" || status === "draw") {
      get().addXP(XP_REWARDS.drawGame[difficulty], "Drew a game");
    } else if (status === "black_wins") {
      get().addXP(XP_REWARDS.loseGame, "Completed a game");
    }
  },

  completeMission: () => {
    const { progression } = get();
    if (!progression.activeMission) return;
    const powerId = progression.activeMission.powerId;
    const power = POWERS.find((p) => p.id === powerId);
    const earnedPowers = power && !progression.earnedPowers.includes(powerId)
      ? [...progression.earnedPowers, powerId]
      : progression.earnedPowers;
    const nextProg: PlayerProgression = {
      ...progression,
      activeMission: null,
      earnedPowers,
    };
    saveProgression(nextProg);
    set({ progression: nextProg });
    // Award bonus XP for applying a tactic
    get().addXP(XP_REWARDS.applyTactic, `Applied ${progression.activeMission.targetTactic}`);
  },

  startMission: (mission) => {
    const { progression } = get();
    const nextProg: PlayerProgression = { ...progression, activeMission: mission };
    saveProgression(nextProg);
    set({ progression: nextProg });
  },

  defeatBoss: (bossName) => {
    const { progression } = get();
    if (progression.defeatedBosses.includes(bossName)) return;
    const nextProg: PlayerProgression = {
      ...progression,
      defeatedBosses: [...progression.defeatedBosses, bossName],
    };
    saveProgression(nextProg);
    set({ progression: nextProg });
  },

  masterStrategy: (strategyId) => {
    const { progression } = get();
    if (progression.masteredStrategies.includes(strategyId)) return;
    const nextProg: PlayerProgression = {
      ...progression,
      masteredStrategies: [...progression.masteredStrategies, strategyId],
    };
    saveProgression(nextProg);
    set({ progression: nextProg });
  },

  clearXPGain: () => set({ lastXPGain: null }),
  clearRankUp: () => set({ justRankedUp: null }),

  hydrateProgression: () => {
    set({ progression: loadProgression() });
  },
}));
