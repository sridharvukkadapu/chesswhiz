// lib/onboarding/__tests__/steps.test.ts
import { getNextStep, getAgeValue } from "../steps";
import type { OnboardingState } from "../steps";

describe("getNextStep", () => {
  it("name → age", () => {
    const state: OnboardingState = { step: "name", name: "Aarav", ageBand: null };
    expect(getNextStep(state)).toBe("age");
  });

  it("age → trial (always, regardless of age band)", () => {
    const state: OnboardingState = { step: "age", name: "Aarav", ageBand: "5-7" };
    expect(getNextStep(state)).toBe("trial");
  });

  it("age 8-10 → trial", () => {
    const state: OnboardingState = { step: "age", name: "Aarav", ageBand: "8-10" };
    expect(getNextStep(state)).toBe("trial");
  });

  it("trial → ready", () => {
    const state: OnboardingState = { step: "trial", name: "Aarav", ageBand: "5-7" };
    expect(getNextStep(state)).toBe("ready");
  });

  it("ready → ready (terminal)", () => {
    const state: OnboardingState = { step: "ready", name: "Aarav", ageBand: "5-7" };
    expect(getNextStep(state)).toBe("ready");
  });
});

describe("getAgeValue", () => {
  it("5-7 → 6", () => expect(getAgeValue("5-7")).toBe(6));
  it("8-10 → 9", () => expect(getAgeValue("8-10")).toBe(9));
  it("11+ → 12", () => expect(getAgeValue("11+")).toBe(12));
});
