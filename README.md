# ChessWhiz

The chess coach your kid always wanted — patient, encouraging, and powered by Claude.

Live: **https://chesswhiz.vercel.app**

ChessWhiz is a web app where kids age 5–12 play chess against an AI bot and receive real-time coaching from "Coach Pawn" — a friendly AI character that explains every move in age-appropriate language. The game is wrapped in a 7-region progression system called **The Chess Kingdom**: kids battle boss characters, earn collectible Powers, and level up from Pawn to King.

---

## Stack

- **Next.js 16** App Router (server components + selective `"use client"`)
- **chess.js** for rules + legal-move generation
- **Custom minimax + alpha-beta** for the bot AI (depth 1/2/3 = Easy/Medium/Hard)
- **Zustand** for game + progression state, persisted to `localStorage`
- **Anthropic Claude (Sonnet)** for coaching messages, streamed via SSE
- **ElevenLabs** for Coach Pawn's voice (with browser-TTS fallback)
- **Lucide** for chrome icons; custom SVG pieces for the chess set; emoji only in coach copy + kingdom region tiles
- **Plus Jakarta Sans + Cormorant Garamond + Caveat + JetBrains Mono** typography
- **Jest** + **Playwright** for tests

---

## Getting started

```bash
npm install
cp .env.example .env.local
# Add ANTHROPIC_API_KEY (required) and ELEVENLABS_API_KEY (optional, falls back to browser TTS)
npm run dev
```

Open <http://localhost:3000>.

### Scripts

| Command | What |
|---|---|
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Jest unit tests (~110 tests across 11 suites) |
| `npm run test:watch` | Jest watch mode |
| `npm run e2e` | Playwright smoke tests (Chromium + iPhone 15) |
| `npm run e2e:ui` | Playwright with the inspector UI |

---

## Architecture

### App routes

| Route | Purpose |
|---|---|
| `/` | Landing page — marketing + journey preview |
| `/onboard` | 3-field intake (name / age tier / difficulty) + quest preview |
| `/play` | The game. Board on the left, Coach Pawn + move history on the right |
| `/kingdom` | World map of all 7 regions with player flag + locked badges |
| `/kingdom/[id]` | Per-region detail (boss bio + dialogue + strategies) |
| `/card` | Shareable Knight Card with rank, stats, bosses defeated, powers |
| `/parent` | PIN-gated dashboard with progress + tier toggle + sound/voice settings |
| `/journey` | Public journey overview (linked from landing) |
| `/how-it-works` | The 5-step learning loop |
| `/privacy`, `/terms` | Legal |
| `/api/coach` | Claude SSE streaming endpoint for coaching |
| `/api/voice` | ElevenLabs TTS proxy (keeps the API key server-side) |

### Key directories

- `lib/chess/` — engine wrapper, evaluation, AI search, move sound classification
- `lib/coaching/` — analyzer, triggers, prompts (with `enforceLength` post-processor), tactics detector, annotations generator
- `lib/progression/` — kingdom/rank/power data, mission system, tier gating
- `lib/design/` — design tokens (colors, fonts, elevation, breakpoints), atmosphere primitives (StarField, MoteField, GoldFoilText, shared rAF clock)
- `lib/audio/` — synthesized SFX cues + haptics wrapper
- `components/` — UI components (Board, ChessPieces, CoachPawn character, Knight Card, Voice Wave, Bottom Nav, etc.)
- `stores/gameStore.ts` — Zustand store: chess state, coach messages, progression, voice playback state, board annotations, voice usage meter
- `e2e/` — Playwright smoke tests

### State flow during a move

1. User taps a square → `handleSquareClick` → `executeMove`
2. `executeMove` calls `chess.move()`, classifies the cue via `classifyMoveSound`, fires SFX + haptic
3. `analyzeMoveQuality` runs (chess.js + minimax compares user's move to bot's best)
4. `shouldCoach` decides whether to call `/api/coach`
5. Coach response streams to the panel, ElevenLabs voice plays via `useSpeech`
6. `generateAnnotation` produces visual arrows/circles
7. Annotation is held in a "pending" ref until `audio.onplaying` fires — board overlay + voice land in sync
8. Bot moves on a `setTimeout`, fires its own cue, repeats

### Tactic detection → Aha! moment

When the player executes a fork/pin/skewer/back-rank-mate, `lib/coaching/tactics.ts` populates the squares involved and `handleTacticDetected` checks the active mission. If it matches, `AhaCelebration` opens with confetti + crystal + spinning rays + Coach Pawn cheer expression, the matching Power is added to `progression.earnedPowers`, and the mission is marked complete.

### Free vs Champion gating

Free tier: only **Pawn Village** is playable. Every other kingdom shows a gold "🔒 Champion" pill on the map. Direct URL hits to a locked `/kingdom/[id]` bounce to `/kingdom?upgrade=<id>` which opens the upgrade modal (and clears the query so back-button doesn't loop). The `PostGameScreen` swaps its "current quest" card for an upgrade pitch once the kid has mastered ≥3 Pawn Village strategies.

The tier toggle lives on `/parent` for testing — replace with Stripe Checkout in v2.

### Voice + haptics

- ElevenLabs Turbo v2.5 model for low-latency speech (~250ms first byte)
- Browser `speechSynthesis` fallback if the API errors so kids never get silence
- 14 synthesized SFX cues via Web Audio API: move, capture, check, castle, promotion, win, lose, draw, coach, aha, click, unlock, error, xp
- Haptics where supported (Android Chrome): tap / capture / check / aha
- All toggleable from `/parent` → Sound & feel

---

## Design system

The redesign matches the **"Reimagined" jewel-tone** spec from the Anthropic Design handoff (deep obsidian/midnight/velvet backgrounds + amber/emerald/sapphire/ruby/amethyst accents).

Tokens live in [`lib/design/tokens.ts`](./lib/design/tokens.ts):
- 5-step elevation scale (`e0..e5`)
- Type scale (`textXs..textHero`)
- 4pt spacing scale (`space1..space16`)
- Standard breakpoints (`bpSm..bp2xl`)
- Per-kingdom accent colors

A single shared `useTime()` rAF clock in [`lib/design/atmosphere.tsx`](./lib/design/atmosphere.tsx) drives every animated layer and pauses automatically when the tab is backgrounded or `prefers-reduced-motion` is set.

---

## Testing

- **Jest** unit tests cover pure logic: tactic detection, move analysis, prompts, triggers, AI search, evaluation, length enforcement, tier gating, annotation generation, move-sound classification. ~110 tests across 11 suites; run `npm test`.
- **Playwright** smoke tests cover the critical user paths: landing renders, onboard flow, /play boots, /kingdom modals + back-loop, SEO infrastructure. ~21 specs × 2 projects (Desktop Chrome + iPhone 15); run `npm run e2e`.

---

## Deploy

Vercel auto-deploys `master` to <https://chesswhiz.vercel.app>. Required env vars in Vercel:

- `ANTHROPIC_API_KEY` (production + preview)
- `ELEVENLABS_API_KEY` (production + preview, optional)
- `ELEVENLABS_VOICE_ID` (optional override; default is the custom Coach Pawn voice)

Marketing pages have `Cache-Control: s-maxage=60, stale-while-revalidate=30` so deploys propagate within ~1 min. The landing page exposes `<meta name="chesswhiz-version">` with the commit SHA so you can verify which deploy is live via view-source.

---

## License

Not yet open-sourced. Reach out at <hello@chesswhiz.com>.
