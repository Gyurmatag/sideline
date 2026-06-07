import { test, expect } from "@playwright/test";

test("analytics dashboard renders KPIs and charts", async ({ page }) => {
  await page.goto("/e/demo/analytics");

  await expect(page.getByText("Organizer dashboard")).toBeVisible();
  await expect(page.getByText("Trades", { exact: true })).toBeVisible();
  await expect(page.getByText("Volume", { exact: true })).toBeVisible();
  await expect(page.getByText("Cumulative trade volume")).toBeVisible();
  await expect(page.getByText("Trades by outcome")).toBeVisible();
});
