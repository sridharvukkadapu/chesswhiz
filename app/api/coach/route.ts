import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CoachRequestSchema, CoachResponseSchema, safeFallback } from "@/lib/coaching/schema";
import type { CoachRequest, CoachResponse } from "@/lib/coaching/schema";
import { buildCoachPrompt } from "@/lib/coaching/prompts";
import { route } from "@/lib/coaching/router";

const client = new Anthropic();

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const SONNET_MODEL = "claude-sonnet-4-6";

// Module-level parse failure tracking (resets on cold start — that's fine)
let parseFailureCount = 0;
let callCount = 0;

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
  callCount++;

  try {
    const response = await client.messages.create({
      model: modelId,
      max_tokens: 512,
      system,
      messages: [{ role: "user", content: user }],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    const json = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      parseFailureCount++;
      console.error(`[coach] PARSE_FAILURE engine=${model} trigger=${req.trigger} calls=${callCount} failures=${parseFailureCount} failRate=${(parseFailureCount/callCount*100).toFixed(1)}% raw=${text.slice(0, 200)}`);
      return safeFallback(req.trigger, req.playerName);
    }

    const validated = CoachResponseSchema.safeParse(parsed);
    if (!validated.success) {
      parseFailureCount++;
      console.error(`[coach] SCHEMA_FAILURE engine=${model} trigger=${req.trigger} calls=${callCount} failures=${parseFailureCount} failRate=${(parseFailureCount/callCount*100).toFixed(1)}% issues=${JSON.stringify(validated.error.issues)}`);
      return safeFallback(req.trigger, req.playerName);
    }
    return validated.data;
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
    parseFailures: parseFailureCount,
    callCount,
    failRate: callCount > 0 ? `${(parseFailureCount / callCount * 100).toFixed(1)}%` : "0%",
  });

  return NextResponse.json({
    ...routed.response,
    _meta: { engine: routed.engine, rateRemaining: remaining },
  });
}
