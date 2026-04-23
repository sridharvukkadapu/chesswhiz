"use client";

import { useState } from "react";
import type { Difficulty } from "@/lib/chess/types";

interface OnboardingProps {
  onStart: (name: string, age: number, difficulty: Difficulty) => void;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

const DIFF_OPTIONS: { label: string; value: Difficulty; stars: number; desc: string }[] = [
  { label: "Easy", value: 1, stars: 1, desc: "Great for beginners" },
  { label: "Medium", value: 2, stars: 2, desc: "A solid challenge" },
  { label: "Hard", value: 3, stars: 3, desc: "Think carefully!" },
];

export default function Onboarding({ onStart }: OnboardingProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(9);
  const [difficulty, setDifficulty] = useState<Difficulty>(2);

  const AGE_OPTIONS = [
    { label: "5–7", value: 6 },
    { label: "8–10", value: 9 },
    { label: "11+", value: 12 },
  ];

  const canStart = name.trim().length > 0;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5"
      style={{ background: "radial-gradient(ellipse at 30% 20%, #0f2744 0%, #0F172A 70%)" }}
    >
      <div
        className="card-enter w-full rounded-3xl p-8 text-center border"
        style={{
          background: "#192134",
          borderColor: "rgba(255,255,255,0.08)",
          maxWidth: 420,
          boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        <div className="text-6xl mb-1" style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))", lineHeight: 1 }}>♟</div>
        <h1 className="text-4xl font-bold mb-0.5 mt-2" style={{ color: "#15803D", fontFamily: "var(--font-baloo), sans-serif", letterSpacing: "-0.5px" }}>
          ChessWhiz
        </h1>
        <p className="text-sm mb-8" style={{ color: "#64748B", fontFamily: "var(--font-nunito), sans-serif" }}>
          Learn chess with your AI coach
        </p>

        {/* Name */}
        <div className="text-left mb-5">
          <label
            htmlFor="player-name"
            className="block text-xs font-semibold mb-1.5"
            style={{ color: "#94A3B8", fontFamily: "var(--font-nunito), sans-serif" }}
          >
            Your name
          </label>
          <input
            id="player-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            autoComplete="given-name"
            className="w-full px-4 rounded-xl border text-base outline-none"
            style={{
              background: "#0F1F2B", borderColor: "rgba(255,255,255,0.08)",
              color: "#f5f0ea", fontFamily: "var(--font-nunito), sans-serif",
              height: "48px",
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(21,128,61,0.5)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
          />
        </div>

        {/* Age group */}
        <div className="text-left mb-5">
          <span className="block text-xs font-semibold mb-2" style={{ color: "#94A3B8", fontFamily: "var(--font-nunito), sans-serif" }}>
            Age group
          </span>
          <div className="flex gap-2" role="group" aria-label="Age group">
            {AGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAge(opt.value)}
                aria-pressed={age === opt.value}
                className="btn-press flex-1 rounded-xl border text-sm font-bold cursor-pointer"
                style={{
                  background: age === opt.value ? "rgba(21,128,61,0.15)" : "#0F1F2B",
                  borderColor: age === opt.value ? "#15803D" : "rgba(255,255,255,0.08)",
                  color: age === opt.value ? "#22C55E" : "#94A3B8",
                  fontFamily: "var(--font-nunito), sans-serif",
                  height: "44px",
                  transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="text-left mb-7">
          <span className="block text-xs font-semibold mb-2" style={{ color: "#94A3B8", fontFamily: "var(--font-nunito), sans-serif" }}>
            Bot difficulty
          </span>
          <div className="flex gap-2" role="group" aria-label="Bot difficulty">
            {DIFF_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDifficulty(opt.value)}
                aria-pressed={difficulty === opt.value}
                className="btn-press flex-1 rounded-xl border cursor-pointer flex flex-col items-center justify-center gap-0.5"
                style={{
                  background: difficulty === opt.value ? "rgba(21,128,61,0.15)" : "#0F1F2B",
                  borderColor: difficulty === opt.value ? "#15803D" : "rgba(255,255,255,0.08)",
                  color: difficulty === opt.value ? "#22C55E" : "#94A3B8",
                  fontFamily: "var(--font-nunito), sans-serif",
                  height: "52px",
                  transition: "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                }}
              >
                <span className="flex gap-0.5">
                  {[1, 2, 3].map((s) => <StarIcon key={s} filled={s <= opt.stars} />)}
                </span>
                <span className="text-xs font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => canStart && onStart(name.trim(), age, difficulty)}
          disabled={!canStart}
          aria-label="Start game"
          className="btn-press w-full rounded-xl border-0 text-lg font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: canStart ? "#15803D" : "#0F1F2B",
            color: canStart ? "#ffffff" : "#94A3B8",
            fontFamily: "var(--font-baloo), sans-serif",
            letterSpacing: "0.3px",
            height: "52px",
            boxShadow: canStart ? "0 4px 24px rgba(21,128,61,0.4)" : "none",
          }}
        >
          Let&apos;s Play! ♟
        </button>
      </div>
    </div>
  );
}
