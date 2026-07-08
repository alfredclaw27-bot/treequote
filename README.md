# TreeQuote — Home Services Lead Gen App

A Next.js lead-gen app connecting homeowners with local contractors. Homeowners submit a request (photos + structured job details) → matching contractors are notified → contractors unlock the lead (pay or use a free credit) → contractors quote → customer picks one.

**This is a template, not just a tree-service app.** Everything vertical-specific (branding, copy, service types, the submit-wizard question schema, pricing, theme color) lives in [`config/site.ts`](./config/site.ts). See [`FORKING.md`](./FORKING.md) for how to fork this to a new vertical (kitchen remodel, bathroom, patio, roofing, etc.) in a handful of edits.

No AI is required to run this — the GPT-4o photo-analysis flow from the original concept still exists in the codebase (`lib/ai-analysis.ts`, `/api/leads/[id]/analyze`) but is **off by default** behind `config.features.aiAnalysis`. The active MVP flow is a structured lead-gen form, not photo analysis.

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** (auth, database, storage)
- **Stripe** (lead-unlock payments) — optional; free lead credits work without it
- **Resend** (transactional + lead-alert emails) — optional; logs to console without it
- **OpenAI** (photo analysis) — optional, off by default
- **Playwright** (E2E tests)

---

## Setup

### 1. Clone & Install

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. **New install:** run [`lib/supabase/schema.sql`](./lib/supabase/schema.sql) in the Supabase SQL editor.
   **Existing TreeQuote database:** run [`migrations/2026-07-07-lead-credits.sql`](./migrations/2026-07-07-lead-credits.sql) instead — it adds `lead_credits`/`is_founding` to contractors, `details`/`photo_urls` to leads, and unlock-tracking columns to `tq_lead_access` without touching existing data.
3. Create a **Storage bucket** for lead photos, named after `photoStorageBucket` from `config/site.ts` (derived from `brand.shortName` — `treequote-photos` by default). Public: true.
4. Get your **Project URL** and **anon/service role keys** from Supabase Settings → API and add them to `.env.local` (see Environment Variables below).

---

### 3. Stripe (optional)

Leads can be unlocked either by paying via Stripe **or** by spending a free lead credit — you don't need Stripe configured to demo or even run the app; the checkout button just shows a "payments not configured" message until you add keys.

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your **Publishable Key** (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) and **Secret Key** (`STRIPE_SECRET_KEY`) from Stripe Dashboard → Developers → API keys
3. Configure your webhook endpoint:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the **webhook signing secret** to `STRIPE_WEBHOOK_SECRET`

Lead pricing is **per service type**, set in `config/site.ts` (`serviceTypes[].leadPriceCents`) — there's no single global `LEAD_PRICE_CENTS` env var anymore.

For local testing, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

### 4. Resend (email — optional)

1. Get a free API key at [resend.com](https://resend.com) (100 emails/day free)
2. Add `RESEND_API_KEY` to `.env.local`
3. Without it, the app doesn't crash — lead alerts and confirmation emails are logged to the server console instead of sent.

---

### 5. OpenAI (optional, disabled by default)

Only needed if you flip `features.aiAnalysis: true` in `config/site.ts`.

1. Get an API key at [platform.openai.com](https://platform.openai.com)
2. Set `OPENAI_API_KEY` in your `.env.local`
3. Analysis is triggered via `POST /api/leads/[id]/analyze`, which returns `404` while the flag is off.

---

### 6. Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (optional — free lead credits work without this)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (optional — emails log to console without this)
RESEND_API_KEY=re_your_key_here

# OpenAI (optional — only needed if features.aiAnalysis is turned on)
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

None of these are required to run the app in demo mode — see below.

---

### 7. Run

```bash
npm run dev              # Development server
npm run build             # Production build
npx playwright test       # Run tests
npx playwright test --project=chromium   # Chromium only
```

---

## 🧪 Demo Mode

No Supabase or API keys needed to explore the app. On the contractor login page (`/contractor/login`), click **"Explore Demo Account"** — it loads the full contractor dashboard with mock leads, masked contact info, and 2 free lead credits (tracked in `localStorage`) so you can walk through the entire unlock → quote flow with zero backend setup.

---

## Key Flows

### Customer Flow
1. Visit `/submit` → upload photos → pick service type(s) → answer config-driven job-detail questions → address → contact info → review → submit.
2. Matching contractors (by zip/city + specialty) are notified by email; the customer gets a confirmation email with a link to `/customer/quotes/[leadId]`.
3. Customer watches quotes arrive at `/customer/quotes/[leadId]` and can accept one.

### Lead Distribution
When a lead comes in, `POST /api/notifications/send-lead-alerts`:
1. Matches contractors by zip/city + specialty — prefers real approved contractors in `tq_contractors`, falling back to `data/contractors-seed.json` when there are no real signups yet (fresh installs / local dev).
2. Sends a branded HTML email to the matched contractors.
3. Records who was notified on the lead; `/admin` can resend manually.

Works without `RESEND_API_KEY` configured — it just logs what it *would* send instead of crashing.

### Contractor Flow
1. Visit `/contractor/apply` → apply → get approved in `/admin`.
2. Browse leads at `/contractor/dashboard` — customer contact info is **masked** (first name + last initial, phone/email hidden) until the lead is unlocked.
3. On a lead's page, unlock it either by **paying via Stripe** or by **spending a free lead credit** (granted by an admin, e.g. for founding contractors).
4. Up to `config.maxContractorsPerLead` (default 5) contractors can unlock the same lead — after that it stops offering.
5. Once unlocked, full contact info is revealed and the contractor can submit a quote.

### Admin Flow (`/admin`)
- Approve/revoke contractors.
- Toggle **founding contractor** status.
- Grant lead credits (+1 / +5 buttons).
- View/manage lead status and resend contractor alerts.

---

## Testing

```bash
npx playwright test --project=chromium
```

Test files are in `tests/`:
- `landing.spec.ts` — public landing page
- `submit.spec.ts` — customer submission wizard
- `contractor.spec.ts` — contractor auth + apply + demo mode
- `contractor-profile.spec.ts` — contractor profile/equipment
- `navigation.spec.ts` — mobile viewport + component behavior
- `admin.spec.ts` — admin panel + submitted confirmation page
- `stripe.spec.ts` — payment/unlock auth gating
- `customer.spec.ts` — customer quotes page
- `lead-unlock.spec.ts` — contact-info masking + free-credit unlock flow (demo mode)

---

## Forking to a new vertical

See [`FORKING.md`](./FORKING.md). Short version: copy the repo, edit `config/site.ts` (and the matching `@theme` colors in `app/globals.css`), swap the logo, and you're forked.
