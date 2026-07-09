import { test, expect } from "@playwright/test";
import path from "path";
import { completeDetailsStep, goToDetailsStep } from "./utils/wizard";

const PHOTON_RESPONSE = {
  features: [
    {
      type: "Feature",
      properties: {
        housenumber: "142",
        street: "Peachtree St NE",
        city: "Atlanta",
        state: "Georgia",
        postcode: "30303",
        countrycode: "US",
      },
      geometry: { type: "Point", coordinates: [-84.389, 33.759] },
    },
    {
      // Non-US result — should be filtered out client-side.
      type: "Feature",
      properties: { city: "Toronto", state: "Ontario", countrycode: "CA" },
      geometry: { type: "Point", coordinates: [-79.38, 43.65] },
    },
  ],
};

/**
 * Advances the submit wizard from step 0 (Photos) through the Details step
 * (now a one-question-per-page flow — see components/DetailsForm.tsx) to
 * Location, answering only the three required questions and skipping the
 * rest via their Next buttons.
 */
async function goToLocationStep(page: import("@playwright/test").Page) {
  await goToDetailsStep(page, path.join(__dirname, "fixtures", "test-photo.png"));

  await completeDetailsStep(page, {
    "Approximate tree height": "Under 20 ft",
    "Tree type": "Oak",
    "How soon do you need this done?": "ASAP / Emergency",
  });

  await expect(page.locator("h1")).toHaveText("Location");
}

test.describe("Address autocomplete", () => {
  test("renders US suggestions from the Photon geocoder and filters out non-US results", async ({ page }) => {
    await page.route("https://photon.komoot.io/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PHOTON_RESPONSE) })
    );

    await goToLocationStep(page);

    await page.locator("[data-testid='location-input']").fill("142 Peachtree");

    const suggestions = page.locator("[data-testid='location-suggestion']");
    await expect(suggestions).toHaveCount(1, { timeout: 5000 });
    await expect(suggestions.first()).toContainText("Atlanta, GA 30303");
    await expect(suggestions.first()).not.toContainText("Toronto");
  });

  test("selecting a suggestion fills the input and closes the dropdown", async ({ page }) => {
    await page.route("https://photon.komoot.io/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PHOTON_RESPONSE) })
    );

    await goToLocationStep(page);

    const input = page.locator("[data-testid='location-input']");
    await input.fill("142 Peachtree");

    const suggestion = page.locator("[data-testid='location-suggestion']").first();
    await expect(suggestion).toBeVisible({ timeout: 5000 });
    await suggestion.click();

    await expect(input).toHaveValue("142 Peachtree St NE, Atlanta, GA 30303");
    await expect(page.locator("[data-testid='location-suggestions']")).toHaveCount(0);
  });

  test("degrades gracefully to plain typing when the geocoder errors", async ({ page }) => {
    await page.route("https://photon.komoot.io/**", (route) => route.abort("failed"));

    await goToLocationStep(page);

    const input = page.locator("[data-testid='location-input']");
    await input.fill("456 Oak Valley Dr, Marietta, GA 30060");
    await expect(input).toHaveValue("456 Oak Valley Dr, Marietta, GA 30060");
    // Next should still enable off plain typed text (no coords needed).
    await expect(page.locator("button:has-text('Next')")).toBeEnabled();
  });
});
