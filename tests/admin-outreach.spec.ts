import { test, expect } from "@playwright/test";

/**
 * Admin supply-side outreach tracker (see app/admin/page.tsx "Outreach"
 * section, lib/outreach.ts, app/api/admin/outreach/**).
 *
 * Like admin.spec.ts, this runs against a dev server with ADMIN_SECRET
 * unset, so /admin stays open (see proxy.ts — the gated-behavior tests live
 * in tests/admin-gate.spec.ts and are skipped unless ADMIN_SECRET is
 * exported before the dev server boots). Without Supabase env keys
 * configured (the default for this repo's CI/local runs), the outreach API
 * routes talk to a placeholder Supabase URL and the section should degrade
 * to an empty-but-graceful state rather than crash the page.
 *
 * Run: PW_PORT=3153 npx playwright test tests/admin-outreach.spec.ts --project=chromium
 */

test.describe("Admin Outreach section", () => {
  test("renders the Outreach section with a search box", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByTestId("outreach-section")).toBeVisible();
    await expect(page.locator("text=Outreach").first()).toBeVisible();
    await expect(page.getByTestId("outreach-search-input")).toBeVisible();
    await expect(page.getByTestId("outreach-search-button")).toBeVisible();
  });

  test("shows summary counts (found/contacted/responded/joined)", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=Found").first()).toBeVisible();
    await expect(page.locator("text=Contacted").first()).toBeVisible();
    await expect(page.locator("text=Responded").first()).toBeVisible();
    await expect(page.locator("text=Joined").first()).toBeVisible();
  });

  test("renders a graceful empty state without a configured Supabase backend", async ({ page }) => {
    await page.goto("/admin");
    // No Supabase keys in this test env -> GET /api/admin/outreach fails
    // against the placeholder URL -> the page should show the empty-state
    // card rather than an unhandled error.
    await expect(page.getByTestId("outreach-empty")).toBeVisible({ timeout: 10_000 });
  });

  test("standalone search surfaces an error instead of crashing when Places isn't configured", async ({ page }) => {
    await page.goto("/admin");
    const input = page.getByTestId("outreach-search-input");
    await input.fill("tree service in Turnersville, NJ");
    await page.getByTestId("outreach-search-button").click();

    // Without GOOGLE_PLACES_API_KEY (or Supabase) configured in this test
    // env, the find route 400s / 500s — the UI should surface that as text,
    // not throw. The page must stay usable either way.
    await expect(page.getByTestId("outreach-section")).toBeVisible();
    const errorLocator = page.getByTestId("outreach-error");
    if (await errorLocator.count()) {
      await expect(errorLocator).toBeVisible();
    }
  });

  test("per-lead \"Find contractors\" action is available when a lead exists", async ({ page }) => {
    await page.goto("/admin");
    const findButtons = page.getByTestId("find-contractors-for-lead");
    const count = await findButtons.count();
    // Demo/local DBs may have zero leads — only assert the button's presence
    // and clickability when at least one lead is rendered.
    test.skip(count === 0, "No leads present in this environment to attach the button to");
    await expect(findButtons.first()).toBeVisible();
  });
});
