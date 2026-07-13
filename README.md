# health-tracker

Personal health & fitness tracking app: assessment, recommendations, and
progress tracking — all driven by text you enter, not photo analysis.

## Features

- **Auth** — email/password accounts (Supabase), per-user data isolation via RLS.
- **Assessment** — AI intake assessment and periodic re-assessments with a
  "how far you've come" progress read, from your questionnaire and tracked
  data only (`claude-opus-4-8`).
- **Progress** — log weight & workouts; weight-trend and workout-frequency charts.
- **Body photos** — a private visual timeline of your progress (upload only —
  no AI analysis; compare them yourself over time).
- **Food log** — log meals and macros by hand.
- **Recommendations** — prioritized, data-grounded advice synthesized from your logs.
- **Coach chat** — multi-turn Q&A over your data, plus short proactive nudges (`claude-haiku-4-5`).
- **Privacy** — private photo storage, signed-URL access, and full account/data deletion.

No feature sends an image to Claude — every AI call is text-only, which keeps
per-call cost low and predictable. AI features degrade gracefully without an
`ANTHROPIC_API_KEY` (they return a clear "not configured" error; everything
else keeps working). AI endpoints are per-user rate-limited to cap spend.

## Structure

```
apps/api             Express + TypeScript backend (Supabase auth, REST API, AI calls)
apps/web             React + Vite PWA frontend
packages/shared      Shared TypeScript types
supabase/migrations  SQL migrations (schema + row-level security + storage buckets)
render.yaml, DEPLOY.md   Deployment blueprint & guide
```

## Setup

1. **Create a Supabase project** at https://supabase.com/dashboard — free tier is fine.
2. In the Supabase SQL editor, run each migration in `supabase/migrations/` in
   order (`0001_init.sql` … `0008_remove_photo_analysis.sql`). `0004` also
   creates a private storage bucket (`body-photos`, still used for the
   photo-timeline feature) and its access policies; `0005` creates
   `food-photos` too — that bucket is now unused by the app (food logging is
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
   - `apps/api/.env`: `ANTHROPIC_API_KEY` (from https://console.anthropic.com — required for
     the AI assessment; other endpoints work without it)
   - `apps/web/.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (safe for client use)
4. Install dependencies and run:
   ```
   npm install
   npm run dev:api   # http://localhost:8787
   npm run dev:web   # http://localhost:5173
   ```

## Testing

```
npm test
```

Runs the unit test suite (vitest) across all three workspaces: pure logic in
`apps/web/src/lib/progress.ts` and `apps/api/src/lib/recommendationContext.ts`,
the shared `sumFoodItems` helper, the per-user rate limiter, and the
metrics/workouts input-validation schemas. Runs in CI on every push and PR.
Route handlers themselves aren't covered yet (would need integration tests
against a real or test Supabase project) — see `DEPLOY.md` for that gap.

## Auth flow

- Frontend uses `@supabase/supabase-js` directly for sign up / log in / log out
  (email + password; Supabase handles email confirmation).
- Backend verifies the Supabase-issued JWT on every request via
  `requireAuth` middleware (`apps/api/src/middleware/auth.ts`), then scopes
  all queries to `req.userId`.
- Postgres row-level security policies (`supabase/migrations/0001_init.sql`)
  are a second layer of defense so a user's data is isolated even if a query
  is misscoped.

## Next steps

See the full plan: data model + core API (step 2), initial assessment (step 3),
progress dashboards (step 4), photo tracking + food logging (steps 5-6, later
simplified to drop AI photo analysis for cost), using the Claude API for the
text-only features.
