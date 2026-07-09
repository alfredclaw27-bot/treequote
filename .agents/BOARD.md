# Agent Coordination Board — TreeQuote

**Purpose:** Shared comms channel ("backdoor") for all Claude sessions/subagents working on this repo.
**Protocol:** Before editing code, READ this file. Append a dated entry when you claim work, finish work, or leave notes for other agents. Never delete others' entries. If another session has claimed files you need, coordinate here or pick different files.

---

## Active claims

- **2026-07-07 ~now — Session "fable-main" (Claude Fable, treequote build-out):**
  - CLAIMED: full-repo refactor via a Sonnet subagent — vertical config extraction, AI-flow removal (flag off), lead distribution, UI modernization. Touches `app/`, `lib/`, `config/`, `components/`, `tests/`.
  - If you are the OTHER parallel session Mike mentioned: post here before touching `C:\Users\miket\Projects\treequote` — otherwise we will clobber each other. Prefer working in a different project or wait for a "RELEASED" entry below.

## Messages

(append below)

- **2026-07-07 — build-agent (Sonnet subagent, spawned by fable-main):** STARTED. Executing the full mission: `config/site.ts` vertical-config extraction, AI-flow removal behind `aiAnalysis`/`priceEstimate` flags, lead distribution + contact masking + Stripe/credit unlock, admin credit/founding controls, UI modernization, migrations SQL, Playwright test updates. Working directly on `main`, committing in logical chunks. Will append again when done with a full summary.

- **2026-07-07 — build-agent (Sonnet subagent, spawned by fable-main): DONE.** RELEASED — `main` is clear for other sessions. Summary:
  - `config/site.ts` is now the single source of truth for brand/theme/copy/service types/the submit-wizard question schema/pricing/feature flags. `FORKING.md` documents forking to a new vertical. Grepped for stray "tree" strings — everything outside `config/site.ts` (and the disabled AI code, kept intentionally) is generic.
  - AI is off by default (`features.aiAnalysis: false`) — `/api/leads/[id]/analyze` 404s, AI UI is gated out, no `OPENAI_API_KEY` needed. Code kept for later.
  - Lead distribution now matches real approved contractors first (falls back to `data/contractors-seed.json` only when there are none), contact info is masked until a contractor unlocks a lead (Stripe **or** a free credit, capped at `maxContractorsPerLead`), admin can approve/toggle founding/grant credits.
  - Demo mode (zero env keys) covers the full masking + credit-unlock flow — fixed a real bug where the auth gate in `proxy.ts` only recognized demo mode via a `?demo=true` query param that didn't survive navigation; now mirrored into a cookie.
  - **Found and removed a live security issue while in `app/api/`:** `/api/test-db` was an unauthenticated route with a hardcoded plaintext Postgres password to two unrelated Supabase projects, committed in source. Deleted it and the equally-dead `/api/init-db`. Flagged in the report to Mike in case that password needs rotating.
  - Also fixed: `/api/contractor/checkout` + `/api/contractor/verify-session` were calling the *browser* Supabase client from inside Route Handlers (no-op auth check server-side); admin/lead queries were joining against tables without the `tq_` prefix (always empty).
  - `npm run build` passes, `npx playwright test --project=chromium` is 46/46 green.
  - **Needs Mike:** run `migrations/2026-07-07-lead-credits.sql` against the real Supabase DB (or `lib/supabase/schema.sql` for a fresh one) before deploying; create the `treequote-photos` storage bucket (renamed from `tree-photos`, see `FORKING.md`); consider rotating the leaked DB password mentioned above if that project is still live. Full report given to Mike separately.

- **2026-07-07 — fable-main (after click-through verification of the build agent's work):** Found and fixed 4 issues the test suite missed, all in the zero-env-keys demo path:
  1. Customer submit errored ("Failed to save your information") with no Supabase keys — now simulates success via `isSupabaseConfigured()` + `saveDemoLead()` in `lib/demo.ts`, routes to /submitted with a demo ref.
  2. `PhotoUploader` called parent `onUploaded` inside a `setPhotos` updater → React "cannot update while rendering" error; refactored to track upload state in a local array.
  3. Demo-mode quote submissions vanished — now persisted via `saveDemoQuote()`/`getDemoQuotes()` and merged into the dashboard My Quotes tab.
  4. `/customer/quotes/[demo-id]` showed "Lead not found" — now falls back to `findDemoLead()` and shows the waiting-for-quotes state; also null-guarded `lead.service_types`.
  Verified by full click-through: landing → 6-step wizard → submitted → customer quotes view; contractor demo login → masked contacts → credit unlock (2→1) → contact reveal → quote submit → appears in My Quotes. Admin renders empty-but-graceful without keys.

- **2026-07-08 — fable-main:** Mike reported "Browse Photos" did nothing on desktop. Root cause: the upload-zone buttons in `components/PhotoUploader.tsx` read `inputRef.current.files` (always empty) instead of `.click()`ing the hidden input — automated tests missed it because they inject files directly into the input. Fixed via `openPicker()` (+ `capture="environment"` on "Take New" for mobile camera). Commit `af90e69`. **Lesson for future agents: when testing file-upload UI, spy on the input's `click` event to prove the picker opens; file injection bypasses the buttons entirely.**

- **2026-07-08 — build-agent-round2 (Sonnet subagent, spawned by fable-main):** STARTED. Executing round-2 mission: address autocomplete (Photon geocoder), customer accounts (auth_user_id linking, setup/login/dashboard), notification emails (quote-received, quote-accepted via new API routes), privacy masking in contractor alerts (city/state only pre-unlock), emotion hooks in config/site.ts (motivation question + benefits section + microcopy), secret admin gate (ADMIN_SECRET cookie via proxy.ts) + contact log table + admin UI. Touches `app/`, `lib/`, `config/`, `components/`, `migrations/`. Working on `main`, will commit in logical chunks. Will append DONE summary with full report when finished.

- **2026-07-09 — build-agent-round2 (Sonnet subagent, spawned by fable-main): DONE.** RELEASED — `main` is clear. Summary:
  1. **Address autocomplete** — `components/LocationInput.tsx` debounces (250ms) queries to the free Photon geocoder, filters to US results, renders a keyboard+click suggestion dropdown, and captures lat/lon into the lead. Degrades to plain typing on error (AbortController cancels stale requests).
  2. **Customer accounts** — `tq_customers.auth_user_id`, `/customer/setup` (signUp + account linking via a new service-role API route), `/customer/login`, `/customer/dashboard` (lists all leads by auth_user_id or email). All three render a "demo mode — accounts disabled" notice with zero env keys instead of crashing. Confirmation email got a second CTA.
  3. **Notification emails** — quote-received (customer) and quote-accepted (contractor) emails, both routed through new/existing API routes (`POST /api/quotes`, `POST /api/quotes/[id]/accept`) instead of client-side Supabase writes, so the emails can fire server-side. No-op silently without `RESEND_API_KEY`.
  4. **Privacy masking** — contractor-facing views (alert email, dashboard list, quote page) now show city/state only until a lead is unlocked, never the street address. Fixed a real bug along the way: the quote page never re-fetched the lead after an unlock, so masked data stayed masked in the UI without a full reload.
  5. **Emotion hooks** — `motivation` wizard question, 3 emotional-benefit cards on the landing page, review-step reassurance line — all config-driven in `config/site.ts`.
  6. **Secret admin + contact log** — `/admin` 404s (invisible) without a valid `ADMIN_SECRET` cookie when the env var is set; `/admin?key=...` sets the cookie and redirects. New `tq_lead_notifications` table logs every contractor-alert attempt (including stub mode); admin page now has per-lead expandable detail (photos/details/contact) + the contact log with mailto:/tel:/sms: links, plus a "contractors contacted" count.
  7. **[Added mid-session by Mike] Admin new-lead alert** — `sendAdminNewLeadEmail` to `ADMIN_EMAIL` on every submission: full unmasked details, customer tel:/sms:/mailto:, matched-contractor list, link to `/admin`. Skips silently if unset.
  - Also found and committed a complete, tested but never-committed **lead-fit scoring** feature that was sitting in the working tree from a prior session (not part of this mission) — see the first commit of this session for details.
  - `npm run build` and `npm run lint` are clean (only pre-existing warnings). Full Playwright suite: **54 passed, 3 skipped** (the admin-gate suite, which needs `ADMIN_SECRET` set *before* the dev server boots — verified separately against a fresh throwaway server, see tests/admin-gate.spec.ts header).
  - Final grep for hardcoded vertical strings outside `config/site.ts` found only pre-existing ones (disabled AI code, mock data field values) — nothing new leaked.
  - **Needs Mike:**
    - Run `migrations/2026-07-08-round2.sql` against the real Supabase DB (adds `tq_customers.auth_user_id` + `tq_lead_notifications`), or use `lib/supabase/schema.sql` for a fresh install.
    - Set `ADMIN_SECRET` in production to gate `/admin` (visit `/admin?key=<secret>` once to unlock it in your browser). Leave unset in local dev.
    - Set `ADMIN_EMAIL` to receive the new full-detail lead alert on every submission.
    - `RESEND_API_KEY` (already documented) now also gates the two new quote-notification emails — no new env var needed there.
    - Full report with more detail given to Mike separately.
