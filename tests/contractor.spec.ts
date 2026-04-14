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
    await expect(page.locator("input[placeholder*='ABC Tree']")).toBeVisible(); // business name
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("input[type='tel']")).toBeVisible();
    await expect(page.locator("text=Specialties")).toBeVisible();
  });

  test("apply page should toggle specialty selections", async ({ page }) => {
    await page.goto("/contractor/apply");
    // Click on Tree Removal specialty
    const removalBtn = page.locator("button:has-text('Tree Removal')");
    await removalBtn.click();
    await expect(removalBtn).toHaveClass(/bg-green-100/);
    await removalBtn.click();
    await expect(removalBtn).not.toHaveClass(/bg-green-100/);
  });

  test("dashboard should redirect to login when unauthenticated", async ({ page }) => {
    await page.goto("/contractor/dashboard");
    // Should redirect to login
    await expect(page).toHaveURL(/\/contractor\/login/);
  });

  test("profile page should load with equipment form", async ({ page }) => {
    await page.goto("/contractor/profile");
    // Should redirect to login when unauthenticated
    await expect(page).toHaveURL(/\/contractor\/login/);
  });
});
