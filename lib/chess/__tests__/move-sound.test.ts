import { classifyMoveSound } from "../engine";

describe("classifyMoveSound", () => {
  describe("priority ordering — game-end > check > castle > promotion > capture > move", () => {
    it("white_wins (player is white) → 'win'", () => {
      expect(
        classifyMoveSound({ san: "Qh7#", status: "white_wins", inCheck: true }),
      ).toBe("win");
    });

    it("black_wins → 'lose'", () => {
      expect(
        classifyMoveSound({ san: "Qh2#", status: "black_wins", inCheck: true }),
      ).toBe("lose");
    });

    it("stalemate → 'draw'", () => {
      expect(
        classifyMoveSound({ san: "Kf7", status: "stalemate", inCheck: false }),
      ).toBe("draw");
    });

    it("draw → 'draw'", () => {
      expect(
        classifyMoveSound({ san: "Kf7", status: "draw", inCheck: false }),
      ).toBe("draw");
    });

    it("check during normal play → 'check'", () => {
      expect(
        classifyMoveSound({ san: "Bb5+", status: "playing", inCheck: true }),
      ).toBe("check");
    });

    it("castling kingside → 'castle'", () => {
      expect(classifyMoveSound({ san: "O-O", status: "playing", inCheck: false })).toBe("castle");
    });

    it("castling queenside → 'castle'", () => {
      expect(classifyMoveSound({ san: "O-O-O", status: "playing", inCheck: false })).toBe("castle");
    });

    it("promotion → 'promotion'", () => {
      expect(classifyMoveSound({ san: "e8=Q", status: "playing", inCheck: false })).toBe("promotion");
    });

    it("promotion that gives check → 'check' wins (alert beats sparkle)", () => {
      expect(classifyMoveSound({ san: "e8=Q+", status: "playing", inCheck: true })).toBe("check");
    });

    it("capture → 'capture'", () => {
      expect(classifyMoveSound({ san: "Nxe5", status: "playing", inCheck: false })).toBe("capture");
    });

    it("capture with check → 'check' wins", () => {
      expect(classifyMoveSound({ san: "Nxe5+", status: "playing", inCheck: true })).toBe("check");
    });

    it("plain piece move → 'move'", () => {
      expect(classifyMoveSound({ san: "Nf3", status: "playing", inCheck: false })).toBe("move");
    });

    it("pawn push → 'move'", () => {
      expect(classifyMoveSound({ san: "e4", status: "playing", inCheck: false })).toBe("move");
    });
  });

  describe("rare combos", () => {
    it("castling that delivers check (rare but legal) → 'check'", () => {
      expect(classifyMoveSound({ san: "O-O+", status: "playing", inCheck: true })).toBe("check");
    });

    it("a promotion that captures and gives check → 'check' (highest)", () => {
      expect(classifyMoveSound({ san: "exd8=Q+", status: "playing", inCheck: true })).toBe("check");
    });

    it("checkmate is announced as a win/lose, not a 'check'", () => {
      // The endgame routes win/lose, even though chess.isCheck() is true at
      // the moment of mate
      expect(
        classifyMoveSound({ san: "Qh7#", status: "white_wins", inCheck: true }),
      ).toBe("win");
    });
  });
});
