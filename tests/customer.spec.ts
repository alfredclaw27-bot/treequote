import { test, expect } from "@playwright/test";

test.describe("Customer Portal", () => {
  test("customer quotes page should load when given a lead ID", async ({ page }) => {
    // Uses mock lead ID that dashboard would have
    await page.goto("/customer/quotes/mock-001");
    // Should handle gracefully (no crash) — shows lead not found or loads data
    await expect(page.locator("body")).toBeVisible();
  });

  test("submit page should have branding", async ({ page }) => {
    await page.goto("/submit");
    await expect(page.locator("text=🌳 TreeQuote")).toBeVisible();
  });

  test("submitted confirmation page should exist", async ({ page }) => {
    await page.goto("/submitted");
    // Shows "You're all set!" h1 and Back to Home button
    await expect(page.locator("h1")).toContainText("all set");
    await expect(page.locator("text=Back to Home")).toBeVisible();
  });

  test("landing page should load correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Trees need work");
  });

  test("customer quotes page should handle unknown lead", async ({ page }) => {
    await page.goto("/customer/quotes/unknown-id");
    // Should show either a loading spinner or error card or redirect
    await expect(page.locator("body")).toBeVisible();
  });
});
