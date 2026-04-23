# ChessWhiz — Design Spec
**Date:** 2026-04-23  
**Status:** Approved  
**Scope:** Web app v1 (mobile/React Native deferred)

---

## What We're Building

ChessWhiz is a web-first AI chess coach for kids. Kids play chess against a bot and receive real-time coaching from "Coach Pawn" (powered by Claude) after notable moves — blunders, great plays, tactical misses. The UI is kid-friendly, dark-themed, and works in the browser today with a clean path to React Native later.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 App Router | API routes protect the Claude key; Vercel deploy is one-click; familiar from PhotoPass.ai |
| Chess rules | chess.js | Battle-tested move validation, legal move gen, draw detection (50-move, threefold, insufficient material) |
| Bot AI | Custom minimax + alpha-beta | Full control over difficulty scaling; piece-square table evaluation |
| Game state | Zustand | Lightweight, no boilerplate, easy to port to React Native |
| Coaching backend | Next.js API route → Claude (streaming SSE) | API key stays server-side; SSE streams text to the coach panel in real time |
| Styling | Tailwind CSS | Utility-first, consistent with Next.js ecosystem |
| Animations | Framer Motion | Piece movement, coach panel fade-in |
| API key | `ANTHROPIC_API_KEY` env var | Set in `.env.local` for dev, Vercel env vars for prod. Never exposed to client. |

---

## Project Structure

```
chesswhiz/
├── app/
│   ├── layout.tsx              # Root layout, fonts (Fredoka, Outfit, JetBrains Mono), metadata
│   ├── page.tsx                # Onboarding screen (redirects to /play after setup)
│   ├── play/
│   │   └── page.tsx            # Game screen (client component, imports Board + CoachPanel)
│   ├── api/
│   │   └── coach/
│   │       └── route.ts        # POST handler — builds prompt, calls Claude, returns SSE stream
│   └── globals.css             # Tailwind base + custom scrollbar + keyframe animations
├── lib/
│   ├── chess/
│   │   ├── engine.ts           # chess.js wrapper: legalMoves(), applyMove(), gameStatus(), moveToSAN()
│   │   ├── evaluation.ts       # Piece values (PIECE_VAL), piece-square tables (PST), evaluate()
│   │   ├── ai.ts               # minimax() with alpha-beta pruning, findBestMove(state, difficulty)
│   │   └── types.ts            # ChessState, Move, Piece, GameStatus, TriggerType types
│   └── coaching/
│       ├── analyzer.ts         # analyzeMoveQuality(prevState, newState, move) → MoveAnalysis
│       ├── triggers.ts         # shouldCoach(analysis, moveCount, lastCoachMove) → boolean
│       └── prompts.ts          # buildCoachPrompt(analysis, state, history, name, age) → {system, user}
├── components/
│   ├── Board.tsx               # 8×8 grid, square click handler, piece rendering, promotion modal
│   ├── CoachPanel.tsx          # Message list with typed styles (praise/tip/correction/celebration)
│   ├── MoveHistory.tsx         # Paired move list (1. e4 e5 2. Nf3...) in monospace grid
│   ├── PlayerBar.tsx           # Name + color + active indicator + "thinking..." state
│   ├── GameStatus.tsx          # Win/draw/loss banner with Play Again button
│   └── Onboarding.tsx          # Name input, age group picker, difficulty picker, Let's Play CTA
├── stores/
│   └── gameStore.ts            # Zustand store: chess state, selection, move history, coach messages
└── public/
    └── (no assets needed for v1 — unicode chess pieces, no image files)
```

All code in `lib/` is pure TypeScript with no React imports. This is intentional — it makes the chess engine and coaching logic fully portable to React Native when the time comes.

---

## Two Screens

### Screen 1: Onboarding (`/`)

A centered card on a dark radial-gradient background.

- **Name input** — text field, required (CTA disabled until filled)
- **Age group** — 3-button toggle: `5–7` (age=6), `8–10` (age=9), `11+` (age=12). Default: 8–10.
- **Bot difficulty** — 3-button toggle: `🐱 Easy` (depth 1), `🔥 Medium` (depth 2), `🦁 Hard` (depth 3). Default: Medium.
- **"Let's Play! ♟"** button — stores settings in Zustand, navigates to `/play`

On submit, the Zustand store is initialized with player settings and a welcome coach message is added.

### Screen 2: Game (`/play`)

Two-column layout (board left, coach panel right). Wraps to single column on mobile.

**Left column:**
- PlayerBar (Bot / Black) — shows "thinking..." during bot turn
- Chessboard — 8×8 grid, wood color scheme (`#ecd8b8` / `#ae825e`), last-move highlight (yellow), selected square (green), legal move dots, check glow (red radial gradient on king)
- PlayerBar (Kid / White) — green active dot on their turn
- GameStatusBar — shown only when game ends; win/draw/loss with Play Again

**Right column:**
- CoachPanel — scrollable message list, messages styled by type (praise=lime, tip=blue, correction=red), typewriter fade-in animation, "thinking..." indicator during API call
- MoveHistory — paired move list in monospace grid
- Action row — New Game + Undo buttons
- FEN display (dev only) — small monospace text showing current FEN for debugging; remove before launch

---

## Chess Engine (`lib/chess/`)

### chess.js integration (`engine.ts`)

Wraps chess.js to expose:
- `getLegalMoves(chess, square?)` — all legal moves, optionally filtered to a square
- `applyMove(chess, move)` — returns new Chess instance after move
- `getGameStatus(chess)` — returns `"playing" | "white_wins" | "black_wins" | "stalemate" | "draw"`
- `moveToSAN(chess, move)` — algebraic notation string
- `toFEN(chess)` — current FEN string

chess.js handles all edge cases: castling rights, en passant, promotion, threefold repetition, 50-move rule, insufficient material.

### Evaluation (`evaluation.ts`)

```
PIECE_VAL = { p:100, n:320, b:330, r:500, q:900, k:0 }
PST = piece-square tables for all 6 piece types (from MVP, proven values)
evaluate(state) = Σ sign * (PIECE_VAL[type] + PST[type][r][c])
```

White is positive, black is negative. Used by minimax and by the move analyzer.

### AI (`ai.ts`)

- `minimax(state, depth, alpha, beta, maximizing)` — standard negamax with alpha-beta pruning
- `findBestMove(state, difficulty)`:
  - difficulty 1 (Easy): random move, biased toward captures 40% of the time
  - difficulty 2 (Medium): depth-2 minimax, 15% random move injection
  - difficulty 3 (Hard): depth-3 minimax, no randomness

Bot plays as Black. `findBestMove` is called in a `setTimeout` (350–850ms random delay) to simulate thinking time and prevent the UI from locking up. For Hard difficulty, depth-3 minimax on the browser main thread can take ~1–3 seconds in complex positions — this is acceptable for v1. If it becomes an issue, move to a Web Worker.

---

## Coaching System (`lib/coaching/`)

### Move quality analysis (`analyzer.ts`)

After each player move, `analyzeMoveQuality(prevState, newState, move)` runs:

1. Evaluate the new position: `newEval = evaluate(newState)`
2. Find the best move white could have played: `bestMove = findBestMove(prevState, 3)`
3. Evaluate the best move's resulting position: `bestEval = evaluate(applyMove(prevState, bestMove))`
4. Compute `diff = Math.abs(bestEval - newEval)` (centipawns)
5. Classify:

| Trigger | CP Diff | Severity |
|---|---|---|
| `GREAT_MOVE` | < 30 | 0 |
| `OK_MOVE` | < 80 | 1 |
| `INACCURACY` | < 200 | 2 |
| `MISTAKE` | < 400 | 3 |
| `BLUNDER` | ≥ 400 | 4 |

Also detects `isHanging` — whether the moved piece can be immediately captured by the opponent.

Returns: `{ trigger, severity, san, bestSAN, diff, piece, captured, isHanging, eval }`

### Coaching triggers (`triggers.ts`)

`shouldCoach(analysis, moveCount, lastCoachMove) → boolean`

Rules (in order):
1. If fewer than 3 moves since last coaching AND severity < 3 → **no** (cooldown)
2. If severity ≥ 3 (MISTAKE or BLUNDER) → **always coach**
3. If severity = 0 (GREAT_MOVE) → coach with 35% probability
4. If severity = 2 (INACCURACY) → coach with 25% probability
5. If moveCount ≤ 2 (opening moves) → coach with any severity ≤ 1
6. Otherwise → **no**

### Claude prompt templates (`prompts.ts`)

`buildCoachPrompt(analysis, gameState, moveHistory, playerName, age) → { system, user }`

**System prompt** varies by age:
- Ages 5–7: max 2 sentences, simple words, emoji encouraged, soft language ("oopsie!" not "wrong"), toy/animal analogies
- Ages 8–10: chess terms OK (fork, pin, check), explain briefly, 3 sentences max, playful
- Ages 11+: full terminology, strategic discussion, 3–4 sentences

**Core system prompt rules (all ages):**
- Never suggest a specific move — only explain what happened
- Never be harsh or discouraging
- Keep responses short
- Celebrate effort

**User prompt** is structured:
```
Game: [move history in SAN]
Position: [current FEN]
[trigger-specific instruction — e.g., "The kid played Nf3, a great move! Praise them and explain why developing a knight toward the center is strong."]
```

**Anti-hallucination guard:** The trigger instruction always includes what the engine determined (played move, best move, eval delta). Claude is explicitly told what happened — it explains, never computes. For v1: rely on the system prompt constraint ("never suggest moves") and log every coaching response to the console. Manually audit the first 100 responses to calibrate quality before adding automated filtering. Post-processing regex is deferred — SAN notation overlaps with natural text ("Be3", "a4") making it error-prone.

**Model routing:**
- Sonnet for everything in v1. Coaching quality is the product differentiator — validate that prompts work well before optimizing costs. Cost delta at low volume is negligible (~$5/mo). Downgrade specific triggers to Haiku post-launch once coaching quality is confirmed.

**Offline fallbacks:** Hardcoded in `prompts.ts` — one array per trigger type, randomly selected. Used when the API call fails or times out.

---

## API Route (`app/api/coach/route.ts`)

**Method:** POST  
**Request body:**
```json
{
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "trigger": "BLUNDER",
  "severity": 4,
  "san": "Bxf7",
  "bestSAN": "Nf3",
  "diff": 520,
  "isHanging": true,
  "piece": "b",
  "captured": null,
  "moveHistory": ["e4", "e5", "Bxf7"],
  "playerName": "Alex",
  "age": 9
}
```

**Response:** SSE stream (`text/event-stream`)  
Each chunk: `data: {"text": "Uh oh! That bishop..."}\n\n`  
Final: `data: [DONE]\n\n`

**Implementation:**
1. Validate request body (zod schema)
2. Call `buildCoachPrompt()` from `lib/coaching/prompts.ts`
3. Use Sonnet for all coaching in v1
4. Call `anthropic.messages.stream()` with `@anthropic-ai/sdk`
5. Pipe chunks to `ReadableStream` response
6. On error: return a JSON fallback response (not an SSE error) so the client can handle it gracefully

**Auth:** None for v1 (protected by being server-side only, no client-exposed key). Rate limiting is left for post-launch.

---

## Zustand Store (`stores/gameStore.ts`)

State shape:
```typescript
{
  // Chess
  chess: Chess                    // chess.js instance
  selected: { r, c } | null
  legalHighlights: Move[]
  lastMove: { fr, fc, tr, tc } | null
  moveHistory: string[]           // SAN strings
  stateHistory: Chess[]           // for undo
  status: GameStatus

  // Player
  playerName: string
  playerAge: number
  difficulty: 1 | 2 | 3

  // Coaching
  coachMessages: CoachMessage[]
  coachLoading: boolean
  lastCoachMove: number           // moveCount when last coached
  moveCount: number

  // UI
  screen: "onboarding" | "playing"
  showPromo: Move | null
  botThinking: boolean
}
```

Actions: `setSettings`, `selectSquare`, `clearSelection`, `makeMove`, `showPromoModal`, `setBotThinking`, `addCoachMessage`, `setCoachLoading`, `resetGame`, `undo`

**Undo behavior:** Pops 2 entries from `stateHistory` (player move + bot response). After undo, dispatches a coaching message: "Let's try that again! Think it through — what are all your options?" This makes undo feel like a coaching moment rather than a silent rewind.

**Persistence:** Zustand state is in-memory for v1. Settings (name, age, difficulty) are lost on page refresh — the user returns to the onboarding screen. This is intentional; no localStorage persistence in v1.

---

## Styling & Fonts

**Color palette** (dark wood theme):
- Background: `#151312`
- Surface: `#1e1c1a`
- Border: `#3a3633`
- Accent: `#5be882` (green)
- Coach blue: `#5bb8e8`
- Board light: `#ecd8b8`
- Board dark: `#ae825e`

**Fonts:**
- `Fredoka` — logo, headers, CTAs (playful, rounded)
- `Outfit` — body text, labels, coach messages (clean, readable)
- `JetBrains Mono` — move history, FEN display

**Piece rendering:** Unicode chess symbols (♔♕♖♗♘♙ / ♚♛♜♝♞♟). No image files needed for v1.

---

## Out of Scope for v1

The following are explicitly deferred:
- User accounts / auth
- Puzzle mode
- Lesson / adventure mode
- ElevenLabs voice coaching
- Parent dashboard
- React Native mobile app
- Rating system (ELO / Glicko-2)
- Caching (Redis / Upstash)
- Analytics (PostHog)

The `lib/` directory is intentionally framework-agnostic to make the eventual React Native port straightforward.

---

## Build Order

1. **Project scaffold** — `create-next-app`, Tailwind, Zustand, chess.js, `@anthropic-ai/sdk`, Framer Motion
2. **`lib/chess/`** — engine wrapper, evaluation, AI (pure TS, no React)
3. **`lib/coaching/`** — analyzer, triggers, prompts (pure TS)
4. **`stores/gameStore.ts`** — Zustand store wiring all state
5. **`components/Board.tsx`** — board rendering and click handling
6. **`components/CoachPanel.tsx`** + `MoveHistory.tsx` + `PlayerBar.tsx` + `GameStatus.tsx`
7. **`app/api/coach/route.ts`** — Claude SSE endpoint (before onboarding — coaching pipeline is critical path)
8. **`app/play/page.tsx`** — wires all components together; test coaching flow end-to-end here
9. **`components/Onboarding.tsx`** + `app/page.tsx` — onboarding is UI polish, not critical path
10. **Polish** — animations, responsive layout, remove FEN debug display
