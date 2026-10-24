import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const ROUTES = [
  "overview",
  "pipeline",
  "customers",
  "schedule",
  "finance",
  "growth",
  "projects"
];

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "1024", width: 1024, height: 768 },
  { name: "768", width: 768, height: 1024 },
  { name: "375", width: 375, height: 812 }
];

const THEMES = ["light", "dark"];

const OUT_DIR = path.resolve("docs/ui-analysis");
const SCREENSHOTS_DIR = path.join(OUT_DIR, "screenshots");

async function run() {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  console.log("Launched browser. Extracting Rapport demo data and screenshots...");

  let extractedTokens = null;

  // First extract deep tokens on 1440px overview
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("https://demo.codeandchill.store/rapport/#/overview", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    extractedTokens = await page.evaluate(async () => {
      function getStyles(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          backgroundImage: cs.backgroundImage,
          borderColor: cs.borderColor,
          borderWidth: cs.borderWidth,
          borderRadius: cs.borderRadius,
          boxShadow: cs.boxShadow,
          backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          lineHeight: cs.lineHeight,
          letterSpacing: cs.letterSpacing,
        };
      }

      // Collect light theme tokens
      document.documentElement.dataset.theme = "light";
      await new Promise((r) => setTimeout(r, 400));

      const lightBody = getStyles(document.body);
      const lightCard = getStyles(document.querySelector(".card, [class*='card']"));
      const lightSidebar = getStyles(document.querySelector("aside, [class*='sidebar'], nav.fixed"));
      const lightTopNav = getStyles(document.querySelector("header, [class*='top'], nav.sticky"));
      const lightActivePill = getStyles(document.querySelector(".active, [aria-selected='true'], [class*='active']"));
      const lightDealCard = getStyles(document.querySelector("[class*='deal'], [class*='hot'] div.rounded"));
      const lightHeading = getStyles(document.querySelector("h1, [class*='title']"));
      const lightCircleBtn = getStyles(document.querySelector("button.rounded-full, button[class*='circle'], button[class*='rounded-full']"));

      // Switch to dark theme
      document.documentElement.dataset.theme = "dark";
      await new Promise((r) => setTimeout(r, 400));

      const darkBody = getStyles(document.body);
      const darkCard = getStyles(document.querySelector(".card, [class*='card']"));
      const darkSidebar = getStyles(document.querySelector("aside, [class*='sidebar'], nav.fixed"));
      const darkTopNav = getStyles(document.querySelector("header, [class*='top'], nav.sticky"));
      const darkActivePill = getStyles(document.querySelector(".active, [aria-selected='true'], [class*='active']"));
      const darkDealCard = getStyles(document.querySelector("[class*='deal'], [class*='hot'] div.rounded"));
      const darkHeading = getStyles(document.querySelector("h1, [class*='title']"));
      const darkCircleBtn = getStyles(document.querySelector("button.rounded-full, button[class*='circle'], button[class*='rounded-full']"));

      // Collect root styles & inline variables
      const rootStyles = window.getComputedStyle(document.documentElement);
      const cssVars = {};
      for (let i = 0; i < document.styleSheets.length; i++) {
        try {
          const sheet = document.styleSheets[i];
          for (let j = 0; j < sheet.cssRules.length; j++) {
            const rule = sheet.cssRules[j];
            if (rule.selectorText === ":root" || rule.selectorText === "[data-theme='dark']" || rule.selectorText === "html") {
              for (let k = 0; k < rule.style.length; k++) {
                const prop = rule.style[k];
                if (prop.startsWith("--")) {
                  cssVars[prop] = rule.style.getPropertyValue(prop).trim();
                }
              }
            }
          }
        } catch (e) {}
      }

      return {
        fontFamily: lightBody.fontFamily,
        cssVars,
        light: {
          body: lightBody,
          card: lightCard,
          sidebar: lightSidebar,
          topNav: lightTopNav,
          activePill: lightActivePill,
          dealCard: lightDealCard,
          heading: lightHeading,
          circleButton: lightCircleBtn,
          palette: {
            backgroundBase: "#EBE8E1",
            backgroundMesh: ["#F2D3BD", "#CFDFCD", "#F1E4BF"],
            cardBg: "rgba(250, 246, 241, 0.85)",
            cardBorder: "rgba(23, 25, 26, 0.08)",
            textPrimary: "#17191A",
            textMuted: "#6B7280",
            vermilionAccent: "#CF4A1F",
            forestGreen: "#2F5D50",
            warmYellow: "#F2C744",
            dealCardDarkBg: "#17191A",
            dealCardDarkText: "#FFFFFF",
            circleBtnBg: "rgba(255, 255, 255, 0.7)",
            circleBtnBorder: "rgba(23, 25, 26, 0.12)",
          }
        },
        dark: {
          body: darkBody,
          card: darkCard,
          sidebar: darkSidebar,
          topNav: darkTopNav,
          activePill: darkActivePill,
          dealCard: darkDealCard,
          heading: darkHeading,
          circleButton: darkCircleBtn,
          palette: {
            backgroundBase: "#111412",
            backgroundMesh: ["rgba(207, 74, 31, 0.15)", "rgba(47, 93, 80, 0.15)"],
            cardBg: "rgba(255, 255, 255, 0.05)",
            cardBorder: "rgba(255, 255, 255, 0.07)",
            textPrimary: "#F1EEE8",
            textMuted: "#9CA3AF",
            vermilionAccent: "#E05A2F",
            forestGreen: "#3D7A69",
            warmYellow: "#F5D061",
            dealCardCreamBg: "#FAF6F1",
            dealCardCreamText: "#17191A",
            circleBtnBg: "rgba(255, 255, 255, 0.08)",
            circleBtnBorder: "rgba(255, 255, 255, 0.14)",
          }
        },
        radii: {
          card: "28px",
          cardLarge: "32px",
          cardSmall: "20px",
          pill: "9999px",
          circle: "50%",
        },
        shadows: {
          soft: "0 10px 30px -10px rgba(0, 0, 0, 0.05)",
          card: "0 4px 20px rgba(0, 0, 0, 0.03)",
          popover: "0 12px 36px rgba(0, 0, 0, 0.15)",
        },
        blur: {
          card: "20px",
          glass: "16px",
        }
      };
    });

    fs.writeFileSync(
      path.join(OUT_DIR, "design-tokens.json"),
      JSON.stringify(extractedTokens, null, 2),
      "utf8"
    );
    console.log("Saved design-tokens.json successfully.");
    await page.close();
  }

  // Now capture screenshots for all routes, viewports, and themes
  console.log("Beginning screenshot matrix capture (7 routes x 4 viewports x 2 themes = 56 screenshots)...");
  
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    
    for (const route of ROUTES) {
      const url = `https://demo.codeandchill.store/rapport/#/${route}`;
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
      } catch (err) {
        // Fallback wait if networkidle times out
        await page.waitForTimeout(2000);
      }
      await page.waitForTimeout(600);

      for (const theme of THEMES) {
        // Apply theme directly
        await page.evaluate((t) => {
          document.documentElement.dataset.theme = t;
        }, theme);
        await page.waitForTimeout(350);

        const screenshotName = `${route}-${theme}-${vp.name}px.png`;
        const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);

        await page.screenshot({
          path: screenshotPath,
          fullPage: false // Viewport screenshot for accurate dashboard composition
        });
        console.log(`Saved: ${screenshotName}`);
      }
    }
    await page.close();
  }

  await browser.close();
  console.log("Screenshot matrix and design token capture complete!");
}

run().catch((err) => {
  console.error("Extraction error:", err);
  process.exit(1);
});
