import type { CoachRequest, CoachResponse } from "./schema";
import { getCached, setCached } from "./cache";
import { findTemplate, requiresLLM, templateToResponse } from "./templates";
import type { AgeBand } from "@/lib/learner/types";

export type Engine = "cache" | "template" | "haiku" | "sonnet";

export interface RoutedResponse {
  response: CoachResponse;
  engine: Engine;
  latencyMs: number;
}

const SONNET_TRIGGERS = new Set([
  "TACTIC_AVAILABLE",
  "BLUNDER",
  "RECURRING_ERROR",
  "BOT_TACTIC_INCOMING",
]);

export function pickEngine(req: CoachRequest, hadTemplate: boolean): "haiku" | "sonnet" {
  // TODO: revert — testing Sonnet-only
  return "sonnet";
}

export async function route(
  req: CoachRequest,
  callLLM: (req: CoachRequest, model: "haiku" | "sonnet") => Promise<CoachResponse>
): Promise<RoutedResponse> {
  const start = Date.now();

  // 1. Cache check — temporarily disabled for testing
  // const cached = getCached(req);
  // if (cached) {
  //   return { response: cached, engine: "cache", latencyMs: Date.now() - start };
  // }

  // 2. Template (skip for LLM-required triggers)
  if (!requiresLLM(req.trigger)) {
    const errorPattern = req.learnerSummary?.recurringErrors[0]?.patternId;
    const tacticPattern = req.tacticsAvailableForKid?.[0];
    const partial = findTemplate(req.trigger, req.ageBand as AgeBand, {
      recurringErrorPattern: errorPattern,
      tacticPattern,
    });
    if (partial) {
      const response = templateToResponse(partial, req);
      setCached(req, response);
      return { response, engine: "template", latencyMs: Date.now() - start };
    }
  }

  // 3. LLM
  const model = pickEngine(req, false);
  const response = await callLLM(req, model);
  setCached(req, response);
  return { response, engine: model, latencyMs: Date.now() - start };
}
