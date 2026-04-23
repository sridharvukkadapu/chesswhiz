"use client";

import { useCallback, useEffect } from "react";
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

export default function PlayPage() {
  const router = useRouter();
  const store = useGameStore();
  const {
    chess, selected, legalHighlights, lastMove, moveHistory,
    stateHistory, status, playerName, playerAge, difficulty,
    coachMessages, coachLoading, showPromo, botThinking, screen,
  } = store;

  useEffect(() => {
    if (screen === "onboarding") router.push("/");
  }, [screen, router]);

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
      return;
    }

    // Analyze player move and maybe coach
    const analysis = analyzeMoveQuality(prevChess, newChess, move);
    if (analysis && shouldCoach(analysis, store.moveCount, store.lastCoachMove)) {
      requestCoaching(analysis);
    }

    // Bot's turn
    if (newChess.turn() === "b") {
      store.setBotThinking(true);
      setTimeout(() => {
        const botMove = findBestMove(newChess, difficulty);
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
          }
        }
        store.setBotThinking(false);
      }, 350 + Math.random() * 500);
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
        // Check if pawn promotion needed: look at the piece on the selected square
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
      executeMove({ ...showPromo, promotion: pieceType as any });
    }
  };

  if (screen === "onboarding") return null;

  return (
    <div className="min-h-dvh" style={{ background: "#0F172A", color: "#e2ddd8" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 py-2 border-b sticky top-0 z-10"
        style={{
          background: "rgba(15,23,42,0.85)",
          borderColor: "rgba(255,255,255,0.07)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">♟</span>
          <span className="text-lg font-bold" style={{ color: "#22C55E", fontFamily: "var(--font-baloo), sans-serif" }}>
            ChessWhiz
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "#94A3B8", fontFamily: "var(--font-nunito), sans-serif" }}>
            {["Easy", "Medium", "Hard"][difficulty - 1]}
          </span>
          <button
            onClick={() => store.resetGame()}
            className="btn-press px-3 rounded-lg border text-xs font-semibold cursor-pointer"
            style={{
              background: "#0F1F2B", borderColor: "rgba(255,255,255,0.08)",
              color: "#c8c0b5", fontFamily: "var(--font-nunito), sans-serif",
              height: "36px",
            }}
          >
            New Game
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main id="main-content" className="flex flex-wrap justify-center items-start gap-4 max-w-5xl mx-auto p-3 sm:p-4">
        {/* Left: Board */}
        <div className="flex flex-col gap-2 w-full" style={{ maxWidth: "min(calc(100vw - 24px), 480px)" }}>
          <PlayerBar
            name="ChessBot"
            colorLabel="Black"
            isActive={chess.turn() === "b" && status === "playing"}
            isBotThinking={botThinking}
            isBot={true}
          />
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
        <div className="flex flex-col gap-3 w-full" style={{ flex: "1 1 280px", maxWidth: 480 }}>
          <CoachPanel messages={coachMessages} loading={coachLoading} />
          <MoveHistory moves={moveHistory} />

          <div className="flex gap-2">
            <button
              onClick={() => store.resetGame()}
              className="btn-press flex-1 rounded-xl border text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
              style={{
                background: "#0F1F2B", borderColor: "rgba(255,255,255,0.08)", color: "#c8c0b5",
                fontFamily: "var(--font-nunito), sans-serif",
                minHeight: "44px",
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
              className="btn-press flex-1 rounded-xl border text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-35 disabled:cursor-not-allowed"
              style={{
                background: "#0F1F2B", borderColor: "rgba(255,255,255,0.08)", color: "#c8c0b5",
                fontFamily: "var(--font-nunito), sans-serif",
                minHeight: "44px",
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
    </div>
  );
}
