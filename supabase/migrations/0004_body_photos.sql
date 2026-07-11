-- Step 5: body photos + AI visual analysis.
-- Photos live in a PRIVATE storage bucket; only the owner can read/write them,
-- and images are only ever surfaced via short-lived signed URLs. analysis_json
-- is a qualitative visual read produced by Claude — never a measurement.

create table if not exists body_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  angle text not null check (angle in ('front', 'side', 'back')),
  taken_at timestamptz not null default now(),
  analysis_json jsonb,
  model text,
  created_at timestamptz not null default now()
);

create index if not exists body_photos_user_taken_idx on body_photos (user_id, taken_at desc);

alter table body_photos enable row level security;

create policy "Users can view their own body photos"
  on body_photos for select
  using (auth.uid() = user_id);

create policy "Users can insert their own body photos"
  on body_photos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own body photos"
  on body_photos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own body photos"
  on body_photos for delete
  using (auth.uid() = user_id);

-- Private storage bucket for the image files.
insert into storage.buckets (id, name, public)
values ('body-photos', 'body-photos', false)
on conflict (id) do nothing;

-- Object path convention: "<user_id>/<uuid>.<ext>". The first path segment must
-- match the authenticated user, so no one can read or write another user's folder.
create policy "Users can read their own body photo objects"
  on storage.objects for select
  using (
    bucket_id = 'body-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload their own body photo objects"
  on storage.objects for insert
  with check (
    bucket_id = 'body-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own body photo objects"
  on storage.objects for delete
  using (
    bucket_id = 'body-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
