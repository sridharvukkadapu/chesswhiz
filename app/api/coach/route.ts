import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CoachRequestSchema, CoachResponseSchema, safeFallback } from "@/lib/coaching/schema";
import type { CoachRequest, CoachResponse } from "@/lib/coaching/schema";
import { buildCoachPrompt } from "@/lib/coaching/prompts";
import { route } from "@/lib/coaching/router";

const client = new Anthropic();

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const SONNET_MODEL = "claude-sonnet-4-6";

// Tracks LLM output quality — counts only calls that received a response.
// Resets on cold start; instance-local metric, not fleet-wide.
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

  try {
    const response = await client.messages.create({
      model: modelId,
      max_tokens: 512,
      system,
      messages: [{ role: "user", content: user }],
    });
    callCount++; // count only calls that received a response

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
    const data = validated.data;
    if (data.annotation === null) data.annotation = undefined;
    if (data.followUpChips === null) data.followUpChips = undefined;
    if (data.conceptTaught === null) data.conceptTaught = undefined;
    if (data.emotion === null) data.emotion = undefined;
    if (data.replay === null) data.replay = undefined;
    return data;
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
    // response content
    message: routed.response.message,
    shouldSpeak: routed.response.shouldSpeak,
    interactionType: routed.response.interactionType,
    emotion: routed.response.emotion ?? null,
    conceptTaught: routed.response.conceptTaught ?? null,
    annotation: routed.response.annotation ?? null,
    hasReplay: (routed.response.replay?.length ?? 0) > 0,
    chipCount: routed.response.followUpChips?.length ?? 0,
    // request context
    playerName: coachReq.playerName,
    ageBand: coachReq.ageBand,
    lastMove: coachReq.lastMove?.san ?? null,
    opportunityType: coachReq.opportunityDetail?.type ?? null,
    // quality metrics
    parseFailures: parseFailureCount,
    callCount,
    failRate: callCount > 0 ? `${(parseFailureCount / callCount * 100).toFixed(1)}%` : "0%",
  });

  return NextResponse.json({
    ...routed.response,
    _meta: { engine: routed.engine, rateRemaining: remaining },
  });
}
