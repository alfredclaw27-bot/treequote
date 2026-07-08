# TreeQuote Go-To-Market Plan

*Written 2026-07-07. Goal: real homeowner quote requests flowing to contractors, and contractors paying per lead — with the first cohort of contractors free.*

## The core sequencing rule

**Supply first, demand second — but barely.** A homeowner who submits a request and hears nothing is gone forever and tells neighbors. A contractor with no leads yet costs you nothing (they're free anyway). So: sign 5–10 founding contractors in ONE metro before spending a dollar on customer traffic. Do not launch in more than one metro.

## Phase 0 — Pick the market & get legal-ready (Week 1)

- **Pick one metro you can service credibly.** Demo data is Atlanta, but pick where you can realistically call contractors and, ideally, where you already have Rapid Patios contractor relationships — tree guys and hardscapers know each other and refer.
- Operate under your existing LLC (DBA "TreeQuote" or similar) — don't form a new entity yet.
- Ship the boring pages before any outreach: Terms, Privacy, and "How it works for contractors." Contractors WILL check whether you look legit before giving you their cell number.
- Set up a dedicated email (you have AgentMail infra) and, strongly recommended, a **phone number** (Google Voice / OpenPhone, ~$15/mo). Contractors do business by phone; a lead-gen site with no phone number reads as spam. (Known gap: Rapid Patios has no number either — one OpenPhone account can host both.)

## Phase 1 — Founding contractors (Weeks 1–3), target: 8–10 signed

**The offer (this is the whole pitch):**
> "I run a local site where homeowners request tree work quotes with photos and job details. I'm launching in [metro] and picking 10 founding companies. You get every matching lead **free for your first 20 leads / 90 days** (whichever comes first). No contract, no card. In exchange: respond to leads within 24h and give me feedback. After that it's pay-per-lead (~$15–25), only for leads you choose to unlock."

**Where to find them (in order of conversion rate):**
1. **Phone calls to Google Maps listings.** Search "tree removal [metro]", skip the top 3 (big spenders, already drowning in HomeAdvisor), target companies with 10–80 reviews — big enough to be real, small enough to be hungry. 20 calls ≈ 3–5 yeses. Call between 7–9am or 5–7pm (owners answer when crews aren't running).
2. **Text/email follow-up** with a link to the /contractors page after every call, answered or not.
3. **Facebook groups** ("Tree Service Business Owners", regional contractor groups) — post value, not spam: "launching a free-lead pilot in [metro], 10 spots."
4. **Adjacent-trade referrals** — your hardscaping contacts: "who does your tree work?"

**What kills you here:** signing contractors who don't respond to leads. Make the 24h-response expectation explicit, and cut anyone who ghosts two leads — a dead lead poisons the customer side.

**Anti-scam positioning (contractors are burned by HomeAdvisor/Angi):** lead them with the differences — you see the full job details AND photos *before* paying; you only pay for leads you choose to unlock; a lead is sold to max 5 companies (say the number out loud); bogus leads get credited back, no argument. Put all four promises on the /contractors page.

## Phase 2 — First customer leads (Weeks 2–6), target: 3–5 leads/week

Cheapest-first order:

1. **Nextdoor + local Facebook groups (free).** Answer every "anyone know a tree guy?" post — these appear daily in every metro — with "I run a local site that gets you 3–5 quotes from vetted local companies, free: [link]". Also make your own posts. This alone can hit 3–5 leads/week and they're the highest-intent leads that exist.
2. **Facebook Marketplace + Craigslist services listings (free).** List "Free tree removal quotes — 3+ local bids." People genuinely browse Marketplace for services.
3. **Storm timing (free, huge).** After any named storm/high-wind event in your metro, post everywhere the same day. Tree work demand is 10x for a week and every contractor is booked — leads sell themselves.
4. **Google Ads, $300–500 test (Weeks 4–6).** Exact-match "tree removal [city]", "tree removal cost [city]", send to landing page. Expect $8–20 per lead-form submission in this niche. Only turn this on once contractors are responding fast, and keep it running only if contractors say the leads are real.
5. **SEO (background, compounds later).** One page per suburb ("Tree Removal in [Suburb] — Get 3 Free Quotes") + a "tree removal cost" guide. Programmatic, config-driven — the fork architecture makes these near-free to stamp out. Don't expect traffic for 3–6 months.

**Skip for now:** paid Nextdoor ads, TikTok/IG content, buying leads from aggregators to reseed.

## Phase 3 — Flip on payment (when, not a date)

Flip a contractor from free → paid when **they've received ≥10 leads and quoted ≥5**. That's proof of value; before that, asking for money just churns them.

- **Pricing:** $20/lead removal, $10 trimming/stump to start (industry pays $15–150; you're the cheap new option). Sell **credit packs** (10 leads = $150) rather than per-lead cards-on-file friction — prepaid credits also smooth your revenue.
- **Guarantee:** wrong-number/duplicate/outside-area leads auto-credited back. Be generous; disputes cost more in trust than the $20.
- **Keep 2 founding slots permanently free** in exchange for testimonials + being your quality bellwether.

## The numbers that matter (weekly check)

| Metric | Healthy |
|---|---|
| Leads submitted / week | 5+ by week 6 |
| Contractors responding within 24h | >70% |
| Leads getting ≥2 quotes | >60% |
| Cost per lead (paid channels) | < $20 |
| Contractor "would you pay?" (ask directly) | yes from 3+ |

If leads get quotes fast and contractors ask for MORE leads — raise ad spend. If contractors ghost — fix supply before spending anything on demand.

## Fork strategy (kitchen/bath/patio)

Don't fork until TreeQuote has paying contractors — one working playbook beats three half-dead sites. When you do: the codebase forks by editing `config/site.ts`; the GTM forks the same way — this entire plan is the template, swap the trade, keywords, and lead price (kitchen remodel leads sell for $50–100+, patios $30–50 — richer verticals, same machine). Patio/hardscape should be fork #1 since Rapid Patios already gives you supply-side relationships.

## Immediate to-dos for Mike (this week)

1. Confirm launch metro.
2. Get a phone number (OpenPhone, shared with Rapid Patios).
3. Approve ~$0 spend now; ~$400 Google Ads test in ~3 weeks (per your cost-approval rule — nothing purchased yet).
4. Set up Supabase/Vercel env for production deploy (app currently has no .env.local; runs demo-only).
5. Make 20 contractor calls (or approve an outreach email campaign via AgentMail and I'll draft it).
