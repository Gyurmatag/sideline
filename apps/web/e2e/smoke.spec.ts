import { test, expect } from "@playwright/test";

test("landing page renders the Sideline hero and CTAs", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Sideline", level: 1 })).toBeVisible();
  await expect(page.getByText(/prediction market/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /create your event/i })).toBeVisible();
  await expect(page.getByText(/play money only/i)).toBeVisible();
});
