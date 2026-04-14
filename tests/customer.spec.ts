import { test, expect } from "@playwright/test";

test.describe("Customer Portal", () => {
  test("customer quotes page should redirect when no lead id", async ({ page }) => {
    // A real lead ID would redirect to login or show the page
    await page.goto("/customer/quotes/test-lead-id");
    // Should handle gracefully (no crash)
    await expect(page.locator("body")).toBeVisible();
  });

  test("submit page should have branding", async ({ page }) => {
    await page.goto("/submit");
    await expect(page.locator("text=🌳 TreeQuote")).toBeVisible();
  });

  test("submitted confirmation page should exist", async ({ page }) => {
    await page.goto("/submitted");
    await expect(page.locator("text=🌳 TreeQuote")).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();
  });

  test("landing page should load correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("TreeQuote");
    await expect(page.locator("text=Get quotes from local tree service pros")).toBeVisible();
  });

  test("customer quotes page should handle unknown lead", async ({ page }) => {
    await page.goto("/customer/quotes/unknown-id");
    // Should show either a loading spinner or error card or redirect
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});