import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CoachRequestSchema, CoachResponseSchema, safeFallback } from "@/lib/coaching/schema";
import type { CoachRequest, CoachResponse } from "@/lib/coaching/schema";
import { buildCoachPrompt } from "@/lib/coaching/prompts";
import { route } from "@/lib/coaching/router";

const client = new Anthropic();

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const SONNET_MODEL = "claude-sonnet-4-6";

// In-memory rate limiter: 60 requests per IP per hour.
const rateLimitMap = new Map<string, { count: number; hour: number }>();
const RATE_LIMIT = 60;

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): { limited: boolean; remaining: number } {
  const hour = Math.floor(Date.now() / 3_600_000);
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.hour !== hour) {
    rateLimitMap.set(ip, { count: 1, hour });
    return { limited: false, remaining: RATE_LIMIT - 1 };
  }
  entry.count += 1;
  return { limited: entry.count > RATE_LIMIT, remaining: Math.max(0, RATE_LIMIT - entry.count) };
}

async function callLLM(req: CoachRequest, model: "haiku" | "sonnet"): Promise<CoachResponse> {
  const { system, user } = buildCoachPrompt(req);
  const modelId = model === "haiku" ? HAIKU_MODEL : SONNET_MODEL;

  try {
    const response = await client.messages.create({
      model: modelId,
      max_tokens: 512,
      system,
      messages: [{ role: "user", content: user }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    // Strip markdown code fences if present
    const json = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
    const parsed = JSON.parse(json);
    const validated = CoachResponseSchema.safeParse(parsed);
    if (validated.success) return validated.data;
    console.warn("[coach] schema validation failed:", validated.error.issues);
    return safeFallback(req.trigger, req.playerName);
  } catch (err) {
    console.error("[coach] LLM error:", err);
    return safeFallback(req.trigger, req.playerName);
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { limited, remaining } = checkRateLimit(ip);

  if (limited) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = CoachRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const coachReq = parsed.data;

  const routed = await route(coachReq, callLLM);

  console.log("[coach]", {
    trigger: coachReq.trigger,
    engine: routed.engine,
    latencyMs: routed.latencyMs,
    shouldSpeak: routed.response.shouldSpeak,
  });

  return NextResponse.json({
    ...routed.response,
    _meta: { engine: routed.engine, rateRemaining: remaining },
  });
}
