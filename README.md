# TreeQuote — Tree Service Lead Gen App

A Next.js app connecting homeowners with local tree service contractors. Homeowners submit a photo → AI analyzes it → contractors get matched leads.

## Tech Stack

- **Next.js 15** (App Router)
- **Supabase** (auth, database, storage)
- **Stripe** (lead access payments)
- **OpenAI** (tree photo analysis)
- **Google Maps** (location verification)
- **Playwright** (E2E tests)

---

## Setup

### 1. Clone & Install

```bash
npm install
```

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run this SQL schema in the Supabase SQL editor:

```sql
-- Customers (homeowners)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  photo_url TEXT,
  analysis_data JSONB,
  estimated_price JSONB,
  service_types TEXT[],
  address TEXT,
  latitude FLOAT,
  longitude FLOAT,
  google_maps_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'new',
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contractors
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  business_name TEXT,
  phone TEXT,
  service_area TEXT[],
  specialties TEXT[],
  approved BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  equipment JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lead access (Stripe payment tracking)
CREATE TABLE lead_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  contractor_id UUID REFERENCES contractors(id),
  stripe_session_id TEXT,
  stripe_payment_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  contractor_id UUID REFERENCES contractors(id),
  amount FLOAT,
  notes TEXT,
  estimated_date DATE,
  status TEXT DEFAULT 'pending',
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (Row Level Security)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Public read for leads (contractors need to see them)
CREATE POLICY "Public read leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Public read customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Users read own contractor" ON contractors FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert contractors" ON contractors FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own contractor" ON contractors FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Auth users can insert quotes" ON quotes FOR INSERT WITH CHECK (auth.uid() = contractor_id);
CREATE POLICY "Auth users can read own quotes" ON quotes FOR SELECT USING (auth.uid() = contractor_id);
CREATE POLICY "Auth users can insert lead_access" ON lead_access FOR INSERT WITH CHECK (auth.uid() = contractor_id);
CREATE POLICY "Auth users can read own lead_access" ON lead_access FOR SELECT USING (auth.uid() = contractor_id);
CREATE POLICY "Auth users can update lead_access" ON lead_access FOR UPDATE USING (auth.uid() = contractor_id);
```

3. Get your **Project URL** and **anon/service role keys** from Supabase Settings → API
4. Copy `.env.local.example` → `.env.local` and fill in your keys

---

### 3. Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your **Publishable Key** (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) and **Secret Key** (`STRIPE_SECRET_KEY`) from Stripe Dashboard → Developers → API keys
3. Set `LEAD_PRICE_CENTS=1000` for a $10 lead access fee
4. Configure your webhook endpoint:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the **webhook signing secret** to `STRIPE_WEBHOOK_SECRET`

For local testing, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

### 4. OpenAI

1. Get an API key at [platform.openai.com](https://platform.openai.com)
2. Set `OPENAI_API_KEY` in your `.env.local`
3. The AI analysis is triggered via `POST /api/leads/[id]/analyze`

---

### 5. Google Maps (optional)

1. Get an API key at [console.cloud.google.com](https://console.cloud.google.com)
2. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. Used for address verification and maps display

---

### 6. Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
LEAD_PRICE_CENTS=1000

# OpenAI
OPENAI_API_KEY=sk-...

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key

# App
ADMIN_EMAIL=you@example.com
```

---

### 7. Run

```bash
npm run dev        # Development server
npm run build -- --webpack  # Production build (use --webpack flag)
npx playwright test  # Run tests (38 tests, all passing)
```

---

## 🧪 Demo Mode

No Supabase or API keys needed to explore the app! When on the contractor login page (`/contractor/login`), click **"Explore Demo Account"** — it loads the full contractor dashboard with mock leads and quotes so you can see everything working immediately.

![Demo Mode Banner on login page]()

---

## Key Flows

### Customer Flow
1. Visit `/submit` → upload tree photo → add address + service type
2. AI analyzes the photo → lead is created in Supabase
3. Customer views quotes at `/customer/quotes/[leadId]`

### Contractor Flow
1. Visit `/contractor/apply` → apply + get approved
2. Browse leads at `/contractor/dashboard`
3. Click "Quote This Lead" → pay $10 via Stripe → submit quote
4. Customer accepts → contractor gets contact info

### Payment Flow
1. Contractor clicks "Pay with Stripe" on quote page
2. `POST /api/contractor/checkout` creates a Stripe Checkout session
3. Contractor pays → Stripe redirects back with `session_id`
4. `GET /api/contractor/verify-session` confirms payment + grants access
5. Lead access recorded in `lead_access` table

---

## Testing

```bash
npx playwright test
# or with UI:
npx playwright test --ui
```

Test files are in `tests/`:
- `landing.spec.ts` — public pages
- `submit.spec.ts` — customer submission flow
- `contractor.spec.ts` — contractor auth + apply
- `navigation.spec.ts` — routing
- `admin.spec.ts` — admin panel
- `stripe.spec.ts` — payment flow
- `customer.spec.ts` — customer quotes page
- `contractor-profile.spec.ts` — contractor profile/equipment