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

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const en = voices.filter((v) => v.lang.startsWith("en"));
  const pool = en.length > 0 ? en : voices;

  // Prefer warm/friendly voices commonly available across OSes.
  const preferred = ["Samantha", "Google US English", "Karen", "Moira", "Tessa", "Allison", "Ava"];
  for (const name of preferred) {
    const match = pool.find((v) => v.name.includes(name));
    if (match) return match;
  }
  // Fall back to a local (non-network) voice if possible.
  const local = pool.find((v) => v.localService);
  return local ?? pool[0];
}

export function useSpeech() {
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Init: check support, load stored preference, listen for voice list.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setEnabled(true);
    } catch {}

    const loadVoices = () => {
      voiceRef.current = pickVoice(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(STORAGE_KEY, next ? "1" : "0"); } catch {}
      if (!next && typeof window !== "undefined") window.speechSynthesis.cancel();
      return next;
    });
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported || !enabled || typeof window === "undefined") return;
    const clean = stripForSpeech(text);
    if (!clean) return;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    if (voiceRef.current) utter.voice = voiceRef.current;
    utter.rate = 0.95;
    utter.pitch = 1.05;
    utter.volume = 1;
    window.speechSynthesis.speak(utter);
  }, [enabled, supported]);

  const stop = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
  }, []);

  return { enabled, supported, toggle, speak, stop };
}
