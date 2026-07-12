-- Step 7: recommendation engine.
-- Each "run" is one synthesis pass over the user's tracked data; it produces a
-- summary plus a set of individual recommendations the user can act on
-- (mark done or dismiss).

create table if not exists recommendation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  summary text not null,
  model text not null,
  created_at timestamptz not null default now()
);

create index if not exists rec_runs_user_created_idx on recommendation_runs (user_id, created_at desc);

alter table recommendation_runs enable row level security;

create policy "Users can view their own recommendation runs"
  on recommendation_runs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own recommendation runs"
  on recommendation_runs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own recommendation runs"
  on recommendation_runs for delete
  using (auth.uid() = user_id);

create table if not exists recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  run_id uuid not null references recommendation_runs (id) on delete cascade,
  category text not null check (
    category in ('nutrition', 'training', 'recovery', 'consistency', 'measurement', 'general')
  ),
  title text not null,
  detail text not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  basis text not null default '',
  status text not null default 'active' check (status in ('active', 'done', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists recommendations_user_run_idx on recommendations (user_id, run_id);

alter table recommendations enable row level security;

create policy "Users can view their own recommendations"
  on recommendations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own recommendations"
  on recommendations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own recommendations"
  on recommendations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own recommendations"
  on recommendations for delete
  using (auth.uid() = user_id);
