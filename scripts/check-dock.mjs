import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://demo.codeandchill.store/rapport/#/overview', { timeout: 30000, waitUntil: 'networkidle' });

  const dockInfo = await page.evaluate(() => {
    const dock = document.querySelector('.dock');
    const buttons = Array.from(document.querySelectorAll('.dock button')).map(b => ({
      text: b.innerText,
      ariaLabel: b.getAttribute('aria-label'),
      className: b.className,
      id: b.id,
      html: b.outerHTML
    }));
    const htmlAttrs = Array.from(document.documentElement.attributes).map(a => `${a.name}="${a.value}"`);
    const bodyAttrs = Array.from(document.body.attributes).map(a => `${a.name}="${a.value}"`);
    return {
      dockExists: !!dock,
      dockClasses: dock ? dock.className : '',
      buttons,
      htmlAttrs,
      bodyAttrs
    };
  });

  console.log('Dock info:', JSON.stringify(dockInfo, null, 2));

  await browser.close();
}

main().catch(console.error);
