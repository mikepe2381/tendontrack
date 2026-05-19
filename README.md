# TendonTrack

A web app for tracking recovery from an Achilles tendon injury — surgical or non-surgical. See [SPEC.md](./SPEC.md) for the full product spec.

## Stack

- Next.js 15 (App Router) + TypeScript strict mode
- Tailwind CSS + shadcn/ui (slate base) + `next-themes` for dark mode
- Supabase (Postgres + Auth) via `@supabase/ssr`
- Auth providers: Google OAuth + email magic link

## Prerequisites

- Node.js 20+ and npm 10+
- A Supabase project ([dashboard](https://supabase.com/dashboard))
- A Google Cloud OAuth client (for the Google sign-in button)

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

### 3. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` for local dev

### 4. Run the database migration

In the Supabase dashboard, open **SQL Editor → New query**, paste the contents of [`supabase/migrations/0001_profiles.sql`](./supabase/migrations/0001_profiles.sql), and run it. This creates the `profiles` table and RLS policies.

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

Why: the default template uses Supabase's PKCE redirect (`?code=...`), which depends on a browser cookie that does not survive being emailed and clicked later (different browser, different device, mobile in-app browsers, strict cookie blockers). The `token_hash` flow uses `verifyOtp` and works regardless of where the link is clicked.

**Google OAuth:**

1. In Google Cloud Console, create an OAuth 2.0 Client ID (Web application).
2. Add `https://<your-project-ref>.supabase.co/auth/v1/callback` as an authorized redirect URI.
3. In Supabase, **Authentication → Providers → Google**: paste the Client ID and Client Secret, enable.

### 6. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000.

## Verifying auth works end-to-end

1. Visit `/` — you should see the landing page.
2. Visit `/dashboard` while signed out — middleware should redirect you to `/login?next=/dashboard`.
3. **Magic link:** enter your email on `/login`, click **Send magic link**, open the email, click the link. You should land on `/dashboard` signed in, with your email shown.
4. **Google:** click **Continue with Google** on `/login`, complete the consent screen, land on `/dashboard`.
5. Click **Sign out** in the header — you should be redirected to `/`.
6. Toggle the sun/moon icon in the header — the theme should switch between light and dark.

## Project layout

```
app/
  layout.tsx          root layout (theme provider, header)
  page.tsx            landing (redirects to /dashboard when signed in)
  about/              public about page
  login/              email + Google sign-in
  auth/callback/      OAuth code exchange (Google)
  auth/confirm/       magic-link token_hash verification
  auth/signout/       POST handler that signs out
  dashboard/          authenticated stub
components/
  header.tsx          server component with auth-aware nav
  theme-provider.tsx  next-themes wrapper
  theme-toggle.tsx    sun/moon button
  ui/                 shadcn primitives (button, input, label)
lib/
  utils.ts            cn() helper
  supabase/
    client.ts         browser client
    server.ts         server-component / route-handler client
    middleware.ts     middleware session refresher
middleware.ts         protects all routes except /, /login, /auth/callback, /auth/confirm, /about
supabase/migrations/  SQL to run manually in the Supabase SQL editor
```

## Build milestones

This repo is built milestone-by-milestone per [SPEC.md §9](./SPEC.md). You are looking at **Milestone 1: scaffold + auth**.
