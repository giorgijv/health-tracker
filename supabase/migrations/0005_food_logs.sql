-- Step 6: food photos + calorie/nutrition estimation.
-- items_json is the FINAL (possibly user-edited) breakdown; ai_analysis_json
-- preserves the original AI estimate for audit. Totals are derived from the
-- final items. Photos live in a private bucket, surfaced via signed URLs.

create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  eaten_at timestamptz not null default now(),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  items_json jsonb not null,
  ai_analysis_json jsonb,
  total_calories numeric not null default 0,
  total_protein_g numeric not null default 0,
  total_carbs_g numeric not null default 0,
  total_fat_g numeric not null default 0,
  confidence text,
  nutritional_quality_json jsonb,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists food_logs_user_eaten_idx on food_logs (user_id, eaten_at desc);

alter table food_logs enable row level security;

create policy "Users can view their own food logs"
  on food_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own food logs"
  on food_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own food logs"
  on food_logs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own food logs"
  on food_logs for delete
  using (auth.uid() = user_id);

-- Private storage bucket for meal photos.
insert into storage.buckets (id, name, public)
values ('food-photos', 'food-photos', false)
on conflict (id) do nothing;

create policy "Users can read their own food photo objects"
  on storage.objects for select
  using (
    bucket_id = 'food-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload their own food photo objects"
  on storage.objects for insert
  with check (
    bucket_id = 'food-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own food photo objects"
  on storage.objects for delete
  using (
    bucket_id = 'food-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
