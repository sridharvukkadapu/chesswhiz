import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { buildCoachPrompt, FALLBACKS, enforceLength } from "@/lib/coaching/prompts";
import type { MoveAnalysis } from "@/lib/chess/types";

const client = new Anthropic();

// In-memory rate limiter: 60 requests per IP per hour.
// Resets on the hour boundary, not rolling — simple and cheap.
const rateLimitMap = new Map<string, { count: number; hour: number }>();
const RATE_LIMIT = 60;

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const hour = Math.floor(Date.now() / 3_600_000);
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.hour !== hour) {
    rateLimitMap.set(ip, { count: 1, hour });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

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
  moveCount: z.number().optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "3600" },
    });
  }

  const body = await req.json().catch(() => null);
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { moveHistory, playerName, age, moveCount, ...analysisFields } = parsed.data;
  const analysis = analysisFields as MoveAnalysis;
  const { system, user } = buildCoachPrompt(analysis, moveHistory, playerName, age, moveCount);

  const encoder = new TextEncoder();

  // Token budget per trigger. Sized for the prompt's word ceiling +
  // 60% breathing room so Claude can finish its last sentence cleanly
  // — running out of tokens mid-clause is what causes "...for" cutoffs.
  const MAX_TOKENS_BY_TRIGGER: Record<string, number> = {
    GREAT_MOVE: 70,    // 12 words → ~70 tokens with headroom
    OK_MOVE: 55,       // 10 words → ~55 tokens
    INACCURACY: 130,   // 30 words → ~130 tokens
    MISTAKE: 170,      // 40 words → ~170 tokens
    BLUNDER: 220,      // 50 words → ~220 tokens
  };
  const maxTokens = MAX_TOKENS_BY_TRIGGER[analysis.trigger] ?? 130;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: user }],
        });

        // Buffer the full text so we can emit a corrected final chunk
        // if the streamed total exceeds the hard word ceiling. Most
        // messages stream entirely below the cap and this is a no-op.
        let buffered = "";
        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            buffered += chunk.delta.text;
            const data = `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        }

        // Hard length guard. If trimmed != streamed, send a "replace"
        // event so the client can rewrite the bubble cleanly.
        const trimmed = enforceLength(buffered, analysis.trigger);
        if (trimmed !== buffered.trim()) {
          const data = `data: ${JSON.stringify({ replace: trimmed })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // Log every coaching response for manual audit (first 100 responses)
        console.log("[coach]", {
          trigger: analysis.trigger,
          words: buffered.trim().split(/\s+/).length,
          trimmed: trimmed !== buffered.trim(),
        });
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
