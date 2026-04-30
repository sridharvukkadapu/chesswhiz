import { z } from "zod";
import type { AgeBand } from "@/lib/learner/types";

export const AnnotationTypeSchema = z.enum([
  "fork_rays",
  "pin_line",
  "skewer_line",
  "discovered_attack",
  "hanging_piece",
  "defended_chain",
  "attack_arrow",
  "danger_square",
  "highlight_square",
  "none",
]);

export type AnnotationType = z.infer<typeof AnnotationTypeSchema>;

export const AnnotationSchema = z.object({
  type: AnnotationTypeSchema,
  squares: z.array(z.string().regex(/^[a-h][1-8]$/)).max(6).optional(),
  secondarySquares: z.array(z.string().regex(/^[a-h][1-8]$/)).max(6).optional(),
  label: z.string().max(20).optional(),
});

export type Annotation = z.infer<typeof AnnotationSchema>;

export const InteractionTypeSchema = z.enum([
  "statement",
  "question",
  "celebration",
  "warning",
  "reinforcement",
]);

export type InteractionType = z.infer<typeof InteractionTypeSchema>;

export const FollowUpChipIntentSchema = z.enum([
  "i_see_it",
  "show_me",
  "what_if",
  "tell_me_more",
  "got_it",
  "try_again",
]);

export type FollowUpChipIntent = z.infer<typeof FollowUpChipIntentSchema>;

export const FollowUpChipSchema = z.object({
  label: z.string().max(40),
  intent: FollowUpChipIntentSchema,
});

export type FollowUpChip = z.infer<typeof FollowUpChipSchema>;

export const ReplayStepSchema = z.object({
  fen: z.string(),
  narration: z.string().max(150),
  annotation: AnnotationSchema.optional(),
  moveLabel: z.string().optional(),  // e.g. "3. Nxe5"
});
export type ReplayStep = z.infer<typeof ReplayStepSchema>;

export const CoachResponseSchema = z.object({
  shouldSpeak: z.boolean(),
  message: z.string().max(280),
  annotation: AnnotationSchema.optional(),
  interactionType: InteractionTypeSchema,
  followUpChips: z.array(FollowUpChipSchema).max(3).optional(),
  conceptTaught: z.string().optional(),
  emotion: z.enum(["happy", "thinking", "concerned", "excited", "neutral"]).optional(),
  replay: z.array(ReplayStepSchema).max(3).optional(),
});
export type CoachResponse = z.infer<typeof CoachResponseSchema>;

export const CoachRequestSchema = z.object({
  fen: z.string(),
  lastMove: z.object({ from: z.string(), to: z.string(), san: z.string() }).optional(),
  mover: z.enum(["player", "bot"]),
  trigger: z.enum([
    "GREAT_MOVE",
    "OK_MOVE",
    "INACCURACY",
    "MISTAKE",
    "BLUNDER",
    "TACTIC_AVAILABLE",
    "PATTERN_RECOGNIZED",
    "RECURRING_ERROR",
    "BOT_TACTIC_INCOMING",
  ]),
  centipawnDelta: z.number().optional(),
  tacticsAvailableForKid: z.array(z.string()).optional(),
  tacticsAvailableForBot: z.array(z.string()).optional(),
  playerName: z.string(),
  ageBand: z.enum(["5-7", "8-10", "11+"]),
  learnerSummary: z.object({
    mastered: z.array(z.string()),
    inProgress: z.array(z.string()),
    needsWork: z.array(z.string()),
    recurringErrors: z.array(z.object({ patternId: z.string(), count: z.number() })),
    recentMessages: z.array(z.string()),
  }).optional(),
  activeMissionConcept: z.string().optional(),
  opportunityDetail: z.object({
    type: z.enum(["hanging_piece", "fork", "pin", "mate_in_1", "bot_threat"]),
    details: z.string(),
    squares: z.array(z.string()).optional(),
  }).optional(),
});

export type CoachRequest = z.infer<typeof CoachRequestSchema>;

export function ageToBand(age: number): AgeBand {
  if (age <= 7) return "5-7";
  if (age <= 10) return "8-10";
  return "11+";
}

export function safeFallback(trigger: string, playerName: string): CoachResponse {
  const messages: Record<string, string> = {
    GREAT_MOVE: `Nice move, ${playerName}! Keep it up! ⭐`,
    OK_MOVE: "Solid move! Keep going.",
    INACCURACY: "Hmm, there might have been something stronger. Keep exploring!",
    MISTAKE: "Watch your pieces! Make sure they're all safe before moving. 💪",
    BLUNDER: "Oops! Always check — is my piece safe after I move? Let's keep going! 🎮",
    TACTIC_AVAILABLE: "See if you can spot a tactical opportunity here!",
    PATTERN_RECOGNIZED: "Interesting position! Look for patterns.",
    RECURRING_ERROR: "Watch out for that pattern — you've seen it before!",
    BOT_TACTIC_INCOMING: "The bot might be setting something up. Stay alert!",
  };
  return {
    shouldSpeak: true,
    message: messages[trigger] ?? "Keep playing!",
    interactionType: "statement",
    emotion: "neutral",
  };
}
