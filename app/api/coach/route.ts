import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { buildCoachPrompt, FALLBACKS } from "@/lib/coaching/prompts";
import type { MoveAnalysis } from "@/lib/chess/types";

const client = new Anthropic();

const RequestSchema = z.object({
  trigger: z.enum(["GREAT_MOVE", "OK_MOVE", "INACCURACY", "MISTAKE", "BLUNDER"]),
  severity: z.number().min(0).max(4),
  san: z.string(),
  bestSAN: z.string(),
  diff: z.number(),
  piece: z.string(),
  captured: z.string().nullable(),
  isHanging: z.boolean(),
  eval: z.number(),
  moveHistory: z.array(z.string()),
  playerName: z.string(),
  age: z.number(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { moveHistory, playerName, age, ...analysisFields } = parsed.data;
  const analysis = analysisFields as MoveAnalysis;
  const { system, user } = buildCoachPrompt(analysis, moveHistory, playerName, age);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 300,
          system,
          messages: [{ role: "user", content: user }],
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const data = `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        }

        // Log every coaching response for manual audit (first 100 responses)
        console.log("[coach]", { trigger: analysis.trigger, system, user });
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        // On error, send a fallback response as a single SSE event
        const fallbacks = FALLBACKS[analysis.trigger] ?? FALLBACKS.OK_MOVE;
        const text = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
