const DEVICE_ID_KEY = "chesswhiz.deviceId";

export function getDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
