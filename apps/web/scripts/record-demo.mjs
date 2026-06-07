// Records a Sideline demo walkthrough to webm (Playwright), against the live site.
// Usage: node scripts/record-demo.mjs  (then convert webm -> mp4 with ffmpeg)
import { chromium } from "@playwright/test";

const BASE =
  process.env.DEMO_BASE ?? "https://sideline-agentb-web.cfi-ops.workers.dev";
const OUT_DIR = "demo-video";
const SIZE = { width: 1366, height: 768 };

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: SIZE,
  recordVideo: { dir: OUT_DIR, size: SIZE },
});
const page = await context.newPage();
const video = page.video();
const pause = (ms) => page.waitForTimeout(ms);

try {
  // 1. Landing
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await pause(3500);

  // 2. Live market — wait for the connection + market data
  await page.goto(`${BASE}/e/demo`, { waitUntil: "domcontentloaded" });
  await page
    .getByRole("heading", { name: /try|keynote|demo/i })
    .first()
    .waitFor({ timeout: 30000 })
    .catch(() => {});
  await pause(4500);

  // 3. Place a few trades so the price visibly moves
  const buyYes = page.getByTestId("buy-YES");
  for (let i = 0; i < 4; i++) {
    if (await buyYes.isEnabled().catch(() => false)) {
      await buyYes.click().catch(() => {});
      await pause(1400);
    }
  }
  await pause(2500);

  // 4. AI desk (transparent forecaster reasoning)
  await page
    .getByText("AI desk")
    .first()
    .scrollIntoViewIfNeeded()
    .catch(() => {});
  await pause(4500);

  // 5. Leaderboard
  await page
    .getByRole("heading", { name: "Leaderboard" })
    .first()
    .scrollIntoViewIfNeeded()
    .catch(() => {});
  await pause(3000);

  // 6. Big-screen / projector view
  await page.goto(`${BASE}/e/demo/screen`, { waitUntil: "domcontentloaded" });
  await page
    .getByRole("heading", { name: /try|keynote|demo/i })
    .first()
    .waitFor({ timeout: 30000 })
    .catch(() => {});
  await pause(6000);

  // 7. Organizer analytics + AI calibration scoreboard
  await page.goto(`${BASE}/e/demo/analytics`, { waitUntil: "domcontentloaded" });
  await page
    .getByText("AI forecaster calibration")
    .waitFor({ timeout: 15000 })
    .catch(() => {});
  await pause(5000);
} finally {
  await context.close();
  await browser.close();
}

const path = await video.path();
console.log("VIDEO_WEBM:" + path);
