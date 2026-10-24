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

  // 1. Workspace Admin - Roles & Permissions
  console.log("Navigating to /app/settings/alien-matrix (Roles tab)...");
  await page.goto("http://localhost:3000/app/settings/alien-matrix", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "12-admin-roles-permissions.png"), fullPage: true });
  console.log("📸 Captured 12-admin-roles-permissions.png");

  // 2. Workspace Admin - Security & SSO
  console.log("Switching to Security tab...");
  await page.locator('button:has-text("Segurança")').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "13-admin-security-sso.png"), fullPage: true });
  console.log("📸 Captured 13-admin-security-sso.png");

  // 3. Workspace Admin - Branding & Languages
  console.log("Switching to Branding & Languages tab...");
  await page.locator('button:has-text("Marca")').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "14-admin-branding-localization.png"), fullPage: true });
  console.log("📸 Captured 14-admin-branding-localization.png");

  // 4. Workspace Admin - Trash & Backup
  console.log("Switching to Trash & Backup tab...");
  await page.locator('button:has-text("Lixeira")').first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, "15-admin-trash-backup.png"), fullPage: true });
  console.log("📸 Captured 15-admin-trash-backup.png");

  // 5. Super-Admin Platform Console
  console.log("Navigating to /admin/alien-matrix...");
  await page.goto("http://localhost:3000/admin/alien-matrix", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "16-super-admin-platform-console.png"), fullPage: true });
  console.log("📸 Captured 16-super-admin-platform-console.png");

  await browser.close();
  console.log("🎉 All Phase 3 visual evidence captured successfully!");
}

main().catch((err) => {
  console.error("Screenshot error:", err);
  process.exit(1);
});
