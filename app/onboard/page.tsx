"use client";

import { useRouter } from "next/navigation";
import Onboarding from "@/components/Onboarding";
import { useGameStore } from "@/stores/gameStore";
import type { Difficulty } from "@/lib/chess/types";

export default function Home() {
  const router = useRouter();
  const setSettings = useGameStore((s) => s.setSettings);

  const handleStart = (name: string, age: number, difficulty: Difficulty) => {
    setSettings(name, age, difficulty);
    router.push("/play");
  };

  return <Onboarding onStart={handleStart} />;
}
