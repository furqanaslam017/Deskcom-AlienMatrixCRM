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
  await page.waitForTimeout(1000);

  console.log("Filling login credentials...");
  await page.locator("#email").fill("admin@whitehouseforexacademy.com");
  await page.locator("#password").fill("Furqan@17**");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  console.log("Waiting for app navigation...");
  await page.waitForURL("**/app/**", { timeout: 30000 });
  await page.waitForTimeout(2000);

  const outDir = path.join(process.cwd(), "evidence", "alien-matrix");

  // 1. Workflows List View
  console.log("Navigating to /app/crm/workflows (Workflows tab)...");
  await page.goto("http://localhost:3000/app/crm/workflows", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "17-workflows-list.png"), fullPage: true });
  console.log("📸 Captured 17-workflows-list.png");

  // 2. Open Workflow Builder Modal
  console.log("Opening Workflow Builder modal...");
  const newWfBtn = page.locator('button:has-text("Novo Workflow")').first();
  if (await newWfBtn.isVisible()) {
    await newWfBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, "18-workflow-builder-modal.png"), fullPage: true });
    console.log("📸 Captured 18-workflow-builder-modal.png");
    await page.locator('button:has-text("Cancelar")').first().click();
    await page.waitForTimeout(500);
  }

  // 3. Lead Forms Tab
  console.log("Switching to Lead Forms tab...");
  await page.locator('button:has-text("Formulários de Captura")').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "19-lead-forms-manager.png"), fullPage: true });
  console.log("📸 Captured 19-lead-forms-manager.png");

  // 4. Inbound Webhooks Tab
  console.log("Switching to Webhooks Inbound tab...");
  await page.locator('button:has-text("Webhooks Inbound")').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "20-workflow-executions-log.png"), fullPage: true });
  console.log("📸 Captured 20-workflow-executions-log.png");

  console.log("✅ All Phase 4 screenshots captured successfully!");
  await browser.close();
}

main().catch(console.error);
