import { chromium } from "@playwright/test";

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("https://demo.codeandchill.store/rapport/#/overview", { waitUntil: "networkidle" });

  console.log("Initial theme:");
  const initialTheme = await page.evaluate(() => ({
    htmlClass: document.documentElement.className,
    htmlDataset: { ...document.documentElement.dataset },
    bodyClass: document.body.className,
    bodyDataset: { ...document.body.dataset },
  }));
  console.log(initialTheme);

  // Find and click the theme toggle button
  console.log("Finding theme toggle...");
  const themeBtn = page.locator("button:has(.ico--moon), button:has(.ico--sun), [aria-label*='theme' i], [aria-label*='dark' i], [aria-label*='light' i]").first();
  await themeBtn.click();
  await page.waitForTimeout(500);

  console.log("After clicking theme button:");
  const darkTheme = await page.evaluate(() => {
    const s = window.getComputedStyle(document.body);
    const cardEl = document.querySelector(".card, [class*='card']");
    const cardStyle = cardEl ? window.getComputedStyle(cardEl) : null;
    return {
      htmlClass: document.documentElement.className,
      htmlDataset: { ...document.documentElement.dataset },
      bodyClass: document.body.className,
      bodyBg: s.backgroundColor,
      bodyColor: s.color,
      cardBg: cardStyle ? cardStyle.backgroundColor : null,
      cardBorder: cardStyle ? cardStyle.border : null,
      cardRadius: cardStyle ? cardStyle.borderRadius : null,
    };
  });
  console.log(darkTheme);

  await browser.close();
}

main().catch(console.error);
