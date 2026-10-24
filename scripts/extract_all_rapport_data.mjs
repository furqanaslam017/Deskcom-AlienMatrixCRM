import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const routes = [
  "overview",
  "pipeline",
  "customers",
  "schedule",
  "finance",
  "growth",
  "projects"
];

const viewports = [
  { width: 1440, height: 900, name: "desktop" },
  { width: 1024, height: 768, name: "tablet-landscape" },
  { width: 768, height: 1024, name: "tablet-portrait" },
  { width: 375, height: 812, name: "mobile" }
];

async function main() {
  const screenshotsDir = path.join(process.cwd(), "docs", "ui-analysis", "screenshots");
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  console.log("Browser launched. Connecting to demo.codeandchill.store...");

  const context = await browser.newContext();
  const page = await context.newPage();

  // 1. First, navigate to overview at 1440 to extract deep design tokens in both themes
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("https://demo.codeandchill.store/rapport/#/overview", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  console.log("Extracting Design Tokens from DOM and Stylesheets...");
  const extractedTokens = await page.evaluate(() => {
    // Extract CSS variables and stylesheets
    const cssVars = {};
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.style) {
            for (let i = 0; i < rule.style.length; i++) {
              const prop = rule.style[i];
              if (prop.startsWith("--")) {
                cssVars[prop] = rule.style.getPropertyValue(prop).trim();
              }
            }
          }
        }
      } catch (e) {
        // cross-origin stylesheets ignore
      }
    }

    const getStyle = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        bgImg: s.backgroundImage,
        color: s.color,
        border: s.border,
        borderRadius: s.borderRadius,
        padding: s.padding,
        boxShadow: s.boxShadow,
        backdropFilter: s.backdropFilter,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
      };
    };

    const lightStyles = {
      body: getStyle("body"),
      topNav: getStyle("nav.tabs, .tabs"),
      activeTab: getStyle(".tab.is-active, .tab--active, a.tab[aria-current='page'], a.tab"),
      sidebar: getStyle("aside, .nav, .sidebar"),
      card: getStyle(".card, article, section.card"),
      hotDealCard: getStyle(".deal, .deal-card, [class*='deal']"),
      buttonCircle: getStyle(".ibtn"),
      kpiCard: getStyle(".kpi, [class*='kpi']"),
      gaugeCard: getStyle("[class*='quota'], [class*='gauge']"),
    };

    return {
      cssVars,
      lightStyles,
    };
  });

  // Switch to dark theme to extract dark styles
  const themeBtn = page.locator("button:has(.ico--moon), button:has(.ico--sun)").first();
  await themeBtn.click();
  await page.waitForTimeout(500);

  const darkStyles = await page.evaluate(() => {
    const getStyle = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        bgImg: s.backgroundImage,
        color: s.color,
        border: s.border,
        borderRadius: s.borderRadius,
        padding: s.padding,
        boxShadow: s.boxShadow,
        backdropFilter: s.backdropFilter,
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        lineHeight: s.lineHeight,
      };
    };

    return {
      body: getStyle("body"),
      topNav: getStyle("nav.tabs, .tabs"),
      activeTab: getStyle(".tab.is-active, .tab--active, a.tab[aria-current='page'], a.tab"),
      sidebar: getStyle("aside, .nav, .sidebar"),
      card: getStyle(".card, article, section.card"),
      hotDealCard: getStyle(".deal, .deal-card, [class*='deal']"),
      buttonCircle: getStyle(".ibtn"),
      kpiCard: getStyle(".kpi, [class*='kpi']"),
      gaugeCard: getStyle("[class*='quota'], [class*='gauge']"),
    };
  });

  // Save design-tokens.json
  const designTokens = {
    fontFamily: {
      primary: "Urbanist",
      fallback: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      headingWeight: "700",
      bodyWeight: "400",
      mediumWeight: "500",
      semiboldWeight: "600",
    },
    colors: {
      light: {
        background: "#EBE8E1",
        backgroundGradient: "radial-gradient(at 0% 0%, #F2D3BD 0px, transparent 50%), radial-gradient(at 100% 0%, #CFDFCD 0px, transparent 50%), radial-gradient(at 50% 100%, #F1E4BF 0px, transparent 50%)",
        card: "rgba(250, 246, 241, 0.85)",
        cardBorder: "rgba(23, 25, 26, 0.08)",
        foreground: "#17191A",
        muted: "#76746F",
        accentVermilion: "#CF4A1F",
        accentGreen: "#2F5D50",
        accentYellow: "#F2C744",
        sidebarBg: "#17191A",
        sidebarForeground: "#FFFFFF",
        activePillBg: "#17191A",
        activePillText: "#FFFFFF",
        dealCardBg: "#17191A",
        dealCardText: "#FFFFFF",
      },
      dark: {
        background: "#111412",
        backgroundGradient: "radial-gradient(at 0% 0%, rgba(207, 74, 31, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(47, 93, 80, 0.15) 0px, transparent 50%)",
        card: "rgba(255, 255, 255, 0.05)",
        cardBorder: "rgba(255, 255, 255, 0.07)",
        foreground: "#F1EEE8",
        muted: "#98968F",
        accentVermilion: "#E05A2F",
        accentGreen: "#3D7A69",
        accentYellow: "#F5D061",
        sidebarBg: "rgba(255, 255, 255, 0.08)",
        sidebarForeground: "#F1EEE8",
        activePillBg: "#F1EEE8",
        activePillText: "#17191A",
        dealCardBg: "#FAF6F1",
        dealCardText: "#17191A",
      }
    },
    radii: {
      card: "28px",
      cardLarge: "32px",
      cardSmall: "20px",
      pill: "9999px",
      circle: "50%",
    },
    borders: {
      hairline: "1px solid",
    },
    spacing: {
      cardPadding: "24px",
      gapBento: "16px",
      sidebarWidth: "56px",
      topNavHeight: "64px",
    },
    shadows: {
      card: "0 10px 30px -10px rgba(0,0,0,0.05)",
      floatingPill: "0 8px 24px -4px rgba(0,0,0,0.12)",
    },
    blur: {
      backdrop: "blur(20px)",
    },
    rawExtracted: {
      cssVariables: extractedTokens.cssVars,
      lightStyles: extractedTokens.lightStyles,
      darkStyles,
    }
  };

  const analysisDir = path.join(process.cwd(), "docs", "ui-analysis");
  fs.writeFileSync(path.join(analysisDir, "design-tokens.json"), JSON.stringify(designTokens, null, 2));
  console.log("✅ Saved design-tokens.json");

  // Switch back to light theme for full screenshot capture
  await themeBtn.click();
  await page.waitForTimeout(500);

  // 2. Capture screenshots for each route across all viewports and both themes
  for (const r of routes) {
    for (const theme of ["light", "dark"]) {
      // Set theme state
      const isDark = await page.evaluate(() => document.documentElement.dataset.theme === "dark");
      if (theme === "dark" && !isDark) {
        await themeBtn.click();
        await page.waitForTimeout(400);
      } else if (theme === "light" && isDark) {
        await themeBtn.click();
        await page.waitForTimeout(400);
      }

      for (const vp of viewports) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`https://demo.codeandchill.store/rapport/#/${r}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(600);

        const filename = `${r}_${theme}_${vp.width}.png`;
        const filepath = path.join(screenshotsDir, filename);
        await page.screenshot({ path: filepath, fullPage: false });
        console.log(`📸 Captured: ${filename}`);
      }
    }
  }

  console.log("✅ All screenshots and design tokens extracted successfully!");
  await browser.close();
}

main().catch(console.error);
