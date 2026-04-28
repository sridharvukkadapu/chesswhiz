import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateProfile } from "@/lib/db/profile";
import { loadMemoryFromDB, saveMemoryToDB } from "@/lib/db/memory";
import type { LearnerModel } from "@/lib/learner/types";

const SyncRequestSchema = z.object({
  deviceId: z.string().min(1),
  playerName: z.string().optional(),
  ageBand: z.enum(["5-7", "8-10", "11+"]).optional(),
  model: z.record(z.string(), z.unknown()),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = SyncRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { deviceId, playerName, ageBand, model } = parsed.data;

  try {
    const profile = await getOrCreateProfile(deviceId, playerName, ageBand);
    await saveMemoryToDB(profile.id, model as unknown as LearnerModel);
    const latest = await loadMemoryFromDB(profile.id);
    return NextResponse.json({ ok: true, profileId: profile.id, model: latest });
  } catch (err) {
    console.error("[memory/sync]", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) return NextResponse.json({ error: "deviceId required" }, { status: 400 });

  try {
    const profile = await getOrCreateProfile(deviceId);
    const model = await loadMemoryFromDB(profile.id);
    return NextResponse.json({ profileId: profile.id, model });
  } catch (err) {
    console.error("[memory/sync GET]", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
