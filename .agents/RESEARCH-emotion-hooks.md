# Research: Emotion Hooks for Conversion (TreeQuote + forks)

Research only — no code touched. Companion to the existing hooks already in `config/site.ts` (`emotionalBenefits`, `wizardMicrocopy`, the `motivation` question) — this extends that work, doesn't replace it.

## 1. TL;DR

- "Steven Cravotta" checks out (spelled **Cravotta**, not Carvotta) — indie app founder (Wordle clone, Puff Count) turned onboarding/monetization creator. No single named "emotion hooks framework" of his was found; his real public content is about testing onboarding/paywalls relentlessly and asking a motivation question early — which TreeQuote already does.
- The real leverage for a home-services funnel isn't novel psychology, it's well-documented CRO: benefit visualization, one-question-per-page momentum, sunk-cost progress, and social proof placed right before the ask.
- Biggest opportunity for TreeQuote: add a "what will it feel like when this is done" wizard question — homeowners buy the after-state, not the labor.
- Multi-step forms with visible progress reliably beat single-page forms (up to +25–300% completion in cited studies) — TreeQuote's wizard already has this shape; keep leaning into it.
- Everything below survives a find/replace of "tree" → "patio"/"kitchen"/"bath" for future forks.

## 2. Who Steven Cravotta Is

Verified via web search (personal site, Spotify podcast interview, YouTube/TikTok/X, Starter Story, Pepperdine Graphic, MoneyCentral Magazine).

- Built an iOS word-game app literally named **Wordle** at 18, which accidentally absorbed millions of downloads from people searching for Josh Wardle's (unrelated) viral web game — grew to 30M+ downloads.
- Founded **Puff Count**, a paid vaping-cessation app, grew it to ~$40K MRR / 1M+ users, exited it.
- Now a builder/creator ("Steveo" on TikTok/YouTube/X, SaaS Accelerator) teaching indie app monetization and onboarding.
- His recurring, verifiable message: **"If your onboarding sucks, your app won't make any money — I exited 2 apps at 27 because I mastered onboarding."** Posts stress testing pricing/paywalls, never assuming users will "figure it out," tracking analytics on every onboarding step, and studying competitor onboarding flows (recommends tools like Mobbin/ScreensDesign).
- **Could not verify** a specific, named "emotion hooks" methodology authored by him — no blog post, talk, or thread laid out a proprietary framework under that name. What's attributable to him is narrower: onboarding is the #1 lever, personalize/ask motivation early, test everything, don't skip the emotional "does this app get me" moment. Treat him as a credible practitioner pointing at a real category, not the origin of the specific techniques in section 3.
- Separately: "Steven **Carvotta**" (Mike's spelling) returns only unrelated people (a building engineer, a 2019 obituary) — almost certainly just a misspelling of Cravotta.

## 3. Principles for a Home-Services Quote Funnel

- **Pain-point mirroring** — naming the visitor's exact worry (leaning trunk, cracked slab, outdated kitchen) before pitching anything proves the product understands them, lowering resistance to the ask. *Use it:* lead the hero and step 1 with the problem, not the service ("Worried about that tree in the next storm?" before "Get a quote").
- **Benefit visualization / future pacing** — people buy the after-state (a yard they relax in, a kitchen they're not embarrassed by), not the labor. *Use it:* the new wizard question (4a) and benefit cards (4b) both describe the after-state, not the work.
- **Identity/aspiration framing** — "the kind of homeowner who takes care of this stuff" is a self-image people want to confirm. *Use it:* treat the visitor as decisive, not a stalled worrier ("You're already ahead of this" beats "Don't wait too long").
- **Loss aversion** — the cost of *not* acting (injury, lower sale price, bigger bill later) motivates harder than the upside. *Use it:* already in `emotionalBenefits` — keep one card loss-framed, the rest gain-framed.
- **One-question-per-page momentum (Typeform pattern)** — one visible question feels effortless, and each answer is a small commitment that makes the next easier (foot-in-the-door effect). *Use it:* the wizard already does this — don't collapse steps to "save space."
- **Progress investment / sunk cost** — a visible progress bar converts completed steps into felt investment. *Caveat:* backfires if step 1 feels like high effort with slow visible progress, so keep easy questions (service type, location) first, harder ones (photos, notes) last — current order already does this.
- **Social proof placement** — works best right before an ask, not buried on a separate page. *Use it:* surface the `socialProof` stat line ("847 jobs serviced · 4.9/5") again right above the final submit button and near the contact-info step, not just the landing page.

## 4. Concrete Copy

### (a) New wizard "benefit" question

> **"What will it feel like when this job's done?"**
> *Optional — pick whatever fits. Helps pros understand what matters most to you.*

- 🧘 Finally stop worrying about it
- 🛡️ Peace of mind for my family's safety
- 🏡 A space I'm actually proud to show off
- 💰 Protect (or boost) my home's value
- ✅ One less thing on my to-do list
- 😌 Get to actually enjoy my [yard / kitchen / bathroom / space] again

Generic enough to keep as-is per vertical, or swap only the last option's bracketed noun per fork.

### (b) Three rewritten landing benefit cards

1. **Stop worrying, start relaxing** — Once it's handled, it's handled. No more side-eyeing it every time you walk past.
2. **A space you're proud of** — Not just fixed — better. The kind of [yard / kitchen / bathroom] you actually want people to see.
3. **Protect what it's worth** — Small jobs now beat big bills (or a lower sale price) later. This pays for itself either way.

### (c) Microcopy lines

- **Review step reassurance (alt/stronger than current):** "You're one click from real quotes — local pros usually respond the same day."
- **Contact step trust line:** "Your info only goes to pros you choose to hear from — never sold, never spammed."
- **Wizard-start momentum line (top of step 1):** "Takes about 2 minutes. Most of it's multiple choice."

### (d) Customer email subject lines

- "Your [trade] pros are already looking at your job"
- "3 pros are reviewing your request right now"
- "Quick — your quote request needs one more look"
- "Good news: you've got a quote waiting"
- "Still thinking about it? Your quote's ready when you are" (follow-up/nudge)

## 5. What NOT to Do

- **No fake urgency/scarcity** — no "Only 2 spots left today" unless literally true (a real founding-contractor cap is fine; countdown timers invented for effect are not).
- **No fake social proof** — don't fabricate review counts or "X people viewing this now" widgets; the stat line must stay a real number.
- **No fear-mongering beyond the real stakes** — "sleep through the next storm" is honest risk-framing; implying imminent catastrophe to force a submit is not.
- **No confirmshaming** — decline/skip options ("No thanks, I like overpaying") are corrosive to trust; just offer a plain "Skip."
- **No dark-pattern progress bars** — don't show fake progress or lock users into steps they can't back out of; back/skip must always work.
- **No bait-and-switch on price** — emotional copy sells the outcome, but the quote itself must stay transparent; never use emotional framing to paper over a hidden fee.
- **Don't overload every screen with emotion** — one hook per screen. If every microcopy line is straining for feeling, none of them land, and it reads as manipulative rather than empathetic.

---
*Sources (web search, July 2026): stevencravotta.com, Spotify Creators podcast, Starter Story, Pepperdine Graphic, MoneyCentral Magazine, X/@StevenCravotta, dev.to onboarding-hooks writeup, Typeform/conversational-form conversion data (rowform.io, startupspells.com), multi-step form CRO studies (Growform, crotricks.com, Irrational Labs on progress-bar backfire), and standard future-pacing/benefit-led copywriting sources.*
