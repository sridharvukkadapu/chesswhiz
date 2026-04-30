# Concept Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent Coach Pawn from referencing chess concepts above the player's current `learningStage` by substituting raw tactic names with stage-appropriate descriptions before the LLM ever sees them.

**Architecture:** Three-layer enforcement — `lib/coaching/stages.ts` is the single source of truth (data only), `lib/coaching/prompts.ts` applies substitution and appends a concept ceiling to the system prompt, and `lib/coaching/schema.ts` adds `learningStage` to `CoachRequest`. `app/play/page.tsx` passes `progression.learningStage` in the three existing coach POST bodies. No new API routes or UI changes.

**Tech Stack:** TypeScript, Zod (already used in schema.ts), Jest (already used in lib/coaching/__tests__/)

---

## File Map

**New files:**
- `lib/coaching/stages.ts` — `STAGE_CONCEPT_ADDITIONS`, `TACTIC_DESCRIPTIONS`, `getAllowedConcepts()`, `describeTactic()`
- `lib/coaching/__tests__/stages.test.ts` — unit tests for stages.ts

**Modified files:**
- `lib/coaching/schema.ts` — add `learningStage: z.number().int().min(1).max(5).optional()` to `CoachRequestSchema`
- `lib/coaching/prompts.ts` — append concept ceiling to system prompt; substitute tactic descriptions in user prompt (triggerDesc + opportunityDetail + details string replace)
- `app/play/page.tsx` — add `learningStage: progression.learningStage` to three `handlePostMoveCoaching` POST bodies

---

## Background: What You Need to Know

### `LearningStage`

Defined in `lib/trial/types.ts`:
```typescript
export type LearningStage = 1 | 2 | 3 | 4 | 5;
```

Stage 1 = board orientation only. Stage 4 = tactic names introduced. Stage 5 = advanced positional concepts.

### `CoachRequest` and `buildCoachPrompt`

`lib/coaching/schema.ts` defines `CoachRequestSchema` (Zod). `CoachRequest = z.infer<typeof CoachRequestSchema>`.

`lib/coaching/prompts.ts` exports `buildCoachPrompt(req: CoachRequest): { system: string; user: string }`. The system prompt is built from `SYSTEM_PROMPT` constant + age band + player name. The user prompt is built from FEN, last move, mover, and a `triggerDesc` record that maps trigger types to natural-language descriptions.

The three places in the user prompt that can leak tactic names:
1. `triggerDesc["TACTIC_AVAILABLE"]` — contains `req.tacticsAvailableForKid`
2. `triggerDesc["BOT_TACTIC_INCOMING"]` — contains `req.tacticsAvailableForBot`
3. The `opportunityDetail` line — contains `req.opportunityDetail.type` and `req.opportunityDetail.details`

### `handlePostMoveCoaching` in `app/play/page.tsx`

Single function called in three places (around lines 602, 845, 858). It builds the POST body with `opportunityDetail` as the 7th argument. `progression` is available in scope via the game store.

### Existing test baseline

`lib/coaching/__tests__/prompts.test.ts` has 6 passing tests and 1 pre-existing failure (`"includes trigger info in user prompt"` fails because BLUNDER trigger desc doesn't include the word "BLUNDER"). Do NOT fix the pre-existing failure — just don't break the 6 passing tests.

---

### Task 1: Create `lib/coaching/stages.ts`

**Files:**
- Create: `lib/coaching/stages.ts`
- Create: `lib/coaching/__tests__/stages.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/coaching/__tests__/stages.test.ts`:

```typescript
import { getAllowedConcepts, describeTactic } from "../stages";

describe("getAllowedConcepts", () => {
  it("stage 1 returns only board-orientation concepts", () => {
    expect(getAllowedConcepts(1)).toEqual(["square", "rank", "file", "diagonal", "board"]);
  });

  it("stage 3 includes check and checkmate but not fork or pin", () => {
    const concepts = getAllowedConcepts(3);
    expect(concepts).toContain("check");
    expect(concepts).toContain("checkmate");
    expect(concepts).not.toContain("fork");
    expect(concepts).not.toContain("pin");
  });

  it("stage 4 includes fork and pin", () => {
    const concepts = getAllowedConcepts(4);
    expect(concepts).toContain("fork");
    expect(concepts).toContain("pin");
  });

  it("stage 5 includes everything from all 5 stages", () => {
    const concepts = getAllowedConcepts(5);
    expect(concepts).toContain("square");
    expect(concepts).toContain("capture");
    expect(concepts).toContain("check");
    expect(concepts).toContain("fork");
    expect(concepts).toContain("zugzwang");
  });
});

describe("describeTactic", () => {
  it("fork stage 1 does not contain the word fork", () => {
    expect(describeTactic("fork", 1)).not.toMatch(/\bfork\b/i);
  });

  it("fork stage 4 contains the word fork", () => {
    expect(describeTactic("fork", 4)).toMatch(/\bfork\b/i);
  });

  it("hanging_piece stage 2 does not contain the word hanging", () => {
    expect(describeTactic("hanging_piece", 2)).not.toMatch(/\bhanging\b/i);
  });

  it("hanging_piece stage 4 contains the word hanging", () => {
    expect(describeTactic("hanging_piece", 4)).toMatch(/\bhanging\b/i);
  });

  it("unknown tactic is passed through unchanged", () => {
    expect(describeTactic("unknown_tactic", 3)).toBe("unknown_tactic");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest lib/coaching/__tests__/stages.test.ts --no-coverage
```

Expected: All tests FAIL with `Cannot find module '../stages'`

- [ ] **Step 3: Create `lib/coaching/stages.ts`**

```typescript
import type { LearningStage } from "@/lib/trial/types";

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

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest lib/coaching/__tests__/stages.test.ts --no-coverage
```

Expected: All 9 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/coaching/stages.ts lib/coaching/__tests__/stages.test.ts
git commit -m "feat(coaching): add concept gating data — STAGE_CONCEPT_ADDITIONS and TACTIC_DESCRIPTIONS"
```

---

### Task 2: Add `learningStage` to `CoachRequestSchema`

**Files:**
- Modify: `lib/coaching/schema.ts` (around line 103–108, the `opportunityDetail` field area)

- [ ] **Step 1: Add the field to `CoachRequestSchema`**

In `lib/coaching/schema.ts`, find `CoachRequestSchema` (line 76). After the `opportunityDetail` field (ends around line 108), add `learningStage`:

The current end of `CoachRequestSchema` looks like:
```typescript
  opportunityDetail: z.object({
    type: z.enum(["hanging_piece", "fork", "pin", "mate_in_1", "bot_threat"]),
    details: z.string(),
    squares: z.array(z.string()).optional(),
  }).optional(),
});
```

Replace with:
```typescript
  opportunityDetail: z.object({
    type: z.enum(["hanging_piece", "fork", "pin", "mate_in_1", "bot_threat"]),
    details: z.string(),
    squares: z.array(z.string()).optional(),
  }).optional(),
  learningStage: z.number().int().min(1).max(5).optional(),
});
```

Also add the import at the top of the file (after `import { z } from "zod"`):
```typescript
// (no import needed — LearningStage is used only at runtime via z.number constraint)
```

Actually, `LearningStage` is not imported as a TS type in schema.ts — Zod validates it as a plain number at runtime and `CoachRequest` will have `learningStage?: number` from `z.infer`. The prompt builder will cast it to `LearningStage` after clamping. No import needed in schema.ts.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -i "schema\|learningStage" | head -20
```

Expected: No errors related to schema.ts

- [ ] **Step 3: Run existing prompts tests to confirm no regression**

```bash
npx jest lib/coaching/__tests__/prompts.test.ts --no-coverage
```

Expected: Same results as before (6 PASS, 1 pre-existing FAIL for "includes trigger info in user prompt")

- [ ] **Step 4: Commit**

```bash
git add lib/coaching/schema.ts
git commit -m "feat(coaching): add learningStage to CoachRequestSchema"
```

---

### Task 3: Apply concept gating in `buildCoachPrompt`

This is the core task. `buildCoachPrompt` in `lib/coaching/prompts.ts` gains two behaviors:
1. A concept ceiling block appended to the system prompt
2. Tactic name substitution in the user prompt (triggerDesc + opportunityDetail type + opportunityDetail details)

**Files:**
- Modify: `lib/coaching/prompts.ts`
- Modify: `lib/coaching/__tests__/prompts.test.ts` (add gating tests)

- [ ] **Step 1: Write the failing tests**

Append to `lib/coaching/__tests__/prompts.test.ts` (after the closing `});` of the existing `describe` block):

```typescript
describe("buildCoachPrompt — concept gating", () => {
  const gatingBase: CoachRequest = {
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    lastMove: { from: "e2", to: "e4", san: "e4" },
    mover: "player",
    trigger: "TACTIC_AVAILABLE",
    playerName: "Alex",
    ageBand: "8-10",
  };

  it("stage 2 with fork opportunityDetail — user prompt does not contain 'fork'", () => {
    const prompt = buildCoachPrompt({
      ...gatingBase,
      learningStage: 2,
      opportunityDetail: { type: "fork", details: "knight forks king and rook", squares: ["c3"] },
    });
    expect(prompt.user).not.toMatch(/\bfork\b/i);
  });

  it("stage 4 with fork opportunityDetail — user prompt contains 'fork'", () => {
    const prompt = buildCoachPrompt({
      ...gatingBase,
      learningStage: 4,
      opportunityDetail: { type: "fork", details: "knight can fork king and rook", squares: ["c3"] },
    });
    expect(prompt.user).toContain("fork");
  });

  it("stage 3 — system prompt contains 'Concept ceiling — Stage 3'", () => {
    const prompt = buildCoachPrompt({ ...gatingBase, learningStage: 3 });
    expect(prompt.system).toContain("Concept ceiling — Stage 3");
  });

  it("stage 3 — system prompt lists 'check' in the allowed list", () => {
    const prompt = buildCoachPrompt({ ...gatingBase, learningStage: 3 });
    expect(prompt.system).toContain("check");
  });

  it("stage 3 — system prompt does not list 'fork' in the allowed list", () => {
    const prompt = buildCoachPrompt({ ...gatingBase, learningStage: 3 });
    // 'fork' should only appear in the DO NOT reference section, if at all
    // The allowed list line must not contain 'fork'
    const lines = prompt.system.split("\n");
    const allowedLine = lines.find((l) => l.startsWith("Concept ceiling"));
    expect(allowedLine).toBeDefined();
    // The "You may reference:" part must not include fork
    const mayReferencePart = allowedLine!.split("Do NOT")[0];
    expect(mayReferencePart).not.toMatch(/\bfork\b/i);
  });

  it("no learningStage field — system prompt defaults to Stage 3", () => {
    const prompt = buildCoachPrompt({ ...gatingBase });
    expect(prompt.system).toContain("Stage 3");
  });

  it("stage 2 — TACTIC_AVAILABLE trigger desc does not contain 'fork' when fork is in tacticsAvailableForKid", () => {
    const prompt = buildCoachPrompt({
      ...gatingBase,
      learningStage: 2,
      tacticsAvailableForKid: ["fork"],
    });
    expect(prompt.user).not.toMatch(/\bfork\b/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest lib/coaching/__tests__/prompts.test.ts --no-coverage
```

Expected: 7 new tests FAIL (concept gating not yet implemented). 6 existing tests still PASS.

- [ ] **Step 3: Update `lib/coaching/prompts.ts`**

Replace the entire file content with:

```typescript
import type { CoachRequest } from "./schema";
import type { TriggerType } from "@/lib/chess/types";
import type { AgeBand } from "@/lib/learner/types";
import type { LearningStage } from "@/lib/trial/types";
import { getAllowedConcepts, describeTactic } from "./stages";

export interface CoachPrompt {
  system: string;
  user: string;
}

const SYSTEM_PROMPT = `You are Coach Pawn, a Socratic chess coach for children. You respond in JSON matching this schema:
{
  "shouldSpeak": boolean,
  "message": string (max 280 chars),
  "annotation": { "type": string, "squares": string[], "secondarySquares": string[], "label": string } | null,
  "interactionType": "statement"|"question"|"celebration"|"warning"|"reinforcement",
  "followUpChips": [{"label": string, "intent": string}] (max 3),
  "conceptTaught": string | null,
  "emotion": "happy"|"thinking"|"concerned"|"excited"|"neutral"
}

ANNOTATION TYPES: fork_rays, pin_line, skewer_line, discovered_attack, hanging_piece, defended_chain, attack_arrow, danger_square, highlight_square, none

FOLLOW-UP CHIP INTENTS: i_see_it, show_me, what_if, tell_me_more, got_it, try_again

SOCRATIC RULES (follow strictly):
1. For GREAT_MOVE / OK_MOVE: brief praise only (≤12 words), no chips, emotion=happy
2. For INACCURACY: one Socratic question ("What does your piece on X control?"), 1–2 chips
3. For MISTAKE / BLUNDER: name what's threatened WITHOUT giving the answer, ask "What do you think will happen next?", 2–3 chips
4. For TACTIC_AVAILABLE: hint at the opportunity without naming it ("Two pieces — is there a way to attack both?"), ask with chips [show_me, i_see_it]
5. For BOT_TACTIC_INCOMING: warn without giving away ("Something's off — can you spot the danger?"), chips [show_me, got_it]
6. For RECURRING_ERROR: refer to the pattern gently ("Remember that trap we've seen before?")
7. NEVER name a specific move (e.g. "play Rxf7"). Guide, don't solve.

LENGTH: "5-7" band → max 60 chars. "8-10" band → max 160 chars. "11+" band → max 280 chars.
TONE: "5-7" → very simple words, emoji OK. "8-10" → playful, chess terms with brief explanation. "11+" → direct chess terminology.`;

function buildConceptCeiling(stage: LearningStage): string {
  const allowed = getAllowedConcepts(stage);
  const allConcepts: string[] = [];
  for (let s = 1; s <= 5; s++) {
    const { STAGE_CONCEPT_ADDITIONS } = require("./stages");
    allConcepts.push(...STAGE_CONCEPT_ADDITIONS[s as LearningStage]);
  }
  const disallowed = allConcepts.filter((c) => !allowed.includes(c));
  const allowedStr = allowed.join(", ");
  if (disallowed.length === 0) {
    return `Concept ceiling — Stage ${stage}: You may reference: ${allowedStr}.`;
  }
  const disallowedStr = disallowed.join(", ");
  return `Concept ceiling — Stage ${stage}: You may reference: ${allowedStr}. Do NOT reference: ${disallowedStr}, or any concept above Stage ${stage}.`;
}

function stripDisallowedConcepts(text: string, stage: LearningStage): string {
  const { STAGE_CONCEPT_ADDITIONS } = require("./stages");
  const allConcepts: string[] = [];
  for (let s = 1; s <= 5; s++) {
    allConcepts.push(...STAGE_CONCEPT_ADDITIONS[s as LearningStage]);
  }
  const allowed = getAllowedConcepts(stage);
  const disallowed = allConcepts.filter((c) => !allowed.includes(c));
  let result = text;
  for (const concept of disallowed) {
    const escaped = concept.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "");
  }
  return result.replace(/\s{2,}/g, " ").trim();
}

function buildLearnerContext(req: CoachRequest): string {
  if (!req.learnerSummary) return "";
  const { mastered, inProgress, needsWork, recurringErrors, recentMessages } = req.learnerSummary;
  const parts: string[] = [];
  if (mastered.length > 0) parts.push(`Mastered: ${mastered.join(", ")}`);
  if (inProgress.length > 0) parts.push(`Learning: ${inProgress.join(", ")}`);
  if (needsWork.length > 0) parts.push(`Struggling: ${needsWork.join(", ")}`);
  if (recurringErrors.length > 0) {
    parts.push(`Recurring errors: ${recurringErrors.map((e) => `${e.patternId} (${e.count}x)`).join(", ")}`);
  }
  if (recentMessages.length > 0) {
    parts.push(`Recent coach messages: ${recentMessages.map((m) => `"${m}"`).join("; ")}`);
  }
  return parts.length > 0 ? `\nLearner profile:\n${parts.join("\n")}` : "";
}

export function buildCoachPrompt(req: CoachRequest): CoachPrompt {
  const stage: LearningStage = (req.learningStage as LearningStage | undefined) ?? 3;
  const conceptCeiling = buildConceptCeiling(stage);
  const learnerCtx = buildLearnerContext(req);
  const system = `${SYSTEM_PROMPT}\n\nAge band: ${req.ageBand}\nPlayer name: ${req.playerName}${learnerCtx}\n\n${conceptCeiling}`;

  const isBot = req.mover === "bot";

  const kidTactics = (req.tacticsAvailableForKid ?? [])
    .map((t) => describeTactic(t, stage))
    .join(", ");
  const botTactics = (req.tacticsAvailableForBot ?? [])
    .map((t) => describeTactic(t, stage))
    .join(", ");

  const triggerDesc: Record<string, string> = {
    GREAT_MOVE: isBot ? "Bot made a strong move — alert the player." : "Player made an excellent move.",
    OK_MOVE: isBot ? "Bot made a solid move." : "Player made a solid but unremarkable move.",
    INACCURACY: isBot
      ? `Bot's last move was slightly inaccurate — the player may have a better response.`
      : `Player's move was slightly inaccurate (${req.centipawnDelta ?? 0}cp loss).`,
    MISTAKE: isBot
      ? `Bot made a mistake — the player may be able to take advantage.`
      : `Player made a mistake (${req.centipawnDelta ?? 0}cp loss). Coach the player about the piece they left in danger.`,
    BLUNDER: isBot
      ? `Bot made a serious blunder — the player has a strong opportunity.`
      : `Player made a serious blunder (${req.centipawnDelta ?? 0}cp loss). Coach the player about the piece they left in danger.`,
    TACTIC_AVAILABLE: `A tactic is available for the player: ${kidTactics || "tactical opportunity"}.`,
    PATTERN_RECOGNIZED: "A recognizable pattern is present on the board.",
    RECURRING_ERROR: `Player repeated a recurring error: ${(req.learnerSummary?.recurringErrors[0]?.patternId ?? "unknown")}.`,
    BOT_TACTIC_INCOMING: `The bot just set up a tactic: ${botTactics || "tactical threat"}.`,
  };

  const userLines: string[] = [
    `Position FEN: ${req.fen}`,
    `Last move: ${req.lastMove ? `${req.lastMove.san} (${req.lastMove.from}→${req.lastMove.to})` : "none"}`,
    `Mover: ${req.mover}`,
    `Situation: ${triggerDesc[req.trigger] ?? req.trigger}`,
  ];
  if (req.activeMissionConcept) {
    userLines.push(`Active mission concept: ${req.activeMissionConcept}`);
  }
  if (req.opportunityDetail) {
    const typeDesc = describeTactic(req.opportunityDetail.type, stage);
    const details = stripDisallowedConcepts(req.opportunityDetail.details, stage);
    userLines.push(`Opportunity detected: ${typeDesc} — ${details}`);
    if (req.opportunityDetail.squares?.length) {
      userLines.push(`Key squares: ${req.opportunityDetail.squares.join(", ")}`);
    }
  }
  userLines.push("", "Respond with valid JSON only. No markdown, no prose outside the JSON.");
  const user = userLines.join("\n");

  return { system, user };
}

export function enforceLength(text: string, ageBand: AgeBand): string {
  const limit = ageBand === "5-7" ? 120 : ageBand === "8-10" ? 200 : 280;
  if (text.length <= limit) return text;
  const truncated = text.slice(0, limit);
  const lastEnd = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?"),
  );
  if (lastEnd > truncated.length / 2) {
    return truncated.slice(0, lastEnd + 1);
  }
  return truncated.replace(/[,;:]$/, "") + "…";
}

// Legacy TriggerType-based enforceLength for backwards compat in API route
export function enforceLengthByTrigger(text: string, trigger: TriggerType): string {
  const MAX_WORDS: Record<TriggerType, number> = {
    GREAT_MOVE: 10,
    OK_MOVE: 8,
    INACCURACY: 35,
    MISTAKE: 45,
    BLUNDER: 55,
    TACTIC_AVAILABLE: 40,
    PATTERN_RECOGNIZED: 35,
    RECURRING_ERROR: 45,
    BOT_TACTIC_INCOMING: 40,
  };
  const limit = MAX_WORDS[trigger] ?? 30;
  const words = text.trim().split(/\s+/);
  if (words.length <= limit) return text.trim();
  const truncated = words.slice(0, limit).join(" ");
  const lastEnd = Math.max(truncated.lastIndexOf("."), truncated.lastIndexOf("!"), truncated.lastIndexOf("?"));
  if (lastEnd > truncated.length / 2) return truncated.slice(0, lastEnd + 1);
  return truncated.replace(/[,;:]$/, "") + "…";
}

export const FALLBACKS: Record<string, string[]> = {
  GREAT_MOVE: [
    "Wow, amazing move! You're really thinking like a chess champion! ⭐",
    "That's a really strong move! Great job! 🎉",
    "Excellent! You're controlling the board beautifully! 🏆",
  ],
  OK_MOVE: [
    "Good thinking! Let's see what happens next.",
    "Solid move! The game is getting interesting.",
    "Nice! Keep looking for opportunities.",
  ],
  INACCURACY: [
    "Not bad! But take another look — could any piece do something stronger?",
    "Decent, but there might have been something even better. Keep exploring!",
  ],
  MISTAKE: [
    "Oops! Check if all your pieces are safe before moving. You've got this! 💪",
    "Hmm, that piece might be in trouble. Always ask: is it protected?",
  ],
  BLUNDER: [
    "Oh no! Something's unprotected. But every champion learns from mistakes! 🎮",
    "Careful! Always check: is my piece safe after I move? Let's keep going!",
  ],
  TACTIC_AVAILABLE: [
    "See if you can spot a tactical opportunity here!",
    "Look carefully — there might be a way to win material!",
  ],
  RECURRING_ERROR: [
    "Watch out for that pattern — you've seen it before!",
    "Remember to check your pieces before moving!",
  ],
  BOT_TACTIC_INCOMING: [
    "The bot might be setting something up. Stay alert!",
    "Something's brewing on the board — can you spot the danger?",
  ],
  PATTERN_RECOGNIZED: [
    "Interesting pattern here! Look for connections.",
    "There's something worth noticing in this position.",
  ],
};
```

**Note on `require()` calls:** The `buildConceptCeiling` and `stripDisallowedConcepts` functions use `require("./stages")` to access `STAGE_CONCEPT_ADDITIONS`. This avoids a circular reference issue if stages.ts ever imports from prompts.ts in the future. If TypeScript complains about `require`, use a top-level import instead:

```typescript
import { getAllowedConcepts, describeTactic, STAGE_CONCEPT_ADDITIONS } from "./stages";
```

And replace the `require("./stages")` calls with direct `STAGE_CONCEPT_ADDITIONS` references. Use the top-level import approach — it's cleaner. The final file should use top-level imports, not require().

**Corrected version of `buildConceptCeiling` and `stripDisallowedConcepts` using top-level import:**

```typescript
import { getAllowedConcepts, describeTactic, STAGE_CONCEPT_ADDITIONS } from "./stages";

function buildConceptCeiling(stage: LearningStage): string {
  const allowed = getAllowedConcepts(stage);
  const allConcepts: string[] = [];
  for (let s = 1; s <= 5; s++) {
    allConcepts.push(...STAGE_CONCEPT_ADDITIONS[s as LearningStage]);
  }
  const disallowed = allConcepts.filter((c) => !allowed.includes(c));
  const allowedStr = allowed.join(", ");
  if (disallowed.length === 0) {
    return `Concept ceiling — Stage ${stage}: You may reference: ${allowedStr}.`;
  }
  const disallowedStr = disallowed.join(", ");
  return `Concept ceiling — Stage ${stage}: You may reference: ${allowedStr}. Do NOT reference: ${disallowedStr}, or any concept above Stage ${stage}.`;
}

function stripDisallowedConcepts(text: string, stage: LearningStage): string {
  const allConcepts: string[] = [];
  for (let s = 1; s <= 5; s++) {
    allConcepts.push(...STAGE_CONCEPT_ADDITIONS[s as LearningStage]);
  }
  const allowed = getAllowedConcepts(stage);
  const disallowed = allConcepts.filter((c) => !allowed.includes(c));
  let result = text;
  for (const concept of disallowed) {
    const escaped = concept.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "");
  }
  return result.replace(/\s{2,}/g, " ").trim();
}
```

Use this corrected version in the actual file. The full file should import from `./stages` at the top (no `require`).

- [ ] **Step 4: Run all coaching tests**

```bash
npx jest lib/coaching/__tests__/prompts.test.ts lib/coaching/__tests__/stages.test.ts --no-coverage
```

Expected:
- All 9 stages tests PASS
- All 7 new gating tests PASS
- 6 existing prompts tests PASS
- 1 pre-existing FAIL for "includes trigger info in user prompt" (unchanged — do not fix)

- [ ] **Step 5: Commit**

```bash
git add lib/coaching/prompts.ts lib/coaching/__tests__/prompts.test.ts
git commit -m "feat(coaching): apply concept ceiling and tactic substitution in buildCoachPrompt"
```

---

### Task 4: Pass `learningStage` in `app/play/page.tsx`

The `handlePostMoveCoaching` callback (around line 593) builds the POST body. Add `learningStage: progression.learningStage` to that body. `progression` is already in scope.

**Files:**
- Modify: `app/play/page.tsx` (the POST body inside `handlePostMoveCoaching`, around line 609–626)

- [ ] **Step 1: Locate the POST body**

The `handlePostMoveCoaching` function contains:
```typescript
body: JSON.stringify({
  fen,
  lastMove: { from: lastMoveFrom, to: lastMoveTo, san: lastMoveSan },
  mover,
  trigger: analysis.trigger,
  centipawnDelta: analysis.diff,
  tacticsAvailableForKid: mover === "player"
    ? (analysis.tactics?.filter((t) => t.detected).map((t) => t.type) ?? [])
    : [],
  tacticsAvailableForBot: mover === "bot"
    ? (analysis.tactics?.filter((t) => t.detected).map((t) => t.type) ?? [])
    : [],
  playerName,
  ageBand: ageToBand(playerAge),
  learnerSummary: summary,
  activeMissionConcept: progression.activeMission?.targetTactic,
  opportunityDetail,
}),
```

- [ ] **Step 2: Add `learningStage` to the POST body**

Replace the `body: JSON.stringify({...})` block with:
```typescript
body: JSON.stringify({
  fen,
  lastMove: { from: lastMoveFrom, to: lastMoveTo, san: lastMoveSan },
  mover,
  trigger: analysis.trigger,
  centipawnDelta: analysis.diff,
  tacticsAvailableForKid: mover === "player"
    ? (analysis.tactics?.filter((t) => t.detected).map((t) => t.type) ?? [])
    : [],
  tacticsAvailableForBot: mover === "bot"
    ? (analysis.tactics?.filter((t) => t.detected).map((t) => t.type) ?? [])
    : [],
  playerName,
  ageBand: ageToBand(playerAge),
  learnerSummary: summary,
  activeMissionConcept: progression.activeMission?.targetTactic,
  opportunityDetail,
  learningStage: progression.learningStage,
}),
```

This is the only POST body for `handlePostMoveCoaching`. All three call sites (player-move coaching, proactive TACTIC_AVAILABLE scan, and BOT_TACTIC_INCOMING warning) go through this single function — so one change covers all three.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | grep -i "play\|learningStage" | head -20
```

Expected: No new errors

- [ ] **Step 4: Run the full coaching test suite**

```bash
npx jest lib/coaching/ --no-coverage
```

Expected: All previously-passing tests still pass. No new failures.

- [ ] **Step 5: Commit**

```bash
git add app/play/page.tsx
git commit -m "feat(play): pass learningStage in coach POST body"
```

---

## Self-Review Checklist

After all tasks are done, verify:

- [ ] `npx jest lib/coaching/ --no-coverage` — all new tests pass, no regressions
- [ ] `npx tsc --noEmit` — zero new TypeScript errors
- [ ] `describeTactic("fork", 2)` does not return a string containing "fork" (verify in stages.test.ts output)
- [ ] `buildCoachPrompt` with `learningStage: 2` and `opportunityDetail: { type: "fork", ... }` — user prompt does not contain "fork" (verify in prompts.test.ts output)
- [ ] System prompt for any stage contains "Concept ceiling — Stage N" line
