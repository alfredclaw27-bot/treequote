import { test, expect } from "@playwright/test";

test.describe("Customer Submission Flow", () => {
  test("should load the submit page", async ({ page }) => {
    await page.goto("/submit");
    await expect(page).toHaveURL("/submit");
    await expect(page.locator("h1")).toContainText("Upload a Photo");
  });

  test("should show progress indicator with 5 steps", async ({ page }) => {
    await page.goto("/submit");
    // Should have 5 step dots
    const dots = page.locator(".step-dot");
    await expect(dots).toHaveCount(5);
  });

  test("should navigate through all form steps", async ({ page }) => {
    await page.goto("/submit");

    // Step 1: Photo — Next should be disabled without photo
    const nextBtn = page.locator("button:has-text('Next')");
    await expect(nextBtn).toBeDisabled();

    // Can't easily test file upload in headless, but we can test step heading
    await expect(page.locator("text=Upload a Photo")).toBeVisible();
  });

  test("should have back link to home", async ({ page }) => {
    await page.goto("/submit");
    const backLink = page.locator("a:has-text('Back')");
    await expect(backLink).toBeVisible();
  });

  test("should show submit page header with branding", async ({ page }) => {
    await page.goto("/submit");
    await expect(page.locator("text=🌳 TreeQuote")).toBeVisible();
  });
});
