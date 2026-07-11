-- Core schema for step 1-2: profiles + row-level security.
-- Later steps add body_metrics, body_photos, food_logs, workouts, assessments, recommendations.

create table if not exists profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  age int,
  sex text check (sex in ('male', 'female', 'other')),
  height_cm numeric,
  activity_level text check (
    activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')
  ),
  goals text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = user_id);
