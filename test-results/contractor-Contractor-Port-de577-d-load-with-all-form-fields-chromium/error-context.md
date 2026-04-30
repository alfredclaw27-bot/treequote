# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: contractor.spec.ts >> Contractor Portal >> apply page should load with all form fields
- Location: tests\contractor.spec.ts:21:7

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
  3  | test.describe("Contractor Portal", () => {
  4  |   test("login page should load and have form", async ({ page }) => {
  5  |     await page.goto("/contractor/login");
  6  |     await expect(page).toHaveURL("/contractor/login");
  7  |     await expect(page.locator("h1")).toContainText("Contractor Login");
  8  |     await expect(page.locator("input[type='email']")).toBeVisible();
  9  |     await expect(page.locator("input[type='password']")).toBeVisible();
  10 |     await expect(page.locator("button:has-text('Sign In')")).toBeVisible();
  11 |   });
  12 | 
  13 |   test("login page should have apply link", async ({ page }) => {
  14 |     await page.goto("/contractor/login");
  15 |     const applyLink = page.locator("a[href='/contractor/apply']");
  16 |     await expect(applyLink).toBeVisible();
  17 |     await applyLink.click();
  18 |     await expect(page).toHaveURL("/contractor/apply");
  19 |   });
  20 | 
  21 |   test("apply page should load with all form fields", async ({ page }) => {
  22 |     await page.goto("/contractor/apply");
  23 |     await expect(page).toHaveURL("/contractor/apply");
> 24 |     await expect(page.locator("h1")).toContainText("Contractor Application");
     |                                      ^ Error: expect(locator).toContainText(expected) failed
  25 |     await expect(page.locator("input[placeholder*='ABC Tree']")).toBeVisible(); // business name
  26 |     await expect(page.locator("input[type='email']")).toBeVisible();
  27 |     await expect(page.locator("input[type='password']")).toBeVisible();
  28 |     await expect(page.locator("input[type='tel']")).toBeVisible();
  29 |     await expect(page.locator("text=Specialties")).toBeVisible();
  30 |   });
  31 | 
  32 |   test("apply page should toggle specialty selections", async ({ page }) => {
  33 |     await page.goto("/contractor/apply");
  34 |     // Click on Tree Removal specialty
  35 |     const removalBtn = page.locator("button:has-text('Tree Removal')");
  36 |     await removalBtn.click();
  37 |     await expect(removalBtn).toHaveClass(/bg-green-100/);
  38 |     await removalBtn.click();
  39 |     await expect(removalBtn).not.toHaveClass(/bg-green-100/);
  40 |   });
  41 | 
  42 |   test("dashboard should redirect to login when unauthenticated", async ({ page }) => {
  43 |     await page.goto("/contractor/dashboard");
  44 |     // Should redirect to login
  45 |     await expect(page).toHaveURL(/\/contractor\/login/);
  46 |   });
  47 | 
  48 |   test("profile page should load with equipment form", async ({ page }) => {
  49 |     await page.goto("/contractor/profile");
  50 |     // Should redirect to login when unauthenticated
  51 |     await expect(page).toHaveURL(/\/contractor\/login/);
  52 |   });
  53 | });
  54 | 
```