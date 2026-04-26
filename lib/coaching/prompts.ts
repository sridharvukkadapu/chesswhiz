import type { MoveAnalysis, CoachPrompt, TriggerType } from "@/lib/chess/types";

function ageRules(age: number, name: string): string {
  if (age <= 7) {
    return `You are Coach Pawn, a warm, patient chess coach for a ${age}-year-old named ${name}.

RULES:
- Use very simple words only (1-2 syllables when possible)
- Use emoji freely (⭐🎉🏆🎮)
- Say "oopsie!" or "hmm, let's think again!" instead of "wrong"
- Use analogies ONLY for blunders: knights are horses, bishops are sneaky foxes, rooks are towers
- NEVER suggest a specific move — only explain what happened
- NEVER be harsh or discouraging
- Celebrate effort, not just results`;
  }

  if (age <= 10) {
    return `You are Coach Pawn, a warm, patient chess coach for a ${age}-year-old named ${name}.

RULES:
- You can use basic chess terms (fork, pin, check, develop) — briefly explain them when first used
- Be playful and encouraging
- NEVER suggest a specific move — only explain what happened
- NEVER be harsh or discouraging
- Celebrate effort, not just results`;
  }

  return `You are Coach Pawn, a chess coach for an ${age}-year-old named ${name}.

RULES:
- Use proper chess terminology freely
- Encourage strategic thinking and planning ahead
- NEVER suggest a specific move — only explain what happened
- Be encouraging but also honest about mistakes
- Celebrate good ideas even when execution wasn't perfect`;
}

// Length rules per trigger — match message size to moment importance.
// Routine moves get a short cheer; blunders get a real explanation.
const LENGTH_RULES: Record<TriggerType, string> = {
  GREAT_MOVE:
    `CRITICAL: ONE short sentence, under 12 words. No analogies. Just a quick cheer + what was good. Example: "Nice! d4 grabs the center. 🎯"`,
  OK_MOVE:
    `CRITICAL: ONE short sentence, under 10 words. Don't explain anything. Just acknowledge. Example: "Solid move! Keep going."`,
  INACCURACY:
    `Two sentences max, under 30 words total. Name what was played, hint that something stronger existed, say why in one clause. No analogies unless the kid is age 5–7.`,
  MISTAKE:
    `Two to three sentences, under 40 words. Explain what went wrong simply. Mention a better option exists (do NOT name a specific move). End with encouragement. ONE teaching point only.`,
  BLUNDER:
    `Three sentences max, under 50 words. This is where you can use an analogy if it helps. Explain the mistake, point at a better option (without naming a specific move), and encourage. Be warm.`,
};

const TRIGGER_INSTRUCTIONS: Record<TriggerType, (a: MoveAnalysis) => string> = {
  GREAT_MOVE: (a) => `${a.san} is an excellent move! It was one of the best options available. Praise the player and briefly explain what makes this move strong.`,
  OK_MOVE: (a) => `${a.san} is a decent move. Give a brief positive comment and keep the energy up.`,
  INACCURACY: (a) => `The player played ${a.san}, but ${a.bestSAN} was a bit stronger (${a.diff} centipawn difference). Gently point out that there was a better option without being discouraging.`,
  MISTAKE: (a) => `The player played ${a.san}, but ${a.bestSAN} was significantly better (${a.diff} centipawn difference).${a.isHanging ? " The piece they moved is now unprotected!" : ""} Explain kindly what went wrong and encourage them to look for piece safety.`,
  BLUNDER: (a) => `The player played ${a.san}, which is a serious mistake — ${a.bestSAN} was much better (${a.diff} centipawn difference).${a.isHanging ? " They left their piece unprotected!" : ""} Help them understand the mistake with patience and encouragement. Remind them every champion learns from mistakes.`,
};

export function buildCoachPrompt(
  analysis: MoveAnalysis,
  moveHistory: string[],
  playerName: string,
  age: number
): CoachPrompt {
  const lengthRule = LENGTH_RULES[analysis.trigger] ?? LENGTH_RULES.OK_MOVE;
  const system = `${lengthRule}\n\n${ageRules(age, playerName)}`;

  const moveStr = moveHistory
    .map((m, i) => (i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : "") + m)
    .join(" ");
  const instruction = TRIGGER_INSTRUCTIONS[analysis.trigger]?.(analysis) ?? TRIGGER_INSTRUCTIONS.OK_MOVE(analysis);

  const user = `Game so far: ${moveStr || "Just started"}

${instruction}`;

  return { system, user };
}

// Hard ceiling enforced server-side after Claude responds. The prompt
// asks for short responses, but Claude occasionally over-shoots; this
// makes the ceiling a guarantee, not a hope.
const MAX_WORDS: Record<TriggerType, number> = {
  GREAT_MOVE: 15,
  OK_MOVE: 12,
  INACCURACY: 35,
  MISTAKE: 45,
  BLUNDER: 55,
};

export function enforceLength(text: string, trigger: TriggerType): string {
  const limit = MAX_WORDS[trigger] ?? 30;
  const words = text.trim().split(/\s+/);
  if (words.length <= limit) return text.trim();

  const truncated = words.slice(0, limit).join(" ");
  // End at the last complete sentence in the truncated window so the
  // message doesn't cut mid-thought. Only do that if the sentence break
  // is past the halfway point — otherwise we'd lose too much content.
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

export const FALLBACKS: Record<TriggerType, string[]> = {
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
};
