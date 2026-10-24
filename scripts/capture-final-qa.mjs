import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
];

const ROUTES = [
  { slug: "overview", path: "/app" },
  { slug: "pipeline", path: "/app/crm/deals" },
  { slug: "customers", path: "/app/channels/whatsapp" },
  { slug: "schedule", path: "/app/crm/calendar" },
  { slug: "finance", path: "/app/crm/invoices" },
  { slug: "growth", path: "/app/analise/alien-matrix" },
  { slug: "projects", path: "/app/objects" },
  { slug: "ai-console", path: "/app/ai/alien-matrix" },
  { slug: "workflows", path: "/app/crm/workflows" },
];

async function applyTheme(page, theme) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.evaluate((t) => {
        document.documentElement.setAttribute("data-theme", t);
        if (t === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }, theme);
      return;
    } catch (err) {
      await page.waitForTimeout(1000);
    }
  }
}

async function main() {
  const outDir = path.join(process.cwd(), "docs", "ui-redesign", "screenshots", "local");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log("Navigating to login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1500);

  console.log("Authenticating...");
  await page.locator("#email").fill("admin@whitehouseforexacademy.com");
  await page.locator("#password").fill("Furqan@17**");
  await page.locator('button[type="submit"]').click();

  console.log("Waiting for app navigation...");
  await page.waitForURL("**/app/**", { timeout: 60000 });
  await page.waitForTimeout(3000);

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================`);
    console.log(`Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    console.log(`========================================`);
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const route of ROUTES) {
      console.log(`Capturing ${route.slug} at ${route.path}...`);
      await page.goto(`http://localhost:3000${route.path}`, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });
      await page.waitForTimeout(2000);

      // Light Theme
      await applyTheme(page, "light");
      await page.waitForTimeout(600);
      const lightFile = path.join(outDir, `${route.slug}-light-${vp.name}.png`);
      await page.screenshot({ path: lightFile, fullPage: false });
      console.log(`  ✓ Saved ${route.slug}-light-${vp.name}.png`);

      // Dark Theme
      await applyTheme(page, "dark");
      await page.waitForTimeout(600);
      const darkFile = path.join(outDir, `${route.slug}-dark-${vp.name}.png`);
      await page.screenshot({ path: darkFile, fullPage: false });
      console.log(`  ✓ Saved ${route.slug}-dark-${vp.name}.png`);
    }
  }

  console.log("\n🎉 All 54 QA screenshots captured successfully across viewports & themes!");
  await browser.close();
}

main().catch((err) => {
  console.error("QA Capture error:", err);
  process.exit(1);
});
