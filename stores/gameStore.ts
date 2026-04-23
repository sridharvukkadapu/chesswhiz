"use client";

import { create } from "zustand";
import { Chess } from "chess.js";
import type { Move, LastMove, GameStatus, CoachMessage, Difficulty, Square } from "@/lib/chess/types";

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

  setSettings: (name, age, difficulty) =>
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
      coachMessages: [
        {
          id: crypto.randomUUID(),
          type: "intro",
          text: `Hey ${name}! I'm Coach Pawn 🐾 — let's play some chess! You're White, so you go first. Try moving a center pawn to start!`,
        },
      ],
    }),

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
    // Add coaching message for undo
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
}));
