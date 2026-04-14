# Tree Service Lead Gen — Full Vision Spec

## 1. Concept & Vision

A mobile-first web app where **customers snap a photo of a tree** and receive competitive quotes from local contractors within hours. AI analyzes the photo to extract tree details (species, height estimate, health, obstacles), packages everything into a qualified lead, and distributes it to contractors who pay per lead. Customers get quotes; contractors get business; we take a cut.

**Vibe:** Trustworthy, fast, transparent. Feels like a modern home services platform — not a sketchy lead broker. Clean enough that contractors trust it with their money and customers trust it with their trees.

---

## 2. Business Model

### Revenue
- **Contractors pay per lead** ($10-$50 depending on job complexity)
- **Optional:** Premium contractor subscriptions for unlimited leads + priority placement
- No cost to customers

### Lead Distribution
- Leads go to 3-5 contractors in the customer's zip code who have matching specialties
- First contractor to pay gets the lead contact info (real-time bidding)
- Multiple contractors can see the same lead but only contact details unlock on payment
- If no contractor pays within 24h, lead goes to wider area

### Contractor Capability Matching
Contractors set up their profile with:
- Equipment: bucket trucks (reach up to X ft), chippers, stump grinders, etc.
- Crew size: number of workers
- Specialty: tree removal, pruning, stump grinding, palm, etc.
- Service radius: zip codes

The AI uses this + photo analysis to give contractors a "match score" so they know which leads are best for them.

---

## 3. AI Analysis (GPT-4o Vision)

### What It Extracts
```
species: string              // "Oak", "Pine", "Palm", "Unknown"
heightEstimate: string       // "20-30 ft", "30-50 ft", "50+ ft"
healthStatus: string         // "healthy" | "stressed" | "hazardous" | "dead"
visibleDamage: string        // description of damage or disease
accessNotes: string          // "fence present", "near power lines", "clear access"
seasonIndicators: string     // "leafless (winter)", "full canopy (summer)"
confidence: number           // 0.0-1.0
obstacles: string[]          // ["fence", "house nearby", "power lines"]
estimatedJobComplexity: string // "simple" | "moderate" | "complex" | "specialized"
```

### Tree Height Estimation Strategy
GPT-4o estimates height from context clues (relative size of reference objects like houses, fences, cars, people) — no depth camera needed. Returns ranges like "30-40 ft" which is what contractors need anyway. This is standard industry practice for initial estimates.

### Pricing Estimate (AI-Generated for Customer)
After analysis, AI generates a **customer-facing estimate range**:
```
estimatedPrice: { low: number, high: number, currency: "USD" }
priceFactors: string[]  // ["Large oak, 40ft", "Near house — careful removal needed", "Easy access from driveway"]
```
This is shown to the customer before contractors quote (transparent, builds trust). Contractors see the same analysis and their own quote form.

---

## 4. Pages & User Flows

### Customer Flow

#### `/` — Landing Page
- Hero: "Trees need work? Get quotes from local pros in minutes."
- Single CTA: "Get My Free Quote →"
- How it works (3 steps): Snap → AI analyzes → Contractors quote
- Trust signals: "No obligation", "Quotes in 24h", "Local contractors"
- Already built ✅

#### `/submit` — Customer Lead Submission
5-step wizard: Photo → Services → Location → Contact → Review
- Step 1: Upload photo (drag/drop or camera)
- Step 2: Services needed (checkboxes)
- Step 3: Address input
- Step 4: Contact info
- Step 5: Review & submit
- Progress indicator
- **Shows AI price estimate on review step** (if analysis done)
- Already built ✅

#### `/submitted` — Confirmation
- "You're all set!" with lead ID
- "Contractors notified. Expect quotes within 24 hours."
- Shows summary + AI analysis preview

#### `/customer/quotes/[leadId]` — Customer's Quotes View
- Shows all quotes received for their lead
- Each quote: contractor name, amount, notes, timestamp
- Customer can accept a quote (which notifies the contractor)
- Accepting doesn't lock them in — just means "I want to work with this contractor"
- Status: waiting → quotes received → accepted → job booked (manual follow-up)

### Contractor Flow

#### `/contractor/login` — Login
- Email + password (Supabase Auth)
- Already built ✅

#### `/contractor/apply` — Application
- Business name, contact info, service area (zip codes), specialties
- Equipment/crew info: bucket truck reach, crew size, stump grinder available, etc.
- "Apply" button → pending approval
- Admin approves in `/admin`

#### `/contractor/dashboard` — Main Portal
3 tabs: **Leads** | **My Quotes** | **Profile**

**Leads tab:**
- List of leads in contractor's service area
- Each shows: photo thumbnail, service type, location, AI analysis summary, "match score"
- Sort: newest, match score, price estimate
- "Quote This Lead" button → leads to quote form
- Lead card shows: height estimate, health status, complexity, obstacles
- Leads marked as new vs. already quoted

**My Quotes tab:**
- Quotes submitted with status (pending, accepted, rejected)
- Click to see quote details + lead details

**Profile tab:**
- Business info, equipment setup, service area
- Stripe payment setup
- Lead pricing info ($X per lead)

#### `/contractor/quote/[leadId]` — Quote Submission
- Shows lead photo (full size, expandable)
- Shows AI analysis: species, height, health, access notes, complexity
- Shows customer-facing price estimate (helps contractor price competitively)
- Form: quote amount, notes to customer, estimated completion date
- Submit → Stripe payment ($10/lead) → lead contact info revealed for 24h
- If Stripe fails, quote not submitted

#### `/contractor/profile` — Equipment & Crew Setup
- Bucket truck reach (dropdown: <30ft, 30-50ft, 50-75ft, 75+ft)
- Crew size (1-10+)
- Equipment available: chipper, stump grinder, climber, etc.
- Specialties checkboxes
- Service area (zip codes)
- This info used for match scoring

### Admin Flow

#### `/admin` — Admin Dashboard
- All leads with status, AI analysis preview, quote count
- All contractors with approval toggle
- Approve/reject contractor applications
- Simple table views, no fancy charts needed yet

---

## 5. AI Pricing Estimation Logic

Based on analysis data + service type, generate a price range:

```
BASE_PRICES = {
  removal: { small: 500, medium: 1500, large: 4000 },  // 3 size tiers
  trimming: { small: 150, medium: 400, large: 1000 },
  stump: { small: 100, medium: 300, large: 750 },
  palm: { small: 150, medium: 350, large: 600 },
}

MODIFIERS = {
  healthy: 1.0,
  stressed: 1.2,    // more work
  hazardous: 1.5,   // extra caution needed
  dead: 0.8,        // no foliage to deal with
  fence: 1.15,      // harder access
  house_nearby: 1.2, // careful removal
  power_lines: 1.3,  // special handling
  large_size: 1.5,  // bigger tree
}
```

GPT-4o returns the analysis, then the API applies pricing logic to generate `estimatedPrice`. This is shown to both customer and contractors.

---

## 6. Lead Gen Business Model (Reference)

**How Angie's List/HomeAdvisor work:**
1. Contractor signs up, picks service categories + zip codes
2. Customers submit requests (similar to our photo flow)
3. Leads distributed to contractors in that zip code
4. Contractors pay per lead ($15-$150 depending on service type)
5. Contractor gets customer contact info upon payment
6. Platform takes 30-50% cut

**Our differentiator:**
- AI photo analysis = we give contractors WAY more info than a text request
- Price estimate upfront = transparency for customers
- Match scoring = contractors don't waste time on wrong leads
- Photo-centric = much more informative than text forms

---

## 7. Marketing & Growth Strategy

### Initial Customer Acquisition
1. **Nextdoor** — neighborhood-specific posts about tree service needs
2. **Facebook Marketplace** — tree service listings
3. **Google Local Service Ads** — when people search "tree removal near me"
4. **Nextdoor Ads** — hyper-local targeting
5. **SEO** — "tree removal cost estimator [city]" + blog content

### Initial Contractor Acquisition
1. **Cold outreach** — find tree service companies on Google Maps in target cities, email/call them
2. **Facebook Groups** — tree service contractor groups
3. **Yelp** — reach out to highly-rated tree services
4. **Industry forums** — arborist forums, equipment manufacturer forums

### Launch Strategy
1. Pick 1 city to start (Atlanta based on demo data)
2. Get 10 contractors signed up before launch
3. Drive traffic with Nextdoor + Facebook ads ($500 test)
4. Target keywords: "tree removal [city]", "tree trimming near me"

---

## 8. PWA vs Native App Decision

**Decision: PWA (Progressive Web App) — keep existing approach**

**Reasons:**
- iOS/Android native would require separate codebases
- PWA with `@ducanh2912/next-pwa` works well on both mobile and desktop
- Service worker enables offline resilience and home screen installation
- No app store review process = faster iteration
- Most users won't notice/care it's not native
- Same approach Airbnb, Uber, Twitter (now X) used for their initial mobile products

**If PWA hits limitations (unlikely for this use case):**
- Camera access works in PWAs
- Push notifications work
- Can add homescreen shortcut
- Would only go native if we needed background processing, Bluetooth, or AR features

---

## 9. Technical Architecture

### Stack (unchanged — already optimal)
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS v4
- **Database + Auth + Storage:** Supabase (PostgreSQL, Row Level Security)
- **AI:** OpenAI GPT-4o (Vision) for image analysis
- **Maps:** Google Maps JavaScript API + Places Autocomplete
- **Payments:** Stripe (contractors pay per lead)
- **PWA:** `@ducanh2912/next-pwa`
- **Deployment:** Vercel

### Database Schema Updates

```sql
-- Add to leads table
analysis_data JSONB,        -- already exists
estimated_price JSONB,      -- {low, high, currency, factors} NEW
customer_visible boolean DEFAULT true,

-- Contractor profiles (extended from auth)
ALTER TABLE contractors ADD COLUMN equipment JSONB;
ALTER TABLE contractors ADD COLUMN crew_size INTEGER;
ALTER TABLE contractors ADD COLUMN bucket_truck_reach TEXT;  -- "<30ft", "30-50ft", "50-75ft", "75+ft"
ALTER TABLE contractors ADD COLUMN has_stump_grinder BOOLEAN DEFAULT false;
ALTER TABLE contractors ADD COLUMN has_chipper BOOLEAN DEFAULT false;

-- Quotes
ALTER TABLE quotes ADD COLUMN stripe_payment_id TEXT;
ALTER TABLE quotes ADD COLUMN contact_revealed_at TIMESTAMPTZ;

-- Lead-bid tracking (who viewed/paid for which lead)
CREATE TABLE lead_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  contractor_id UUID REFERENCES contractors(id),
  paid BOOLEAN DEFAULT false,
  stripe_payment_id TEXT,
  accessed_at TIMESTAMPTZ DEFAULT now()
);
```

### API Routes to Add
- `GET /api/leads/available` — contractor gets leads in their area
- `POST /api/contractors/profile` — update equipment/crew info
- `POST /api/contractors/leads/[id]/access` — pay for lead access + Stripe
- `GET /api/customers/[leadId]/quotes` — customer sees all quotes for their lead
- `POST /api/customers/quotes/[quoteId]/accept` — customer accepts a quote

---

## 10. File Structure (Current)

Already built in the existing codebase. Key structure:
```
app/
├── page.tsx                          # Landing ✅
├── submit/page.tsx                    # Customer wizard ✅
├── submitted/page.tsx                # Confirmation
├── contractor/
│   ├── login/page.tsx               # Login ✅
│   ├── apply/page.tsx               # Apply
│   ├── dashboard/page.tsx           # Dashboard ✅
│   ├── quote/[leadId]/page.tsx      # Quote form
│   └── profile/page.tsx             # Equipment setup (NEW)
├── customer/
│   └── quotes/[leadId]/page.tsx      # Customer view quotes (NEW)
├── admin/page.tsx                   # Admin ✅
└── api/
    ├── leads/route.ts               # Create lead ✅
    ├── leads/[id]/route.ts          # Get lead ✅
    ├── leads/[id]/analyze/route.ts  # AI analysis ✅
    ├── leads/[id]/quotes/route.ts   # Quotes for lead
    ├── contractors/apply/route.ts   # Apply ✅
    ├── quotes/route.ts              # Create quote
    └── webhooks/stripe/route.ts     # Stripe webhooks
```

---

## 11. MVP Improvements Needed

Based on existing code review:

### Must Fix/Add (MVP priority)
1. ~~**Quote submission flow**~~ — `/contractor/quote/[leadId]` needs full Stripe payment flow (mostly done)
2. ~~**Customer quotes view**~~ — `/customer/quotes/[leadId]` exists ✅
3. ~~**Contractor profile/equipment setup**~~ — `/contractor/profile` exists ✅
4. ~~**AI pricing estimation**~~ — `generatePriceEstimate()` in `lib/ai-analysis.ts` ✅
5. **Stripe integration** — stubbed, needs real keys
6. ~~**Lead access tracking**~~ — `lead_access` table in schema ✅
7. **Match scoring** — show contractors how well a lead matches their equipment (partially done via mock data)

### Nice to Have
- Email notifications (nodemailer or Resend)
- Google Maps integration for location (currently just text address)
- Real contractor approval workflow in admin
- Push notifications for new quotes

## 12. Testing

### Playwright E2E Testing (Active)
- 48 tests covering all major pages and flows
- Chromium and Mobile Safari (WebKit)
- Run tests: `npm test`
- Run Chromium only: `npm run test:chromium`
- Run headed: `npm run test:headed`
- Install browsers: `npm run playwright:install`

### Test Coverage
- Landing page (hero, CTA, navigation)
- Customer submission wizard (all 5 steps)
- Contractor login + apply flow
- Contractor dashboard (auth guard, tabs)
- Admin dashboard (leads, contractors, quotes)
- Mobile viewport rendering
- Multi-select specialty toggles

---

## 12. Decisions Needed from Mike

1. **Lead price point**: $10/lead for MVP? Or tiered ($10 removal, $5 trimming)? Industry is $15-150. I'd start at $15 for removal leads, $5 for trimming/stump.

2. **Cities to launch**: Atlanta is demo-ready. Should we launch there or pick a different market?

3. **Contractor onboarding**: Manual approval for now (admin flips a boolean). Is that okay or do we need self-serve?

4. **Quote validity**: Once a contractor pays $10, they see customer contact for 24h. Should we extend that window? Or let them see it indefinitely after payment?

5. **Multi-contractor bidding**: Our model means the FIRST contractor to pay wins. Alternative: show quotes to customer in real-time and they pick. Which do we want to implement first?

6. **AI price estimate visibility**: Show AI's estimated price range to BOTH customer and contractors? Or only customer? Or only contractors? Showing it to both creates transparency but contractors might feel constrained.

---

*Last updated: 2026-04-13*