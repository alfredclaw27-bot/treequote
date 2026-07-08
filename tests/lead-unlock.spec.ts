import { test, expect } from "@playwright/test";

/**
 * Contact-info masking + free-credit unlock flow, exercised in demo mode
 * (no Supabase required). Demo mode ships with 2 starting lead credits per
 * browser (see lib/demo.ts).
 */
test.describe("Lead contact masking + credit unlock", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contractor/login");
    await page.click("text=Explore Demo Account");
    await expect(page).toHaveURL(/\/contractor\/dashboard/);
  });

  test("dashboard shows masked contact info for locked leads", async ({ page }) => {
    const masked = page.locator("[data-testid='contact-masked']").first();
    await expect(masked).toBeVisible();
    await expect(masked).toContainText("Contact hidden");
    // Full phone number should never appear on a locked lead card
    await expect(masked).not.toContainText("555");
  });

  test("account tab shows starting lead credits", async ({ page }) => {
    await page.click("text=Account");
    await expect(page.locator("[data-testid='lead-credits-count']")).toContainText("2 free credits");
  });

  test("unlocking a lead with a credit reveals contact info and decrements the balance", async ({ page }) => {
    // mock-002 is unused by the default demo quote seed, safe to unlock here
    await page.goto("/contractor/quote/mock-002");

    await expect(page.locator("[data-testid='contact-masked']")).toBeVisible();
    await expect(page.locator("[data-testid='unlock-with-credit']")).toContainText("2 available");

    await page.click("[data-testid='unlock-with-credit']");

    await expect(page.locator("[data-testid='contact-unlocked']")).toBeVisible();
    await expect(page.locator("text=Lead unlocked!")).toBeVisible();

    // Credit balance should have decremented on the account tab
    await page.goto("/contractor/dashboard");
    await page.click("text=Account");
    await expect(page.locator("[data-testid='lead-credits-count']")).toContainText("1 free credits");
  });

  test("unlocked leads show full contact info on the dashboard list", async ({ page }) => {
    await page.goto("/contractor/quote/mock-004");
    await page.click("[data-testid='unlock-with-credit']");
    await expect(page.locator("[data-testid='contact-unlocked']")).toBeVisible();

    await page.goto("/contractor/dashboard");
    // At least one lead card should now show unlocked contact info
    await expect(page.locator("[data-testid='contact-unlocked']").first()).toBeVisible();
  });

  test("running out of credits disables the credit-unlock button", async ({ page }) => {
    await page.goto("/contractor/quote/mock-002");
    await page.click("[data-testid='unlock-with-credit']");
    await expect(page.locator("[data-testid='contact-unlocked']")).toBeVisible();

    await page.goto("/contractor/quote/mock-004");
    await page.click("[data-testid='unlock-with-credit']");
    await expect(page.locator("[data-testid='contact-unlocked']")).toBeVisible();

    // Both starting credits are now spent — a third lead should show the button disabled
    await page.goto("/contractor/quote/mock-005");
    const unlockBtn = page.locator("[data-testid='unlock-with-credit']");
    await expect(unlockBtn).toBeDisabled();
    await expect(unlockBtn).toContainText("No lead credits remaining");
  });
});
