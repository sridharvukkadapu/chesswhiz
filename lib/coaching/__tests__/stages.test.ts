import { getAllowedConcepts, describeTactic } from "../stages";

describe("getAllowedConcepts", () => {
  it("stage 1 returns only board-orientation concepts", () => {
    expect(getAllowedConcepts(1)).toEqual(["square", "rank", "file", "diagonal", "board"]);
  });

  it("stage 3 includes check and checkmate but not fork or pin", () => {
    const concepts = getAllowedConcepts(3);
    expect(concepts).toContain("check");
    expect(concepts).toContain("checkmate");
    expect(concepts).not.toContain("fork");
    expect(concepts).not.toContain("pin");
  });

  it("stage 4 includes fork and pin", () => {
    const concepts = getAllowedConcepts(4);
    expect(concepts).toContain("fork");
    expect(concepts).toContain("pin");
  });

  it("stage 5 includes everything from all 5 stages", () => {
    const concepts = getAllowedConcepts(5);
    expect(concepts).toContain("square");
    expect(concepts).toContain("capture");
    expect(concepts).toContain("check");
    expect(concepts).toContain("fork");
    expect(concepts).toContain("zugzwang");
  });
});

describe("describeTactic", () => {
  it("fork stage 1 does not contain the word fork", () => {
    expect(describeTactic("fork", 1)).not.toMatch(/\bfork\b/i);
  });

  it("fork stage 4 contains the word fork", () => {
    expect(describeTactic("fork", 4)).toMatch(/\bfork\b/i);
  });

  it("hanging_piece stage 2 does not contain the word hanging", () => {
    expect(describeTactic("hanging_piece", 2)).not.toMatch(/\bhanging\b/i);
  });

  it("hanging_piece stage 4 contains the word hanging", () => {
    expect(describeTactic("hanging_piece", 4)).toMatch(/\bhanging\b/i);
  });

  it("unknown tactic is passed through unchanged", () => {
    expect(describeTactic("unknown_tactic", 3)).toBe("unknown_tactic");
  });
});
