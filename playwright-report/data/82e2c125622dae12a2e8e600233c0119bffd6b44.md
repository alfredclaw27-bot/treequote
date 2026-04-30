# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: contractor-profile.spec.ts >> Contractor Profile Page >> contractor apply page should load
- Location: tests\contractor-profile.spec.ts:30:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('h1')
Expected substring: "Contractor Application"
Received string:    "Join the Network"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('h1')
    9 × locator resolved to <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Join the Network</h1>
      - unexpected value "Join the Network"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - link "← Back" [ref=e5] [cursor=pointer]:
        - /url: /
      - generic [ref=e6]: 🌳 TreeQuote
      - button "Toggle theme" [ref=e7]:
        - img [ref=e8]
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]:
          - img [ref=e13]
          - text: For Contractors
        - heading "Join the Network" [level=1] [ref=e17]
        - paragraph [ref=e18]: Apply to start receiving qualified tree service leads in your area. Review within 24 hours.
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]: Business Name
          - textbox "Business Name" [ref=e23]:
            - /placeholder: ABC Tree Services
        - generic [ref=e24]:
          - generic [ref=e25]: Email
          - textbox "Email" [ref=e26]:
            - /placeholder: contact@abctrees.com
        - generic [ref=e27]:
          - generic [ref=e28]: Password
          - textbox "Password" [ref=e29]:
            - /placeholder: Create a secure password
        - generic [ref=e30]:
          - img [ref=e31]
          - generic [ref=e33]:
            - generic [ref=e34]: Phone
            - textbox "Phone" [ref=e35]:
              - /placeholder: (404) 555-0100
        - generic [ref=e36]:
          - generic [ref=e37]:
            - img [ref=e38]
            - text: Service Area
          - textbox "Atlanta, GA · Marietta, GA · Roswell, GA" [ref=e42]
          - paragraph [ref=e43]: Comma-separated list of cities or zip codes you serve
        - generic [ref=e44]:
          - paragraph [ref=e45]: Specialties
          - generic [ref=e46]:
            - button "🪓 Tree Removal" [ref=e47]
            - button "✂️ Trimming / Pruning" [ref=e48]
            - button "⚙️ Stump Grinding" [ref=e49]
            - button "🌴 Palm Cleaning" [ref=e50]
            - button "❓ Other" [ref=e51]
        - generic [ref=e52]:
          - paragraph [ref=e53]: What happens after you apply?
          - list [ref=e54]:
            - listitem [ref=e55]: ✓ We review your application (within 24 hours)
            - listitem [ref=e56]: ✓ You receive an email when approved
            - listitem [ref=e57]: ✓ Log in and start receiving leads!
        - button "Submit Application" [ref=e58]
      - paragraph [ref=e59]:
        - text: Already have an account?
        - link "Sign in" [ref=e60] [cursor=pointer]:
          - /url: /contractor/login
  - button "Open Next.js Dev Tools" [ref=e66] [cursor=pointer]:
    - img [ref=e67]
  - alert [ref=e70]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Contractor Profile Page", () => {
  4  |   test("profile page should redirect to login when unauthenticated", async ({ page }) => {
  5  |     await page.goto("/contractor/profile");
  6  |     await expect(page).toHaveURL(/\/contractor\/login/);
  7  |   });
  8  | 
  9  |   test("profile page should have equipment section when accessible", async ({ page }) => {
  10 |     // This test would need auth cookie injection in a real scenario
  11 |     // We verify the page structure exists at the code level
  12 |     await page.goto("/contractor/profile");
  13 |     // Should redirect to login
  14 |     await expect(page).toHaveURL(/\/contractor\/login/);
  15 |   });
  16 | 
  17 |   test("profile page should have bucket truck reach options", async ({ page }) => {
  18 |     // Check that the profile page has expected UI structure by verifying
  19 |     // it redirects to login (no session) - this confirms routes are wired
  20 |     await page.goto("/contractor/profile");
  21 |     await expect(page).toHaveURL(/\/contractor\/login/);
  22 |   });
  23 | 
  24 |   test("login page should have contractor apply link", async ({ page }) => {
  25 |     await page.goto("/contractor/login");
  26 |     const applyLink = page.locator("a[href='/contractor/apply']");
  27 |     await expect(applyLink).toBeVisible();
  28 |   });
  29 | 
  30 |   test("contractor apply page should load", async ({ page }) => {
  31 |     await page.goto("/contractor/apply");
  32 |     await expect(page).toHaveURL("/contractor/apply");
> 33 |     await expect(page.locator("h1")).toContainText("Contractor Application");
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  34 |   });
  35 | });
```