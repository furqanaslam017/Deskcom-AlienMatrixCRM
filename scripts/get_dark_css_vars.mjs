import { chromium } from "@playwright/test";
import fs from "node:fs";

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("https://demo.codeandchill.store/rapport/#/overview", { waitUntil: "networkidle" });

  const tokens = await page.evaluate(() => {
    const darkRules = {};
    const lightRules = {};

    for (let i = 0; i < document.styleSheets.length; i++) {
      try {
        const sheet = document.styleSheets[i];
        for (let j = 0; j < sheet.cssRules.length; j++) {
          const rule = sheet.cssRules[j];
          if (rule.selectorText && (rule.selectorText.includes("dark") || rule.selectorText.includes("[data-theme='dark']"))) {
            for (let k = 0; k < rule.style.length; k++) {
              const prop = rule.style[k];
              if (prop.startsWith("--")) {
                darkRules[prop] = rule.style.getPropertyValue(prop).trim();
              }
            }
          }
          if (rule.selectorText === ":root" || rule.selectorText === "html" || (rule.selectorText && rule.selectorText.includes("[data-theme='light']"))) {
            for (let k = 0; k < rule.style.length; k++) {
              const prop = rule.style[k];
              if (prop.startsWith("--")) {
                lightRules[prop] = rule.style.getPropertyValue(prop).trim();
              }
            }
          }
        }
      } catch (e) {}
    }
    return { lightRules, darkRules };
  });

  console.log(JSON.stringify(tokens, null, 2));
  await browser.close();
}

main().catch(console.error);
