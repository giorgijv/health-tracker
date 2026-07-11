-- Step 3: AI-generated health & fitness assessments.
-- intake_json preserves exactly what the user submitted; summary_json holds the
-- structured write-up Claude produced. Keeping both means an assessment is fully
-- reproducible and auditable.

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null default 'initial' check (type in ('initial', 'periodic')),
  intake_json jsonb not null,
  summary_json jsonb not null,
  model text not null,
  created_at timestamptz not null default now()
);

create index if not exists assessments_user_created_idx on assessments (user_id, created_at desc);

alter table assessments enable row level security;

create policy "Users can view their own assessments"
  on assessments for select
  using (auth.uid() = user_id);

create policy "Users can insert their own assessments"
  on assessments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own assessments"
  on assessments for delete
  using (auth.uid() = user_id);
