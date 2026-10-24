import { chromium } from '@playwright/test';

async function inspectMeshCss() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://demo.codeandchill.store/rapport/#/overview', { timeout: 30000, waitUntil: 'networkidle' });

  const css = await page.evaluate(() => {
    const results = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules || [])) {
          if (rule.selectorText && (
            rule.selectorText.includes('.mesh') ||
            rule.selectorText.includes('.dock') ||
            rule.selectorText.includes('.top') ||
            rule.selectorText.includes('.card') ||
            rule.selectorText.includes('.tab') ||
            rule.selectorText.includes('.brand')
          )) {
            results.push({
              selector: rule.selectorText,
              cssText: rule.cssText
            });
          }
        }
      } catch (e) {}
    }
    return results;
  });

  console.log('CSS Rules found:', css.length);
  for (const r of css.slice(0, 30)) {
    console.log(r.cssText);
  }

  await browser.close();
}

inspectMeshCss().catch(console.error);
