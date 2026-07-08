import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should load the landing page with hero and CTA", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toContainText("Trees need work");

    const ctaButton = page.locator("a[href='/submit']").first();
    await expect(ctaButton).toBeVisible();

    await expect(page.locator("text=TreeQuote").first()).toBeVisible();
  });

  test("should have working contractor login link", async ({ page }) => {
    await page.goto("/");
    const loginLink = page.locator("header a[href='/contractor/login']");
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL("/contractor/login");
  });

  test("should navigate to submit page when CTA clicked", async ({ page }) => {
    await page.goto("/");
    await page.locator("a[href='/submit']").first().click();
    await expect(page).toHaveURL("/submit");
  });

  test("should show how it works section", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#how-it-works")).toBeVisible();
    await expect(page.locator("h2:has-text('How It Works')")).toBeVisible();
  });

  test("should have a contractor pitch section with apply CTA", async ({ page }) => {
    await page.goto("/");
    const applyLink = page.locator("a[href='/contractor/apply']").first();
    await expect(applyLink).toBeVisible();
  });

  test("should have a footer with quick links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
    await expect(page.locator("footer a[href='/submit']")).toBeVisible();
  });
});
