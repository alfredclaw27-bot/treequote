import { test, expect } from "@playwright/test";
import path from "path";
import { completeDetailsStep, goToDetailsStep } from "./utils/wizard";

/**
 * Demo-mode (zero env keys) end-to-end coverage for the "Updates & comments"
 * timeline: a customer submits a request via the wizard, then from their
 * confirmation link adds a comment and edits a job detail — both should show
 * up on the timeline with a formatted date/time. See lib/lead-events.ts for
 * the diff logic and app/customer/quotes/[leadId]/page.tsx for the UI.
 */
test.describe("Lead comments and tracked edits (demo mode)", () => {
  test("customer can add a comment and see it timestamped on the timeline", async ({ page }) => {
    const leadId = await submitDemoLead(page);
    await page.goto(`/customer/quotes/${leadId}`);

    await expect(page.locator("h2:has-text('Updates & comments')")).toBeVisible();

    await page.locator("[data-testid='comment-input']").fill("Please call before you come by, thanks!");
    await page.locator("[data-testid='post-comment']").click();

    const eventItems = page.locator("[data-testid='event-item']");
    await expect(eventItems).toHaveCount(1);
    await expect(eventItems.first()).toContainText("Please call before you come by, thanks!");
    // A formatted date + time stamp is rendered above the comment body.
    await expect(eventItems.first().locator("p").first()).toContainText(/\d/);

    // Comment box clears after posting.
    await expect(page.locator("[data-testid='comment-input']")).toHaveValue("");
  });

  test("customer can edit a detail answer and see a tracked change entry", async ({ page }) => {
    const leadId = await submitDemoLead(page);
    await page.goto(`/customer/quotes/${leadId}`);

    // Original submission answered "Under 20 ft" for tree height.
    await expect(page.getByText("Approximate tree height: Under 20 ft")).toBeVisible();

    await page.locator("[data-testid='edit-request']").click();

    // Change the height answer to a different option.
    await page.locator("[data-testid='edit-option-height']:has-text('Over 60 ft')").click();
    await page.locator("[data-testid='save-edit']").click();

    // Edit form closes and the summary reflects the new value.
    await expect(page.locator("[data-testid='edit-request']")).toBeVisible();
    await expect(page.getByText("Approximate tree height: Over 60 ft")).toBeVisible();

    // Tracked as a timeline event with the human-readable diff.
    const eventItems = page.locator("[data-testid='event-item']");
    await expect(eventItems).toHaveCount(1);
    await expect(eventItems.first()).toContainText("Approximate tree height: Under 20 ft → Over 60 ft");
  });
});

/** Walks the full submit wizard in demo mode and returns the resulting demo lead id. */
async function submitDemoLead(page: import("@playwright/test").Page): Promise<string> {
  await goToDetailsStep(page, path.join(__dirname, "fixtures", "test-photo.png"));

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
  await page.locator("input[type='text']").fill("Jamie Timeline");
  await page.locator("input[type='tel']").fill("5551230000");
  await page.click("button:has-text('Next')");

  // Review -> Submit
  await expect(page.locator("h1")).toHaveText("Review");
  await page.click("button:has-text('Submit Request')");

  await expect(page).toHaveURL(/\/submitted\?/, { timeout: 10_000 });
  const url = new URL(page.url());
  const leadId = url.searchParams.get("ref") ?? url.searchParams.get("leadId");
  if (!leadId) throw new Error("submitDemoLead: no ref/leadId in /submitted URL");
  return leadId;
}
