"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGameStore } from "@/stores/gameStore";

const STORAGE_KEY = "chesswhiz.voice";

function stripForSpeech(text: string): string {
  // Emojis/symbols don't read well; drop them. Keep punctuation for cadence.
  return text
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2700}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickFallbackVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const en = voices.filter((v) => v.lang.startsWith("en"));
  const pool = en.length > 0 ? en : voices;
  const preferred = ["Samantha", "Google US English", "Karen", "Moira", "Tessa", "Allison", "Ava"];
  for (const name of preferred) {
    const match = pool.find((v) => v.name.includes(name));
    if (match) return match;
  }
  const local = pool.find((v) => v.localService);
  return local ?? pool[0];
}

export function useSpeech() {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);
  const fallbackVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Increments on every speak/stop — lets us cancel an in-flight TTS fetch
  // when a newer message arrives.
  const playTokenRef = useRef(0);
  const recordVoiceUsage = useGameStore((s) => s.recordVoiceUsage);
  const setVoicePlayback = useGameStore((s) => s.setVoicePlayback);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Voice is "supported" if either ElevenLabs OR browser TTS is usable.
    // We check browser TTS as a baseline; ElevenLabs availability is
    // determined per-call (the API returns 503 if the key is missing).
    const hasBrowserTTS = "speechSynthesis" in window;
    setSupported(hasBrowserTTS || true); // always on — server can serve audio

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setEnabled(true);
    } catch {}

    if (hasBrowserTTS) {
      const loadVoices = () => {
        fallbackVoiceRef.current = pickFallbackVoice(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Reusable Audio element so iOS/Safari accept playback after the first
    // user gesture (the toggle button counts as that gesture).
    audioRef.current = new Audio();
    audioRef.current.preload = "auto";

    return () => {
      if (typeof window !== "undefined" && hasBrowserTTS) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const stop = useCallback(() => {
    playTokenRef.current += 1;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setVoicePlayback("idle");
  }, [setVoicePlayback]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch {}
      if (!next) {
        playTokenRef.current += 1;
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setVoicePlayback("idle");
      }
      return next;
    });
  }, [setVoicePlayback]);

  const speak = useCallback(async (text: string) => {
    if (!enabled || typeof window === "undefined") return;
    const clean = stripForSpeech(text);
    if (!clean) return;

    const myToken = ++playTokenRef.current;
    setVoicePlayback("loading");

    // Try ElevenLabs first.
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean }),
      });

      // Newer message has superseded this one — bail without playing.
      if (myToken !== playTokenRef.current) return;

      if (!res.ok) throw new Error(`voice api ${res.status}`);

      const blob = await res.blob();
      if (myToken !== playTokenRef.current) return;

      const url = URL.createObjectURL(blob);
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;

      // Free the old object URL when a new one replaces it.
      const prevSrc = audio.src;
      audio.src = url;
      // Lifecycle wiring — annotation reveal hooks onto these states.
      // onplaying fires the moment audio leaves the speaker, which is
      // what we mean by "voice is playing now"; loadeddata/canplay are
      // too eager (audio is ready but not yet audible).
      const handlePlaying = () => {
        if (myToken === playTokenRef.current) setVoicePlayback("playing");
      };
      const handleEnded = () => {
        URL.revokeObjectURL(url);
        if (myToken === playTokenRef.current) setVoicePlayback("idle");
      };
      const handleError = () => {
        URL.revokeObjectURL(url);
        if (myToken === playTokenRef.current) setVoicePlayback("idle");
      };
      audio.onplaying = handlePlaying;
      audio.onended = handleEnded;
      audio.onerror = handleError;
      if (prevSrc && prevSrc.startsWith("blob:")) URL.revokeObjectURL(prevSrc);

      await audio.play();
      // Only count usage on a successful playback path.
      recordVoiceUsage(clean.length, "tts");
      return;
    } catch {
      // Fall through to browser TTS — better than silent failure on a
      // game where the kid expects to hear Coach Pawn.
    }

    if (myToken !== playTokenRef.current) return;
    if ("speechSynthesis" in window) {
      // Browser TTS doesn't expose a reliable per-utterance "playing"
      // event across browsers, so we approximate: state goes to
      // "playing" when speak() returns, and to "idle" when the
      // utterance ends.
      const utter = new SpeechSynthesisUtterance(clean);
      if (fallbackVoiceRef.current) utter.voice = fallbackVoiceRef.current;
      utter.rate = 0.95;
      utter.pitch = 1.05;
      utter.volume = 1;
      utter.onstart = () => {
        if (myToken === playTokenRef.current) setVoicePlayback("playing");
      };
      utter.onend = () => {
        if (myToken === playTokenRef.current) setVoicePlayback("idle");
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
      recordVoiceUsage(clean.length, "fallback");
      return;
    }

    // No usable voice anywhere — clear the loading state.
    setVoicePlayback("idle");
  }, [enabled, recordVoiceUsage, setVoicePlayback]);

  // One-way enable — safe to call even if already enabled; does NOT toggle off.
  const enable = useCallback(() => {
    setEnabled((prev) => {
      if (prev) return prev;
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
      return true;
    });
  }, []);

  return { enabled, supported, enable, toggle, speak, stop };
}
