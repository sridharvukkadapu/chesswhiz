// lib/onboarding/steps.ts
export type OnboardingStep = "name" | "age" | "trial" | "ready";

export type AgeBand = "5-7" | "8-10" | "11+";

export interface OnboardingState {
  step: OnboardingStep;
  name: string | null;
  ageBand: AgeBand | null;
}

export function getNextStep(state: OnboardingState): OnboardingStep {
  switch (state.step) {
    case "name":
      return "age";
    case "age":
      return "trial";
    case "trial":
      return "ready";
    case "ready":
      return "ready";
  }
}

export function getAgeValue(band: AgeBand): number {
  if (band === "5-7") return 6;
  if (band === "8-10") return 9;
  return 12;
}
