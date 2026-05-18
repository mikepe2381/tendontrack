# TendonTrack — Achilles Recovery App

A web app for tracking recovery from Achilles tendon injury, whether managed surgically or non-surgically. Helps users log daily symptoms, manage supplements, anticipate milestones, and prepare for appointments — anchored to evidence-based recovery timelines.

---

## 1. Product principles

1. **Honest over reassuring.** Show realistic ranges, not point estimates. Flag when evidence is weak.
2. **Low-friction logging.** Daily check-in must take under 60 seconds on mobile or the user stops.
3. **Personal, not prescriptive.** The app does not prescribe treatment. It contextualizes the user's experience against typical ranges and surfaces good questions for their care team.
4. **Mobile-first.** Most logging happens on a phone, often one-handed, often in bed.
5. **Yours forever.** Users own their data. Export to JSON/CSV any time.

---

## 2. Tech stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database & auth:** Supabase (Postgres + Auth)
- **Auth providers:** Google OAuth + email magic links
- **Hosting:** Vercel (auto-deploy from GitHub main branch)
- **Forms:** react-hook-form + zod for validation
- **Date handling:** date-fns
- **Charts (timeline view):** Recharts

Do not add other dependencies without justification. Keep the dependency tree small.

---

## 3. Data model (Supabase / Postgres)

All tables have `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`, and (where relevant) `user_id uuid references auth.users on delete cascade`.

Row-Level Security (RLS) is enabled on every user-data table. Policy: `auth.uid() = user_id` for select/insert/update/delete.

### `profiles`
- `user_id uuid primary key references auth.users`
- `display_name text`
- `injury_date date not null`
- `treatment_type text not null check (treatment_type in ('surgical', 'non_surgical'))`
- `surgery_date date` (nullable; required if treatment_type = 'surgical')
- `affected_side text check (affected_side in ('left', 'right', 'both'))`
- `timezone text default 'UTC'`
- `onboarding_complete boolean default false`

### `daily_logs`
One row per user per day. Unique constraint on `(user_id, log_date)`.
- `user_id uuid`
- `log_date date not null`
- `pain_level int check (pain_level between 0 and 10)`
- `swelling_level int check (swelling_level between 0 and 10)`
- `sleep_hours numeric(3,1)`
- `sleep_quality int check (sleep_quality between 1 and 5)`
- `mood int check (mood between 1 and 5)`
- `mobility_status text check (mobility_status in ('nwb_cast', 'nwb_boot', 'pwb_boot', 'fwb_boot', 'fwb_shoe', 'unrestricted'))`
- `notes text`
- `flagged_for_followup boolean default false`

### `supplements`
User's defined supplement list.
- `user_id uuid`
- `name text not null`
- `dose text` (free text — "20g", "2000 IU", etc.)
- `timing text check (timing in ('morning', 'midday', 'evening', 'bedtime', 'as_needed'))`
- `notes text`
- `active boolean default true`
- `sort_order int default 0`

### `supplement_logs`
- `user_id uuid`
- `supplement_id uuid references supplements`
- `log_date date not null`
- `taken boolean not null`
- Unique on `(user_id, supplement_id, log_date)`

### `appointments`
- `user_id uuid`
- `appointment_date timestamptz not null`
- `provider_name text`
- `provider_type text` (free text — "Surgeon", "Physio", etc.)
- `location text`
- `status text check (status in ('scheduled', 'completed', 'cancelled')) default 'scheduled'`
- `prep_questions text` (markdown)
- `outcome_notes text` (markdown, post-appointment)

### `milestones` (user-specific milestone instances)
Seeded on profile creation from a clinical content library (see Section 5).
- `user_id uuid`
- `milestone_key text not null` (e.g., 'cast_removal', 'boot_transition', 'first_pwb')
- `expected_week_min int`
- `expected_week_max int`
- `achieved_date date` (nullable)
- `notes text`

### `notes` (general freeform notes)
- `user_id uuid`
- `title text`
- `body text` (markdown)
- `tags text[]`

---

## 4. User flows

### 4.1 Onboarding (first login)
1. User signs in via Google or email magic link.
2. Onboarding wizard (3 screens):
   - **Screen 1:** "Was your injury managed with surgery, or non-surgically?" → sets `treatment_type`
   - **Screen 2:** Date pickers for injury date and (if surgical) surgery date. Affected side.
   - **Screen 3:** "Add your supplement stack (optional, can do later)" with a "Skip" button.
3. On completion: seed milestones from clinical library based on treatment_type, mark `onboarding_complete = true`, redirect to dashboard.

### 4.2 Daily check-in
- Big primary CTA on dashboard: "Log today" (or "Edit today's log" if one exists).
- Single-screen form. All fields optional except date. Tap-friendly inputs (sliders for 0-10 scales, segmented controls for mobility status).
- Supplements section: list of active supplements with checkboxes. State persists.
- Submit returns to dashboard with confirmation.

### 4.3 Timeline view
- Horizontal timeline showing weeks since injury (or surgery, if surgical).
- Current position marker.
- Milestone bands showing expected ranges (e.g., "Cast removal: weeks 2-3"). Tap a milestone to see source/evidence note and mark achieved.
- Below the timeline: "What's typical right now" panel — pulls from clinical library based on current week.

### 4.4 Appointments
- List view, upcoming and past.
- Tap to view/edit. Pre-appointment screen has a "Questions for this appointment" markdown field. Post-appointment screen swaps to "What we discussed" markdown field.
- "Add appointment" floating button.

### 4.5 Supplements management
- Settings → Supplements.
- CRUD list. Drag to reorder. Active/inactive toggle (inactive supplements don't appear in daily check-in but preserve history).

### 4.6 Data export
- Settings → Export data. Downloads a JSON file with all user data. Also offer CSV per table.

---

## 5. Clinical content library

A static TypeScript module at `lib/clinical-content.ts`. Not user-editable. Versioned. Every entry has a `source` field and an `evidence_level` field (`'high' | 'moderate' | 'low' | 'expert_opinion'`).

### Milestones (seed data)

**Surgical pathway (Achilles repair, modern functional rehab protocol):**
- `cast_removal`: weeks 1-2. Source: typical post-op MIS protocols.
- `boot_transition`: weeks 2-3. Source: Willits et al. JBJS 2010; modern accelerated protocols.
- `partial_weight_bearing`: weeks 2-4.
- `full_weight_bearing_in_boot`: weeks 4-6.
- `wedge_reduction_complete`: weeks 6-8.
- `transition_to_shoe`: weeks 8-12.
- `driving_cleared`: weeks 6-9 (right Achilles) / weeks 2-4 (left, automatic). Source: brake reaction time studies.
- `stationary_bike`: weeks 2-6.
- `return_to_jogging`: months 4-6.
- `return_to_cutting_sports`: months 9-12.

**Non-surgical pathway:**
- `boot_with_wedges`: weeks 0-2.
- `partial_weight_bearing`: weeks 2-4.
- `full_weight_bearing_in_boot`: weeks 4-8.
- `wedge_reduction_complete`: weeks 8-10.
- `transition_to_shoe`: weeks 10-14.
- `return_to_jogging`: months 5-7.
- `return_to_cutting_sports`: months 10-14.

Every range must have a one-paragraph "what to expect" note and at least one cited source. Mark `evidence_level` honestly — most ranges are `moderate` (based on cohort studies and consensus protocols, not RCTs).

### Supplement evidence (informational only, shown on a "Supplement evidence" reference page)

For each commonly-used supplement (collagen, vitamin C, vitamin D, creatine, protein, omega-3, magnesium), provide:
- One-paragraph plain-English summary of the evidence for tendon healing or general recovery
- Evidence level (`high` / `moderate` / `low` / `theoretical`)
- Typical dose range
- Notable caveats
- 1-2 cited sources (peer-reviewed where possible)

Do NOT include hyped/weak-evidence items (peptides like BPC-157, TB-500) in the seed library. If users want to add them, they can add custom supplements — but the reference page does not endorse them.

### Educational framing

Every page that shows clinical content must include this banner near the top:

> **Educational content, not medical advice.** Recovery varies widely between individuals. Use this as a starting point for conversations with your surgeon and physiotherapist, not as a substitute for their guidance.

---

## 6. Pages & routes

- `/` — marketing landing (unauthenticated) or redirect to `/dashboard` (authenticated)
- `/login` — auth screen
- `/onboarding` — wizard (gated until `onboarding_complete = true`)
- `/dashboard` — home: today's log CTA, current week, next appointment, recent milestones
- `/log` — daily check-in form (defaults to today; `/log?date=YYYY-MM-DD` for editing past)
- `/log/history` — list view of all logs, filterable
- `/timeline` — milestone timeline
- `/appointments` — list
- `/appointments/[id]` — detail
- `/notes` — list
- `/notes/[id]` — detail
- `/reference/supplements` — supplement evidence library
- `/reference/recovery` — general recovery education
- `/settings` — profile, supplements management, export, account
- `/about` — what the app is, who built it, disclaimer

---

## 7. Visual design

- Clean, calm, clinical-but-warm. Not bro-y. Not infantilizing.
- Type: Inter for UI, optional serif for long-form reference content.
- Color: neutral base (slate/stone), single accent color (suggest teal or deep blue — not red, which reads as "alert").
- Dark mode supported via Tailwind's `dark:` variants and a toggle in settings.
- Empty states should be encouraging without being saccharine. "No logs yet — tap below to start." Not "You got this! 💪"

---

## 8. Out of scope for v1

Explicitly do not build:
- AI chat / data summarization features
- Photo logging
- Wearable / health-app integrations
- PT exercise library with videos
- Social features, community, sharing
- Push notifications
- Email reminders (could be a v1.1)
- Native mobile apps
- i18n / multi-language (English only for v1)
- Notion import (v1.1)

---

## 9. Build milestones

Claude Code should build in this order, committing after each milestone with a clear message:

1. **Scaffold + auth.** Next.js project, Tailwind, shadcn/ui, Supabase client, Google + magic link auth, protected routes, basic layout shell.
2. **Onboarding + profile.** Wizard, profile table, milestone seeding logic.
3. **Daily log.** Schema, form, history list, edit-past-log capability.
4. **Supplements.** Management UI + integration into daily log.
5. **Timeline + clinical content library.** Static library, timeline view, milestone interaction.
6. **Appointments + notes.** CRUD for both.
7. **Settings + export + polish.** Data export, dark mode, empty states, error boundaries, loading states, mobile QA pass.

After each milestone: commit, push, verify deploys on Vercel preview, then proceed.

---

## 10. Non-negotiables

- TypeScript strict mode on.
- No `any` types except where genuinely necessary (and commented).
- Server components by default; client components only where interactivity requires.
- All forms validate with zod schemas shared between client and server.
- Database access only through Supabase client with RLS enforced — never bypass RLS with the service key in client code.
- Accessibility: keyboard navigable, semantic HTML, proper labels, sufficient contrast.
- Mobile responsive at 375px minimum width.
- No console errors in production build.
- README.md with setup instructions for a new contributor.
