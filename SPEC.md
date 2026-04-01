# Tree Service Lead Gen — MVP Specification

## 1. Concept & Vision

A mobile-first web app where **customers snap a photo of a tree** that needs service (removal, trimming, stump grinding, etc.) and receive competitive quotes from local contractors within hours. The app uses AI to analyze the photo and extract key details (tree type, height estimate, health, obstacles), packages everything into a qualified lead, and distributes it to contractors who pay per lead. Customers get quotes; contractors get business; we take a cut.

**Vibe:** Trustworthy, fast, transparent. Feels like a modern home services platform — not a sketchy lead broker. Clean enough that contractors trust it with their money and customers trust it with their trees.

---

## 2. Design Language

- **Aesthetic:** Clean outdoorsy-professional. Think Angi's List meets a modern fintech app. Light, airy, with nature-green accents.
- **Color palette:**
  - Primary: `#16A34A` (green-600)
  - Secondary: `#15803D` (green-700)
  - Accent: `#F59E0B` (amber-500) — CTA buttons
  - Background: `#F9FAFB` (gray-50)
  - Surface: `#FFFFFF`
  - Text: `#111827` (gray-900)
  - Muted: `#6B7280` (gray-500)
- **Typography:** Inter (Google Fonts) — clean, modern, readable on mobile
- **Motion:** Subtle. Page transitions fade. Form steps slide in. Loading states use skeleton shimmer.
- **Icons:** Lucide React — consistent, clean, mobile-friendly stroke icons

---

## 3. Layout & Structure

### Pages

1. **`/` — Landing Page**
   - Hero: "Trees need work? Get quotes from local pros in minutes."
   - Single CTA: "Get My Free Quote →" (scrolls to form)
   - How it works (3 steps): Snap photo → AI analyzes → Contractors quote
   - Trust signals: "No obligation", "Quotes in 24h", "Local contractors"

2. **`/submit` — Customer Lead Submission**
   - Step 1: Upload photo (drag/drop or camera)
   - Step 2: Describe the work needed (checkboxes: removal, trimming, stump grinding, other)
   - Step 3: Location (address input + geolocation autofill)
   - Step 4: Contact info (name, phone, email)
   - Step 5: Review & Submit
   - Progress indicator across top

3. **`/submitted` — Confirmation**
   - "You're all set!" with lead ID
   - "Contractors in your area have been notified. Expect quotes within 24 hours."
   - Shows summary of what was submitted

4. **`/contractor/login` — Contractor Auth**
   - Email + password login via Supabase Auth
   - "New contractor? Apply →" (links to `/contractor/apply`)

5. **`/contractor/apply` — Contractor Application**
   - Business name, contact info, service area (city/zip), specialties
   - Approvals handled manually (admin flag in DB)

6. **`/contractor/dashboard` — Contractor Portal**
   - Tabs: **Leads** | **My Quotes** | **Account**
   - **Leads tab:** List of available leads in their area (card with photo thumbnail, location, service type, price paid indicator). Click to expand → full analysis + "Quote This Lead" button.
   - **My Quotes tab:** Quotes they've submitted with status (pending, accepted, rejected)
   - **Account tab:** Profile, Stripe payment setup link

7. **`/contractor/quote/[leadId]` — Quote Submission**
   - Shows: Lead photo (full size), AI analysis summary, location map
   - Form: Quote amount, notes to customer, estimated completion date
   - Submit → Stripe payment for lead access ($5-$25 TBD, configurable)

8. **`/admin` — Admin Dashboard** (simple, internal)
   - All leads with status
   - All contractors with approval toggle
   - All quotes

---

## 4. Features & Interactions

### Customer Flow
- **Photo upload:** Accept JPG/PNG, max 10MB. Show preview immediately. Compress client-side before upload to Supabase Storage.
- **Location:** Google Places Autocomplete for address. Also "Use my location" button.
- **AI Analysis:** On photo upload, call OpenAI GPT-4o (or Gemini) to extract:
  - Tree species/type (if visible)
  - Estimated height range
  - Health assessment (healthy, stressed, hazardous)
  - Visible damage or concerns
  - Equipment access notes (e.g., "fence present", "limited access")
  - Current season indicators
- **Lead status:** `new` → `quoted` → `contractor_contacted` (future)
- **No payment** required from customers. Free to submit.

### Contractor Flow
- Apply → admin approves → contractor can access leads
- Leads in their service area shown first; others hidden
- To quote: must pay via Stripe ($10/lead, configurable in env)
- Payment → lead contact details revealed for 24h
- Customer receives email with contractor's quote

### AI Analysis (OpenAI GPT-4o Vision)
- Prompt: Analyze this tree photo. Provide JSON with: species, heightEstimate, healthStatus, visibleDamage, accessNotes, seasonIndicators, confidence
- Fallback: If API fails, store "analysis pending" and retry
- Store full analysis JSON in `leads.analysis_data`

### Google Maps Integration
- Store coordinates from Places autocomplete
- Verify location is real and in service area (configurable)
- Display map on lead card for contractors

### PWA
- Service worker for offline resilience
- Add to home screen prompt
- Works in Safari (iOS) and Chrome (Android)

---

## 5. Component Inventory

### Shared
- `<Button>` — variants: primary (amber), secondary (green outline), ghost
- `<Input>` — text, email, phone; with label and error state
- `<Card>` — white surface, shadow-sm, rounded-xl
- `<Badge>` — status indicators (green=new, blue=quoted, gray=closed)
- `<Skeleton>` — loading shimmer for cards/lists
- `<ProgressBar>` — multi-step form indicator

### Customer
- `<PhotoUploader>` — drag/drop zone, camera capture, preview, compression
- `<ServiceSelector>` — checkbox grid: Tree Removal, Trimming/Pruning, Stump Grinding, Palm Cleaning, Other
- `<LocationInput>` — Google Places autocomplete + geolocation button
- `<LeadSummaryCard>` — photo thumb, service type, location, AI analysis snippet

### Contractor
- `<LeadCard>` — thumbnail, service type badge, location, distance, price paid indicator, expand button
- `<QuoteForm>` — amount input, notes textarea, date picker, submit
- `<AnalysisDisplay>` — formatted AI output with icons

---

## 6. Technical Approach

### Stack
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Database + Auth + Storage:** Supabase (PostgreSQL, Row Level Security)
- **AI:** OpenAI GPT-4o (Vision) for image analysis
- **Maps:** Google Maps JavaScript API + Places Autocomplete
- **Payments:** Stripe (contractors pay per lead)
- **PWA:** `@ducanh2912/next-pwa`
- **Deployment:** Vercel

### Database Schema

```sql
-- customers (tracked for lead ownership)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  photo_url TEXT NOT NULL,
  analysis_data JSONB, -- {species, heightEstimate, healthStatus, ...}
  service_types TEXT[] NOT NULL, -- ['removal', 'trimming', etc]
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_maps_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'new', -- new | quoted | closed
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- contractors
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT,
  service_area TEXT[], -- zip codes or city names
  specialties TEXT[],
  approved BOOLEAN DEFAULT false,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  contractor_id UUID REFERENCES contractors(id),
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  estimated_date DATE,
  status TEXT DEFAULT 'pending', -- pending | accepted | rejected
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- admin env: ADMIN_EMAIL, OPENAI_API_KEY, STRIPE_SECRET_KEY, NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

### API Routes
- `POST /api/leads` — create lead (customer submits)
- `GET /api/leads/[id]` — get lead (authenticated contractor who paid)
- `POST /api/leads/[id]/analyze` — trigger AI analysis
- `POST /api/contractors/apply` — contractor application
- `POST /api/quotes` — submit quote + trigger Stripe payment
- `POST /api/webhooks/stripe` — handle payment confirmations

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
ADMIN_EMAIL=mike@mtkinnovations.com
LEAD_PRICE_CENTS=1000
```

### Auth Strategy
- **Customers:** No auth needed. Lead tied to session cookie (UUID stored in httpOnly cookie).
- **Contractors:** Supabase Auth (email/password). JWT checked in middleware.
- **Admin:** Simple env-based check (ADMIN_EMAIL).

---

## 7. File Structure

```
tree-service-lead-gen/
├── SPEC.md
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Landing page
│   ├── globals.css
│   ├── submit/
│   │   └── page.tsx                # Customer lead form
│   ├── submitted/
│   │   └── page.tsx                # Confirmation
│   ├── contractor/
│   │   ├── login/page.tsx
│   │   ├── apply/page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── quote/[leadId]/page.tsx
│   ├── admin/
│   │   └── page.tsx
│   └── api/
│       ├── leads/route.ts
│       ├── leads/[id]/route.ts
│       ├── leads/[id]/analyze/route.ts
│       ├── contractors/apply/route.ts
│       ├── quotes/route.ts
│       └── webhooks/stripe/route.ts
├── components/
│   ├── ui/                         # Button, Input, Card, Badge, etc.
│   ├── PhotoUploader.tsx
│   ├── ServiceSelector.tsx
│   ├── LocationInput.tsx
│   ├── LeadCard.tsx
│   ├── AnalysisDisplay.tsx
│   └── QuoteForm.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── openai.ts
│   ├── stripe.ts
│   └── google-maps.ts
├── types/
│   └── index.ts
└── public/
    ├── manifest.json
    └── icons/
```

---

## 8. MVP Scope — What to Build Now

**Must have (MVP):**
- Landing page with clear CTA
- Full customer submission flow (photo → form → submit → confirm)
- AI analysis of uploaded photo (real GPT-4o Vision call)
- Supabase storage for photos + DB for leads
- Contractor apply/login (auth, no Stripe yet — manual approval)
- Contractor dashboard with lead list (mock leads for now, real leads once customers submit)
- Quote submission form
- Basic admin view
- PWA manifest + service worker

**Nice to have (later):**
- Real Stripe integration (stub it for now)
- Email notifications (stub with console.log for now)
- Google Maps geolocation (stub address input for now)
- Full RLS policies

Build the full Next.js app. Make it real and functional. Use real API keys where available.
