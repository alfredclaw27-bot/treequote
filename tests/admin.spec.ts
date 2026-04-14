import { test, expect } from "@playwright/test";

test.describe("Admin Page", () => {
  test("should load the admin page", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL("/admin");
    await expect(page.locator("text=TreeQuote Admin")).toBeVisible();
  });

  test("should show sections for leads, contractors, and quotes", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=Leads")).toBeVisible();
    await expect(page.locator("text=Contractors")).toBeVisible();
    await expect(page.locator("text=Quotes")).toBeVisible();
  });

  test("should have back to site link", async ({ page }) => {
    await page.goto("/admin");
    const backLink = page.locator("a:has-text('Back to site')");
    await expect(backLink).toBeVisible();
  });
});

test.describe("Submitted Confirmation Page", () => {
  test("should load submitted page", async ({ page }) => {
    await page.goto("/submitted");
    await expect(page).toHaveURL("/submitted");
    await expect(page.locator("h1")).toContainText("all set");
    await expect(page.locator("text=Back to Home")).toBeVisible();
  });

  test("should show what happens next section", async ({ page }) => {
    await page.goto("/submitted");
    await expect(page.locator("text=What happens next?")).toBeVisible();
  });
});
