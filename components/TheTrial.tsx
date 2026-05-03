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
  ROUND1_START_FEN,
  ROUND1_QUESTIONS,
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

// Single source of truth for what the kid sees and hears for each
// (round, questionIndex). The visible panel uses `display`; the spoken
// line uses `voice`. `uppercase` controls the display value's casing
// without relying on a length heuristic.
interface QuestionPrompt {
  display: { label: string; value: string; uppercase: boolean };
  voice: string;
}

function getQuestion(roundId: TrialRoundId, qIndex: number): QuestionPrompt | null {
  if (roundId === 1) {
    const q = ROUND1_QUESTIONS[qIndex];
    if (!q) return null;
    return {
      display: { label: "Tap this piece", value: q.displayLabel, uppercase: false },
      voice: q.voice,
    };
  }
  if (roundId === 2) {
    const pq = ROUND2_PIECE_QUESTIONS[ROUND2_PIECE_ORDER[qIndex]];
    if (!pq) return null;
    return {
      display: { label: "Tap all squares it can reach", value: pq.displayLabel, uppercase: false },
      voice: pq.voice,
    };
  }
  if (roundId === 3) {
    const q = ROUND3_QUESTIONS[qIndex];
    if (!q) return null;
    return {
      display: { label: "Chess challenge", value: q.displayLabel, uppercase: false },
      voice: q.voice,
    };
  }
  if (roundId === 4) {
    const q = ROUND4_TACTIC_QUESTIONS[qIndex];
    if (!q) return null;
    return {
      display: { label: "Tactic puzzle", value: q.displayLabel, uppercase: false },
      voice: q.voice,
    };
  }
  if (roundId === 5) {
    const q = ROUND5_STRATEGY_QUESTIONS[qIndex];
    if (!q) return null;
    return {
      display: { label: "Strategy challenge", value: q.displayLabel, uppercase: false },
      voice: q.voice,
    };
  }
  return null;
}

function getCoachMessage(
  roundId: TrialRoundId,
  playerName: string,
  state: "intro" | "correct" | "wrong" | "bridge" | "final",
  extra?: string
): string {
  if (state === "bridge") return extra ?? "Let's get started!";
  if (state === "final") return extra ?? `Welcome, ${playerName}! Let's begin!`;
  if (state === "correct") return ["Nice!", "You got it!", "Perfect!", "Great move!"][Math.floor(Math.random() * 4)];
  if (state === "wrong") return extra ?? "Not quite — let me show you!";

  const intros: Record<TrialRoundId, string> = {
    1: `Hey ${playerName}! Let's see if you know the pieces.`,
    2: "Great! Now show me how pieces move.",
    3: "Nice work! Let's try some real positions.",
    4: "Now for the sneaky tricks — tactics!",
    5: "One last challenge — strategy.",
  };
  return intros[roundId];
}

export default function TheTrial({ playerName, ageBand: _ageBand, onComplete }: TheTrialProps) {
  const [currentRound, setCurrentRound] = useState<TrialRoundId>(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState<TrialAnswer[]>([]);
  const [coachMessage, setCoachMessage] = useState(() => {
    const intro = getCoachMessage(1, playerName, "intro");
    const first = getQuestion(1, 0);
    return first ? `${intro} ${first.voice}` : intro;
  });
  const [coachExpression, setCoachExpression] = useState<CoachExpression>("talking");
  const [confidenceState, setConfidenceState] = useState<ConfidenceState | null>(null);
  const [pendingAnswer, setPendingAnswer] = useState<Omit<TrialAnswer, "confident"> | null>(null);
  const [flashSquare, setFlashSquare] = useState<FeedbackFlash>(null);
  const [revealSquares, setRevealSquares] = useState<string[]>([]);
  const [selectedSquares, setSelectedSquares] = useState<string[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<string[]>([]);
  const [selectedArrow, setSelectedArrow] = useState<string | null>(null);

  const questionStartTime = useRef(Date.now());
  const confidenceClickedRef = useRef(false);
  const confidenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speech = useSpeech();
  // Tracks the latest coachMessage so the enabled-watcher can speak it
  // when voice turns on (initial auto-enable or manual re-enable).
  const latestMessageRef = useRef(coachMessage);
  const hasSpokeRef = useRef(false);
  useEffect(() => { latestMessageRef.current = coachMessage; }, [coachMessage]);

  // On mount: unconditionally enable voice using the one-way enable() — safe
  // even if voice was already on from a previous session.
  // Deps omitted: this must run exactly once on mount; speech.enable is
  // useCallback-stable, but listing it would re-run the effect if a future
  // change makes it unstable.
  useEffect(() => {
    speech.enable();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // When enabled flips true (initial auto-enable OR user toggling back on),
  // speak the current coach message so voice always resumes audibly.
  // Deps omitted: speech.speak closes over `enabled`; listing speech here
  // would cause double-speak when the parent re-renders. Only `enabled`
  // matters for re-running.
  useEffect(() => {
    if (!speech.enabled) return;
    speech.speak(latestMessageRef.current);
    hasSpokeRef.current = true;
  }, [speech.enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Speak subsequent messages as coachMessage changes (voice already on).
  // Deps omitted: only coachMessage should trigger; speech.speak is
  // useCallback-stable but listing it would risk re-speaking on unrelated
  // re-renders if its closure ever changed.
  useEffect(() => {
    if (!hasSpokeRef.current) return;
    speech.speak(coachMessage);
  }, [coachMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetQuestionState() {
    setSelectedSquares([]);
    setSelectedPiece(null);
    setLegalMoveSquares([]);
    setSelectedArrow(null);
    setRevealSquares([]);
    questionStartTime.current = Date.now();
  }

  function showConfidenceToggle(answer: Omit<TrialAnswer, "confident">) {
    confidenceClickedRef.current = false;
    setPendingAnswer(answer);
    setConfidenceState("showing");
    if (confidenceTimerRef.current) clearTimeout(confidenceTimerRef.current);
    confidenceTimerRef.current = setTimeout(() => {
      confidenceTimerRef.current = null;
      if (!confidenceClickedRef.current) {
        commitAnswer({ ...answer, confident: null });
      }
    }, 3000);
  }

  // Clear pending confidence-fallback timer on unmount to avoid setting
  // state on an unmounted component (e.g., after final round completes).
  useEffect(() => {
    return () => {
      if (confidenceTimerRef.current) clearTimeout(confidenceTimerRef.current);
    };
  }, []);

  function handleConfidenceClick(confident: boolean) {
    if (confidenceTimerRef.current) {
      clearTimeout(confidenceTimerRef.current);
      confidenceTimerRef.current = null;
    }
    handleConfidence(confident);
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
      // 2 piece-recognition questions; pass if at least 1 correct
      roundComplete = roundAnswers.length >= ROUND1_QUESTIONS.length;
      if (roundComplete) {
        roundPassed = roundAnswers.filter((a) => a.correct).length >= 1;
      }
    } else if (currentRound === 2) {
      // 2 questions: rook + knight; any fail stops the round (fail → Stage 2)
      roundComplete = !lastAnswer.correct || roundAnswers.length >= ROUND2_PIECE_ORDER.length;
      roundPassed = roundAnswers.length >= ROUND2_PIECE_ORDER.length && roundAnswers.every((a) => a.correct);
    } else if (currentRound === 3) {
      // 2 questions: check-detection + checkmate-in-1; need both right
      roundComplete = roundAnswers.length >= ROUND3_QUESTIONS.length;
      roundPassed = roundAnswers.filter((a) => a.correct).length >= ROUND3_QUESTIONS.length;
    } else if (currentRound === 4) {
      // 2 tactic questions; need both right to reach strategy
      roundComplete = roundAnswers.length >= ROUND4_TACTIC_QUESTIONS.length || !lastAnswer.correct;
      roundPassed = roundAnswers.length >= ROUND4_TACTIC_QUESTIONS.length && roundAnswers.every((a) => a.correct);
    } else if (currentRound === 5) {
      roundComplete = roundAnswers.length >= ROUND5_STRATEGY_QUESTIONS.length;
      roundPassed = roundAnswers.filter((a) => a.correct).length >= ROUND5_STRATEGY_QUESTIONS.length;
    }

    if (!roundComplete) {
      const nextIdx = questionIndex + 1;
      setQuestionIndex(nextIdx);
      resetQuestionState();
      // Speak the next question's prompt so the kid hears what to do.
      const next = getQuestion(currentRound, nextIdx);
      if (next) {
        setCoachMessage(next.voice);
        setCoachExpression("talking");
      }
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
    const intro = getCoachMessage(nextRound, playerName, "intro");
    const first = getQuestion(nextRound, 0);
    setCoachMessage(first ? `${intro} ${first.voice}` : intro);
    setCoachExpression("talking");
  }

  function getBridgeMessage(stage: number, name: string): string {
    if (stage === 1) return `Let's start with the board, ${name}! We'll come back to the tricky stuff later. 🏘️`;
    if (stage === 2) return `You know the board! Let's learn how all the pieces move. 🎯`;
    if (stage === 3) return `You know how pieces move! Now let's learn about check and checkmate — the rules of winning. ♟️`;
    if (stage === 4) return `You know the rules! Let's work on tactics — the sneaky tricks of chess. 🍴`;
    return `Wow, ${name} — you already know tactics! Welcome to the Strategy Summit! 🏔️`;
  }

  function getCorrectAnswerSquares(): string[] {
    if (currentRound === 1) {
      return ROUND1_QUESTIONS[questionIndex]?.correctSquares ?? [];
    }
    if (currentRound === 2) {
      return ROUND2_PIECE_QUESTIONS[ROUND2_PIECE_ORDER[questionIndex]]?.expectedSquares ?? [];
    }
    if (currentRound === 3) {
      const q = ROUND3_QUESTIONS[questionIndex];
      if (!q) return [];
      if (q.type === "checkmate-in-1") return [q.correctMove.from, q.correctMove.to];
      return []; // check-detection: no square to reveal, coach message is enough
    }
    if (currentRound === 4) {
      const q = ROUND4_TACTIC_QUESTIONS[questionIndex];
      return q ? [q.correctMove.from, q.correctMove.to] : [];
    }
    return [];
  }

  function recordAnswer(correct: boolean, extra?: Partial<TrialAnswer>) {
    const responseTimeMs = Date.now() - questionStartTime.current;
    if (correct) {
      setCoachMessage(getCoachMessage(currentRound, playerName, "correct"));
      setCoachExpression("cheer");
    } else {
      setCoachMessage(getCoachMessage(currentRound, playerName, "wrong"));
      setCoachExpression("sad");
      // Show the correct answer squares for 1.5s so kids can see what they missed
      const squares = getCorrectAnswerSquares();
      if (squares.length > 0) {
        setRevealSquares(squares);
        setTimeout(() => setRevealSquares([]), 1500);
      }
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

  function handleR1PieceTap(sq: string, tappedKind: string) {
    const q = ROUND1_QUESTIONS[questionIndex];
    if (!q) return;
    const correct = tappedKind === q.pieceKind && q.correctSquares.includes(sq);
    setFlashSquare({ sq, type: correct ? "correct" : "wrong" });
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
      const q = ROUND1_QUESTIONS[questionIndex];
      return {
        mode: "tap-piece" as const,
        fen: ROUND1_START_FEN,
        targetPieceKind: q?.pieceKind,
        onPieceKindTap: handleR1PieceTap,
        highlightSquares: revealSquares,
        flashSquare,
      };
    }
    if (currentRound === 2) {
      const pq = ROUND2_PIECE_QUESTIONS[ROUND2_PIECE_ORDER[questionIndex]];
      // Build FEN with just the piece on its starting square
      const pieceChar = pq.pieceKind === "knight" ? "N" : pq.pieceKind === "rook" ? "R" : pq.pieceKind[0].toUpperCase();
      const fenMap: Record<string, string> = {
        rook: "8/8/8/8/3R4/8/8/8 w - - 0 1",
        knight: "8/8/8/8/3N4/8/8/8 w - - 0 1",
      };
      const moveFen = fenMap[pq.pieceKind] ?? `8/8/8/8/3${pieceChar}4/8/8/8 w - - 0 1`;
      return {
        mode: "multi-select" as const,
        fen: moveFen,
        selectedSquares,
        expectedCount: pq.expectedSquares.length,
        onSquareToggle: (sq: string) =>
          setSelectedSquares((prev) =>
            prev.includes(sq) ? prev.filter((s) => s !== sq) : [...prev, sq]
          ),
        onSubmit: handleR2Submit,
        highlightSquares: revealSquares,
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
        highlightSquares: revealSquares,
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
        highlightSquares: revealSquares,
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

  // Per-question prompt shown prominently above the board. This is the
  // actual question (e.g. "Find: e4") — separate from coachMessage which
  // is general encouragement.
  const prompt = getQuestion(currentRound, questionIndex)?.display ?? null;

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
            aria-label={speech.enabled ? "Turn off voice" : "Turn on voice"}
            aria-pressed={speech.enabled}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              minWidth: 44, minHeight: 44,
              background: "none", border: "none", cursor: "pointer",
              borderRadius: 8, padding: 10,
              opacity: speech.enabled ? 1 : 0.4,
              transition: "opacity 150ms ease",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {speech.enabled ? (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              )}
            </svg>
          </button>
        )}
      </div>
      <SpeechBubble text={coachMessage} />

      {/* Prominent question prompt — what the kid actually has to do */}
      {prompt && (
        <div
          aria-live="polite"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            padding: "10px 22px",
            background: "rgba(255,107,90,0.08)",
            border: `1.5px solid rgba(255,107,90,0.28)`,
            borderRadius: 14,
            minWidth: 220,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: T.coral,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontFamily: T.fontUI,
            }}
          >
            {prompt.label}
          </div>
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 30,
              fontWeight: 700,
              color: T.ink,
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
              textTransform: prompt.uppercase ? "uppercase" : "none",
            }}
          >
            {prompt.value}
          </div>
        </div>
      )}

      {/* Board */}
      <TrialBoard {...boardProps} />

      {/* Confidence toggle */}
      {confidenceState === "showing" && (
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => handleConfidenceClick(true)}
            className="btn-press"
            style={{
              flex: 1,
              minHeight: 44,
              padding: "10px 20px",
              border: `1.5px solid ${T.border}`,
              borderRadius: 100,
              background: "transparent",
              fontFamily: T.fontUI,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              color: T.ink,
            }}
          >
            Sure
          </button>
          <button
            type="button"
            onClick={() => handleConfidenceClick(false)}
            className="btn-press"
            style={{
              flex: 1,
              minHeight: 44,
              padding: "10px 20px",
              border: `1.5px solid ${T.border}`,
              borderRadius: 100,
              background: "transparent",
              fontFamily: T.fontUI,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              color: T.ink,
            }}
          >
            Guessing
          </button>
        </div>
      )}
    </div>
  );
}
