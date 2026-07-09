import { test, expect } from "@playwright/test";
import path from "path";
import { completeDetailsStep, goToDetailsStep } from "./utils/wizard";

/**
 * Regression test for the production hang bug: in demo mode (zero env
 * keys), a real phone photo falls back to a full base64 data URL (see
 * PhotoUploader — Supabase upload fails without credentials, so the
 * FileReader preview of the *original* file becomes the stored photo URL).
 * That data URL alone can be 5-10MB+, which blows localStorage's
 * ~5-10MB-per-origin quota. `saveDemoLead` used to let that
 * QuotaExceededError throw uncaught, which left `submitting` stuck `true`
 * forever — the button just sat on "Submitting..." with no error and no
 * navigation.
 *
 * `tests/fixtures/large-photo.jpg` is 8MB of random bytes (generated, not a
 * real photo) — big enough that its base64 data URL alone exceeds any
 * browser's localStorage quota, faithfully reproducing the bug without
 * needing a real multi-MB phone photo checked into the repo.
 */
test.describe("Demo-mode submit with an oversized photo", () => {
  test("does not hang at 'Submitting...' when a photo blows the localStorage quota", async ({ page }) => {
    await goToDetailsStep(page, path.join(__dirname, "fixtures", "large-photo.jpg"));

    await completeDetailsStep(page, {
      "Approximate tree height": "Under 20 ft",
      "Tree type": "Oak",
      "How soon do you need this done?": "ASAP / Emergency",
    });

    // Location
    await expect(page.locator("h1")).toHaveText("Location");
    await page.locator("[data-testid='location-input']").fill("456 Oak Valley Dr, Marietta, GA 30060");
    await page.click("button:has-text('Next')");

    // Contact
    await expect(page.locator("h1")).toHaveText("Contact");
    await page.locator("input[type='text']").fill("Jamie Quota");
    await page.locator("input[type='tel']").fill("5551234567");
    await page.click("button:has-text('Next')");

    // Review -> Submit
    await expect(page.locator("h1")).toHaveText("Review");
    const submitBtn = page.locator("button:has-text('Submit Request')");
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // The bug: this used to hang forever on "Submitting...". It must
    // instead navigate to /submitted within a few seconds no matter what
    // localStorage does under the hood.
    await expect(page).toHaveURL(/\/submitted\?/, { timeout: 10_000 });
    await expect(page.locator("h1")).toContainText("all set");
  });
});
