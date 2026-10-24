import { chromium } from "@playwright/test";

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("https://demo.codeandchill.store/rapport/#/overview", { waitUntil: "networkidle" });

  const bgInfo = await page.evaluate(() => {
    const body = document.body;
    const appEl = document.querySelector("#app, main, .app, [class*='app']");
    const bgEl = document.querySelector("[class*='mesh'], [class*='bg'], [class*='gradient']");

    // Check all stylesheet rules for background or mesh
    const meshRules = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.cssText && (rule.cssText.includes("radial-gradient") || rule.cssText.includes("mesh") || rule.cssText.includes("--mesh"))) {
            meshRules.push(rule.cssText);
          }
        }
      } catch (e) {}
    }

    return {
      bodyStyle: {
        background: window.getComputedStyle(body).background,
        backgroundColor: window.getComputedStyle(body).backgroundColor,
        backgroundImage: window.getComputedStyle(body).backgroundImage,
      },
      appElTag: appEl ? appEl.tagName : null,
      appElClass: appEl ? appEl.className : null,
      meshRules: meshRules.slice(0, 10),
    };
  });

  console.log(JSON.stringify(bgInfo, null, 2));
  await browser.close();
}

main().catch(console.error);
