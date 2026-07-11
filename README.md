# health-tracker

Personal health & fitness tracking app: assessment, recommendations, progress
tracking, and photo-based feedback (body composition + food/calories).

See `/tmp` plan doc shared in chat for the full 10-step build plan. This repo
currently implements **Step 1: scaffolding + auth**.

## Structure

```
apps/api      Express + TypeScript backend (Supabase-backed auth, REST API)
apps/web      React + Vite PWA frontend
packages/shared  Shared TypeScript types
supabase/migrations  SQL migrations (schema + row-level security)
```

## Setup

1. **Create a Supabase project** at https://supabase.com/dashboard — free tier is fine.
2. In the Supabase SQL editor, run each migration in `supabase/migrations/` in
   order (`0001_init.sql`, `0002_metrics_workouts.sql`, `0003_assessments.sql`).
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
