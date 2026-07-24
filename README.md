# health-tracker

Personal health & fitness tracking app: progress documentation and monitoring
— weight, workouts, body photos, and food logs, with charts. No AI, no
external API calls, nothing sent off-device except to your own Supabase
project.

## Features

- **Auth** — email/password accounts (Supabase), per-user data isolation via
  RLS, with a "Forgot password?" email-link flow to reset a lost password.
- **Progress** — log weight & workouts; weight-trend and workout-frequency charts.
- **Weekly goals** — set a weekly target per workout type, up to 1000 (e.g.
  "Push ups" x100/week, "Run" x3/week). Pick the exercise from a built-in
  catalog grouped by muscle group (Abs, Back, Chest, Biceps, Triceps,
  Shoulders, Legs, Glutes, Cardio) — each with a form-cue illustration — or
  fall back to a custom name for anything not in the list. Log progress per
  goal as you go — each entry's count sums toward the week's total (10 today
  + 10 tomorrow = 20/100) — and track it as a percentage achieved, with an
  8-week trend chart per goal.
- **Body photos** — a private visual timeline of your progress (upload only —
  compare them yourself over time).
- **Food log** — log meals and macros by hand.
- **Privacy** — private photo storage, signed-URL access, and full account/data deletion.

## Structure

```
apps/api             Express + TypeScript backend (Supabase auth, REST API)
apps/web             React + Vite PWA frontend
packages/shared      Shared TypeScript types
supabase/migrations  SQL migrations (schema + row-level security + storage buckets)
render.yaml, DEPLOY.md   Deployment blueprint & guide
```

## Setup

1. **Create a Supabase project** at https://supabase.com/dashboard — free tier is fine.
2. In the Supabase SQL editor, run each migration in `supabase/migrations/` in
   order (`0001_init.sql` … `0010_workout_count_and_higher_goal_max.sql`). `0004` also
   creates a private storage bucket (`body-photos`, still used for the
   photo-timeline feature) and its access policies; `0005` creates
   `food-photos` too — that bucket is unused by the app now (food logging is
   text-only) but is left in place for any photos already in it. If the
   storage-policy statements error in the SQL editor, create the buckets
   (private) and equivalent policies from the Storage section of the
   dashboard instead.
3. Copy env templates and fill in your project's values (Project Settings → API):
   ```
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```
   - `apps/api/.env`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — server-only)
   - `apps/web/.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (safe for client use)
4. Install dependencies and run:
   ```
   npm install
   npm run dev:api   # http://localhost:8787
   npm run dev:web   # http://localhost:5173
   ```

There is no `ANTHROPIC_API_KEY` (or any other third-party API key) to set —
the app has no external dependency beyond Supabase.

## Testing

```
npm test
```

Runs the unit test suite (vitest) across all three workspaces: pure logic in
`apps/web/src/lib/progress.ts` (including weekly-goal progress math), the
shared `sumFoodItems` helper, and the metrics/workouts/workout-goals
input-validation schemas. Runs in CI on every push and PR.
Route handlers themselves aren't covered yet (would need integration tests
against a real or test Supabase project) — see `DEPLOY.md` for that gap.

## Auth flow

- Frontend uses `@supabase/supabase-js` directly for sign up / log in / log out
  (email + password; Supabase handles email confirmation).
- "Forgot password?" on the login page sends a reset-link email
  (`ForgotPassword.tsx`). `AuthContext` listens for Supabase's
  `PASSWORD_RECOVERY` event and `App.tsx` shows `ResetPassword.tsx` the
  moment it fires — see `DEPLOY.md` § 5 for why it's wired this way instead
  of a plain `/reset-password` route.
- Backend verifies the Supabase-issued JWT on every request via
  `requireAuth` middleware (`apps/api/src/middleware/auth.ts`), then scopes
  all queries to `req.userId`.
- Postgres row-level security policies (`supabase/migrations/0001_init.sql`)
  are a second layer of defense so a user's data is isolated even if a query
  is misscoped.

## History

The app originally included an AI-generated assessment, recommendations, a
coach chat, and photo-based food/body analysis (via Claude). Those were
removed in stages as the product direction settled on pure progress
tracking: photo analysis first (cost), then the assessment/recommendations/
chat surface entirely, once it was clear the app didn't need an AI
dependency at all. What's left is deliberately simple: log data, see charts.
