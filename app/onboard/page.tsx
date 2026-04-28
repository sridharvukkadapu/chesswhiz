"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Onboarding from "@/components/Onboarding";
import { useGameStore, loadSavedGame, loadLastPlayer } from "@/stores/gameStore";
import type { Difficulty } from "@/lib/chess/types";
import type { SavedGame, LastPlayer } from "@/stores/gameStore";
import { T } from "@/lib/design/tokens";

function ReturnCard({
  title,
  subtitle,
  primaryLabel,
  onPrimary,
  onSecondary,
}: {
  title: string;
  subtitle: string;
  primaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: T.bgRadial,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
        fontFamily: T.fontUI,
      }}
    >
      <div
        style={{
          maxWidth: 400,
          width: "100%",
          background: "rgba(255,255,255,0.72)",
          backdropFilter: "blur(12px)",
          borderRadius: 24,
          padding: "36px 32px",
          boxShadow: `0 8px 40px rgba(31,42,68,0.12)`,
          textAlign: "center",
          border: `1px solid rgba(31,42,68,0.08)`,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>♟️</div>
        <h2
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 26,
            fontWeight: 900,
            color: T.ink,
            margin: "0 0 8px",
            letterSpacing: -0.5,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            fontSize: 15,
            color: T.textMed,
            margin: "0 0 28px",
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>

        <button
          onClick={onPrimary}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 14,
            background: T.coral,
            color: "#fff",
            fontFamily: T.fontUI,
            fontWeight: 800,
            fontSize: 16,
            border: "none",
            cursor: "pointer",
            marginBottom: 10,
            boxShadow: `0 4px 16px rgba(255,107,90,0.35)`,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {primaryLabel}
        </button>

        <button
          onClick={onSecondary}
          style={{
            width: "100%",
            padding: "12px 0",
            borderRadius: 14,
            background: "transparent",
            color: T.textMed,
            fontFamily: T.fontUI,
            fontWeight: 700,
            fontSize: 14,
            border: `1.5px solid rgba(31,42,68,0.14)`,
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.70")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Not you? Start fresh
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const setSettings = useGameStore((s) => s.setSettings);
  const resumeGame = useGameStore((s) => s.resumeGame);
  const [savedGame, setSavedGame] = useState<SavedGame | null>(null);
  const [lastPlayer, setLastPlayer] = useState<LastPlayer | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const saved = loadSavedGame();
    setSavedGame(saved);
    if (!saved) setLastPlayer(loadLastPlayer());
    setChecked(true);
  }, []);

  const handleStart = (name: string, age: number, difficulty: Difficulty) => {
    setSettings(name, age, difficulty);
    router.push("/play");
  };

  const handleResume = () => {
    if (!savedGame) return;
    resumeGame(savedGame);
    router.push("/play");
  };

  const handleQuickPlay = () => {
    if (!lastPlayer) return;
    setSettings(lastPlayer.name, lastPlayer.age, lastPlayer.difficulty as Difficulty);
    router.push("/play");
  };

  const handleClearReturning = () => {
    setSavedGame(null);
    setLastPlayer(null);
  };

  if (!checked) return null;

  if (savedGame) {
    const moveWord = savedGame.moveCount === 1 ? "move" : "moves";
    const mins = Math.round((Date.now() - savedGame.savedAt) / 60_000);
    const timeLabel = mins < 2 ? "just now" : mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`;
    return (
      <ReturnCard
        title={`Welcome back, ${savedGame.playerName}!`}
        subtitle={`You were ${savedGame.moveCount} ${moveWord} into a game — saved ${timeLabel}.`}
        primaryLabel="Resume game →"
        onPrimary={handleResume}
        onSecondary={handleClearReturning}
      />
    );
  }

  if (lastPlayer) {
    return (
      <ReturnCard
        title={`Hey ${lastPlayer.name}!`}
        subtitle="Ready for another game? Your progress is saved."
        primaryLabel="Play now →"
        onPrimary={handleQuickPlay}
        onSecondary={handleClearReturning}
      />
    );
  }

  const firstSessionComplete = useGameStore((s) => s.firstSessionComplete);
  return <Onboarding onStart={handleStart} firstSessionComplete={firstSessionComplete} />;
}
