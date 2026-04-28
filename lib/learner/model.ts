import type { LearnerModel, ConceptId, LearnerSignal, RecurringError, ConceptMastery, ErrorPatternId } from "./types";

export function createEmptyLearnerModel(playerId: string): LearnerModel {
  return {
    version: 1,
    playerId,
    conceptsIntroduced: [],
    recurringErrors: [],
    recentCoachMessages: [],
    currentSession: {
      gameId: crypto.randomUUID(),
      moveCount: 0,
      startedAt: Date.now(),
    },
    stats: {
      gamesPlayed: 0,
      totalMoves: 0,
      tacticsSpotted: 0,
    },
  };
}

export function applySignal(model: LearnerModel, signal: LearnerSignal): LearnerModel {
  const concepts = [...model.conceptsIntroduced];
  const idx = concepts.findIndex((c) => c.conceptId === signal.conceptId);
  let entry: ConceptMastery;

  if (idx === -1) {
    entry = { conceptId: signal.conceptId, score: 0.1, seenCount: 1, correctCount: 0, lastSeenMove: signal.moveNumber };
    concepts.push(entry);
  } else {
    entry = { ...concepts[idx], seenCount: concepts[idx].seenCount + 1, lastSeenMove: signal.moveNumber };
  }

  if (signal.type === "correct_application") {
    entry.score = entry.score + 0.3 * (1 - entry.score);
    entry.correctCount += 1;
    if (model.stats.tacticsSpotted !== undefined) {
      // counted below
    }
  } else if (signal.type === "missed_opportunity") {
    entry.score = entry.score * 0.85;
  } else if (signal.type === "error_committed") {
    entry.score = entry.score * 0.7;
  }

  entry.score = Math.max(0, Math.min(1, entry.score));
  if (idx === -1) {
    // already pushed above
  } else {
    concepts[idx] = entry;
  }

  let recurringErrors = [...model.recurringErrors];
  if (signal.type === "error_committed" && signal.errorPatternId) {
    const errIdx = recurringErrors.findIndex((e) => e.patternId === signal.errorPatternId);
    if (errIdx === -1) {
      const newErr: RecurringError = {
        patternId: signal.errorPatternId as ErrorPatternId,
        count: 1,
        exampleFENs: signal.fen ? [signal.fen] : [],
        lastSeenMove: signal.moveNumber,
      };
      recurringErrors.push(newErr);
    } else {
      const existing = recurringErrors[errIdx];
      const fens = signal.fen
        ? [...existing.exampleFENs, signal.fen].slice(-3)
        : existing.exampleFENs;
      recurringErrors[errIdx] = {
        ...existing,
        count: existing.count + 1,
        exampleFENs: fens,
        lastSeenMove: signal.moveNumber,
      };
    }
  }

  const stats = { ...model.stats };
  if (signal.type === "correct_application") {
    stats.tacticsSpotted = (stats.tacticsSpotted ?? 0) + 1;
  }

  return { ...model, conceptsIntroduced: concepts, recurringErrors, stats };
}

export function recordCoachMessage(model: LearnerModel, message: string): LearnerModel {
  const msgs = [...model.recentCoachMessages, message].slice(-2);
  return { ...model, recentCoachMessages: msgs };
}

export function startNewGame(model: LearnerModel): LearnerModel {
  return {
    ...model,
    currentSession: {
      gameId: crypto.randomUUID(),
      moveCount: 0,
      startedAt: Date.now(),
    },
    stats: {
      ...model.stats,
      gamesPlayed: model.stats.gamesPlayed + 1,
    },
  };
}

export function incrementMoveCount(model: LearnerModel): LearnerModel {
  return {
    ...model,
    currentSession: {
      ...model.currentSession,
      moveCount: model.currentSession.moveCount + 1,
    },
    stats: {
      ...model.stats,
      totalMoves: model.stats.totalMoves + 1,
    },
  };
}

export interface LearnerSummary {
  mastered: ConceptId[];
  inProgress: ConceptId[];
  needsWork: ConceptId[];
  recurringErrors: { patternId: string; count: number }[];
  recentMessages: string[];
}

export function summarizeForPrompt(model: LearnerModel): LearnerSummary {
  const mastered: ConceptId[] = [];
  const inProgress: ConceptId[] = [];
  const needsWork: ConceptId[] = [];

  for (const c of model.conceptsIntroduced) {
    if (c.score >= 0.8) mastered.push(c.conceptId);
    else if (c.score >= 0.3) inProgress.push(c.conceptId);
    else needsWork.push(c.conceptId);
  }

  const recurringErrors = model.recurringErrors
    .filter((e) => e.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((e) => ({ patternId: e.patternId, count: e.count }));

  return {
    mastered,
    inProgress,
    needsWork,
    recurringErrors,
    recentMessages: model.recentCoachMessages,
  };
}
