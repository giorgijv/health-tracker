-- Step: drop AI photo analysis entirely (cost control). Food logging is now
-- text-only (no photo required); body photos remain as a plain visual
-- timeline with no AI analysis. Historical rows/photos/analyses are left
-- untouched — this only changes what new writes look like.

alter table food_logs alter column storage_path drop not null;
