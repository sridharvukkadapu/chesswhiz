/**
 * @jest-environment jsdom
 */
import { getDeviceId } from "../device";

describe("getDeviceId", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetModules();
  });

  it("returns a UUID string", () => {
    const id = getDeviceId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(10);
  });

  it("returns the same ID on second call", () => {
    const a = getDeviceId();
    const b = getDeviceId();
    expect(a).toBe(b);
  });

  it("persists across instances (reads from localStorage)", () => {
    const first = getDeviceId();
    localStorage.setItem("chesswhiz.deviceId", first);
    const second = getDeviceId();
    expect(second).toBe(first);
  });
});
