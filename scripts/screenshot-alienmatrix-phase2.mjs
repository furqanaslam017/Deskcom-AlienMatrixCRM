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
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });

  console.log("Filling login credentials...");
  await page.fill('input[type="email"]', "admin@whitehouseforexacademy.com");
  await page.fill('input[type="password"]', "Furqan@17**");
  await page.click('button[type="submit"]');

  console.log("Waiting for app navigation...");
  await page.waitForURL("**/app/**", { timeout: 30000 });
  await page.waitForTimeout(2000);

  const outDir = path.join(process.cwd(), "evidence", "alien-matrix");

  // 06. Deals
  console.log("Capturing 06-deals-kanban.png...");
  await page.goto("http://localhost:3000/app/crm/deals", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "06-deals-kanban.png"), fullPage: true });

  // 08. Products
  console.log("Capturing 08-products-catalog.png...");
  await page.goto("http://localhost:3000/app/crm/products", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "08-products-catalog.png"), fullPage: true });

  // 09. Invoices
  console.log("Capturing 09-invoices-quotes.png...");
  await page.goto("http://localhost:3000/app/crm/invoices", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "09-invoices-quotes.png"), fullPage: true });

  // 10. Calendar
  console.log("Capturing 10-calendar-timeline.png...");
  await page.goto("http://localhost:3000/app/crm/calendar", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "10-calendar-timeline.png"), fullPage: true });

  await browser.close();
  console.log("🎉 Fresh captures 06, 08, 09, 10 completed!");
}

main().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});
