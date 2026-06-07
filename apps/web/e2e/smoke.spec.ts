import { test, expect } from "@playwright/test";

test("landing page renders the Sideline hero and CTAs", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /sideline/i }).first()).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /turn your event into a live market/i,
      level: 1,
    }),
  ).toBeVisible();
  await expect(page.getByText(/prediction market/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /create your event/i }).first(),
  ).toBeVisible();
  await expect(page.getByText(/play money only/i).first()).toBeVisible();
});
