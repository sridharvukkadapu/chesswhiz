import { getOrCreateProfile } from "../profile";
import { loadMemoryFromDB, saveMemoryToDB } from "../memory";
import { insertCoachLog } from "../log";

describe("DB helper function signatures", () => {
  it("getOrCreateProfile is a function", () => {
    expect(typeof getOrCreateProfile).toBe("function");
  });
  it("loadMemoryFromDB is a function", () => {
    expect(typeof loadMemoryFromDB).toBe("function");
  });
  it("saveMemoryToDB is a function", () => {
    expect(typeof saveMemoryToDB).toBe("function");
  });
  it("insertCoachLog is a function", () => {
    expect(typeof insertCoachLog).toBe("function");
  });
});
