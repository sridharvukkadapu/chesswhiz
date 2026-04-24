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

const P = {
  cream: "#FBF7F0",
  creamDeep: "#F5EFE4",
  parchment: "#F0E8D8",
  ink: "#1A1210",
  inkMed: "#5C544A",
  inkLight: "#8A8278",
  inkFaint: "#B0A898",
  inkGhost: "#D0C8BC",
  emerald: "#1B7340",
  emeraldPale: "#E6F4EC",
  gold: "#C7940A",
};

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

    const analysis = analyzeMoveQuality(prevChess, newChess, move);
    if (analysis && shouldCoach(analysis, store.moveCount, store.lastCoachMove)) {
      requestCoaching(analysis);
    }

    if (newChess.turn() === "b") {
      store.setBotThinking(true);
      findBestMove(newChess, difficulty).then((botMove) => {
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

  const diffLabel = ["Easy", "Medium", "Hard"][difficulty - 1];

  return (
    <div style={{ minHeight: "100dvh", background: P.cream, color: P.ink, position: "relative" }}>
      {/* Paper grain */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)' opacity='0.022'/%3E%3C/svg%3E")`,
      }} />

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
          {/* Difficulty badge */}
          <span style={{
            fontSize: 12, fontWeight: 700, color: P.inkLight,
            fontFamily: "var(--font-nunito), sans-serif",
            background: P.parchment,
            border: `1px solid ${P.inkGhost}`,
            borderRadius: 8, padding: "4px 10px",
            letterSpacing: 0.3,
          }}>{diffLabel}</span>

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
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: "1 1 280px", maxWidth: 480 }}>
          <CoachPanel messages={coachMessages} loading={coachLoading} />
          <MoveHistory moves={moveHistory} />

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
    </div>
  );
}
