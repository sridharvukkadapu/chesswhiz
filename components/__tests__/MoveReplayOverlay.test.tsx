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

jest.mock("@/lib/speech", () => ({
  useSpeech: () => ({ speak: jest.fn(), enabled: false, supported: false, toggle: jest.fn() }),
}));

jest.mock("@/stores/gameStore", () => ({
  useGameStore: () => ({
    recordVoiceUsage: jest.fn(),
    setVoicePlayback: jest.fn(),
    voiceEnabled: false,
  }),
}));

import { render } from "@testing-library/react";
import MoveReplayOverlay from "../MoveReplayOverlay";

const steps = [
  { fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1", narration: "One move ago: e4.", moveLabel: "1. e4" },
  { fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", narration: "And then — e5. See what happened?", moveLabel: "1... e5" },
];

describe("MoveReplayOverlay", () => {
  it("renders null when steps is empty", () => {
    const { container } = render(<MoveReplayOverlay steps={[]} onDismiss={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when steps are provided", () => {
    const { container } = render(<MoveReplayOverlay steps={steps} onDismiss={() => {}} />);
    expect(container.firstChild).not.toBeNull();
  });
});
