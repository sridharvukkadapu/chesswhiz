import { getNextStep, type OnboardingState } from "../steps";

describe("getNextStep", () => {
  it("name → age after name is entered", () => {
    const state: OnboardingState = { step: "name", name: "Aarav", ageBand: null, experience: null };
    expect(getNextStep(state)).toBe("age");
  });
  it("age → experience for 5-7 band", () => {
    const state: OnboardingState = { step: "age", name: "Aarav", ageBand: "5-7", experience: null };
    expect(getNextStep(state)).toBe("experience");
  });
  it("age → ready (skip experience) for 11+ band", () => {
    const state: OnboardingState = { step: "age", name: "Aarav", ageBand: "11+", experience: null };
    expect(getNextStep(state)).toBe("ready");
  });
  it("experience:never → pawn_mini_game", () => {
    const state: OnboardingState = { step: "experience", name: "Aarav", ageBand: "5-7", experience: "never" };
    expect(getNextStep(state)).toBe("pawn_mini_game");
  });
  it("experience:yes → ready", () => {
    const state: OnboardingState = { step: "experience", name: "Aarav", ageBand: "5-7", experience: "yes" };
    expect(getNextStep(state)).toBe("ready");
  });
});
