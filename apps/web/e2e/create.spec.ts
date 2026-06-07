import { test, expect } from "@playwright/test";

test("create-event form renders and previews the event link", async ({ page }) => {
  await page.goto("/create");

  await expect(
    page.getByRole("heading", { name: "Create your event" }),
  ).toBeVisible();

  await page.getByLabel("Event name").fill("My Test Event");
  await expect(page.getByText("/e/my-test-event")).toBeVisible();

  await expect(page.getByText(/play money only/i)).toBeVisible();
});
