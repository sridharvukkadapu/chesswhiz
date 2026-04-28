import type { CoachRequest, CoachResponse } from "./schema";
import type { AgeBand } from "@/lib/learner/types";

export interface TemplatePartial {
  message: string;
  interactionType: CoachResponse["interactionType"];
  emotion: CoachResponse["emotion"];
  followUpChips?: CoachResponse["followUpChips"];
}

type TemplateKey = string; // "TRIGGER|ageBand" or "TRIGGER|pattern|ageBand"

const TEMPLATES: Record<TemplateKey, TemplatePartial[]> = {
  // GREAT_MOVE — age 5-7
  "GREAT_MOVE|5-7": [
    { message: "Wow, great move! ⭐", interactionType: "celebration", emotion: "excited" },
    { message: "You did it! Amazing! 🎉", interactionType: "celebration", emotion: "excited" },
    { message: "Super move! You're a star! 🌟", interactionType: "celebration", emotion: "happy" },
    { message: "Yes! That's the way! 🏆", interactionType: "celebration", emotion: "excited" },
    { message: "Wow wow wow! Great thinking! ⭐", interactionType: "celebration", emotion: "excited" },
  ],
  // GREAT_MOVE — age 8-10
  "GREAT_MOVE|8-10": [
    { message: "Nice! That controls key squares. 🎯", interactionType: "reinforcement", emotion: "happy" },
    { message: "Smart move — you're developing well!", interactionType: "reinforcement", emotion: "happy" },
    { message: "Excellent! That puts pressure on the bot.", interactionType: "reinforcement", emotion: "excited" },
    { message: "Great thinking! Your pieces are active now.", interactionType: "reinforcement", emotion: "happy" },
    { message: "That's a strong move! You're in control. 💪", interactionType: "reinforcement", emotion: "excited" },
  ],
  // GREAT_MOVE — age 11+
  "GREAT_MOVE|11+": [
    { message: "Excellent move — maximizes piece activity.", interactionType: "reinforcement", emotion: "happy" },
    { message: "Strong! That improves your position significantly.", interactionType: "reinforcement", emotion: "happy" },
    { message: "Nice choice — well-timed and purposeful.", interactionType: "reinforcement", emotion: "happy" },
    { message: "Good move. That's the right priority here.", interactionType: "reinforcement", emotion: "happy" },
    { message: "Precise! That's exactly what the position called for.", interactionType: "reinforcement", emotion: "excited" },
  ],

  // RECURRING_ERROR hangs_queen — per age
  "RECURRING_ERROR|hangs_queen|5-7": [
    {
      message: "Uh oh! Your queen might be in danger! 😮 Can you move her somewhere safe?",
      interactionType: "warning",
      emotion: "concerned",
      followUpChips: [{ label: "I see it!", intent: "i_see_it" }, { label: "Show me", intent: "show_me" }],
    },
  ],
  "RECURRING_ERROR|hangs_queen|8-10": [
    {
      message: "Watch your queen — she's unprotected! Remember, losing the queen usually loses the game.",
      interactionType: "warning",
      emotion: "concerned",
      followUpChips: [{ label: "Got it", intent: "got_it" }, { label: "Show me", intent: "show_me" }],
    },
  ],
  "RECURRING_ERROR|hangs_queen|11+": [
    {
      message: "Queen safety issue — she's currently unprotected. Tactical motifs often exploit this.",
      interactionType: "warning",
      emotion: "concerned",
      followUpChips: [{ label: "Got it", intent: "got_it" }, { label: "Tell me more", intent: "tell_me_more" }],
    },
  ],

  // PATTERN_RECOGNIZED fork — all ages
  "PATTERN_RECOGNIZED|fork|5-7": [
    {
      message: "Hey! One of your pieces can attack TWO of the bot's pieces at the same time! Can you find it? 🍴",
      interactionType: "question",
      emotion: "excited",
      followUpChips: [{ label: "I see it!", intent: "i_see_it" }, { label: "Show me", intent: "show_me" }],
    },
  ],
  "PATTERN_RECOGNIZED|fork|8-10": [
    {
      message: "There's a fork available! One piece can attack two at once. Can you spot it?",
      interactionType: "question",
      emotion: "excited",
      followUpChips: [{ label: "I see it!", intent: "i_see_it" }, { label: "Show me", intent: "show_me" }],
    },
  ],
  "PATTERN_RECOGNIZED|fork|11+": [
    {
      message: "Fork opportunity present. Can you find the piece and squares?",
      interactionType: "question",
      emotion: "thinking",
      followUpChips: [{ label: "Found it", intent: "i_see_it" }, { label: "Show me", intent: "show_me" }],
    },
  ],

  // PATTERN_RECOGNIZED pin — all ages
  "PATTERN_RECOGNIZED|pin|5-7": [
    {
      message: "One of the bot's pieces is stuck! It can't move without losing something important. Did you see that? 📌",
      interactionType: "question",
      emotion: "excited",
      followUpChips: [{ label: "I see it!", intent: "i_see_it" }, { label: "Tell me more", intent: "tell_me_more" }],
    },
  ],
  "PATTERN_RECOGNIZED|pin|8-10": [
    {
      message: "You've created a pin! The bot's piece can't move safely. How can you take advantage?",
      interactionType: "question",
      emotion: "excited",
      followUpChips: [{ label: "I see it!", intent: "i_see_it" }, { label: "Tell me more", intent: "tell_me_more" }],
    },
  ],
  "PATTERN_RECOGNIZED|pin|11+": [
    {
      message: "Pin established. The pinned piece is a target — how do you exploit it?",
      interactionType: "question",
      emotion: "thinking",
      followUpChips: [{ label: "I know", intent: "i_see_it" }, { label: "Tell me more", intent: "tell_me_more" }],
    },
  ],

  // BLUNDER — per age
  "BLUNDER|5-7": [
    {
      message: "Oopsie! That piece might get captured! 😮 Every champion learns from mistakes — let's keep going! 💪",
      interactionType: "warning",
      emotion: "concerned",
      followUpChips: [{ label: "Got it", intent: "got_it" }, { label: "Try again", intent: "try_again" }],
    },
  ],
  "BLUNDER|8-10": [
    {
      message: "That move leaves something unprotected! Can you see what the bot can capture next move?",
      interactionType: "warning",
      emotion: "concerned",
      followUpChips: [{ label: "I see it", intent: "i_see_it" }, { label: "Show me", intent: "show_me" }, { label: "Got it", intent: "got_it" }],
    },
  ],
  "BLUNDER|11+": [
    {
      message: "Serious material loss incoming. What does the bot play next — and how might you have prevented it?",
      interactionType: "warning",
      emotion: "concerned",
      followUpChips: [{ label: "I see it", intent: "i_see_it" }, { label: "Show me", intent: "show_me" }, { label: "Got it", intent: "got_it" }],
    },
  ],
};

// These triggers always need LLM — no template can substitute
const LLM_REQUIRED = new Set(["TACTIC_AVAILABLE", "BOT_TACTIC_INCOMING"]);

export function requiresLLM(trigger: string): boolean {
  return LLM_REQUIRED.has(trigger);
}

export function findTemplate(
  trigger: string,
  ageBand: AgeBand,
  context?: { recurringErrorPattern?: string; tacticPattern?: string }
): TemplatePartial | null {
  // Try most-specific key first
  if (context?.recurringErrorPattern) {
    const key = `${trigger}|${context.recurringErrorPattern}|${ageBand}`;
    const list = TEMPLATES[key];
    if (list?.length) return list[Math.floor(Math.random() * list.length)];
  }

  if (context?.tacticPattern) {
    const key = `${trigger}|${context.tacticPattern}|${ageBand}`;
    const list = TEMPLATES[key];
    if (list?.length) return list[Math.floor(Math.random() * list.length)];
  }

  // Generic trigger|ageBand
  const key = `${trigger}|${ageBand}`;
  const list = TEMPLATES[key];
  if (list?.length) return list[Math.floor(Math.random() * list.length)];

  return null;
}

export function templateToResponse(partial: TemplatePartial, req: CoachRequest): CoachResponse {
  return {
    shouldSpeak: true,
    message: partial.message,
    interactionType: partial.interactionType,
    emotion: partial.emotion,
    followUpChips: partial.followUpChips,
  };
}
