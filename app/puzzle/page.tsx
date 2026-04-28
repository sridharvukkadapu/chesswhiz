"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Chess } from "chess.js";
import { useGameStore } from "@/stores/gameStore";
import { getDailyPuzzle, type DailyPuzzle } from "@/lib/puzzle/daily";
import CoachPawn, { SpeechBubble } from "@/components/CoachPawn";
import { T } from "@/lib/design/tokens";
import { useSpeech } from "@/lib/speech";
import Link from "next/link";

const TIMER_SECONDS = 30;
const PIECE_GLYPHS: Record<string, string> = {
  wk:"♔",wq:"♕",wr:"♖",wb:"♗",wn:"♘",wp:"♙",
  bk:"♚",bq:"♛",br:"♜",bb:"♝",bn:"♞",bp:"♟",
};

function PuzzleBoard({ fen, selected, highlights, onSquareClick }: {
  fen: string;
  selected?: string | null;
  highlights?: string[];
  onSquareClick?: (sq: string) => void;
}) {
  const board = useMemo(() => new Chess(fen).board(), [fen]);
  const sqSize = 52;
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(8,${sqSize}px)`, gridTemplateRows: `repeat(8,${sqSize}px)`, border: `2px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      {board.map((rank, ri) =>
        [0,1,2,3,4,5,6,7].map((fi) => {
          const sq = `${String.fromCharCode(97+fi)}${8-ri}`;
          const piece = rank[fi];
          const isLight = (ri+fi)%2===0;
          const isSelected = selected === sq;
          const isHL = highlights?.includes(sq);
          const glyph = piece ? PIECE_GLYPHS[`${piece.color}${piece.type}`] ?? "" : "";
          return (
            <div key={sq} onClick={() => onSquareClick?.(sq)}
              style={{ width: sqSize, height: sqSize,
                background: isSelected ? "rgba(255,107,90,0.5)" : isHL ? "rgba(124,182,158,0.55)" : isLight ? "#F0D9B5" : "#B58863",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 30, userSelect: "none", cursor: onSquareClick ? "pointer" : "default" }}
            >{glyph}</div>
          );
        })
      )}
    </div>
  );
}

export default function PuzzlePage() {
  const learnerModel = useGameStore((s) => s.learnerModel);
  const { speak } = useSpeech();
  const speakRef = useRef(speak);
  useEffect(() => { speakRef.current = speak; }, [speak]);

  const puzzleRef = useRef<DailyPuzzle | null>(null);
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [phase, setPhase] = useState<"intro" | "playing" | "solved" | "failed" | "hint">("intro");
  const [selected, setSelected] = useState<string | null>(null);
  const [coachMessage, setCoachMessage] = useState("");

  useEffect(() => {
    const p = getDailyPuzzle(learnerModel);
    setPuzzle(p);
    puzzleRef.current = p;
    if (p) {
      const msg = `${p.title} You've got ${TIMER_SECONDS} seconds. ${p.hint}`;
      setCoachMessage(msg);
      speakRef.current(msg);
    }
  }, [learnerModel]);

  useEffect(() => {
    if (phase !== "playing") return;
    if (timeLeft <= 0) {
      setPhase("failed");
      const msg = "Time's up! Don't worry — let me show you the trick.";
      setCoachMessage(msg);
      speakRef.current(msg);
      return;
    }
    const t = setTimeout(() => setTimeLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  const handleSquareClick = useCallback((sq: string) => {
    setSelected((prev) => {
      if (!prev) return sq;
      const currentPuzzle = puzzleRef.current;
      if (!currentPuzzle) return null;
      const chess = new Chess(currentPuzzle.fen);
      try {
        const result = chess.move({ from: prev, to: sq });
        if (result && result.san === currentPuzzle.solution) {
          setPhase("solved");
          const msg = `Yes! That's it! You found the ${currentPuzzle.concept.replace(/_/g, " ")}! Huge!`;
          setCoachMessage(msg);
          speakRef.current(msg);
        } else {
          setCoachMessage("Hmm, not quite. Try again!");
          speakRef.current("Hmm, not quite. Try again!");
        }
      } catch { /* invalid move */ }
      return null;
    });
  }, []);

  if (!puzzle) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bgRadial }}>
        <div style={{ color: T.inkLow, fontFamily: T.fontUI }}>Loading puzzle…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: T.bgRadial, fontFamily: T.fontUI, padding: "20px 16px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Link href="/play" style={{ color: T.inkLow, textDecoration: "none", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em" }}>← BACK</Link>
        <div style={{ fontFamily: T.fontDisplay, fontStyle: "italic", fontSize: 22, color: T.ink, flex: 1, textAlign: "center" }}>{puzzle.title}</div>
        {phase === "playing" && (
          <div style={{ fontFamily: T.fontMono, fontSize: 18, fontWeight: 700, color: timeLeft <= 10 ? T.coral : T.ink, minWidth: 32, textAlign: "right" }}>{timeLeft}s</div>
        )}
      </div>

      <div style={{ maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, width: "100%" }}>
          <CoachPawn size={64} expression={phase === "solved" ? "cheer" : phase === "failed" ? "sad" : "talking"} mode="kid" />
          <SpeechBubble text={coachMessage} width={260} tail="left" />
        </div>

        <PuzzleBoard
          fen={puzzle.fen}
          selected={selected}
          onSquareClick={phase === "playing" || phase === "hint" ? handleSquareClick : undefined}
        />

        {phase === "intro" && (
          <button onClick={() => { setPhase("playing"); setTimeLeft(TIMER_SECONDS); setCoachMessage(puzzle.hint); }}
            style={{ padding: "14px 32px", borderRadius: 100, background: T.coral, color: "#fff", fontFamily: T.fontUI, fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer" }}>
            Start puzzle! →
          </button>
        )}

        {phase === "playing" && (
          <button onClick={() => { setPhase("hint"); setCoachMessage(puzzle.hint); speakRef.current(puzzle.hint); }}
            style={{ padding: "10px 20px", borderRadius: 100, background: "transparent", border: `1.5px solid ${T.border}`, color: T.inkLow, fontFamily: T.fontUI, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Give me a hint
          </button>
        )}

        {(phase === "solved" || phase === "failed") && (
          <Link href="/play" style={{ padding: "14px 24px", borderRadius: 100, background: T.coral, color: "#fff", fontFamily: T.fontUI, fontWeight: 800, fontSize: 15, textDecoration: "none" }}>
            Play a game! →
          </Link>
        )}
      </div>
    </div>
  );
}
