import { test, expect } from "@playwright/test";
import path from "path";
import { goToDetailsStep } from "./utils/wizard";

/**
 * Covers the Typeform-style one-question-per-page rework of the Details
 * step (components/DetailsForm.tsx): one question visible at a time, its
 * own "Question X of Y" progress, auto-advance on single-select answers,
 * an explicit Next button for other field kinds, Back moving through
 * sub-questions before leaving the step, and showIf-hidden questions being
 * skipped entirely.
 */
test.describe("Details step — one question per page", () => {
  test("shows one question at a time with its own progress counter", async ({ page }) => {
    await goToDetailsStep(page, path.join(__dirname, "fixtures", "test-photo.png"));

    await expect(page.locator("[data-testid='detail-question-label']")).toHaveText("Approximate tree height");
    await expect(page.locator("text=Question 1 of")).toBeVisible();

    // Only the current question's options are on the page — "Oak" (a
    // treeType option) shouldn't be visible while height is showing.
    await expect(page.locator("button:has-text('Oak')")).toHaveCount(0);
  });

  test("required single-select auto-advances ~300ms after picking an option", async ({ page }) => {
    await goToDetailsStep(page, path.join(__dirname, "fixtures", "test-photo.png"));

    await page.click("button:has-text('Under 20 ft')");
    // Immediately after the click we should still be on the same question
    // (auto-advance hasn't fired yet) — then it should move on shortly after,
    // landing on the (optional) trunk thickness question next.
    await expect(page.locator("[data-testid='detail-question-label']")).toContainText("Trunk thickness", { timeout: 2000 });
  });

  test("optional select shows a Next button to skip", async ({ page }) => {
    await goToDetailsStep(page, path.join(__dirname, "fixtures", "test-photo.png"));

    await page.click("button:has-text('Under 20 ft')");

    // Trunk thickness is optional — has a Next button since it's not required.
    await expect(page.locator("[data-testid='detail-question-label']")).toContainText("Trunk thickness");
    await expect(page.locator("button:has-text('Next')")).toBeEnabled();
  });

  test("Back moves through sub-questions before leaving the Details step", async ({ page }) => {
    await goToDetailsStep(page, path.join(__dirname, "fixtures", "test-photo.png"));

    await page.click("button:has-text('Under 20 ft')");
    await expect(page.locator("[data-testid='detail-question-label']")).toContainText("Trunk thickness");

    // Back should return to the first question, not leave the Details step.
    await page.click("button:has-text('Back')");
    await expect(page.locator("h1")).toHaveText("Details");
    await expect(page.locator("[data-testid='detail-question-label']")).toHaveText("Approximate tree height");

    // Back again from the first question leaves the step entirely (Service).
    await page.click("button:has-text('Back')");
    await expect(page.locator("h1")).toHaveText("Service");
  });

  test("showIf-hidden questions are skipped (stump diameter only appears when a stump exists)", async ({ page }) => {
    await goToDetailsStep(page, path.join(__dirname, "fixtures", "test-photo.png"));

    await page.click("button:has-text('Under 20 ft')");
    await expect(page.locator("[data-testid='detail-question-label']")).toContainText("Trunk thickness");
    await page.click("button:has-text('Next')");
    await expect(page.locator("[data-testid='detail-question-label']")).toHaveText("Tree type");
    await page.click("button:has-text('Oak')");
    await expect(page.locator("[data-testid='detail-question-label']")).toContainText("Stump situation");

    // Skip past it without picking "Has stump" — stump diameter must be
    // skipped entirely, landing straight on the next question instead.
    await page.click("button:has-text('Next')");
    await expect(page.locator("[data-testid='detail-question-label']")).toContainText("Equipment access");
  });

  test("selecting 'Has stump' reveals the stump diameter follow-up question", async ({ page }) => {
    await goToDetailsStep(page, path.join(__dirname, "fixtures", "test-photo.png"));

    await page.click("button:has-text('Under 20 ft')");
    await expect(page.locator("[data-testid='detail-question-label']")).toContainText("Trunk thickness");
    await page.click("button:has-text('Next')");
    await expect(page.locator("[data-testid='detail-question-label']")).toHaveText("Tree type");
    await page.click("button:has-text('Oak')");
    await expect(page.locator("[data-testid='detail-question-label']")).toContainText("Stump situation");
    await page.click("button:has-text('Has stump')");

    await expect(page.locator("[data-testid='detail-question-label']")).toContainText("Stump diameter (if known)", { timeout: 2000 });
  });

  test("the benefit-goal question is present and optional multiselect", async ({ page }) => {
    await goToDetailsStep(page, path.join(__dirname, "fixtures", "test-photo.png"));

    const requiredAnswers: Record<string, string> = {
      "Approximate tree height": "Under 20 ft",
      "Tree type": "Oak",
      "How soon do you need this done?": "ASAP / Emergency",
    };

    // Fast-forward to the benefit question, answering each required select
    // exactly once (then waiting out its auto-advance) and skipping
    // everything else via Next.
    for (let i = 0; i < 20; i++) {
      const label = (await page.locator("[data-testid='detail-question-label']").textContent())?.trim() ?? "";
      if (label.startsWith("What will it feel like")) break;

      const answer = requiredAnswers[label];
      if (answer) {
        await page.click(`button:has-text('${answer}')`);
        await page.waitForTimeout(450);
      } else {
        await page.click("button:has-text('Next')");
      }
    }

    await expect(page.locator("[data-testid='detail-question-label']")).toContainText("What will it feel like when this job's done?");
    await expect(page.locator("button:has-text('Get to actually enjoy my yard again')")).toBeVisible();
  });
});
