# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: customer.spec.ts >> Customer Portal >> landing page should load correctly
- Location: tests\customer.spec.ts:22:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "TreeQuote"
Received string:    "Trees need work?Get quotes from local prosin minutes."
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')
    9 × locator resolved to <h1 class="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-6">…</h1>
      - unexpected value "Trees need work?Get quotes from local prosin minutes."

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]: 🌳
        - generic [ref=e6]: TreeQuote
      - link "Contractor Login" [ref=e7] [cursor=pointer]:
        - /url: /contractor/login
        - button "Contractor Login" [ref=e8]
    - generic [ref=e9]:
      - generic [ref=e10]:
        - img [ref=e11]
        - text: Fast Quotes — Usually Within 24 Hours
      - heading "Trees need work? Get quotes from local pros in minutes." [level=1] [ref=e13]:
        - text: Trees need work?
        - text: Get quotes from local pros
        - text: in minutes.
      - paragraph [ref=e14]: Snap a photo of your tree. Our AI analyzes it. Local contractors compete for your job. No obligation. No hassle.
      - generic [ref=e15]:
        - link "Get My Free Quote" [ref=e16] [cursor=pointer]:
          - /url: /submit
          - button "Get My Free Quote" [ref=e17]:
            - text: Get My Free Quote
            - img [ref=e18]
        - link "See How It Works" [ref=e20] [cursor=pointer]:
          - /url: "#how-it-works"
          - button "See How It Works" [ref=e21]
    - generic [ref=e23]:
      - img "Beautiful tree in a sunny yard" [ref=e24]
      - paragraph [ref=e26]: Healthy Oak, ~40ft — spotted by our AI
    - generic [ref=e28]:
      - heading "How It Works" [level=2] [ref=e29]
      - generic [ref=e30]:
        - generic [ref=e31]:
          - generic [ref=e32]: 📸
          - heading "Snap a Photo" [level=3] [ref=e33]
          - paragraph [ref=e34]: Take a clear picture of the tree that needs work. Upload it to our form.
        - generic [ref=e35]:
          - generic [ref=e36]: 🤖
          - heading "AI Analyzes It" [level=3] [ref=e37]
          - paragraph [ref=e38]: Our AI reads the photo — tree type, height estimate, health, access notes.
        - generic [ref=e39]:
          - generic [ref=e40]: 💰
          - heading "Get Quotes" [level=3] [ref=e41]
          - paragraph [ref=e42]: Local contractors see your lead and submit competitive quotes. You pick the best.
    - generic [ref=e44]:
      - generic [ref=e45]:
        - img [ref=e47]
        - generic [ref=e50]:
          - paragraph [ref=e51]: No Obligation
          - paragraph [ref=e52]: You're never locked in
      - generic [ref=e53]:
        - img [ref=e55]
        - generic [ref=e57]:
          - paragraph [ref=e58]: Quotes in 24h
          - paragraph [ref=e59]: Fast contractor response
      - generic [ref=e60]:
        - img [ref=e62]
        - generic [ref=e64]:
          - paragraph [ref=e65]: Local Pros
          - paragraph [ref=e66]: Contractors in your area
    - generic [ref=e68]:
      - heading "Ready to get started?" [level=2] [ref=e69]
      - paragraph [ref=e70]: Takes less than 2 minutes. Free for customers.
      - link "Get My Free Quote" [ref=e71] [cursor=pointer]:
        - /url: /submit
        - button "Get My Free Quote" [ref=e72]:
          - text: Get My Free Quote
          - img [ref=e73]
    - paragraph [ref=e76]:
      - text: © 2026 TreeQuote · Contractors
      - link "apply here" [ref=e77] [cursor=pointer]:
        - /url: /contractor/apply
  - button "Open Next.js Dev Tools" [ref=e83] [cursor=pointer]:
    - img [ref=e84]
  - alert [ref=e87]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Customer Portal", () => {
  4  |   test("customer quotes page should redirect when no lead id", async ({ page }) => {
  5  |     // A real lead ID would redirect to login or show the page
  6  |     await page.goto("/customer/quotes/test-lead-id");
  7  |     // Should handle gracefully (no crash)
  8  |     await expect(page.locator("body")).toBeVisible();
  9  |   });
  10 | 
  11 |   test("submit page should have branding", async ({ page }) => {
  12 |     await page.goto("/submit");
  13 |     await expect(page.locator("text=🌳 TreeQuote")).toBeVisible();
  14 |   });
  15 | 
  16 |   test("submitted confirmation page should exist", async ({ page }) => {
  17 |     await page.goto("/submitted");
  18 |     await expect(page.locator("text=🌳 TreeQuote")).toBeVisible();
  19 |     await expect(page.locator("h1")).toBeVisible();
  20 |   });
  21 | 
  22 |   test("landing page should load correctly", async ({ page }) => {
  23 |     await page.goto("/");
> 24 |     await expect(page.locator("h1")).toContainText("TreeQuote");
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  25 |     await expect(page.locator("text=Get quotes from local tree service pros")).toBeVisible();
  26 |   });
  27 | 
  28 |   test("customer quotes page should handle unknown lead", async ({ page }) => {
  29 |     await page.goto("/customer/quotes/unknown-id");
  30 |     // Should show either a loading spinner or error card or redirect
  31 |     const body = page.locator("body");
  32 |     await expect(body).toBeVisible();
  33 |   });
  34 | });
```