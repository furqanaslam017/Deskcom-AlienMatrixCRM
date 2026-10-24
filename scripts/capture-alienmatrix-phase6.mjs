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

  // 1. Providers Tab
  console.log("Navigating to /app/ai/alien-matrix (Providers tab)...");
  await page.goto("http://localhost:3000/app/ai/alien-matrix", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(outDir, "25-ai-multi-providers.png"), fullPage: true });
  console.log("📸 Captured 25-ai-multi-providers.png");

  // 2. Personas Tab
  console.log("Switching to Personas tab...");
  await page.locator('button:has-text("Personas do Agente")').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, "26-ai-agent-personas.png"), fullPage: true });
  console.log("📸 Captured 26-ai-agent-personas.png");

  // 3. Knowledge Base RAG Tab
  console.log("Switching to Base RAG tab...");
  await page.locator('button:has-text("Base RAG")').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, "27-ai-knowledge-rag.png"), fullPage: true });
  console.log("📸 Captured 27-ai-knowledge-rag.png");

  // 4. Lead Scoring & Insights Tab
  console.log("Switching to Lead Scoring & Insights tab...");
  await page.locator('button:has-text("Lead Scoring & Insights")').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, "28-ai-lead-scoring-insights.png"), fullPage: true });
  console.log("📸 Captured 28-ai-lead-scoring-insights.png");

  // 5. Human Handoff Queue Tab
  console.log("Switching to Handoffs Humanos tab...");
  await page.locator('button:has-text("Handoffs Humanos")').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, "29-ai-human-handoff-queue.png"), fullPage: true });
  console.log("📸 Captured 29-ai-human-handoff-queue.png");

  console.log("✅ All Phase 6 screenshots captured successfully!");
  await browser.close();
}

main().catch(console.error);
