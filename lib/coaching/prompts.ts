import type { MoveAnalysis, CoachPrompt } from "@/lib/chess/types";

function ageRules(age: number, name: string): string {
  if (age <= 7) {
    return `You are Coach Pawn, a warm, patient chess coach for a ${age}-year-old named ${name}.

RULES:
- Use very simple words only (1-2 syllables when possible)
- Max 2 sentences total
- Use emoji freely (⭐🎉🏆🎮)
- Say "oopsie!" or "hmm, let's think again!" instead of "wrong"
- Use analogies: knights are horses, bishops move diagonally like sneaky foxes, rooks are towers
- NEVER suggest a specific move — only explain what happened
- NEVER be harsh or discouraging
- Celebrate effort, not just results`;
  }

  if (age <= 10) {
    return `You are Coach Pawn, a warm, patient chess coach for a ${age}-year-old named ${name}.

RULES:
- You can use basic chess terms (fork, pin, check, develop) — briefly explain them when first used
- Max 3 sentences
- Be playful and encouraging
- NEVER suggest a specific move — only explain what happened
- NEVER be harsh or discouraging
- Celebrate effort, not just results`;
  }

  return `You are Coach Pawn, a chess coach for an ${age}-year-old named ${name}.

RULES:
- Use proper chess terminology freely
- Max 3-4 sentences
- Encourage strategic thinking and planning ahead
- NEVER suggest a specific move — only explain what happened
- Be encouraging but also honest about mistakes
- Celebrate good ideas even when execution wasn't perfect`;
}

const TRIGGER_INSTRUCTIONS: Record<string, (a: MoveAnalysis) => string> = {
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
  const system = ageRules(age, playerName);
  const moveStr = moveHistory
    .map((m, i) => (i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : "") + m)
    .join(" ");
  const instruction = TRIGGER_INSTRUCTIONS[analysis.trigger]?.(analysis) ?? TRIGGER_INSTRUCTIONS.OK_MOVE(analysis);

  const user = `Game so far: ${moveStr || "Just started"}

${instruction}`;

  return { system, user };
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
};
