import { chromium } from "@playwright/test";

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("https://demo.codeandchill.store/rapport/#/overview", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    // Look for theme toggle in sidebar
    const allButtons = Array.from(document.querySelectorAll("button, a"));
    const buttonInfos = allButtons.map(b => ({
      tag: b.tagName,
      text: b.innerText?.trim(),
      ariaLabel: b.getAttribute("aria-label"),
      className: b.className,
      href: b.getAttribute("href"),
      innerHTML: b.innerHTML.slice(0, 100),
    }));

    // Computed style of body, cards, headings, buttons
    const bodyStyle = window.getComputedStyle(document.body);
    const htmlStyle = window.getComputedStyle(document.documentElement);

    // Find cards
    const cards = Array.from(document.querySelectorAll("*")).filter(el => {
      const s = window.getComputedStyle(el);
      const br = parseFloat(s.borderRadius);
      return br >= 16;
    }).slice(0, 15).map(el => {
      const s = window.getComputedStyle(el);
      return {
        tag: el.tagName,
        className: el.className,
        bg: s.backgroundColor,
        bgImg: s.backgroundImage,
        color: s.color,
        borderRadius: s.borderRadius,
        padding: s.padding,
        border: s.border,
        boxShadow: s.boxShadow,
        backdropFilter: s.backdropFilter,
        fontFamily: s.fontFamily,
      };
    });

    return {
      title: document.title,
      htmlClass: document.documentElement.className,
      bodyClass: document.body.className,
      bodyBg: bodyStyle.backgroundColor,
      bodyBgImg: bodyStyle.backgroundImage,
      fontFamily: bodyStyle.fontFamily,
      cards,
      buttonInfos: buttonInfos.filter(b => b.ariaLabel?.toLowerCase().includes("theme") || b.ariaLabel?.toLowerCase().includes("mode") || b.className?.includes("theme") || b.className?.includes("mode") || b.innerHTML?.includes("moon") || b.innerHTML?.includes("sun") || b.innerHTML?.includes("svg")),
    };
  });

  console.log("Page info:", JSON.stringify(info, null, 2));
  await browser.close();
}

main().catch(console.error);
