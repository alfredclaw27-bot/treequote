import { test, expect } from "@playwright/test";

/**
 * Contractor-facing address privacy: only city/state is shown before a
 * lead is unlocked; the full street address is revealed after. Exercised
 * in demo mode (no Supabase required) — see lib/details.ts#maskAddressToCity,
 * used by both the contractor UI here and the contractor alert emails in
 * lib/notifications.ts.
 */
test.describe("Address masking pre/post unlock", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contractor/login");
    await page.click("text=Explore Demo Account");
    await expect(page).toHaveURL(/\/contractor\/dashboard/);
  });

  test("dashboard lead list shows city-level location only for locked leads", async ({ page }) => {
    // mock-005 starts locked in a fresh demo session.
    const card = page.locator("text=88 Dogwood Ln").first();
    await expect(card).toHaveCount(0);
    await expect(page.locator("text=Alpharetta, GA 30009").first()).toBeVisible();
  });

  test("quote page hides the street address until unlocked, then reveals it", async ({ page }) => {
    await page.goto("/contractor/quote/mock-001");

    await expect(page.locator("text=142 Peachtree St NE")).toHaveCount(0);
    await expect(page.locator("text=Atlanta, GA 30303").first()).toBeVisible();

    await page.click("[data-testid='unlock-with-credit']");
    await expect(page.locator("[data-testid='contact-unlocked']")).toBeVisible();

    await expect(page.locator("text=142 Peachtree St NE, Atlanta, GA 30303")).toBeVisible();
  });
});
