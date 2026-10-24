import { chromium } from '@playwright/test';

async function inspectModals() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://demo.codeandchill.store/rapport/#/overview', { timeout: 30000, waitUntil: 'networkidle' });

  // Open "Create new" menu or "Today" modal
  const modalsInfo = await page.evaluate(() => {
    const dialogs = Array.from(document.querySelectorAll('dialog')).map(d => ({
      id: d.id,
      className: d.className,
      computed: {
        background: window.getComputedStyle(d).background,
        borderRadius: window.getComputedStyle(d).borderRadius,
        boxShadow: window.getComputedStyle(d).boxShadow,
        border: window.getComputedStyle(d).border
      }
    }));
    return dialogs;
  });

  console.log('Dialogs info:', JSON.stringify(modalsInfo, null, 2));
  await browser.close();
}

inspectModals().catch(console.error);
