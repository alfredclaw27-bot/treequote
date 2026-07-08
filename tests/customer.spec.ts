import { test, expect } from "@playwright/test";

test.describe("Customer Portal", () => {
  test("customer quotes page should load when given a lead ID", async ({ page }) => {
    // Uses a demo mock lead ID that the contractor dashboard also uses
    await page.goto("/customer/quotes/mock-001");
    await expect(page.locator("body")).toBeVisible();
  });

  test("submit page should have branding", async ({ page }) => {
    await page.goto("/submit");
    await expect(page.locator("text=TreeQuote").first()).toBeVisible();
  });

  test("submitted confirmation page should exist", async ({ page }) => {
    await page.goto("/submitted");
    await expect(page.locator("h1")).toContainText("all set");
    await expect(page.locator("text=Back to Home")).toBeVisible();
  });

  test("landing page should load correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Trees need work");
  });

  test("customer quotes page should handle unknown lead", async ({ page }) => {
    await page.goto("/customer/quotes/unknown-id");
    await expect(page.locator("body")).toBeVisible();
  });
});
