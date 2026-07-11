-- Step 2: progress-tracking core tables (manual entry). Body photos, food
-- logs, assessments, and recommendations are added in their own steps.

create table if not exists body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  weight_kg numeric,
  body_fat_pct_est numeric,
  waist_cm numeric,
  source text not null default 'manual' check (source in ('manual', 'photo_est')),
  created_at timestamptz not null default now()
);

create index if not exists body_metrics_user_date_idx on body_metrics (user_id, date desc);

alter table body_metrics enable row level security;

create policy "Users can view their own body metrics"
  on body_metrics for select
  using (auth.uid() = user_id);

create policy "Users can insert their own body metrics"
  on body_metrics for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own body metrics"
  on body_metrics for update
  using (auth.uid() = user_id);

create policy "Users can delete their own body metrics"
  on body_metrics for delete
  using (auth.uid() = user_id);

create table if not exists workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  type text not null,
  duration_min int,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists workouts_user_date_idx on workouts (user_id, date desc);

alter table workouts enable row level security;

create policy "Users can view their own workouts"
  on workouts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own workouts"
  on workouts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workouts"
  on workouts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workouts"
  on workouts for delete
  using (auth.uid() = user_id);
