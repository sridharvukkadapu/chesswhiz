import { isKingdomLocked, isReadyForNextKingdom, KINGDOMS } from "../data";

describe("isKingdomLocked", () => {
  it("Pawn Village is always unlocked, even on free tier", () => {
    expect(isKingdomLocked("village", "free")).toBe(false);
    expect(isKingdomLocked("village", "champion")).toBe(false);
  });

  it("free tier locks every non-village kingdom", () => {
    for (const k of KINGDOMS) {
      if (k.id === "village") continue;
      expect(isKingdomLocked(k.id, "free")).toBe(true);
    }
  });

  it("champion tier unlocks every kingdom", () => {
    for (const k of KINGDOMS) {
      expect(isKingdomLocked(k.id, "champion")).toBe(false);
    }
  });

  it("returns true for an unknown kingdom on free tier (defensive)", () => {
    expect(isKingdomLocked("nonexistent", "free")).toBe(true);
  });

  it("returns false for an unknown kingdom on champion (champion bypasses gating)", () => {
    expect(isKingdomLocked("nonexistent", "champion")).toBe(false);
  });
});

describe("isReadyForNextKingdom", () => {
  it("returns false when no village strategies are mastered", () => {
    expect(isReadyForNextKingdom([])).toBe(false);
  });

  it("returns false when fewer than 3 village strategies are mastered", () => {
    const village = KINGDOMS.find((k) => k.id === "village")!;
    const ids = village.strategies.slice(0, 2).map((s) => s.id);
    expect(isReadyForNextKingdom(ids)).toBe(false);
  });

  it("returns true when 3+ village strategies are mastered", () => {
    const village = KINGDOMS.find((k) => k.id === "village")!;
    const ids = village.strategies.slice(0, 3).map((s) => s.id);
    expect(isReadyForNextKingdom(ids)).toBe(true);
  });

  it("ignores non-village strategies — only counts the gate", () => {
    // 5 random strategy IDs that don't exist in the village kingdom.
    expect(isReadyForNextKingdom(["fake1", "fake2", "fake3", "fake4", "fake5"])).toBe(false);
  });

  it("returns true when ALL village strategies are mastered", () => {
    const village = KINGDOMS.find((k) => k.id === "village")!;
    expect(isReadyForNextKingdom(village.strategies.map((s) => s.id))).toBe(true);
  });
});
