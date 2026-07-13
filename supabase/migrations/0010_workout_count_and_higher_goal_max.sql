-- Step: let one workout entry represent more than one unit (e.g. "50
-- push-ups" logged as a single row with count=50, not fifty separate rows),
-- so weekly goal progress can sum reps/counts instead of only counting
-- sessions. Backward compatible: existing rows default to count = 1, which
-- reproduces their old count-based contribution to weekly goals exactly.
alter table workouts add column if not exists count int not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'workouts'::regclass and conname = 'workouts_count_check'
  ) then
    alter table workouts add constraint workouts_count_check check (count > 0 and count <= 100000);
  end if;
end $$;

-- Raise the weekly-goal target ceiling from 100 to 1000 (e.g. "1000 push-ups
-- / week"). The original check constraint from 0009 had no explicit name, so
-- find whatever Postgres auto-named it and drop it before adding the new one.
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'workout_goals'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%target_per_week%'
  loop
    execute format('alter table workout_goals drop constraint %I', con.conname);
  end loop;
end $$;

alter table workout_goals
  add constraint workout_goals_target_per_week_check check (target_per_week > 0 and target_per_week <= 1000);
