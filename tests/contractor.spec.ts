import { test, expect } from "@playwright/test";

test.describe("Contractor Portal", () => {
  test("login page should load and have form", async ({ page }) => {
    await page.goto("/contractor/login");
    await expect(page).toHaveURL("/contractor/login");
    await expect(page.locator("h1")).toContainText("Contractor Login");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button:has-text('Sign In')")).toBeVisible();
  });

  test("login page should have apply link", async ({ page }) => {
    await page.goto("/contractor/login");
    const applyLink = page.locator("a[href='/contractor/apply']");
    await expect(applyLink).toBeVisible();
    await applyLink.click();
    await expect(page).toHaveURL("/contractor/apply");
  });

  test("apply page should load with all form fields", async ({ page }) => {
    await page.goto("/contractor/apply");
    await expect(page).toHaveURL("/contractor/apply");
    await expect(page.locator("h1")).toContainText("Contractor Application");
    await expect(page.locator("input[placeholder*='ABC Services']")).toBeVisible();
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("input[type='tel']")).toBeVisible();
    await expect(page.locator("text=Specialties")).toBeVisible();
  });

  test("apply page should toggle specialty selections", async ({ page }) => {
    await page.goto("/contractor/apply");
    const removalBtn = page.locator("button:has-text('Tree Removal')");
    await removalBtn.click();
    await expect(removalBtn).toHaveClass(/bg-primary/);
    await removalBtn.click();
    await expect(removalBtn).not.toHaveClass(/bg-primary/);
  });

  test("dashboard should redirect to login when unauthenticated", async ({ page }) => {
    await page.goto("/contractor/dashboard");
    await expect(page).toHaveURL(/\/contractor\/login/);
  });

  test("profile page should redirect to login when unauthenticated", async ({ page }) => {
    await page.goto("/contractor/profile");
    await expect(page).toHaveURL(/\/contractor\/login/);
  });

  test("demo mode should unlock the full dashboard without Supabase", async ({ page }) => {
    await page.goto("/contractor/login");
    await page.click("text=Explore Demo Account");
    await expect(page).toHaveURL(/\/contractor\/dashboard/);
    await expect(page.locator("text=Demo mode")).toBeVisible();
    await expect(page.locator("text=Available Leads")).toBeVisible();
    await expect(page.locator("[data-testid='lead-triage-controls']")).toBeVisible();
    await expect(page.locator("[data-testid='lead-fit-summary']").first()).toContainText("Why this fits");
    await expect(page.locator("[data-testid='lead-fit-summary']").first()).toContainText("Strong specialty match");
  });

  test("demo dashboard triage controls can filter available leads", async ({ page }) => {
    await page.goto("/contractor/login");
    await page.click("text=Explore Demo Account");
    await expect(page).toHaveURL(/\/contractor\/dashboard/);

    await page.selectOption("[data-testid='lead-service-select']", "stump");
    await expect(page.locator("p.font-semibold", { hasText: "Stump Grinding" })).toBeVisible();
    await expect(page.locator("text=Church Rd")).toHaveCount(0);

    await page.click("button:has-text('Unlocked')");
    await expect(page.locator("text=No leads match those filters right now.")).toBeVisible();
  });
});
