import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getOrCreateProfile } from "@/lib/db/profile";
import { loadMemoryFromDB, saveMemoryToDB } from "@/lib/db/memory";
import type { LearnerModel } from "@/lib/learner/types";
import { summarizeForPrompt } from "@/lib/learner/model";

const client = new Anthropic();
const HAIKU_MODEL = "claude-haiku-4-5-20251001";

const SessionRequestSchema = z.object({
  deviceId: z.string(),
  playerName: z.string(),
  ageBand: z.enum(["5-7", "8-10", "11+"]),
  phase: z.enum(["game_start", "game_end"]),
  gameResult: z.enum(["win", "loss", "draw"]).optional(),
  moveCount: z.number().optional(),
  tacticsSpotted: z.number().optional(),
  model: z.record(z.string(), z.unknown()).optional(),
});

async function buildGameStartCallback(
  playerName: string,
  ageBand: string,
  memory: LearnerModel | null
): Promise<string> {
  if (!memory || memory.stats.gamesPlayed === 0) {
    return `Hi! I'm Coach Pawn — welcome to the Chess Kingdom, ${playerName}! Let's play your first game. 🏰`;
  }

  const summary = summarizeForPrompt(memory);
  const lastMsg = memory.recentCoachMessages[memory.recentCoachMessages.length - 1];
  const gamesPlayed = memory.stats.gamesPlayed;
  const tacticsSpotted = memory.stats.tacticsSpotted;

  const prompt = `You are Coach Pawn, a warm slightly-playful chess coach for kids.
You're welcoming ${playerName} (age band ${ageBand}) back for another game.
They have played ${gamesPlayed} game${gamesPlayed === 1 ? "" : "s"} and spotted ${tacticsSpotted} tactic${tacticsSpotted === 1 ? "" : "s"}.
Mastered concepts: ${summary.mastered.join(", ") || "none yet"}.
In progress: ${summary.inProgress.join(", ") || "none"}.
Your last coaching message to them was: "${lastMsg ?? "none"}".

Write ONE short welcome-back line (max 120 chars). Reference something specific from their history.
Use "we" not "you". Start with "Ah!" or "Hey!" or "Welcome back!". End with something forward-looking.
No JSON. Plain text only.`;

  try {
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
    return text || `Welcome back, ${playerName}! Let's keep building those skills! ♟`;
  } catch {
    return `Welcome back, ${playerName}! Let's see what we find today! ♟`;
  }
}

async function buildGameEndSummary(
  playerName: string,
  ageBand: string,
  gameResult: "win" | "loss" | "draw",
  moveCount: number,
  tacticsSpotted: number,
  memory: LearnerModel
): Promise<{ narrative: string; memoryEntry: string }> {
  const summary = summarizeForPrompt(memory);

  const prompt = `You are Coach Pawn, a warm slightly-playful chess coach for kids.
Game just ended. Player: ${playerName} (age band ${ageBand}).
Result: ${gameResult}. Moves played: ${moveCount}. Tactics spotted this game: ${tacticsSpotted}.
Mastered: ${summary.mastered.join(", ") || "none"}. In progress: ${summary.inProgress.join(", ") || "none"}.

Respond with a JSON object with exactly two fields:
- "narrative": A 1-2 sentence post-game message. Warm, specific, forward-looking. Max 150 chars.
- "memoryEntry": A single sentence (max 80 chars) to store as the session memory for next time's callback.

Example: {"narrative": "Ah, great game! We defended well under pressure — let's try to spot a fork next time.", "memoryEntry": "Defended well under pressure in game 12; working on forks."}`;

  try {
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "{}";
    const json = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(json);
    return {
      narrative: parsed.narrative ?? `Great game, ${playerName}!`,
      memoryEntry: parsed.memoryEntry ?? `Completed game ${memory.stats.gamesPlayed}.`,
    };
  } catch {
    return {
      narrative: `Great effort, ${playerName}! Each game makes us stronger. ♟`,
      memoryEntry: `Completed game ${memory.stats.gamesPlayed}.`,
    };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = SessionRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { deviceId, playerName, ageBand, phase, gameResult, moveCount, tacticsSpotted, model } = parsed.data;

  try {
    const profile = await getOrCreateProfile(deviceId, playerName, ageBand);
    const memory = await loadMemoryFromDB(profile.id);

    if (phase === "game_start") {
      const message = await buildGameStartCallback(playerName, ageBand, memory);
      return NextResponse.json({ message });
    }

    // game_end
    const currentModel = (model as LearnerModel | undefined) ?? memory;
    if (!currentModel) return NextResponse.json({ narrative: `Great game, ${playerName}!`, memoryEntry: "" });

    const { narrative, memoryEntry } = await buildGameEndSummary(
      playerName,
      ageBand,
      gameResult ?? "draw",
      moveCount ?? 0,
      tacticsSpotted ?? 0,
      currentModel
    );

    const updatedModel: LearnerModel = {
      ...currentModel,
      recentCoachMessages: [...(currentModel.recentCoachMessages ?? []), memoryEntry].slice(-2),
    };
    await saveMemoryToDB(profile.id, updatedModel);

    return NextResponse.json({ narrative, memoryEntry });
  } catch (err) {
    console.error("[coach/session]", err);
    return NextResponse.json({ error: "Session error" }, { status: 500 });
  }
}
