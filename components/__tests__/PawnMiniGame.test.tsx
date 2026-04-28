/**
 * @jest-environment jsdom
 */
import { render } from "@testing-library/react";

// matchMedia is not implemented in jsdom
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

import PawnMiniGame from "../PawnMiniGame";

describe("PawnMiniGame", () => {
  it("renders without crashing", () => {
    const { container } = render(<PawnMiniGame onComplete={() => {}} playerName="Aarav" />);
    expect(container).toBeTruthy();
  });
});
