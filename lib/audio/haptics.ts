// Web Vibration API wrapper.
//
// Browser support is uneven (Android Chrome/Edge: yes; iOS Safari: no
// at the time of writing). The wrapper no-ops silently where the API
// isn't available, so callers don't need a feature check.
//
// Patterns are tuned for kids — short, gentle, never buzzy.
//   tap      —  10ms     (move, button press)
//   capture  —  20ms     (capture, undo)
//   check    —  [40,40,40] (alert tempo)
//   aha      —  [12,40,12,40,12] (celebratory triplet)

const ENABLED_KEY = "chesswhiz.haptics";

function vibrate(pattern: number | number[]): void {
  if (typeof window === "undefined") return;
  // Respect a localStorage opt-out (defaults to on)
  try {
    if (localStorage.getItem(ENABLED_KEY) === "0") return;
  } catch {}
  const nav = window.navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  if (typeof nav.vibrate !== "function") return;
  try { nav.vibrate(pattern); } catch {}
}

export const haptics = {
  tap: () => vibrate(10),
  capture: () => vibrate(20),
  check: () => vibrate([40, 40, 40]),
  aha: () => vibrate([12, 40, 12, 40, 12]),
};

export function setHapticsEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0"); } catch {}
}

export function getHapticsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try { return localStorage.getItem(ENABLED_KEY) !== "0"; } catch { return true; }
}
