import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log("Navigating to login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1000);

  console.log("Filling login credentials...");
  await page.locator("#email").fill("admin@whitehouseforexacademy.com");
  await page.locator("#password").fill("Furqan@17**");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  console.log("Waiting for app navigation...");
  await page.waitForURL("**/app/**", { timeout: 60000 });
  await page.waitForTimeout(2000);

  const outDir = path.join(process.cwd(), "evidence", "alien-matrix");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Executive Analytics Dashboard
  console.log("Navigating to /app/analise/alien-matrix (Dashboard tab)...");
  await page.goto("http://localhost:3000/app/analise/alien-matrix", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('[data-testid="tab-reports"]', { timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "30-analytics-executive-dashboard.png"), fullPage: true });
  console.log("📸 Captured 30-analytics-executive-dashboard.png");

  // 2. Custom Reports Tab
  console.log("Switching to Reports tab...");
  await page.locator('[data-testid="tab-reports"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, "31-analytics-custom-reports.png"), fullPage: true });
  console.log("📸 Captured 31-analytics-custom-reports.png");

  // 3. Scheduled Reports Tab
  console.log("Switching to Scheduled Reports tab...");
  await page.locator('[data-testid="tab-scheduled"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, "32-analytics-scheduled-reports.png"), fullPage: true });
  console.log("📸 Captured 32-analytics-scheduled-reports.png");

  // 4. Plans & Billing Tab
  console.log("Switching to Plans & Billing tab...");
  await page.locator('[data-testid="tab-billing"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, "33-billing-plans-subscriptions.png"), fullPage: true });
  console.log("📸 Captured 33-billing-plans-subscriptions.png");

  console.log("✅ All Phase 7 screenshots captured successfully!");
  await browser.close();
}

main().catch(console.error);
