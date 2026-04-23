"use client";

import { useState } from "react";
import type { Difficulty } from "@/lib/chess/types";

interface OnboardingProps {
  onStart: (name: string, age: number, difficulty: Difficulty) => void;
}

export default function Onboarding({ onStart }: OnboardingProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(9);
  const [difficulty, setDifficulty] = useState<Difficulty>(2);

  const AGE_OPTIONS = [
    { label: "5–7", value: 6 },
    { label: "8–10", value: 9 },
    { label: "11+", value: 12 },
  ];

  const DIFF_OPTIONS: { label: string; value: Difficulty; emoji: string }[] = [
    { label: "Easy", value: 1, emoji: "🐱" },
    { label: "Medium", value: 2, emoji: "🔥" },
    { label: "Hard", value: 3, emoji: "🦁" },
  ];

  const canStart = name.trim().length > 0;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: "radial-gradient(ellipse at 30% 20%, #1f1a14 0%, #151312 70%)" }}
    >
      <div
        className="w-full rounded-3xl p-10 text-center border"
        style={{
          background: "#1e1c1a",
          borderColor: "#3a3633",
          maxWidth: 420,
          boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        <div className="text-6xl mb-1" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>♟</div>
        <h1 className="text-4xl font-bold mb-0.5" style={{ color: "#5be882", fontFamily: "'Fredoka', sans-serif", letterSpacing: "-0.5px" }}>
          ChessWhiz
        </h1>
        <p className="text-sm mb-8" style={{ color: "#5a5550", fontFamily: "'Outfit', sans-serif" }}>
          Learn chess with your AI coach
        </p>

        {/* Name */}
        <div className="text-left mb-5">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#8a8278", fontFamily: "'Outfit', sans-serif" }}>
            Your name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 rounded-xl border text-base outline-none transition-colors"
            style={{
              background: "#282523", borderColor: "#3a3633",
              color: "#f5f0ea", fontFamily: "'Outfit', sans-serif",
            }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(91,232,130,0.5)"; }}
            onBlur={(e) => { e.target.style.borderColor = "#3a3633"; }}
          />
        </div>

        {/* Age group */}
        <div className="text-left mb-5">
          <label className="block text-xs font-semibold mb-2" style={{ color: "#8a8278", fontFamily: "'Outfit', sans-serif" }}>
            Age group
          </label>
          <div className="flex gap-2">
            {AGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAge(opt.value)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-bold cursor-pointer transition-all"
                style={{
                  background: age === opt.value ? "rgba(91,232,130,0.1)" : "#282523",
                  borderColor: age === opt.value ? "#5be882" : "#3a3633",
                  color: age === opt.value ? "#5be882" : "#8a8278",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="text-left mb-7">
          <label className="block text-xs font-semibold mb-2" style={{ color: "#8a8278", fontFamily: "'Outfit', sans-serif" }}>
            Bot difficulty
          </label>
          <div className="flex gap-2">
            {DIFF_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDifficulty(opt.value)}
                className="flex-1 py-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all"
                style={{
                  background: difficulty === opt.value ? "rgba(91,232,130,0.1)" : "#282523",
                  borderColor: difficulty === opt.value ? "#5be882" : "#3a3633",
                  color: difficulty === opt.value ? "#5be882" : "#8a8278",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                {opt.emoji} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => canStart && onStart(name.trim(), age, difficulty)}
          disabled={!canStart}
          className="w-full py-3.5 rounded-xl border-0 text-lg font-bold cursor-pointer transition-all disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: canStart ? "#5be882" : "#282523",
            color: canStart ? "#151312" : "#5a5550",
            fontFamily: "'Fredoka', sans-serif",
            letterSpacing: "0.3px",
            boxShadow: canStart ? "0 4px 20px rgba(91,232,130,0.3)" : "none",
          }}
        >
          Let's Play! ♟
        </button>
      </div>
    </div>
  );
}
