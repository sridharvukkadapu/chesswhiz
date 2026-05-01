// components/TheTrial.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useSpeech } from "@/lib/speech";
import dynamic from "next/dynamic";
import { Chess } from "chess.js";
import CoachPawn, { SpeechBubble } from "@/components/CoachPawn";
import type { CoachExpression } from "@/components/CoachPawn";
import { T } from "@/lib/design/tokens";
import type { AgeBand } from "@/lib/onboarding/steps";
import type { TrialAnswer, TrialRoundId, TrialResult } from "@/lib/trial/types";
import { placeTrial } from "@/lib/trial/placement";
import {
  getNextRound,
  ROUND1_QUESTIONS,
  ROUND1_COLOR_QUESTION,
  ROUND2_PIECE_ORDER,
  ROUND2_PIECE_QUESTIONS,
  ROUND3_QUESTIONS,
  ROUND4_TACTIC_QUESTIONS,
  ROUND5_STRATEGY_QUESTIONS,
} from "@/lib/trial/rounds";
import type { ArrowOption } from "@/components/TrialBoard";

const TrialBoard = dynamic(() => import("@/components/TrialBoard"), { ssr: false });

export interface TheTrialProps {
  playerName: string;
  ageBand: AgeBand;
  onComplete: (result: TrialResult) => void;
}

type ConfidenceState = "showing" | "done";
type FeedbackFlash = { sq: string; type: "correct" | "wrong" } | null;

function getCoachMessage(
  roundId: TrialRoundId,
  playerName: string,
  state: "intro" | "correct" | "wrong" | "bridge" | "final",
  extra?: string
): string {
  if (state === "bridge") return extra ?? "Let's get started!";
  if (state === "final") return extra ?? `Welcome, ${playerName}! Let's begin! 🎉`;
  if (state === "correct") return ["Nice! ✓", "You got it! ⭐", "Perfect!", "Great move! 🌟"][Math.floor(Math.random() * 4)];
  if (state === "wrong") return extra ?? "Not quite — let me show you!";

  const intros: Record<TrialRoundId, string> = {
    1: `Hey ${playerName}! I'm Coach Pawn 🐾 Let's see what you already know! Tap the square I name for you.`,
    2: "Awesome! Now let's see how the pieces move. Tap ALL the squares this piece can reach!",
    3: "You know how pieces move! Let's try some real chess positions. Is the king in check?",
    4: "Great work! Now for the sneaky tricks — find the best move in each position!",
    5: "Impressive! One last challenge — which move makes the best use of your position?",
  };
  return intros[roundId];
}

export default function TheTrial({ playerName, ageBand: _ageBand, onComplete }: TheTrialProps) {
  const [currentRound, setCurrentRound] = useState<TrialRoundId>(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState<TrialAnswer[]>([]);
  const [coachMessage, setCoachMessage] = useState(
    getCoachMessage(1, playerName, "intro")
  );
  const [coachExpression, setCoachExpression] = useState<CoachExpression>("talking");
  const [confidenceState, setConfidenceState] = useState<ConfidenceState | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<Omit<TrialAnswer, "confident"> | null>(null);
  const [flashSquare, setFlashSquare] = useState<FeedbackFlash>(null);
  const [selectedSquares, setSelectedSquares] = useState<string[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<string[]>([]);
  const [selectedArrow, setSelectedArrow] = useState<string | null>(null);

  const questionStartTime = useRef(Date.now());
  const confidenceClickedRef = useRef(false);

  const speech = useSpeech();
  useEffect(() => { speech.speak(coachMessage); }, [coachMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetQuestionState() {
    setSelectedSquares([]);
    setSelectedPiece(null);
    setLegalMoveSquares([]);
    setSelectedArrow(null);
    questionStartTime.current = Date.now();
  }

  function showConfidenceToggle(answer: Omit<TrialAnswer, "confident">) {
    confidenceClickedRef.current = false;
    setPendingAnswer(answer);
    setConfidenceState("showing");
    setTimeout(() => {
      if (!confidenceClickedRef.current) {
        commitAnswer({ ...answer, confident: null });
      }
    }, 3000);
  }

  function handleConfidence(confident: boolean) {
    if (!pendingAnswer || confidenceState !== "showing") return;
    confidenceClickedRef.current = true;
    setConfidenceState("done");
    commitAnswer({ ...pendingAnswer, confident });
  }

  function commitAnswer(answer: TrialAnswer) {
    setConfidenceState(null);
    setPendingAnswer(null);
    const newAnswers = [...allAnswers, answer];
    setAllAnswers(newAnswers);
    advanceAfterAnswer(answer, newAnswers);
  }

  function advanceAfterAnswer(lastAnswer: TrialAnswer, answers: TrialAnswer[]) {
    const roundAnswers = answers.filter((a) => a.roundId === currentRound);

    let roundComplete = false;
    let roundPassed = false;

    if (currentRound === 1) {
      const squareAnswers = roundAnswers.filter((a) => a.questionIndex < 5);
      roundComplete = squareAnswers.length >= 5;
      if (roundComplete) {
        const squareOnes = answers.filter((a) => a.roundId === 1 && a.questionIndex < 5);
        const weighted = squareOnes.reduce((s, a) => s + (a.correct ? (a.confident === false ? 0.5 : 1) : 0), 0);
        roundPassed = weighted >= 4;
      }
    } else if (currentRound === 2) {
      roundComplete = !lastAnswer.correct || questionIndex >= ROUND2_PIECE_ORDER.length - 1;
      roundPassed = !lastAnswer.correct ? false : questionIndex >= ROUND2_PIECE_ORDER.length - 1;
    } else if (currentRound === 3) {
      roundComplete = roundAnswers.length >= 4;
      roundPassed = roundAnswers.filter((a) => a.correct).length >= 3;
    } else if (currentRound === 4) {
      const correct = roundAnswers.filter((a) => a.correct).length;
      roundComplete = roundAnswers.length >= 4 || !lastAnswer.correct;
      roundPassed = correct >= 3 && roundAnswers.length === 4;
    } else if (currentRound === 5) {
      roundComplete = roundAnswers.length >= 3;
      roundPassed = roundAnswers.filter((a) => a.correct).length >= 2;
    }

    if (!roundComplete) {
      setQuestionIndex((i) => i + 1);
      resetQuestionState();
      return;
    }

    const nextRound = getNextRound(currentRound, answers);
    if (nextRound === null || !roundPassed) {
      const result = placeTrial(answers);
      const bridgeMsg = getBridgeMessage(result.learningStage, playerName);
      setCoachMessage(bridgeMsg);
      setCoachExpression("cheer");
      setTimeout(() => onComplete(result), 2000);
      return;
    }

    setCurrentRound(nextRound);
    setQuestionIndex(0);
    resetQuestionState();
    setCoachMessage(getCoachMessage(nextRound, playerName, "intro"));
    setCoachExpression("talking");
  }

  function getBridgeMessage(stage: number, name: string): string {
    if (stage === 1) return `Let's start with the board, ${name}! We'll come back to the tricky stuff later. 🏘️`;
    if (stage === 2) return `You know the board! Let's learn how all the pieces move. 🎯`;
    if (stage === 3) return `You know how pieces move! Now let's learn about check and checkmate — the rules of winning. ♟️`;
    if (stage === 4) return `You know the rules! Let's work on tactics — the sneaky tricks of chess. 🍴`;
    return `Wow, ${name} — you already know tactics! Welcome to the Strategy Summit! 🏔️`;
  }

  function recordAnswer(correct: boolean, extra?: Partial<TrialAnswer>) {
    const responseTimeMs = Date.now() - questionStartTime.current;
    if (correct) {
      setCoachMessage(getCoachMessage(currentRound, playerName, "correct"));
      setCoachExpression("cheer");
    } else {
      setCoachMessage(getCoachMessage(currentRound, playerName, "wrong"));
      setCoachExpression("sad");
    }
    const answer: Omit<TrialAnswer, "confident"> = {
      roundId: currentRound,
      questionIndex,
      correct,
      responseTimeMs,
      ...extra,
    };
    setTimeout(() => showConfidenceToggle(answer), correct ? 400 : 600);
  }

  function handleR1SquareTap(sq: string) {
    const isColorQuestion = questionIndex === 5;
    if (isColorQuestion) {
      const fileIdx = sq.charCodeAt(0) - 97;
      const rank = parseInt(sq[1], 10);
      const isLight = (fileIdx + rank) % 2 === 0;
      const correct = isLight === (ROUND1_COLOR_QUESTION.color === "light");
      setFlashSquare({ sq, type: correct ? "correct" : "wrong" });
      recordAnswer(correct, { questionIndex: 5 });
      return;
    }
    const target = ROUND1_QUESTIONS[questionIndex]?.target;
    const correct = sq === target;
    setFlashSquare({ sq, type: correct ? "correct" : "wrong" });
    if (!correct && target) {
      setTimeout(() => setFlashSquare({ sq: target, type: "correct" }), 400);
      setTimeout(() => setFlashSquare(null), 1200);
    }
    recordAnswer(correct);
  }

  function handleR2Submit() {
    const pq = ROUND2_PIECE_QUESTIONS[ROUND2_PIECE_ORDER[questionIndex]];
    const expected = new Set(pq.expectedSquares);
    const selected = new Set(selectedSquares);
    const correct =
      [...expected].every((s) => selected.has(s)) &&
      [...selected].every((s) => expected.has(s));
    recordAnswer(correct, { pieceKind: pq.pieceKind });
  }

  function handleCheckAnswer(isCheck: boolean) {
    const q = ROUND3_QUESTIONS[questionIndex];
    if (q.type !== "check-detection") return;
    const correct = isCheck === q.isInCheck;
    recordAnswer(correct);
  }

  function handlePieceTap(sq: string) {
    if (currentRound === 3) {
      const q = ROUND3_QUESTIONS[questionIndex];
      if (q.type !== "checkmate-in-1") return;
      const chess = new Chess(q.fen);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const moves = chess.moves({ square: sq as any, verbose: true }) as Array<{ to: string }>;
      setSelectedPiece(sq);
      setLegalMoveSquares(moves.map((m) => m.to));
    } else if (currentRound === 4) {
      const q = ROUND4_TACTIC_QUESTIONS[questionIndex];
      const chess = new Chess(q.fen);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const moves = chess.moves({ square: sq as any, verbose: true }) as Array<{ to: string }>;
      setSelectedPiece(sq);
      setLegalMoveSquares(moves.map((m) => m.to));
    }
  }

  function handleMoveTap(sq: string) {
    if (!selectedPiece) return;
    if (currentRound === 3) {
      const q = ROUND3_QUESTIONS[questionIndex];
      if (q.type !== "checkmate-in-1") return;
      const correct = selectedPiece === q.correctMove.from && sq === q.correctMove.to;
      setFlashSquare({ sq, type: correct ? "correct" : "wrong" });
      setSelectedPiece(null);
      setLegalMoveSquares([]);
      recordAnswer(correct);
    } else if (currentRound === 4) {
      const q = ROUND4_TACTIC_QUESTIONS[questionIndex];
      const correct = selectedPiece === q.correctMove.from && sq === q.correctMove.to;
      const missType = !correct && selectedPiece === q.correctPiece ? "execution" : "blind";
      setFlashSquare({ sq, type: correct ? "correct" : "wrong" });
      setSelectedPiece(null);
      setLegalMoveSquares([]);
      recordAnswer(correct, {
        tacticId: q.tacticId,
        missType: correct ? undefined : missType,
      });
    }
  }

  function handleArrowTap(id: string) {
    setSelectedArrow(id);
    const q = ROUND5_STRATEGY_QUESTIONS[questionIndex];
    const best = `${q.bestMove.from}-${q.bestMove.to}`;
    const correct = id === best;
    setTimeout(() => recordAnswer(correct), 300);
  }

  function getCurrentBoardProps() {
    if (currentRound === 1) {
      return {
        mode: "tap-square" as const,
        fen: "8/8/8/8/8/8/8/8 w - - 0 1",
        onSquareTap: handleR1SquareTap,
        flashSquare,
      };
    }
    if (currentRound === 2) {
      const pq = ROUND2_PIECE_QUESTIONS[ROUND2_PIECE_ORDER[questionIndex]];
      return {
        mode: "multi-select" as const,
        fen: "8/8/8/8/8/8/8/8 w - - 0 1",
        selectedSquares,
        expectedCount: pq.expectedSquares.length,
        onSquareToggle: (sq: string) =>
          setSelectedSquares((prev) =>
            prev.includes(sq) ? prev.filter((s) => s !== sq) : [...prev, sq]
          ),
        onSubmit: handleR2Submit,
        flashSquare,
      };
    }
    if (currentRound === 3) {
      const q = ROUND3_QUESTIONS[questionIndex];
      return {
        mode: q.type === "check-detection" ? ("tap-square" as const) : ("move" as const),
        fen: q.fen,
        showCheckButtons: q.type === "check-detection",
        onCheckAnswer: handleCheckAnswer,
        selectedPiece,
        legalMoveSquares,
        onPieceTap: handlePieceTap,
        onMoveTap: handleMoveTap,
        flashSquare,
      };
    }
    if (currentRound === 4) {
      const q = ROUND4_TACTIC_QUESTIONS[questionIndex];
      return {
        mode: "move" as const,
        fen: q.fen,
        selectedPiece,
        legalMoveSquares,
        onPieceTap: handlePieceTap,
        onMoveTap: handleMoveTap,
        flashSquare,
      };
    }
    if (currentRound === 5) {
      const q = ROUND5_STRATEGY_QUESTIONS[questionIndex];
      const arrowOptions: ArrowOption[] = [
        { id: `${q.bestMove.from}-${q.bestMove.to}`, from: q.bestMove.from, to: q.bestMove.to, label: "Option A" },
        { id: `${q.mediocreMove.from}-${q.mediocreMove.to}`, from: q.mediocreMove.from, to: q.mediocreMove.to, label: "Option B" },
        { id: `${q.badMove.from}-${q.badMove.to}`, from: q.badMove.from, to: q.badMove.to, label: "Option C" },
      ];
      return {
        mode: "arrows" as const,
        fen: q.fen,
        arrows: arrowOptions,
        selectedArrow,
        onArrowTap: handleArrowTap,
      };
    }
    return { mode: "tap-square" as const };
  }

  const totalRounds = 5;
  const boardProps = getCurrentBoardProps();

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
      padding: "24px 16px",
      fontFamily: T.fontUI,
    }}>
      {/* Progress dots */}
      <div style={{ display: "flex", gap: 8 }}>
        {Array.from({ length: totalRounds }, (_, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: i + 1 < currentRound
                ? T.coral
                : i + 1 === currentRound
                ? T.butter
                : T.border,
              transition: "background 300ms",
            }}
          />
        ))}
      </div>

      {/* Coach Pawn + voice toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <CoachPawn expression={coachExpression} size={56} />
        {speech.supported && (
          <button
            type="button"
            onClick={speech.toggle}
            title={speech.enabled ? "Turn off voice" : "Turn on voice"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 20, opacity: speech.enabled ? 1 : 0.4,
              padding: 4,
            }}
          >
            🔊
          </button>
        )}
      </div>
      <SpeechBubble text={coachMessage} />

      {/* Board */}
      <TrialBoard {...boardProps} />

      {/* Confidence toggle */}
      {confidenceState === "showing" && (
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => handleConfidence(true)}
            style={{
              padding: "8px 20px",
              border: `1.5px solid ${T.border}`,
              borderRadius: 100,
              background: "transparent",
              fontFamily: T.fontUI,
              fontSize: 15,
              cursor: "pointer",
              color: T.ink,
            }}
          >
            😊 Sure
          </button>
          <button
            type="button"
            onClick={() => handleConfidence(false)}
            style={{
              padding: "8px 20px",
              border: `1.5px solid ${T.border}`,
              borderRadius: 100,
              background: "transparent",
              fontFamily: T.fontUI,
              fontSize: 15,
              cursor: "pointer",
              color: T.ink,
            }}
          >
            🤔 Guessing
          </button>
        </div>
      )}
    </div>
  );
}
