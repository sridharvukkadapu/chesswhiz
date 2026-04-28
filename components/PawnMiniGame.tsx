"use client";

import { useState, useCallback } from "react";
import CoachPawn, { SpeechBubble } from "@/components/CoachPawn";
import { T } from "@/lib/design/tokens";

interface PawnMiniGameProps {
  onComplete: () => void;
  playerName: string;
}

const FILES = ["e", "f", "g", "h"];
const NARRATION: string[] = [
  "This is a pawn! Tap one of your white pawns to move it forward.",
  "Great! Pawns move forward one square — or two squares on their first move!",
  "Nice! Pawns capture diagonally. If a black pawn is one step forward-diagonally, you can take it!",
  "You're getting it! When a pawn reaches the other side, it becomes a queen — that's called promotion!",
  "Keep going — push your pawns forward!",
];

type PawnSquare = string;

interface GameState {
  whitePawns: PawnSquare[];
  blackPawns: PawnSquare[];
  turn: "white" | "black";
  selected: PawnSquare | null;
  moveCount: number;
  done: boolean;
  winner: "white" | "black" | null;
}

function initState(): GameState {
  return {
    whitePawns: ["e2", "f2", "g2", "h2"],
    blackPawns: ["e7", "f7", "g7", "h7"],
    turn: "white",
    selected: null,
    moveCount: 0,
    done: false,
    winner: null,
  };
}

function fileIdx(sq: PawnSquare): number { return sq.charCodeAt(0) - 97; }
function rankIdx(sq: PawnSquare): number { return parseInt(sq[1], 10); }
function toSq(file: number, rank: number): PawnSquare { return `${String.fromCharCode(97 + file)}${rank}`; }

function getLegalWhiteMoves(sq: PawnSquare, state: GameState): PawnSquare[] {
  const f = fileIdx(sq);
  const r = rankIdx(sq);
  const moves: PawnSquare[] = [];
  const occupied = [...state.whitePawns, ...state.blackPawns];
  const fwd1 = toSq(f, r + 1);
  if (r + 1 <= 8 && !occupied.includes(fwd1)) {
    moves.push(fwd1);
    if (r === 2) {
      const fwd2 = toSq(f, r + 2);
      if (!occupied.includes(fwd2)) moves.push(fwd2);
    }
  }
  for (const df of [-1, 1]) {
    if (f + df >= 0 && f + df <= 7) {
      const capSq = toSq(f + df, r + 1);
      if (state.blackPawns.includes(capSq)) moves.push(capSq);
    }
  }
  return moves;
}

function getBotMove(state: GameState): { from: PawnSquare; to: PawnSquare } | null {
  for (const sq of state.blackPawns) {
    const f = fileIdx(sq);
    const r = rankIdx(sq);
    const occupied = [...state.whitePawns, ...state.blackPawns];
    for (const df of [-1, 1]) {
      if (f + df >= 0 && f + df <= 7) {
        const capSq = toSq(f + df, r - 1);
        if (state.whitePawns.includes(capSq)) return { from: sq, to: capSq };
      }
    }
    const fwd = toSq(f, r - 1);
    if (r - 1 >= 1 && !occupied.includes(fwd)) return { from: sq, to: fwd };
  }
  return null;
}

export default function PawnMiniGame({ onComplete, playerName }: PawnMiniGameProps) {
  const [state, setState] = useState<GameState>(initState);
  const narrationIdx = Math.min(state.moveCount, NARRATION.length - 1);
  const narration = state.done
    ? (state.winner === "white"
        ? `Amazing, ${playerName}! Your pawn made it! Now you know how pawns work — ready for a real game? 🎉`
        : `Nice try! Let's play a real game now — you've got the idea! ♟`)
    : NARRATION[narrationIdx];

  const handleSquareClick = useCallback((sq: PawnSquare) => {
    if (state.turn !== "white" || state.done) return;

    if (state.selected) {
      const legal = getLegalWhiteMoves(state.selected, state);
      if (legal.includes(sq)) {
        let newWhite = state.whitePawns.map((p) => (p === state.selected ? sq : p));
        let newBlack = state.blackPawns.filter((p) => p !== sq);

        const whiteWon = newWhite.some((p) => rankIdx(p) === 8);
        if (whiteWon) {
          setState({ ...state, whitePawns: newWhite, blackPawns: newBlack, done: true, winner: "white", selected: null });
          return;
        }

        const newStateAfterWhite: GameState = { ...state, whitePawns: newWhite, blackPawns: newBlack, turn: "black", selected: null, moveCount: state.moveCount + 1 };
        const botMove = getBotMove(newStateAfterWhite);
        if (botMove) {
          newWhite = newWhite.filter((p) => p !== botMove.to);
          newBlack = newBlack.map((p) => (p === botMove.from ? botMove.to : p));
          const blackWon = newBlack.some((p) => rankIdx(p) === 1);
          if (blackWon) {
            setState({ ...newStateAfterWhite, whitePawns: newWhite, blackPawns: newBlack, done: true, winner: "black" });
            return;
          }
        }

        if (newBlack.length === 0) {
          setState({ ...newStateAfterWhite, whitePawns: newWhite, blackPawns: newBlack, done: true, winner: "white" });
          return;
        }
        if (newWhite.length === 0) {
          setState({ ...newStateAfterWhite, whitePawns: newWhite, blackPawns: newBlack, done: true, winner: "black" });
          return;
        }

        setState({ ...newStateAfterWhite, whitePawns: newWhite, blackPawns: newBlack, turn: "white", moveCount: state.moveCount + 1 });
      } else {
        if (state.whitePawns.includes(sq)) {
          setState({ ...state, selected: sq });
        } else {
          setState({ ...state, selected: null });
        }
      }
    } else {
      if (state.whitePawns.includes(sq)) setState({ ...state, selected: sq });
    }
  }, [state]);

  const squareSize = 54;
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
  const legalMoves = state.selected ? getLegalWhiteMoves(state.selected, state) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        <CoachPawn size={80} expression={state.done ? "cheer" : "talking"} mode="kid" />
        <SpeechBubble text={narration} width={260} tail="left" />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(4, ${squareSize}px)`,
        gridTemplateRows: `repeat(8, ${squareSize}px)`,
        border: `2px solid ${T.border}`,
        borderRadius: 8,
        overflow: "hidden",
        boxShadow: T.e1,
      }}>
        {ranks.map((rank) =>
          FILES.map((file) => {
            const sq: PawnSquare = `${file}${rank}`;
            const isLight = (rankIdx(sq) + fileIdx(sq)) % 2 === 0;
            const hasWhite = state.whitePawns.includes(sq);
            const hasBlack = state.blackPawns.includes(sq);
            const isSelected = state.selected === sq;
            const isLegal = legalMoves.includes(sq);
            return (
              <div
                key={sq}
                onClick={() => handleSquareClick(sq)}
                style={{
                  width: squareSize,
                  height: squareSize,
                  background: isSelected
                    ? "rgba(255,107,90,0.45)"
                    : isLegal
                      ? "rgba(124,182,158,0.55)"
                      : isLight ? "#F0D9B5" : "#B58863",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: (hasWhite || isLegal) ? "pointer" : "default",
                  fontSize: 32,
                  userSelect: "none",
                  transition: "background 120ms",
                }}
              >
                {hasWhite && "♙"}
                {hasBlack && "♟"}
              </div>
            );
          })
        )}
      </div>

      {state.done && (
        <button
          onClick={onComplete}
          style={{
            marginTop: 8,
            padding: "14px 32px",
            borderRadius: 100,
            background: T.coral,
            color: "#fff",
            fontFamily: T.fontUI,
            fontWeight: 800,
            fontSize: 16,
            border: "none",
            cursor: "pointer",
            boxShadow: T.glowCoral,
          }}
        >
          Play a real game! →
        </button>
      )}
    </div>
  );
}
