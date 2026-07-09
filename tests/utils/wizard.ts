import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Walks the one-question-per-page Details step (see components/DetailsForm.tsx)
 * from wherever it currently is until the wizard reaches the next step
 * ("Location" by default).
 *
 * `answers` maps a question's exact label text (as rendered by
 * `[data-testid='detail-question-label']`) to the option button text to
 * click for that question. Any question not present in `answers` is
 * skipped via its Next button (works for every optional field kind).
 * Required single-select questions auto-advance ~300ms after the option
 * click, so we always wait a beat after answering one.
 *
 * Generic on purpose — this only knows about `siteConfig.detailFields`
 * indirectly (through whatever the page renders), so it keeps working
 * across config edits/forks as long as the questions being answered here
 * still exist.
 */
export async function completeDetailsStep(
  page: Page,
  answers: Record<string, string>,
  untilHeading = "Location",
  maxQuestions = 25
) {
  await expect(page.locator("h1")).toHaveText("Details");

  for (let i = 0; i < maxQuestions; i++) {
    const heading = (await page.locator("h1").textContent())?.trim();
    if (heading === untilHeading) return;

    const questionLabel = (await page.locator("[data-testid='detail-question-label']").textContent())?.trim() ?? "";
    // Strip the "(optional)" suffix DetailsForm appends to non-required labels.
    const cleanLabel = questionLabel.replace(/\s*\(optional\)\s*$/, "").trim();
    const answer = answers[cleanLabel];

    if (answer) {
      await page.locator(`[data-testid='detail-option']:has-text('${answer}'), button:has-text('${answer}')`).first().click();
      // Give the ~300ms auto-advance timer (single-select) time to fire.
      await page.waitForTimeout(450);
    } else {
      await page.locator("button:has-text('Next')").first().click();
    }
  }

  throw new Error(`completeDetailsStep: did not reach "${untilHeading}" within ${maxQuestions} questions`);
}

/** Advances the submit wizard from step 0 (Photos) through the Service step, landing on Details. */
export async function goToDetailsStep(page: Page, photoFixturePath: string, serviceLabel = "Tree Removal") {
  await page.goto("/submit");
  await page.locator("input[type='file']").setInputFiles(photoFixturePath);
  await expect(page.locator("button:has-text('Next')")).toBeEnabled({ timeout: 15000 });
  await page.click("button:has-text('Next')");

  await page.click(`button:has-text('${serviceLabel}')`);
  await page.click("button:has-text('Next')");
}
