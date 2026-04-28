export type OnboardingStep =
  | "name"
  | "age"
  | "experience"
  | "pawn_mini_game"
  | "ready";

export type ExperienceLevel = "never" | "a_little" | "yes";

export interface OnboardingState {
  step: OnboardingStep;
  name: string | null;
  ageBand: "5-7" | "8-10" | "11+" | null;
  experience: ExperienceLevel | null;
}

export function getNextStep(state: OnboardingState): OnboardingStep {
  switch (state.step) {
    case "name":
      return "age";
    case "age":
      // Skip experience question for 8-10 and 11+ — assume some knowledge
      if (state.ageBand === "5-7") return "experience";
      return "ready";
    case "experience":
      if (state.experience === "never") return "pawn_mini_game";
      return "ready";
    case "pawn_mini_game":
      return "ready";
    case "ready":
      return "ready";
  }
}

export function getAgeValue(band: "5-7" | "8-10" | "11+") {
  if (band === "5-7") return 6;
  if (band === "8-10") return 9;
  return 12;
}
