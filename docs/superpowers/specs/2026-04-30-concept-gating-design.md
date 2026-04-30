# Concept Gating Design Spec

## Goal

Coach Pawn never references a chess concept above the player's current `learningStage`. A Stage 1 kid hears only board-orientation language. A Stage 3 kid hears about check and checkmate but never about forks or pins. A Stage 4 kid hears tactic names for the first time. This is enforced at the prompt-builder level — raw tactic names are substituted before the LLM ever sees them, so the model cannot accidentally leak constrained vocabulary.

## Architecture

Three layers of enforcement, each with a single responsibility:

1. **`lib/coaching/stages.ts`** — single source of truth for what's allowed at each stage. Contains `STAGE_ALLOWED_CONCEPTS` and `TACTIC_DESCRIPTIONS`. No logic, just data.
2. **`lib/coaching/prompts.ts`** — reads the data tables and applies gating. Substitutes raw tactic names in the user prompt; appends a concept ceiling block to the system prompt.
3. **`lib/coaching/schema.ts`** — adds `learningStage?: LearningStage` to `CoachRequest` so the field flows from the store to the API to the prompt builder.

`app/play/page.tsx` is the only caller change — it adds `learningStage: progression.learningStage` to each of the three `CoachRequest` POST bodies.

---

## `lib/coaching/stages.ts`

### `STAGE_ALLOWED_CONCEPTS`

Cumulative — each stage adds to the one below it. The running allowed set is built at call time by merging stages 1 through N.

```typescript
export const STAGE_CONCEPT_ADDITIONS: Record<LearningStage, string[]> = {
  1: ["square", "rank", "file", "diagonal", "board"],
  2: ["piece movement", "piece value", "capture", "protection", "trade"],
  3: ["check", "checkmate", "stalemate", "castling", "en passant", "promotion"],
  4: ["fork", "pin", "skewer", "discovered attack", "hanging piece", "back rank"],
  5: ["outpost", "open file", "pawn structure", "opposition", "zugzwang"],
};

export function getAllowedConcepts(stage: LearningStage): string[] {
  const result: string[] = [];
  for (let s = 1; s <= stage; s++) {
    result.push(...STAGE_CONCEPT_ADDITIONS[s as LearningStage]);
  }
  return result;
}
```

### `TACTIC_DESCRIPTIONS`

Maps each raw `opportunityDetail.type` / tactic ID to a stage-appropriate description. The substitution is applied to both `opportunityDetail` serialization and `tacticsAvailableForKid`/`tacticsAvailableForBot` arrays in the user prompt.

Below Stage 4 the pattern name is absent — Coach Pawn describes the **effect** instead.

```typescript
export const TACTIC_DESCRIPTIONS: Record<string, Record<LearningStage, string>> = {
  fork: {
    1: "you can attack two pieces at the same time",
    2: "you can attack two pieces at the same time",
    3: "you can attack two pieces at the same time",
    4: "fork — attack two pieces at once",
    5: "fork",
  },
  pin: {
    1: "one of your pieces is stuck and can't move safely",
    2: "one of your pieces is stuck and can't move safely",
    3: "a piece is stuck — something important is behind it",
    4: "pin — piece is fixed to a more valuable piece behind it",
    5: "pin",
  },
  skewer: {
    1: "something dangerous is aimed at your piece",
    2: "something dangerous is aimed at your piece",
    3: "your piece is being attacked and something valuable is behind it",
    4: "skewer — attack through a piece to win material behind it",
    5: "skewer",
  },
  discovered_attack: {
    1: "moving a piece reveals a surprise attack",
    2: "moving a piece reveals a surprise attack",
    3: "moving a piece reveals a surprise attack",
    4: "discovered attack — move one piece to unleash another",
    5: "discovered attack",
  },
  hanging_piece: {
    1: "that piece isn't safe",
    2: "that piece isn't safe — it can be captured for free",
    3: "that piece is hanging — no one is protecting it",
    4: "hanging piece — undefended and free to capture",
    5: "hanging piece",
  },
  mate_in_1: {
    1: "you can end the game right now",
    2: "you can end the game right now",
    3: "checkmate in one move",
    4: "checkmate in one move",
    5: "mate in 1",
  },
  bot_threat: {
    1: "something dangerous is coming",
    2: "the bot is setting up a trap",
    3: "the bot is threatening something — can you spot it?",
    4: "the bot has a tactic coming",
    5: "the bot has a tactic coming",
  },
};

export function describeTactic(tacticId: string, stage: LearningStage): string {
  return TACTIC_DESCRIPTIONS[tacticId]?.[stage] ?? tacticId;
}
```

---

## `lib/coaching/schema.ts`

Add `learningStage` to `CoachRequestSchema`:

```typescript
import type { LearningStage } from "@/lib/trial/types";

// In CoachRequestSchema:
learningStage: z.number().int().min(1).max(5).optional(),
```

`CoachRequest` picks it up automatically via `z.infer`. Default assumption when absent: Stage 3 (mid-point, safe fallback for any existing callers).

---

## `lib/coaching/prompts.ts`

### System prompt: concept ceiling block

`buildCoachPrompt` appends a concept ceiling block to the system string, generated from `getAllowedConcepts()`:

```
Concept ceiling — Stage 2: You may reference: square, rank, file, diagonal, board, piece movement, piece value, capture, protection, trade. Do NOT reference: check, checkmate, stalemate, castling, en passant, promotion, fork, pin, skewer, discovered attack, hanging piece, back rank, outpost, open file, pawn structure, opposition, zugzwang, or any concept above Stage 2.
```

The "Do NOT reference" list is built by collecting everything in stages (N+1) through 5. If stage is 5, the "Do NOT reference" line is omitted entirely.

### User prompt: tactic name substitution

Two substitution points:

1. **`tacticsAvailableForKid` / `tacticsAvailableForBot`** arrays — each element is passed through `describeTactic(id, stage)` before being joined into the trigger description string.

2. **`opportunityDetail` serialization** — the `type` field is replaced with `describeTactic(type, stage)` before being written into the user prompt line. The raw type string never appears in the prompt below Stage 4.

Example user prompt diff for Stage 2 with a fork available:

```
// Before (no gating):
Opportunity detected: fork — White knight on c3 can fork king on e4 and rook on a4

// After (Stage 2 gating):
Opportunity detected: you can attack two pieces at the same time — White knight on c3 can attack king on e4 and rook on a4
```

Note: `opportunityDetail.details` (a free-text string) may contain the word "fork" as it's generated by the opportunity scanner. The prompt builder strips any disallowed concept words from `details` as well using a simple word-boundary replace. Alternatively the opportunity scanner can be taught to produce stage-appropriate details — but that's a later improvement. For now: string replace in `buildCoachPrompt` using the disallowed concept list.

---

## `app/play/page.tsx`

Three POST bodies gain one field:

```typescript
learningStage: progression.learningStage,
```

These are at the player-move coaching call, the bot-move coaching call, and the opportunity scan coaching call. All three already have access to `progression` via the store.

---

## Tests

### `lib/coaching/__tests__/stages.test.ts` (new file)

- `getAllowedConcepts(1)` returns `["square","rank","file","diagonal","board"]`
- `getAllowedConcepts(3)` includes `"check"` and `"checkmate"` but NOT `"fork"` or `"pin"`
- `getAllowedConcepts(4)` includes `"fork"` and `"pin"`
- `getAllowedConcepts(5)` includes everything from all 5 stages
- `describeTactic("fork", 1)` returns a string that does NOT contain the word "fork"
- `describeTactic("fork", 4)` returns a string that DOES contain "fork"
- `describeTactic("hanging_piece", 2)` does not contain "hanging"
- `describeTactic("hanging_piece", 4)` contains "hanging"
- `describeTactic("unknown_tactic", 3)` returns `"unknown_tactic"` (passthrough for unknown IDs)

### Additions to `lib/coaching/__tests__/prompts.test.ts`

- `buildCoachPrompt` with `learningStage: 2`, `opportunityDetail: { type: "fork", details: "knight forks king and rook", squares: ["c3"] }` → user prompt does NOT contain the word `"fork"`
- Same request with `learningStage: 4` → user prompt DOES contain `"fork"`
- `buildCoachPrompt` with `learningStage: 3` → system prompt contains `"Concept ceiling — Stage 3"`
- `buildCoachPrompt` with `learningStage: 3` → system prompt contains `"check"` in the allowed list
- `buildCoachPrompt` with `learningStage: 3` → system prompt does NOT list `"fork"` in the allowed list
- `buildCoachPrompt` with no `learningStage` field → system prompt contains `"Stage 3"` (default fallback)

---

## File Map

**New files:**
- `lib/coaching/stages.ts`
- `lib/coaching/__tests__/stages.test.ts`

**Modified files:**
- `lib/coaching/schema.ts` — add `learningStage` to `CoachRequestSchema`
- `lib/coaching/prompts.ts` — add concept ceiling to system prompt; substitute tactic descriptions in user prompt
- `app/play/page.tsx` — add `learningStage` to three coach POST bodies

---

## Out of Scope

- Changing the tactic **detection** logic — the scanner always runs at full fidelity at every stage. Gating is presentation-only.
- Changing `opportunityDetail.details` generation in `lib/coaching/opportunity.ts` — the string-replace in `buildCoachPrompt` handles leakage for now.
- Stage-gating the `annotation` type returned by the LLM (e.g. suppressing `fork_rays` for Stage 1–3). This is a future improvement.
- Any UI changes.
