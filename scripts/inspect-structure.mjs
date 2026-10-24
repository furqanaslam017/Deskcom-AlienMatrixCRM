import { chromium } from '@playwright/test';

async function inspectLayout() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://demo.codeandchill.store/rapport/#/overview', { timeout: 30000, waitUntil: 'networkidle' });

  const structure = await page.evaluate(() => {
    const bodyChildren = Array.from(document.body.children).map(c => ({
      tagName: c.tagName,
      className: c.className,
      id: c.id
    }));

    const bgElement = document.querySelector('.bg, .mesh, [class*="bg"], [class*="mesh"]');
    const bgStyles = bgElement ? window.getComputedStyle(bgElement).cssText : 'none';

    const header = document.querySelector('header, .header, .topbar, .nav');
    const headerInfo = header ? {
      className: header.className,
      height: header.clientHeight,
      computed: {
        padding: window.getComputedStyle(header).padding,
        backdropFilter: window.getComputedStyle(header).backdropFilter,
        position: window.getComputedStyle(header).position
      }
    } : null;

    const dock = document.querySelector('.dock');
    const dockInfo = dock ? {
      className: dock.className,
      width: dock.clientWidth,
      height: dock.clientHeight,
      computed: {
        position: window.getComputedStyle(dock).position,
        left: window.getComputedStyle(dock).left,
        top: window.getComputedStyle(dock).top,
        borderRadius: window.getComputedStyle(dock).borderRadius,
        backgroundColor: window.getComputedStyle(dock).backgroundColor,
        backdropFilter: window.getComputedStyle(dock).backdropFilter
      }
    } : null;

    return {
      bodyChildren,
      headerInfo,
      dockInfo,
      bgElementClass: bgElement?.className,
      bodyStyles: {
        background: window.getComputedStyle(document.body).background,
        backgroundImage: window.getComputedStyle(document.body).backgroundImage
      }
    };
  });

  console.log('Structure & Layout:', JSON.stringify(structure, null, 2));

  await browser.close();
}

inspectLayout().catch(console.error);
