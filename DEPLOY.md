# Deploying Health Tracker

The app is two deployable pieces plus Supabase:

- **Web** (`apps/web`) — a static PWA build, hosted on **GitHub Pages**
  (`.github/workflows/deploy-pages.yml`, deploys automatically on push to `main`).
- **API** (`apps/api`) — a Node web service that holds the two secrets that can
  never reach the browser (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`).
  Deployed here via the **Render** blueprint (`render.yaml`); the pieces work
  the same on Fly/Railway/a VPS if you'd rather not use Render.
- **Supabase** — Postgres + Auth + Storage (set up per the README).

Auth (login/signup) runs entirely client-side against Supabase, so the web app
works on its own. Every other feature (progress, photos, food log,
recommendations, coach) calls the API, so those stay broken until it's deployed.

## 1. Prerequisites

- Supabase project with all migrations in `supabase/migrations/` applied and the
  two private storage buckets created (see README).
- An `ANTHROPIC_API_KEY` from https://console.anthropic.com.
- The web app already deployed to GitHub Pages (see § 3) — you need that URL for
  `WEB_ORIGIN` below.

## 2. Deploy the API on Render

1. Go to https://render.com, sign in (GitHub login is easiest), and connect the
   `health-tracker` repo if prompted.
2. **New → Blueprint**, select the repo. Render reads `render.yaml` and proposes
   one service: `health-tracker-api`.
3. Fill in the env vars it marks as required:
   - `SUPABASE_URL` — Project Settings → API in your Supabase dashboard
   - `SUPABASE_SERVICE_ROLE_KEY` — same page, the **secret** key (never expose
     this to the browser — it bypasses row-level security)
   - `ANTHROPIC_API_KEY`
   - `WEB_ORIGIN` — your GitHub Pages **origin only**, no path, no trailing
     slash: `https://<your-username>.github.io` (not
     `https://<your-username>.github.io/health-tracker/`)
4. Deploy. First build takes a few minutes. Render gives you a URL like
   `https://health-tracker-api.onrender.com` — copy it.
5. Confirm it's alive: open `<that-url>/health` in a browser, expect
   `{"status":"ok"}`.

**Free-tier note:** Render's free web services spin down after 15 minutes of no
traffic and take up to ~50s to wake on the next request. The first API call
after idle will feel slow (or time out and need a retry) — this is expected on
the free plan, not a bug.

## 3. Point the web app at the deployed API

1. Repo → Settings → Secrets and variables → Actions → edit (or add)
   `VITE_API_URL` → paste the Render URL from step 2.4.
2. Re-run the Pages deploy: push anything to `main`, or go to the **Actions**
   tab → "Deploy web app to GitHub Pages" → **Run workflow**. `VITE_*` values
   are baked in at build time, so this rebuild is required — editing the
   secret alone doesn't update the live site.

## 4. CORS

The API only accepts requests from `WEB_ORIGIN` (see `apps/api/src/index.ts`).
A CORS error in the browser console means `WEB_ORIGIN` doesn't exactly match
the page's origin — fix it on Render and it takes effect on the next deploy
(Render auto-redeploys when you change an env var).

## 5. Supabase auth redirect

Supabase dashboard → Authentication → URL Configuration → add your GitHub
Pages URL to the allowed redirect URLs, so any email-based auth link points
back to the live site instead of `localhost`.

> **Known caveat:** the web app uses `HashRouter` for GitHub Pages compatibility
> (§ "GitHub Pages" below), and Supabase's default auth flow also puts session
> tokens in the URL hash on email-confirmation / password-reset links. The two
> can collide. Practical workaround for now: keep **Confirm email** off
> (Authentication → Providers → Email), as already suggested in the README —
> that avoids the collision entirely since no hash-based link is ever sent. If
> you need email confirmation or password reset in production, that requires
> switching Supabase to PKCE flow (query-param based, no hash), which isn't
> done yet — flagging as a follow-up rather than shipping it unverified.

## 6. Cost & rate limiting notes

- Each user has an in-memory AI-spend cap (40 model calls/hour) enforced in
  `apps/api/src/middleware/rateLimit.ts`. This is **per API instance** — if you
  scale the API to multiple instances, move the limiter to a shared store (Redis)
  so the budget is global.
- Model/effort choices per feature (tune in the respective `lib/*.ts`):
  | Feature | Model | Effort |
  |---|---|---|
  | Initial & periodic assessment | `claude-opus-4-8` | high |
  | Body-photo analysis | `claude-opus-4-8` | high |
  | Food-photo analysis | `claude-opus-4-8` | high |
  | Recommendations | `claude-opus-4-8` | medium |
  | Coach chat | `claude-opus-4-8` | medium |
  | Nudges | `claude-haiku-4-5` | (n/a — Haiku) |

  The photo/assessment calls are the expensive ones. If cost is a concern before
  quality is validated, drop those to `medium` first.

## 7. GitHub Pages (web app hosting)

`.github/workflows/deploy-pages.yml` builds `apps/web` and deploys it to Pages
automatically on every push to `main`. One-time setup:

1. **Enable Pages**: repo → Settings → Pages → *Build and deployment* → Source
   → **GitHub Actions**. (Not "Deploy from a branch.")
2. **Add repository secrets**: repo → Settings → Secrets and variables →
   Actions → New repository secret:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` — the **anon/publishable** key (safe to expose
     client-side, gated by row-level security — never the `service_role` key)
   - `VITE_API_URL` — set once the API is deployed (§ 2–3)
3. Push to `main` (or run the workflow manually). Publishes to
   `https://<your-username>.github.io/health-tracker/`.

Notes:
- Build sets `GH_PAGES=true`, switching the Vite `base` to `/health-tracker/`
  so assets resolve under the repo subpath. Don't set this locally.
- Routing uses `HashRouter` (URLs look like `.../#/progress`) — GitHub Pages
  has no server-side rewrites, so a plain path route 404s on refresh; hash
  routes always resolve to `index.html`. See § 5 for the auth-redirect caveat
  this creates.
