# health-tracker

Personal health & fitness tracking app: assessment, recommendations, progress
tracking, and photo-based feedback (body composition + food/calories).

## Features

- **Auth** — email/password accounts (Supabase), per-user data isolation via RLS.
- **Assessment** — AI intake assessment and periodic re-assessments with a
  "how far you've come" progress read (`claude-opus-4-8`).
- **Progress** — log weight & workouts; weight-trend and workout-frequency charts.
- **Body photos** — private uploads with AI visual analysis vs. prior photos.
- **Food log** — snap a meal → AI calorie/macro estimate you edit before logging.
- **Recommendations** — prioritized, data-grounded advice synthesized from your logs.
- **Coach chat** — multi-turn Q&A over your data, plus short proactive nudges (`claude-haiku-4-5`).
- **Privacy** — private photo storage, signed-URL access, and full account/data deletion.

All AI features degrade gracefully without an `ANTHROPIC_API_KEY` (they return a
clear "not configured" error; everything else keeps working). AI endpoints are
per-user rate-limited to cap spend.

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
   order (`0001_init.sql` … `0007_chat.sql`). `0004` and `0005` also create
   private storage buckets (`body-photos`, `food-photos`) and their access
   policies; if the storage-policy statements error in the SQL editor, create the
   buckets (private) and equivalent policies from the Storage section of the
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
progress dashboards (step 4), then photo-based body/food analysis (steps 5-6)
using the Claude API.
