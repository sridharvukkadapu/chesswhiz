# The Trial — Design Spec

**Date:** 2026-04-30  
**Feature:** Placement assessment that routes new ChessWhiz players to the right learning stage  
**Status:** Approved for implementation

---

## Problem

Kids who open ChessWhiz today get dropped directly into a full 32-piece game. There is no assessment of what they know. A total beginner and an experienced player both start at the same place. The result: beginners are overwhelmed, experienced players are bored, and the Coach is generic from the first move.

The Trial fixes this. It is a 3–5 minute interactive assessment — played entirely on a real chess board — that determines exactly where a kid is in their chess education and routes them to the right starting point.

---

## Goals

1. Place every new player at the correct `learningStage` before they see a single game.
2. Feel like chess, not a test. Every question is board interaction — tapping squares, selecting piece moves, finding checkmate — never clicking multiple-choice buttons.
3. Collect `strengthsAndGaps` data that personalizes Coach Pawn's coaching from the first session.
4. Be adaptive: if a kid fails early rounds, later rounds are skipped gracefully and Coach Pawn bridges the transition positively.

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `lib/trial/types.ts` | `LearningStage`, `TrialRound`, `TrialAnswer`, `TrialResult` |
| `lib/trial/rounds.ts` | Round definitions, question banks, `getNextRound()` short-circuit logic |
| `lib/trial/placement.ts` | Pure `placeTrial(answers[]) → TrialResult` function |
| `lib/trial/__tests__/placement.test.ts` | 15+ test cases for boundary placements |
| `components/TheTrial.tsx` | Orchestrator: round sequencing, Coach Pawn, progress dots, `onComplete(result)` |
| `components/TrialBoard.tsx` | Board with Trial-specific interaction layer (tap squares, multi-select, move execution) |

### Modified Files

| File | Change |
|------|--------|
| `lib/progression/types.ts` | Add `learningStage: LearningStage` to `PlayerProgression` |
| `lib/onboarding/steps.ts` | Replace `experience` + `pawn_mini_game` steps with `trial` step |
| `components/Onboarding.tsx` | Render `<TheTrial>` at the `trial` step, pass result to `onStart()` |
| `stores/gameStore.ts` | Initialize `learningStage` from `TrialResult`; keep `currentKingdom` in sync via `stageToKingdom()` |

### Data Flow

```
Onboarding (name + age)
  → TheTrial (5 adaptive rounds)
    → placeTrial(answers[]) → TrialResult
      → PlayerProgression { learningStage, currentKingdom, strengthsAndGaps }
        → routed to correct stage/kingdom
```

---

## learningStage vs currentKingdom

These are two separate fields that always stay in sync, but represent different things:

- **`learningStage: LearningStage` (1–6)** — pedagogical reality. What content is gated, what Coach Pawn teaches, what the bot difficulty targets. This is the source of truth for learning progression.
- **`currentKingdom: KingdomId`** — narrative wrapper. The kingdom the kid is in. Makes the app feel like an adventure, not a curriculum.

They move together. Stage 4 always maps to the tactic kingdoms (Fork Forest → Pin Palace → Skewer Spire → Discovery Depths) based on which tactic they're currently working on. A helper `stageToKingdom(stage, strengthsAndGaps)` computes the correct kingdom entry point.

---

## The 5 Rounds

### Global: Confidence Signal

After every answer, before Coach Pawn responds, the kid sees an optional **😊 Sure / 🤔 Guessing** toggle. Skippable — a timeout of 3 seconds auto-skips it. If the kid marks "Guessing" on a correct answer, that answer is weighted **0.5** instead of 1.0 in `placeTrial()` scoring. A 4/5 with 3 guesses places weaker than a clean 4/5.

---

### Round 1 — Board Knowledge

**Questions:** 5 square-naming + 1 color question  
**Pass threshold:** 4/5 squares correct (color question doesn't affect placement, only `colorAwareness` signal)  
**Fail placement:** Stage 1 (Pawn Village)

**Interaction:**
- Empty board. All 64 squares tappable.
- Coach Pawn says: *"Tap the square **e4** for me!"*
- Kid taps a square. Correct = green flash. Wrong = gentle shake, correct square briefly highlighted.
- 5 questions from the set: `e4, d4, a1, h8, c6, f3, b5, g7` (center, edges, corners, mid-board).
- After the 5 squares: *"Which color is the square **f1**?"* Kid taps a light or dark square. This tests color pattern understanding — passing the square questions but missing this notes `colorAwareness: 'weak'` for reinforcement, but does not change stage placement.

**Fail bridge (Coach Pawn):**
> "Let's start with the board! We'll come back to the tricky stuff later. 🏘️"

Rounds 2–5 are skipped. The kid feels *placed*, not failed.

**Signal collected:** `boardKnowledge: 'strong' | 'weak'`, `colorAwareness: 'strong' | 'weak'` (never `'untested'` — this question is always asked in Round 1)

---

### Round 2 — Piece Movement

**Questions:** Up to 6 (one per piece), stops after 3 failures  
**Pass threshold:** Correct on each piece (within 1 miss tolerance per piece for large move sets)  
**Fail placement:** Stage 2, starting at the first piece they got wrong  
**Order:** Rook → Bishop → Queen → King → Knight → Pawn

**Interaction:**
- One piece placed on the board. All other squares empty (except pawn question — see below).
- Coach Pawn says: *"Tap ALL the squares this knight can reach!"*
- Multi-select mode. As the kid taps squares, a counter updates live: **"3 of 8 squares found."** This is critical — without a counter, kids Submit before finding all squares.
- A Submit button appears after the first tap.
- On Submit: correct squares flash green, missed squares flash briefly, extra taps flash red.

**Pawn position (special case):**  
Pawn placed on **e2** (starting rank) with an opponent pawn on **d3**. This single position tests all three pawn behaviors:
- Single push: e3
- Double push (first move): e4
- Diagonal capture: d3

Skipped pieces (because the kid failed 3 earlier) are stored as `'untested'` in `pieceMovement`.

**Fail bridge:**  
If failed at knight: *"The knight IS the trickiest piece — it jumps in an L-shape! Let's practice it. 🐴"*  
If failed at pawn: *"Pawns have the most rules of any piece — let's go through them together."*

**Signal collected:** `pieceMovement: Record<PieceType, 'strong' | 'weak' | 'untested'>`

---

### Round 3 — Check & Checkmate

**Questions:** 4 (2 check detection + 2 checkmate-in-1)  
**Pass threshold:** 3/4  
**Fail placement:** Stage 3 (Training Grounds)

**Interaction — Check detection (2 questions):**
- A position is shown on the board.
- Two large answer tiles styled as board squares occupy the bottom two ranks of the board (where the kid's pieces would normally sit): **✓ Yes, check!** (green-tinted) and **✗ No check** (red-tinted).
- Coach Pawn: *"Is the king in check?"*
- These are buttons, but they live inside the board grid visually — they feel like board interaction, not a quiz popup. This preserves the "everything happens on the board" feel while avoiding the ambiguous "tap king if yes / tap anywhere else if no" interaction.

**Interaction — Checkmate-in-1 (2 questions):**
- Full board interaction. Coach Pawn: *"One move wins the game — find it!"*
- Tap a piece → legal move highlights appear → tap destination.
- Patterns used: Queen + King box mate, Rook + King back-rank mate. Simple, unambiguous.

**Fail bridge:**
> "You know how pieces move! Now let's learn about check and checkmate — the rules of winning."

**Signal collected:** `checkUnderstanding: 'strong' | 'weak'`

---

### Round 4 — Tactics

**Questions:** 4 (one per tactic, in curriculum order)  
**Pass threshold:** 3/4 → advance to Round 5. Partial pass → placed at first missed tactic.  
**Fail placement:** Stage 4, at the kingdom corresponding to the first missed tactic

**Tactics tested (in order):**
1. Fork (knight fork — two pieces attacked simultaneously)
2. Pin (bishop pin — piece can't move without exposing a higher-value piece)
3. Skewer (rook skewer — high-value piece forced to move, lower-value piece behind it captured)
4. Discovered attack (moving one piece reveals an attack from another)

**Interaction:**
- Full position on the board.
- Coach Pawn: *"Find the best move! Tap the piece to move, then tap where it goes."*
- Tap piece → legal moves highlight → tap destination. One correct answer per puzzle.

**Partial placement logic:**
- Gets fork ✓, pin ✓, misses skewer → placed at Stage 4, starting at Skewer Spire
- `tacticsKnown: ['fork', 'pin']`, `tacticsMissed: [{id: 'skewer', missType: 'execution' | 'blind'}]`

**`missType` signal (crown jewel):**  
On a wrong answer, record HOW it was wrong:
- **`'blind'`** — kid tapped a completely unrelated piece. They didn't see the tactic at all.
- **`'execution'`** — kid tapped the correct piece but moved it to the wrong square. They see the tactic but can't execute it yet.

This distinction changes how Coach Pawn coaches: *"You spotted the fork but moved the knight to the wrong square — let's look at where it needed to go"* vs *"Did you see the fork? The knight could attack both pieces at once — let me show you."*

**Signal collected:**
```typescript
tacticsKnown: string[]
tacticsMissed: Array<{ id: string; missType: 'execution' | 'blind' }>
```

---

### Round 5 — Strategy

**Questions:** 3  
**Pass threshold:** 2/3 → Stage 5 (Strategy Summit). Fail → Stage 4 (more tactics needed first).  
**Only shown if Round 4 passed.**

**Interaction:**
- Full position on the board with **3 candidate move arrows** pre-drawn.
- Coach Pawn: *"Which move improves your position? Tap it."*
- Kid taps one of the 3 arrows to select a move.
- Always structured: one clearly best, one mediocre, one actively bad. No ambiguity in the "correct" answer.

**Themes tested:** Open file activation for rook, active vs passive piece placement, pawn structure decision. Strictly strategic — no tactics.

**Why this round exists:** Most kids won't reach Round 5. It catches returning players or kids who've had coaching outside the app — they know tactics but belong at the Strategy Summit, not Fork Forest. Without Round 5, these kids get bored and churn.

---

## TrialResult Type

```typescript
interface TrialAnswer {
  roundId: 1 | 2 | 3 | 4 | 5;
  correct: boolean;
  confident: boolean | null;       // null = skipped the toggle
  responseTimeMs: number;          // silent fluency signal, not used for placement
  pieceType?: PieceType;           // Round 2
  tacticId?: string;               // Round 4
  missType?: 'execution' | 'blind'; // Round 4, wrong answers only
}

interface TrialResult {
  learningStage: LearningStage;           // 1–5 (never 6 — see placement rules)
  kingdomId: KingdomId;                   // narrative entry point
  advancedPlayer: boolean;               // true if Round 5 perfect — accelerates Stage 5 pacing
  strengthsAndGaps: {
    boardKnowledge: 'strong' | 'weak' | 'untested';
    colorAwareness: 'strong' | 'weak' | 'untested';
    pieceMovement: Record<PieceType, 'strong' | 'weak' | 'untested'>;
    checkUnderstanding: 'strong' | 'weak' | 'untested';
    tacticsKnown: string[];
    tacticsMissed: Array<{
      id: string;
      missType: 'execution' | 'blind';
    }>;
  };
}
```

---

## placeTrial() — Pure Placement Function

Lives in `lib/trial/placement.ts`. Takes an array of `TrialAnswer` objects (one per question answered), returns `TrialResult`.

**Key inputs:**
- Per-question: `roundId`, `correct: boolean`, `confident: boolean | null`, `pieceType?`, `tacticId?`, `missType?`, `responseTimeMs: number`
- Confidence weighting: a correct answer with `confident: false` counts as 0.5
- `responseTimeMs` is recorded silently but does NOT affect placement — it informs coaching pacing only

**Placement rules (in order — first match wins):**

| Condition | Stage | Kingdom |
|-----------|-------|---------|
| Round 1 fails (< 4/5 weighted) | 1 | `village` |
| Round 2 fails at Rook or Bishop | 2 | `village` (piece curriculum) |
| Round 2 fails at Queen, King, or Knight | 2 | `village` (piece curriculum, at that piece) |
| Round 2 fails at Pawn | 2 | `village` (pawn curriculum) |
| Round 3 fails (< 3/4) | 3 | `village` (Training Grounds section) |
| Round 4 — gets 0/4 | 4 | `fork_forest` |
| Round 4 — misses at fork | 4 | `fork_forest` |
| Round 4 — misses at pin | 4 | `pin_palace` |
| Round 4 — misses at skewer | 4 | `skewer_spire` |
| Round 4 — misses at discovered | 4 | `discovery_depths` |
| Round 4 passes (3/4+), Round 5 fails | 4 | `discovery_depths` (finish tactics first) |
| Round 4 passes, Round 5 passes (2/3+) | 5 | `strategy_summit` |
| Round 5 perfect (3/3) with high confidence | 5 | `strategy_summit` + `advancedPlayer: true` |

**Stage 6 is never assigned by The Trial.** Stage 6 (Endgame Throne) requires demonstrated mastery in actual games, not 3 assessment questions. The Trial can identify "this kid knows strategy" — it cannot verify endgame technique. A perfect Round 5 sets `advancedPlayer: true` on the result, which Coach Pawn uses to accelerate Stage 5 pacing. Stage 6 is only reached by playing through Stage 5.

**Test coverage required (15+ cases):**
- Perfect score → Stage 5 (Stage 6 never assigned by The Trial)
- Zero score → Stage 1
- Passes R1–R3, fails R4 at fork → Stage 4 / Fork Forest
- Passes R1–R3, fails R4 at skewer → Stage 4 / Skewer Spire
- Passes R1, fails R2 at knight → Stage 2 (knight curriculum)
- Passes R1, fails R2 at pawn → Stage 2 (pawn curriculum)
- 4/5 squares with 3 guesses → weaker than 4/5 clean (may fall to Stage 1)
- Passes all 4 tactic rounds, fails R5 → Stage 4 (not Stage 5)
- Color question miss doesn't affect stage
- R2 stops at 3 failures — pieces 4–6 are 'untested'

---

## TrialBoard.tsx

A separate component from `Board.tsx`. Shares visual layer (square colors, piece glyphs, coordinate labels, sizing, design tokens from `lib/design/tokens.ts`) but has its own interaction layer.

**Modes:**
- `'tap-square'` — single square tap. Fires `onSquareTap(sq)`. Used in Round 1.
- `'multi-select'` — tap to toggle squares. Shows live counter "N of M squares found." Submit button. Used in Round 2.
- `'move'` — tap piece → highlights appear → tap destination. Two-step interaction. Used in Rounds 3–5.
- `'arrows'` — pre-drawn arrows on board, tap an arrow to select. Used in Round 5.

**Feedback animations:**
- Correct tap: green flash (200ms)
- Wrong tap: gentle red shake (300ms), then correct answer briefly highlighted (800ms)
- Multi-select: selected squares show a soft purple highlight

**Extraction rule:** If square rendering duplication between `Board.tsx` and `TrialBoard.tsx` exceeds ~50 lines, extract a `BoardGrid.tsx` presentational component. Start without it — extract only if the duplication becomes painful.

---

## TheTrial.tsx — Orchestrator

**Props:**
```typescript
interface TheTrialProps {
  playerName: string;
  ageBand: AgeBand;
  onComplete: (result: TrialResult) => void;
}
```

**Responsibilities:**
- Renders progress dots (up to 5, fills as rounds complete)
- Holds current round state
- Calls `getNextRound()` after each round to decide continue or short-circuit
- Renders Coach Pawn with appropriate message per round state
- Renders `<TrialBoard>` with correct mode for the current question
- Shows confidence toggle after each answer (3s auto-skip)
- On all rounds done: calls `placeTrial(answers)` → calls `onComplete(result)`

**Coach Pawn messaging states:**
- Round intro: enthusiasm ("Let's see what you know!")
- Correct answer: brief praise ("Nice!" / "You got it!")
- Wrong answer: gentle ("Not quite — the correct square was **e4**")
- Round skip bridge: positive reframe ("Let's start with the board!")
- Final result: placed positively regardless of stage ("You already know forks! Let's work on pins next." / "You're at the very start of an awesome adventure! 🏘️")

---

## Onboarding Integration

The `experience` and `pawn_mini_game` steps in `lib/onboarding/steps.ts` are **removed** and replaced by a single `trial` step.

**Before:** name → age → experience → (maybe) pawn_mini_game → ready  
**After:** name → age → trial → ready

The `trial` step renders `<TheTrial>`. When it calls `onComplete(result)`, `Onboarding` advances to `ready` and passes `result` downstream into the store initialization.

**Rationale:** `experience` was self-reported — unreliable with kids. The Trial demonstrates knowledge rather than asking about it.

---

## Coaching Integration

`strengthsAndGaps` from `TrialResult` is written to `PlayerProgression` and made available to the coaching system. The `LearnerModel` in `lib/learner/types.ts` is pre-seeded with concepts from `strengthsAndGaps` before the first game starts:

- `tacticsKnown` → mark those `ConceptMastery` entries as `score: 0.8` (known but reinforce)
- `tacticsMissed` → mark as `score: 0.1` (new concept, needs introduction)
- `missType: 'execution'` → special coaching note: kid sees the pattern, needs execution practice
- `missType: 'blind'` → standard intro coaching: kid hasn't learned this pattern yet
- `advancedPlayer: true` → Coach Pawn skips slow introductions in Stage 5, assumes faster concept uptake
- `responseTimeMs` per answer → informs coaching pacing: low median response time = faster-moving explanations; high median = more board-familiarity reinforcement before advancing

This means Coach Pawn's first message in the first game is personalized, not generic.

---

## Out of Scope

- Stage 1–2 mini-game content (Square Hunt, Rook Maze, etc.) — separate feature
- Stage 3 simplified first games — separate feature
- Adaptive difficulty changes — separate feature
- The Trial being repeatable / re-takeable — not in this spec

The Trial routes the kid to a stage. The content at that stage is built separately.
