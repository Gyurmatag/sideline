import { test, expect } from "@playwright/test";

test("the demo market shows the live AI desk with forecaster reasoning", async ({
  page,
}) => {
  await page.goto("/e/demo");

  // The AI desk panel renders once the live market loads over the WebSocket.
  await expect(page.getByRole("heading", { name: /AI desk/i })).toBeVisible({
    timeout: 30_000,
  });

  // At least one AI forecast streams in live from SpacetimeDB (sideline-agentb
  // already has forecaster entries). Allow time for the WebSocket subscription.
  await expect(page.getByTestId("agent-feed-item").first()).toBeVisible({
    timeout: 30_000,
  });

  // The live leaderboard ranks traders (agents + humans) by net worth.
  await expect(page.getByRole("heading", { name: /Leaderboard/i })).toBeVisible();
  await expect(page.getByTestId("leaderboard-row").first()).toBeVisible({
    timeout: 30_000,
  });
});
