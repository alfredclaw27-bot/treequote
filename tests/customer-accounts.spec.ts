import { test, expect } from "@playwright/test";

/**
 * Customer accounts (setup/login/dashboard). This suite runs against a
 * zero-env-keys install (no NEXT_PUBLIC_SUPABASE_URL), so every page should
 * render its "demo mode — accounts disabled" notice instead of crashing.
 */
test.describe("Customer accounts — demo mode", () => {
  test("setup page renders a demo-mode notice instead of a signup form", async ({ page }) => {
    await page.goto("/customer/setup?email=test%40example.com&leadId=mock-001");
    await expect(page.locator("text=Demo mode — accounts disabled")).toBeVisible();
  });

  test("login page renders a demo-mode notice instead of a login form", async ({ page }) => {
    await page.goto("/customer/login");
    await expect(page.locator("text=Demo mode")).toBeVisible();
  });

  test("dashboard page renders a demo-mode notice instead of crashing", async ({ page }) => {
    await page.goto("/customer/dashboard");
    await expect(page.locator("text=Demo mode")).toBeVisible();
  });
});
