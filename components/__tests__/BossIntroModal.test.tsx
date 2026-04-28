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

import { render, screen } from "@testing-library/react";
import BossIntroModal from "../BossIntroModal";
import { KINGDOMS } from "@/lib/progression/data";

const bossKingdom = KINGDOMS.find((k) => k.boss !== null)!;
const boss = bossKingdom.boss!;

describe("BossIntroModal", () => {
  it("renders null when boss is null", () => {
    const { container } = render(<BossIntroModal boss={null} onFight={() => {}} onRetreat={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders boss name when boss is provided", () => {
    render(<BossIntroModal boss={boss} onFight={() => {}} onRetreat={() => {}} />);
    expect(screen.getByText(new RegExp(boss.name, "i"))).toBeTruthy();
  });
});
