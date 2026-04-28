import { KINGDOMS } from "../data";

describe("Boss data completeness", () => {
  const bossKingdoms = KINGDOMS.filter((k) => k.boss !== null);

  it("every boss kingdom has a boss with all required fields", () => {
    for (const k of bossKingdoms) {
      const boss = k.boss!;
      expect(boss.signatureLesson).toBeTruthy();
      expect(boss.openingFEN).toBeTruthy();
      expect(boss.defeatTactic).toBeTruthy();
      expect(boss.voicedIntro).toBeTruthy();
      expect(boss.voicedIntro.length).toBeLessThanOrEqual(100);
    }
  });

  it("every boss has at least 2 dialogue lines", () => {
    for (const k of bossKingdoms) {
      expect(k.boss!.dialogue.length).toBeGreaterThanOrEqual(2);
    }
  });
});
