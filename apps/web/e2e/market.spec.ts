import { test, expect } from "@playwright/test";

/** Parse a "62%" style string into a number. */
function pct(text: string | null): number {
  const m = text?.match(/(\d+)%/);
  return m ? Number(m[1]) : NaN;
}

test("a trade moves the LMSR price live for a second client", async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const a = await ctxA.newPage();
  const b = await ctxB.newPage();

  await a.goto("/e/demo");
  await b.goto("/e/demo");

  // Both clients reach the live market.
  await expect(a.getByTestId("buy-YES")).toBeEnabled({ timeout: 45_000 });
  await expect(b.getByTestId("prob-YES")).toBeVisible({ timeout: 45_000 });

  // Trade the cheaper side (always has room to move up — robust to prior runs).
  const yesB = pct(await b.getByTestId("prob-YES").textContent());
  const noB = pct(await b.getByTestId("prob-NO").textContent());
  const target = yesB <= noB ? "YES" : "NO";
  const before = Math.min(yesB, noB);

  // Bigger size for a clearly visible move, then buy on client A.
  await a.getByRole("button", { name: "50", exact: true }).click();
  await a.getByTestId(`buy-${target}`).click();

  // Client B — which never traded — sees the new price stream in live.
  await expect
    .poll(async () => pct(await b.getByTestId(`prob-${target}`).textContent()), {
      timeout: 25_000,
    })
    .toBeGreaterThan(before);

  await ctxA.close();
  await ctxB.close();
});
