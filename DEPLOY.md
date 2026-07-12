# Deploying Health Tracker

The app is two deployable pieces plus Supabase:

- **API** (`apps/api`) — a Node web service.
- **Web** (`apps/web`) — a static PWA build.
- **Supabase** — Postgres + Auth + Storage (already set up per the README).

`render.yaml` is a ready-made [Render](https://render.com) blueprint for both.
Alternatively, the web app can be hosted for free on **GitHub Pages** (see § 6)
— but the API still needs to run *somewhere* (Render, Fly, Railway, a VPS) for
anything beyond login/signup to work, since Pages only serves static files.

## 1. Prerequisites

- Supabase project with all migrations in `supabase/migrations/` applied and the
  two private storage buckets created (see README).
- An `ANTHROPIC_API_KEY` from https://console.anthropic.com.

## 2. Deploy with the Render blueprint

1. Push this repo to GitHub (done if you're reading this there).
2. In Render: **New → Blueprint**, point it at the repo. It reads `render.yaml`
   and proposes two services: `health-tracker-api` and `health-tracker-web`.
3. Set the environment variables it marks as required:

   **health-tracker-api**
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` — server-only secret; never expose to the client
   - `ANTHROPIC_API_KEY`
   - `WEB_ORIGIN` — the web service's URL, e.g. `https://health-tracker-web.onrender.com`

   **health-tracker-web** (these are baked in at build time)
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` — the API service's URL, e.g. `https://health-tracker-api.onrender.com`

4. Deploy. The API exposes `/health` for the health check.

> **Chicken-and-egg URLs:** the API needs `WEB_ORIGIN` and the web needs
> `VITE_API_URL`, but you only learn each URL after the first deploy. Deploy
> once to get the URLs, set the two cross-referencing vars, then redeploy. The
> web service in particular must be **rebuilt** after `VITE_API_URL` changes,
> since Vite inlines it at build time.

## 3. CORS

The API only accepts requests from `WEB_ORIGIN` (see `apps/api/src/index.ts`). If
the browser reports a CORS error, `WEB_ORIGIN` doesn't match the origin the app
is actually served from — fix it and redeploy the API.

## 4. Supabase auth redirect

In the Supabase dashboard → Authentication → URL Configuration, add your deployed
web URL to the allowed redirect URLs so email confirmation links work in
production.

## 5. Cost & rate limiting notes

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

## 6. GitHub Pages (free static hosting for the web app)

`.github/workflows/deploy-pages.yml` builds `apps/web` and deploys it to Pages
automatically on every push to `main`. What it needs from you, once:

1. **Enable Pages**: repo → Settings → Pages → *Build and deployment* → Source
   → **GitHub Actions**. (Not "Deploy from a branch" — the workflow handles
   publishing itself.)
2. **Add repository secrets**: repo → Settings → Secrets and variables →
   Actions → New repository secret:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — the Supabase **anon/publishable** key (safe to
     expose client-side; it's gated by row-level security, not secrecy — never
     put the `service_role` key here)
   - `VITE_API_URL` — your deployed API's URL (e.g. from step 2 above). If you
     haven't deployed the API yet, leave this unset for now: the site will
     still load and login/signup will work (Supabase auth runs entirely
     client-side), but every data/AI feature will show a fetch error until
     it's set and the workflow re-runs.
3. Push to `main` (or run the workflow manually from the Actions tab). The site
   publishes to `https://<your-username>.github.io/health-tracker/`.

Notes:
- The build sets `GH_PAGES=true`, which switches the Vite `base` to
  `/health-tracker/` so assets resolve under the repo subpath (see
  `apps/web/vite.config.ts`). Don't set this locally.
- Routing uses `HashRouter` (URLs look like `.../#/progress`), not
  `BrowserRouter` — GitHub Pages has no server-side rewrites, so a plain path
  route 404s on refresh; hash routes always resolve to `index.html`.
- Changing a `VITE_*` secret doesn't retroactively update the live site — it
  only takes effect on the next workflow run (push to `main`, or re-run the
  workflow manually).
