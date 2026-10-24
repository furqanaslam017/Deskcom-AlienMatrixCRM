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
  await page.locator('button[type="submit"]').click();

  console.log("Waiting for app navigation...");
  await page.waitForURL("**/app/**", { timeout: 60000 });
  await page.waitForTimeout(2000);

  const outDir = path.join(process.cwd(), "evidence", "alien-matrix");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Executive Analytics Dashboard (English)
  console.log("Navigating to /app/analise/alien-matrix (Executive Dashboard)...");
  await page.goto("http://localhost:3000/app/analise/alien-matrix", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('[data-testid="tab-reports"]', { timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "34-english-analytics-executive-dashboard.png"), fullPage: true });
  console.log("📸 Captured 34-english-analytics-executive-dashboard.png");

  // 2. Plans & Billing Tab (English)
  console.log("Switching to Plans & Billing tab...");
  await page.locator('[data-testid="tab-billing"]').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, "35-english-analytics-plans-billing.png"), fullPage: true });
  console.log("📸 Captured 35-english-analytics-plans-billing.png");

  // 3. AI Layer Console (English)
  console.log("Navigating to /app/ai/alien-matrix (AI Console)...");
  await page.goto("http://localhost:3000/app/ai/alien-matrix", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "36-english-ai-layer-console.png"), fullPage: true });
  console.log("📸 Captured 36-english-ai-layer-console.png");

  // 4. WhatsApp Flagship (English)
  console.log("Navigating to /app/channels/whatsapp (WhatsApp Flagship)...");
  await page.goto("http://localhost:3000/app/channels/whatsapp", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "37-english-whatsapp-flagship.png"), fullPage: true });
  console.log("📸 Captured 37-english-whatsapp-flagship.png");

  // 5. Workflows Builder (English)
  console.log("Navigating to /app/crm/workflows (Workflows Builder)...");
  await page.goto("http://localhost:3000/app/crm/workflows", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "38-english-workflows-builder.png"), fullPage: true });
  console.log("📸 Captured 38-english-workflows-builder.png");

  // 6. Custom Objects (English)
  console.log("Navigating to /app/objects (Custom Objects Engine)...");
  await page.goto("http://localhost:3000/app/objects", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "39-english-custom-objects-table.png"), fullPage: true });
  console.log("📸 Captured 39-english-custom-objects-table.png");

  // 7. Platform Super-Admin (English)
  console.log("Navigating to /admin/alien-matrix (Super-Admin Console)...");
  await page.goto("http://localhost:3000/admin/alien-matrix", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "40-english-platform-superadmin.png"), fullPage: true });
  console.log("📸 Captured 40-english-platform-superadmin.png");

  console.log("✅ All Phase 8 English screenshots captured successfully!");
  await browser.close();
}

main().catch(console.error);
