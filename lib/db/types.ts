export interface KidProfileRow {
  id: string;
  device_id: string;
  player_name: string | null;
  age_band: string | null;
  created_at: string;
  updated_at: string;
}

export interface KidMemoryRow {
  id: string;
  profile_id: string;
  model: Record<string, unknown>;
  updated_at: string;
}

export interface CoachLogEntry {
  profile_id: string;
  fen: string;
  trigger: string;
  message: string;
  engine: string;
  chip_response?: string;
  latency_ms?: number;
}
