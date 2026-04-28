/**
 * @jest-environment jsdom
 */

// atmosphere.tsx runs window.matchMedia at module load time in jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

import { render } from "@testing-library/react";
import AhaCelebration from "../AhaCelebration";

const mockCelebration = {
  tactic: {
    type: "fork" as const,
    detected: true,
    details: "Knight fork",
    materialWon: 300,
    attackerSquare: "e5",
    targetSquares: ["d7", "f7"],
  },
  power: {
    id: "fork_power",
    name: "The Fork",
    icon: "⚔️",
    tactic: "fork",
    kingdom: "fork_forest" as const,
    howToEarn: "Attack two pieces at once",
    coachCelebration: "FORK!",
    rarity: "common" as const,
  },
};

describe("AhaCelebration", () => {
  it("renders null when celebration is null", () => {
    const { container } = render(
      <AhaCelebration celebration={null} onDismiss={() => {}} playerName="Aarav" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders frame overlay when celebration is provided", () => {
    const { container } = render(
      <AhaCelebration celebration={mockCelebration} onDismiss={() => {}} playerName="Aarav" />
    );
    expect(container.firstChild).not.toBeNull();
  });
});
