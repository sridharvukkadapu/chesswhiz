import { NextRequest } from "next/server";
import { z } from "zod";

// Default voice: "Rachel" (warm female narrator) — common in ElevenLabs
// onboarding examples. Override per-deployment via ELEVENLABS_VOICE_ID.
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

const RequestSchema = z.object({
  text: z.string().min(1).max(800),
  // Optional per-call overrides — useful if we ever do "Knight Twins voice"
  voiceId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Voice not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
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

  const voiceId = parsed.data.voiceId
    ?? process.env.ELEVENLABS_VOICE_ID
    ?? DEFAULT_VOICE_ID;

  const upstream = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text: parsed.data.text,
        model_id: "eleven_turbo_v2_5", // fastest, low-latency model good for live coaching
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
          style: 0.35,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    return new Response(
      JSON.stringify({ error: "TTS failed", status: upstream.status, detail: detail.slice(0, 200) }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // Stream the MP3 straight through. Cache repeated phrases (fallbacks etc.)
  // at the edge for an hour — coach messages are deterministic given text.
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
