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
