import { test, expect } from "@playwright/test";

/**
 * Secret /admin gate (see proxy.ts). When ADMIN_SECRET is unset (the
 * default for local dev and for this suite), /admin stays open — see
 * "should load the admin page" in admin.spec.ts.
 *
 * These tests exercise the *gated* behavior and only run when ADMIN_SECRET
 * is exported before the dev server starts, e.g.:
 *   ADMIN_SECRET=test-secret PW_PORT=3150 npx playwright test tests/admin-gate.spec.ts --project=chromium
 * (the running dev server reads ADMIN_SECRET once at startup, so it has to
 * be set before `npm run dev` boots — setting it only for the test process
 * has no effect on an already-running / reused server).
 */
const ADMIN_SECRET = process.env.ADMIN_SECRET;

test.describe("Secret admin gate", () => {
  test.skip(!ADMIN_SECRET, "ADMIN_SECRET not set for this dev server — see file header to run this suite");

  test("no key and no cookie 404s", async ({ page, context }) => {
    await context.clearCookies();
    const res = await page.goto("/admin");
    expect(res?.status()).toBe(404);
  });

  test("wrong key 404s", async ({ page, context }) => {
    await context.clearCookies();
    const res = await page.goto("/admin?key=wrong-key");
    expect(res?.status()).toBe(404);
  });

  test("correct key sets a cookie, redirects to clean /admin, and unlocks it", async ({ page }) => {
    await page.goto(`/admin?key=${ADMIN_SECRET}`);
    await expect(page).toHaveURL("/admin");
    await expect(page.locator("text=Admin")).toBeVisible();

    // A fresh navigation (no key in the URL) should stay unlocked via the cookie.
    await page.goto("/admin");
    await expect(page.locator("text=Admin")).toBeVisible();
  });
});
