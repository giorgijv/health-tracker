-- Step: weekly workout goals per type (e.g. "Run" x3/week), tracked against
-- the existing workouts table. One target per (user, type); progress is
-- computed from workouts.date + workouts.type client/server-side, not stored.

create table if not exists workout_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_type text not null,
  target_per_week int not null check (target_per_week > 0 and target_per_week <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, workout_type)
);

create index if not exists workout_goals_user_idx on workout_goals (user_id, created_at);

alter table workout_goals enable row level security;

create policy "Users can view their own workout goals"
  on workout_goals for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workout goals"
  on workout_goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workout goals"
  on workout_goals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workout goals"
  on workout_goals for delete
  using (auth.uid() = user_id);
