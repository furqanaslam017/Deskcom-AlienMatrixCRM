import { chromium } from '@playwright/test';

async function extractStyles() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://demo.codeandchill.store/rapport/#/overview', { timeout: 30000, waitUntil: 'networkidle' });

  // 1. Light Theme Token Extraction
  const lightTokens = await page.evaluate(() => {
    const root = document.documentElement;
    const computed = window.getComputedStyle(root);
    const bodyComputed = window.getComputedStyle(document.body);

    const cssVars = {};
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules || [])) {
          if (rule.selectorText === ':root' || rule.selectorText === 'html' || rule.selectorText?.includes('theme')) {
            const style = rule.style;
            for (let i = 0; i < style.length; i++) {
              const name = style[i];
              if (name.startsWith('--')) {
                cssVars[name] = computed.getPropertyValue(name).trim();
              }
            }
          }
        }
      } catch (e) {
        // cross-origin stylesheets ignore
      }
    }

    return {
      cssVars,
      fontFamily: bodyComputed.fontFamily,
      fontSize: bodyComputed.fontSize,
      backgroundColor: bodyComputed.backgroundColor,
      color: bodyComputed.color,
    };
  });

  // Toggle theme to dark
  await page.click('button.dock__theme');
  await page.waitForTimeout(500);

  // 2. Dark Theme Token Extraction
  const darkTokens = await page.evaluate(() => {
    const root = document.documentElement;
    const computed = window.getComputedStyle(root);
    const bodyComputed = window.getComputedStyle(document.body);
    const themeAttr = root.getAttribute('data-theme');

    const cssVars = {};
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules || [])) {
          if (rule.selectorText?.includes('dark') || rule.selectorText === ':root' || rule.selectorText === 'html') {
            const style = rule.style;
            for (let i = 0; i < style.length; i++) {
              const name = style[i];
              if (name.startsWith('--')) {
                cssVars[name] = computed.getPropertyValue(name).trim();
              }
            }
          }
        }
      } catch (e) {}
    }

    return {
      themeAttr,
      cssVars,
      fontFamily: bodyComputed.fontFamily,
      fontSize: bodyComputed.fontSize,
      backgroundColor: bodyComputed.backgroundColor,
      color: bodyComputed.color,
    };
  });

  console.log('--- LIGHT THEME TOKENS ---');
  console.log(JSON.stringify(lightTokens, null, 2));

  console.log('--- DARK THEME TOKENS ---');
  console.log(JSON.stringify(darkTokens, null, 2));

  await browser.close();
}

extractStyles().catch(console.error);
