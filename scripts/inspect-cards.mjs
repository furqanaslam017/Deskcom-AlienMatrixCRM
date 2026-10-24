import { chromium } from '@playwright/test';

async function inspectCards() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://demo.codeandchill.store/rapport/#/overview', { timeout: 30000, waitUntil: 'networkidle' });

  const cardCss = await page.evaluate(() => {
    const results = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules || [])) {
          if (rule.selectorText && (
            rule.selectorText.includes('.card') ||
            rule.selectorText.includes('.tile') ||
            rule.selectorText.includes('.table') ||
            rule.selectorText.includes('.btn') ||
            rule.selectorText.includes('.badge') ||
            rule.selectorText.includes('.pill') ||
            rule.selectorText.includes('.grid') ||
            rule.selectorText.includes('.kpi') ||
            rule.selectorText.includes('.metric')
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

  console.log('Card/Component CSS Rules:', cardCss.length);
  for (const r of cardCss.slice(0, 40)) {
    console.log(r.cssText);
  }

  await browser.close();
}

inspectCards().catch(console.error);
