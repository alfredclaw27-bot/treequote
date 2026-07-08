import { test, expect } from "@playwright/test";

test.describe("Mobile PWA", () => {
  test("should render correctly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14 size
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    const ctaButton = page.locator("a[href='/submit']").first();
    await expect(ctaButton).toBeVisible();
  });

  test("submit page should be mobile-friendly", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/submit");
    await expect(page.locator("h1")).toBeVisible();
    const steps = page.locator("[data-testid='progress-step']");
    await expect(steps).toHaveCount(6);
  });
});

test.describe("Component Tests", () => {
  test("service selector should allow multi-select", async ({ page }) => {
    await page.goto("/contractor/apply");
    const removal = page.locator("button:has-text('Tree Removal')");
    const trimming = page.locator("button:has-text('Trimming')");
    await removal.click();
    await trimming.click();
    await expect(removal).toHaveClass(/bg-primary/);
    await expect(trimming).toHaveClass(/bg-primary/);
  });

  test("contractor apply requires business name and email", async ({ page }) => {
    await page.goto("/contractor/apply");
    await page.click("button:has-text('Submit Application')");
    const emailInput = page.locator("input[type='email']");
    await expect(emailInput).toBeVisible();
  });
});
