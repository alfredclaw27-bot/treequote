import { test, expect } from "@playwright/test";

test.describe("Stripe Payment Flow", () => {
  test("quote page should redirect to login when unauthenticated", async ({ page }) => {
    await page.goto("/contractor/quote/mock-001");
    await expect(page).toHaveURL(/\/contractor\/login/);
  });

  test("checkout API should require auth", async ({ page }) => {
    const res = await page.request.post("/api/contractor/checkout", {
      data: { leadId: "mock-001" },
    });
    expect([401, 500]).toContain(res.status());
  });

  test("credit-unlock API should require auth", async ({ page }) => {
    const res = await page.request.post("/api/contractor/unlock-with-credit", {
      data: { leadId: "mock-001" },
    });
    expect([401, 500]).toContain(res.status());
  });

  test("demo mode quote page should show payment and credit-unlock options", async ({ page }) => {
    await page.goto("/contractor/login");
    await page.click("text=Explore Demo Account");
    await expect(page).toHaveURL(/\/contractor\/dashboard/);

    await page.goto("/contractor/quote/mock-002");
    await expect(page.locator("text=TreeQuote")).toBeVisible();
    await expect(page.locator("[data-testid='pay-with-stripe']")).toBeVisible();
    await expect(page.locator("[data-testid='unlock-with-credit']")).toBeVisible();
  });
});
