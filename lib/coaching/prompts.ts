import type { CoachRequest } from "./schema";
import type { TriggerType } from "@/lib/chess/types";
import type { AgeBand } from "@/lib/learner/types";

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
  const learnerCtx = buildLearnerContext(req);
  const system = `${SYSTEM_PROMPT}\n\nAge band: ${req.ageBand}\nPlayer name: ${req.playerName}${learnerCtx}`;

  const triggerDesc: Record<string, string> = {
    GREAT_MOVE: "Player made an excellent move.",
    OK_MOVE: "Player made a solid but unremarkable move.",
    INACCURACY: `Player's move was slightly inaccurate (${req.centipawnDelta ?? 0}cp loss).`,
    MISTAKE: `Player made a mistake (${req.centipawnDelta ?? 0}cp loss).`,
    BLUNDER: `Player made a serious blunder (${req.centipawnDelta ?? 0}cp loss).`,
    TACTIC_AVAILABLE: `A tactic is available for the player: ${(req.tacticsAvailableForKid ?? []).join(", ")}.`,
    PATTERN_RECOGNIZED: "A recognizable pattern is present on the board.",
    RECURRING_ERROR: `Player repeated a recurring error: ${(req.learnerSummary?.recurringErrors[0]?.patternId ?? "unknown")}.`,
    BOT_TACTIC_INCOMING: `The bot just set up a tactic: ${(req.tacticsAvailableForBot ?? []).join(", ")}.`,
  };

  const user = `Position FEN: ${req.fen}
Last move: ${req.lastMove ? `${req.lastMove.san} (${req.lastMove.from}→${req.lastMove.to})` : "none"}
Mover: ${req.mover}
Situation: ${triggerDesc[req.trigger] ?? req.trigger}${req.activeMissionConcept ? `\nActive mission concept: ${req.activeMissionConcept}` : ""}

Respond with valid JSON only. No markdown, no prose outside the JSON.`;

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
