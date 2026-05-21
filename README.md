# TendonTrack

A web app for tracking recovery from an Achilles tendon injury — surgical or non-surgical. Calm, evidence-grounded, and built around a daily check-in. See [SPEC.md](./SPEC.md) for the full product spec.

## Features

- **Daily check-in** — pain, swelling, mobility, sleep, mood, supplement adherence, follow-up flag.
- **Recovery timeline** — surgical and non-surgical milestones from published rehab protocols, plotted against your weeks-since-injury (or since-surgery) anchor with a "you are here" marker.
- **Clinical reference** — milestones and supplement evidence summaries with citations and evidence-level badges.
- **Supplements** — manage your stack with timing/dose, drag to reorder, deactivate without losing history, daily-log integration.
- **Appointments** — schedule visits with markdown prep questions and post-visit outcome notes, dashboard surfacing of the next upcoming visit.
- **Notes** — freeform markdown notebook with tag chips, search, and per-tag filtering.
- **Settings** — edit your profile (treatment type, dates, side, timezone), manage account (sign out, delete), and export everything.
- **Data export** — one-click JSON dump of every record, plus per-table CSVs for Excel/Sheets.
- **About** — public landing-aware page with the educational disclaimer in full.
- **Auth** — Supabase Google OAuth + email magic link, with onboarding gating and an auth-aware nav.
- **Polish** — Suspense skeletons matching loaded layouts, error boundaries with retry, Sonner toasts on every create/update/delete, dark mode via `next-themes`.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript strict mode
- Tailwind CSS + shadcn/ui (slate base) + `next-themes` for dark mode
- Supabase (Postgres + Auth) via `@supabase/ssr`
- React Hook Form + Zod (single schema source shared client + server action)
- `sonner` for toast notifications, `lucide-react` for icons, `react-markdown` for the markdown previews, `@dnd-kit/*` for the supplements reorder

## Prerequisites

- Node.js 20+ and npm 10+
- A Supabase project ([dashboard](https://supabase.com/dashboard))
- A Google Cloud OAuth client (only if you want the Google sign-in button)

## First-time setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to https://supabase.com/dashboard and create a new project.
2. In **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` *(server only — required for account deletion)*

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Set:

| Variable | Where | Why |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API settings | Browser + server Supabase client |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project API settings | RLS-respecting client/server queries |
| `NEXT_PUBLIC_SITE_URL` | You pick | Used for OAuth + magic-link redirect URLs (`http://localhost:3000` locally) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project API settings | Server-only. Required to delete the `auth.users` row when a user deletes their account. Never expose to the client. |

### 4. Run the database migrations

In the Supabase dashboard, open **SQL Editor → New query** and run each file in [`supabase/migrations/`](./supabase/migrations/) in order:

1. `0001_profiles.sql` — profiles + RLS + `set_updated_at()` trigger function
2. `0002_milestones.sql` — milestones + RLS
3. `0003_daily_logs.sql` — daily_logs + RLS
4. `0004_supplements.sql` — supplements + supplement_logs + RLS
5. `0005_appointments.sql` — appointments + RLS
6. `0006_notes.sql` — notes + RLS

Every table is RLS-scoped to `auth.uid() = user_id`.

### 5. Configure auth providers

In the Supabase dashboard, **Authentication → URL Configuration**:

- **Site URL:** `http://localhost:3000` (add your production URL alongside it when you deploy)
- **Redirect URLs:** add both
  - `http://localhost:3000/auth/callback` (Google OAuth)
  - `http://localhost:3000/auth/confirm` (magic-link confirmation)
  - and the production equivalents when you deploy.

**Email magic link** uses the SSR-recommended `token_hash` / `verifyOtp` flow, which requires a one-time email-template change. In the Supabase dashboard go to **Authentication → Email Templates → Magic Link** and replace the body's `{{ .ConfirmationURL }}` link with:

```html
<h2>Sign in to TendonTrack</h2>
<p>Click the link below to sign in:</p>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink&next={{ .RedirectTo }}">
    Sign in to TendonTrack
  </a>
</p>
```

Why: the default template uses Supabase's PKCE redirect (`?code=...`), which depends on a browser cookie that does not survive being emailed and clicked later. The `token_hash` flow uses `verifyOtp` and works regardless of where the link is clicked.

**Google OAuth** (optional):

1. In Google Cloud Console, create an OAuth 2.0 Client ID (Web application).
2. Add `https://<your-project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI.
3. In Supabase, **Authentication → Providers → Google**: paste the Client ID and Client Secret, enable.

### 6. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000.

## Deployment (Vercel)

1. Push the repo to GitHub.
2. In Vercel, **Add New → Project**, import the repo. Framework: Next.js (auto-detected).
3. Add environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (the production URL — e.g. `https://tendontrack.vercel.app`)
   - `SUPABASE_SERVICE_ROLE_KEY` (server only — do not check the *NEXT_PUBLIC_* prefix box)
4. Deploy. Vercel will run `npm run build` automatically.
5. Back in Supabase, add the production URL to **Authentication → URL Configuration** as both a Site URL and Redirect URL (`/auth/callback` and `/auth/confirm`).

## Project layout

```
app/
  layout.tsx          root layout (theme provider, header, Sonner toaster)
  page.tsx            landing (redirects to /dashboard when signed in)
  about/              public about page
  login/              email + Google sign-in
  auth/               callback / confirm / signout route handlers
  onboarding/         3-step wizard, gated by middleware
  dashboard/          authenticated home (week, treatment, next appt, recent notes)
  log/                daily check-in form + /log/history list
  timeline/           milestone band chart with "you are here" marker
  reference/          clinical reference (recovery + supplements)
  appointments/       list + new + [id] detail (markdown prep/outcome editor)
  notes/              list + new + [id] detail (markdown editor with preview)
  settings/           index + profile / account / supplements / export
components/           shared UI (header, theme toggle, markdown preview, skeletons)
lib/
  auth/gates.ts       requireUser / requireOnboardedProfile server gates
  clinical-content.ts milestone templates + supplement evidence + disclaimer
  dates.ts            ISO-date helpers, weeksSince (1-indexed)
  milestones/seed.ts  idempotent per-user milestone seeding/backfill
  schemas/            Zod schemas shared between forms and server actions
  supabase/           browser, server, middleware Supabase clients
middleware.ts         session refresher + auth gate (allow-list public routes)
supabase/migrations/  SQL to run manually in the Supabase SQL editor
```

## Scripts

- `npm run dev` — Next dev server.
- `npm run build` — production build + type check.
- `npm run lint` — ESLint (Next config).
- `npm run start` — run a built app locally.

## License

Released under the MIT License — see [LICENSE](./LICENSE) if present, or treat as MIT-by-default. Educational content within the app cites the underlying clinical literature and is not original medical guidance.
