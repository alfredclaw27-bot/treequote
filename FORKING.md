# Forking TreeQuote to a new vertical

This app is built as a lead-gen template. TreeQuote (tree service) is just
the first vertical running on it. Forking to kitchen remodels, bathroom
remodels, patios/hardscaping, roofing, etc. is meant to be **mostly a
config edit**, not a rewrite.

## The short version

1. Copy the repo (or `git clone` + rename).
2. Edit `config/site.ts` — see field-by-field guide below.
3. Also update the `@theme` color values in `app/globals.css` to match
   `config/site.ts`'s `theme` object (Tailwind reads CSS at build time, so
   the two must be kept in sync manually — see the comment in that file).
4. Swap the logo/emoji (`brand.emoji`) and replace `data/contractors-seed.json`
   with real contractors for your market (or leave it — it's just used as a
   demo/fallback contractor pool when no real contractors have signed up
   yet).
5. Run the SQL in `lib/supabase/schema.sql` against a fresh Supabase
   project (or `migrations/2026-07-07-lead-credits.sql` against an existing
   TreeQuote database).
6. Create a Supabase Storage bucket named `photoStorageBucket` from
   `config/site.ts` (derived from `brand.shortName`, e.g. `treequote-photos`
   → for a fork named "PatioQuote" it'd be `patioquote-photos`). Public: true.
7. `npm run build` and you're forked.

There should be **zero hardcoded vertical-specific strings** (like "tree")
anywhere outside `config/site.ts`. If you find one, it's a bug — please fix
it or flag it.

## `config/site.ts` field guide

- **`brand`** — name, tagline, domain, support email. Shows up in the header,
  emails, and page titles.
- **`theme`** — hex colors. Also update `app/globals.css`'s `@theme` block
  (`--color-primary`, `--color-primary-dark`, `--color-accent`,
  `--color-accent-dark`) to match. Every component uses the `primary`/
  `accent` Tailwind tokens (e.g. `bg-primary`, `text-accent-dark`,
  `bg-primary/10` for tints) instead of hardcoded `green-600`/`amber-500`,
  so this one edit re-themes the whole app.
- **`hero` / `howItWorksCustomer` / `trustSignals` / `customerBanner`** —
  landing page copy for the customer-facing half of the page.
- **`contractorPitch` / `socialProof` / `footer`** — landing page copy for
  the contractor-facing half.
- **`itemNounSingular` / `itemNounPlural`** — e.g. `"tree"`/`"trees"` or
  `"kitchen"`/`"kitchens"`. Used in a few sentences like "Upload photos of
  the ___ you need service on."
- **`serviceTypes`** — the list of services customers can request and
  contractors can specialize in. Each has its own `leadPriceCents`. This
  drives the service-selector step of the submit wizard, contractor
  specialties on the apply/profile pages, and lead pricing.
- **`detailFields`** — the typed question schema for the submit wizard's
  "Details" step. This is the biggest lever for a new vertical: swap tree
  height/species/stump questions for kitchen cabinet style/square footage/
  appliance package questions, etc. Supports `select`, `multiselect`,
  `checkbox-group`, `checkbox`, `text`, `textarea`, and `number` field
  kinds, plus a `showIf` conditional (see the `stumpDiameter` field for an
  example of a field that only shows when another field has a specific
  value). `components/DetailsForm.tsx` renders whatever you put here — you
  never need to touch that component.
- **`maxContractorsPerLead`** — how many contractors can unlock (pay for or
  spend a credit on) the same lead before it's "full."
- **`emailCopy`** — subject lines and from-addresses for the three
  transactional emails (contractor application, contractor approved,
  customer confirmation) plus the contractor lead-alert email.
- **`features.aiAnalysis` / `features.priceEstimate`** — off by default.
  Flip `aiAnalysis: true` to re-enable the GPT-4o photo analysis flow
  (requires `OPENAI_API_KEY`); the `/api/leads/[id]/analyze` route,
  `lib/ai-analysis.ts`, and `<AnalysisDisplay>` are all still in the
  codebase, just gated behind this flag. Note the AI analysis prompt in
  `lib/ai-analysis.ts` is still tree-specific — if you turn this on for a
  non-tree vertical you'll want to rewrite that prompt too.
- **`pwa`** — install prompt copy, consumed by `app/manifest.ts` (which
  replaces the old static `public/manifest.json` — Next.js generates the
  manifest route from this file automatically).

## What to also touch

- **`data/contractors-seed.json`** — demo/fallback contractor list used by
  `lib/notifications.ts` when there are no real approved contractors in the
  database yet (fresh installs, local dev). Replace with contractors for
  your real market, or leave the placeholders for demoing.
- **`lib/mock-data.ts`** — the 5 example leads shown in the contractor demo
  account (`/contractor/login` → "Explore Demo Account"). Not required to
  edit, but worth it for a polished demo.
- **Logo / favicon** — `public/favicon.svg` and the PWA icons referenced in
  `app/manifest.ts` (`/icons/icon-192.png`, `/icons/icon-512.png` — add
  those files under `public/icons/`).

## What you should NOT need to touch

Landing page, submit wizard, contractor dashboard/quote/apply/profile
pages, admin page, emails, and the PWA manifest all read from
`config/site.ts`. If a fork requires editing any of those files just to
change copy or the question set, that's a bug in the config extraction —
please fix it rather than hardcoding a workaround.
