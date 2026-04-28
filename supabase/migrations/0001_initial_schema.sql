-- kid_profile: one row per device/player identity
create table if not exists kid_profile (
  id           uuid primary key default gen_random_uuid(),
  device_id    text not null unique,
  player_name  text,
  age_band     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- kid_memory: one JSONB blob per profile
create table if not exists kid_memory (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references kid_profile(id) on delete cascade,
  model        jsonb not null,
  updated_at   timestamptz not null default now(),
  unique(profile_id)
);

-- coach_log: one row per coach exchange
create table if not exists coach_log (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references kid_profile(id) on delete cascade,
  fen             text not null,
  trigger         text not null,
  message         text not null,
  engine          text not null,
  chip_response   text,
  latency_ms      integer,
  logged_at       timestamptz not null default now()
);

alter table kid_profile enable row level security;
alter table kid_memory   enable row level security;
alter table coach_log    enable row level security;

create policy "anon_profile" on kid_profile for all using (true) with check (true);
create policy "anon_memory"  on kid_memory  for all using (true) with check (true);
create policy "anon_log"     on coach_log   for all using (true) with check (true);
