"use client";

import { useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import type { ReplayStep } from "@/lib/coaching/schema";
import { T, Z } from "@/lib/design/tokens";
import CoachPawn, { SpeechBubble } from "@/components/CoachPawn";
import { useSpeech } from "@/lib/speech";

interface MoveReplayOverlayProps {
  steps: ReplayStep[];
  onDismiss: () => void;
  title?: string;
}

const STEP_DURATION_MS = 2200;

function StaticBoard({ fen }: { fen: string }) {
  const chess = new Chess(fen);
  const board = chess.board();

  const PIECE_GLYPHS: Record<string, string> = {
    wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
    bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟",
  };

  const squareSize = 44;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(8, ${squareSize}px)`,
      gridTemplateRows: `repeat(8, ${squareSize}px)`,
      border: "2px solid rgba(255,255,255,0.15)",
      borderRadius: 6,
      overflow: "hidden",
    }}>
      {board.map((rank, ri) =>
        rank.map((sq, fi) => {
          const isLight = (ri + fi) % 2 === 0;
          const glyph = sq ? PIECE_GLYPHS[`${sq.color}${sq.type}`] ?? "" : "";
          return (
            <div
              key={`${ri}-${fi}`}
              style={{
                width: squareSize,
                height: squareSize,
                background: isLight ? "#F0D9B5" : "#B58863",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                userSelect: "none",
              }}
            >
              {glyph}
            </div>
          );
        })
      )}
    </div>
  );
}

export default function MoveReplayOverlay({ steps, onDismiss, title }: MoveReplayOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);
  const { speak } = useSpeech();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onDismissRef = useRef(onDismiss);
  useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);

  useEffect(() => {
    if (steps.length === 0) return;

    setCurrentStep(0);
    setDone(false);

    steps.forEach((step, i) => {
      const t = setTimeout(() => {
        setCurrentStep(i);
        speak(step.narration);
        if (i === steps.length - 1) {
          const tDone = setTimeout(() => setDone(true), STEP_DURATION_MS);
          timersRef.current.push(tDone);
        }
      }, 1200 + i * STEP_DURATION_MS);
      timersRef.current.push(t);
    });

    return () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [steps, title, speak]);

  if (steps.length === 0) return null;

  const step = steps[currentStep];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Move replay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: Z.modal - 5,
        background: "rgba(10,10,20,0.88)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "24px 16px",
        animation: "replayIn 0.4s ease-out both",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, maxWidth: 500, width: "100%" }}>
        <CoachPawn size={60} expression="talking" mode="kid" />
        <SpeechBubble
          text={done ? "That's what happened! Tap to keep playing." : (title ?? "Wait — let me show you what just happened.")}
          width={300}
          tail="left"
        />
      </div>

      <div style={{ animation: "replayBoardIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 400ms both" }}>
        <StaticBoard fen={step.fen} />
      </div>

      <div style={{ maxWidth: 352, width: "100%", textAlign: "center" }}>
        {step.moveLabel && (
          <div style={{ fontFamily: T.fontMono, fontSize: 13, color: "rgba(255,107,90,0.8)", fontWeight: 700, marginBottom: 6, letterSpacing: "0.1em" }}>
            {step.moveLabel}
          </div>
        )}
        <div style={{ fontFamily: T.fontUI, fontSize: 15, color: "rgba(255,255,255,0.85)", lineHeight: 1.55 }}>
          {step.narration}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === currentStep ? T.coral : "rgba(255,255,255,0.25)", transition: "background 300ms" }} />
        ))}
      </div>

      {done && (
        <button
          onClick={() => onDismissRef.current()}
          style={{
            padding: "12px 28px",
            borderRadius: 100,
            background: T.coral,
            color: "#fff",
            fontFamily: T.fontUI,
            fontWeight: 800,
            fontSize: 15,
            border: "none",
            cursor: "pointer",
            animation: "replayDismissIn 0.3s ease-out both",
          }}
        >
          Got it — keep playing →
        </button>
      )}

      <style>{`
        @keyframes replayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes replayBoardIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes replayDismissIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
