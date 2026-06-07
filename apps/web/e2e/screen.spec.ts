import { test, expect } from "@playwright/test";

test("spectator screen renders the featured market, AI desk, and leaderboard", async ({
  page,
}) => {
  await page.goto("/e/demo/screen");

  await expect(page.getByText("Featured market")).toBeVisible();
  await expect(page.getByText("AI desk")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Leaderboard" })).toBeVisible();

  // Once connected + subscribed, the live market question replaces the placeholder.
  await expect(page.getByRole("heading", { name: /try/i })).toBeVisible({
    timeout: 30_000,
  });
});
