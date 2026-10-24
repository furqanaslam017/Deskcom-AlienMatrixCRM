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
  await page.waitForURL("**/app/**", { timeout: 30000 });
  await page.waitForTimeout(2000);

  const outDir = path.join(process.cwd(), "evidence", "alien-matrix");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. WhatsApp Shared Inbox
  console.log("Navigating to /app/channels/whatsapp (Inbox tab)...");
  await page.goto("http://localhost:3000/app/channels/whatsapp", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(outDir, "21-whatsapp-shared-inbox.png"), fullPage: true });
  console.log("📸 Captured 21-whatsapp-shared-inbox.png");

  // 2. Multi-Numbers & Sessions Tab
  console.log("Switching to Multi-Numbers tab...");
  await page.locator('button:has-text("Multi-Números")').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, "22-whatsapp-multi-numbers.png"), fullPage: true });
  console.log("📸 Captured 22-whatsapp-multi-numbers.png");

  // 3. Broadcasts & Anti-Ban Pacing Tab
  console.log("Switching to Broadcasts tab...");
  await page.locator('button:has-text("Transmissões Anti-Ban")').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, "23-whatsapp-broadcasts-antiban.png"), fullPage: true });
  console.log("📸 Captured 23-whatsapp-broadcasts-antiban.png");

  // 4. Guardrails Configuration Tab
  console.log("Switching to The 7 Guardrails tab...");
  await page.locator('button:has-text("Os 7 Guardrails")').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, "24-whatsapp-guardrails-config.png"), fullPage: true });
  console.log("📸 Captured 24-whatsapp-guardrails-config.png");

  console.log("✅ All Phase 5 screenshots captured successfully!");
  await browser.close();
}

main().catch(console.error);
