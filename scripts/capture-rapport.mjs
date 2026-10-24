import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('docs/ui-redesign/screenshots/reference');
fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
];

const ROUTES = [
  { name: 'overview', hash: '#/overview' },
  { name: 'pipeline', hash: '#/pipeline' },
  { name: 'customers', hash: '#/customers' },
  { name: 'schedule', hash: '#/schedule' },
  { name: 'finance', hash: '#/finance' },
  { name: 'growth', hash: '#/growth' },
  { name: 'projects', hash: '#/projects' },
];

async function capture() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n=== Processing Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    // Initial load
    await page.goto('https://demo.codeandchill.store/rapport/#/overview', { timeout: 35000, waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    for (const theme of ['light', 'dark']) {
      console.log(`--- Theme: ${theme} ---`);

      // Ensure theme is set correctly
      const currentTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');
      if (currentTheme !== theme) {
        console.log(`Toggling theme from ${currentTheme} to ${theme}...`);
        await page.click('button.dock__theme');
        await page.waitForTimeout(600);
      }

      for (const route of ROUTES) {
        const url = `https://demo.codeandchill.store/rapport/${route.hash}`;
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
          await page.waitForTimeout(800);

          const fileName = `${route.name}-${theme}-${vp.name}.png`;
          const filePath = path.join(OUT_DIR, fileName);
          await page.screenshot({ path: filePath, fullPage: false });
          console.log(`Saved screenshot: ${fileName}`);
        } catch (e) {
          console.error(`Failed to capture ${route.name} (${theme}, ${vp.name}):`, e.message);
        }
      }
    }

    await page.close();
  }

  await browser.close();
  console.log('\nAll reference screenshots captured successfully!');
}

capture().catch(console.error);
