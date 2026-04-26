"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

function speakViaBrowser(text: string, voice: SpeechSynthesisVoice | null) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  if (voice) utter.voice = voice;
  utter.rate = 0.95;
  utter.pitch = 1.05;
  utter.volume = 1;
  window.speechSynthesis.speak(utter);
}

export function useSpeech() {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);
  const fallbackVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Increments on every speak/stop — lets us cancel an in-flight TTS fetch
  // when a newer message arrives.
  const playTokenRef = useRef(0);

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
  }, []);

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
      }
      return next;
    });
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!enabled || typeof window === "undefined") return;
    const clean = stripForSpeech(text);
    if (!clean) return;

    const myToken = ++playTokenRef.current;

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
      audio.onended = () => URL.revokeObjectURL(url);
      audio.onerror = () => URL.revokeObjectURL(url);
      if (prevSrc && prevSrc.startsWith("blob:")) URL.revokeObjectURL(prevSrc);

      await audio.play();
      return;
    } catch {
      // Fall through to browser TTS — better than silent failure on a
      // game where the kid expects to hear Coach Pawn.
    }

    if (myToken !== playTokenRef.current) return;
    if ("speechSynthesis" in window) {
      speakViaBrowser(clean, fallbackVoiceRef.current);
    }
  }, [enabled]);

  return { enabled, supported, toggle, speak, stop };
}
