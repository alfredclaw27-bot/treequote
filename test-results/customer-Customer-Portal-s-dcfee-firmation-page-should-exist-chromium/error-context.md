# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: customer.spec.ts >> Customer Portal >> submitted confirmation page should exist
- Location: tests\customer.spec.ts:16:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=🌳 TreeQuote')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=🌳 TreeQuote')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e6]
      - generic [ref=e9]:
        - heading "You're all set!" [level=1] [ref=e10]
        - paragraph [ref=e11]: Your tree service request has been submitted. Contractors in your area have been notified.
      - generic [ref=e13]:
        - img [ref=e14]
        - generic [ref=e17]:
          - paragraph [ref=e18]: What happens next?
          - paragraph [ref=e19]: Our AI is analyzing your photo right now. Contractors will review your lead and submit quotes — usually within 24 hours. You'll receive notifications when quotes come in.
      - link "Back to Home" [ref=e21] [cursor=pointer]:
        - /url: /
        - button "Back to Home" [ref=e22]
      - paragraph [ref=e23]: Questions? Email us at mike@mtkinnovations.com
  - button "Open Next.js Dev Tools" [ref=e29] [cursor=pointer]:
    - img [ref=e30]
  - alert [ref=e33]
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
> 18 |     await expect(page.locator("text=🌳 TreeQuote")).toBeVisible();
     |                                                     ^ Error: expect(locator).toBeVisible() failed
  19 |     await expect(page.locator("h1")).toBeVisible();
  20 |   });
  21 | 
  22 |   test("landing page should load correctly", async ({ page }) => {
  23 |     await page.goto("/");
  24 |     await expect(page.locator("h1")).toContainText("TreeQuote");
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