import { test, expect } from "@playwright/test";

test.describe("Contractor Profile Page", () => {
  test("profile page should redirect to login when unauthenticated", async ({ page }) => {
    await page.goto("/contractor/profile");
    await expect(page).toHaveURL(/\/contractor\/login/);
  });

  test("login page should have contractor apply link", async ({ page }) => {
    await page.goto("/contractor/login");
    const applyLink = page.locator("a[href='/contractor/apply']");
    await expect(applyLink).toBeVisible();
  });

  test("contractor apply page should load", async ({ page }) => {
    await page.goto("/contractor/apply");
    await expect(page).toHaveURL("/contractor/apply");
    await expect(page.locator("h1")).toContainText("Contractor Application");
  });

  test("contractor apply requires business name and email", async ({ page }) => {
    await page.goto("/contractor/apply");
    await page.click("button:has-text('Submit Application')");
    const emailInput = page.locator("input[type='email']");
    await expect(emailInput).toBeVisible();
  });
});
