import fs from "node:fs";

const globalsPath = "app/globals.css";
let css = fs.readFileSync(globalsPath, "utf8");

// Define Rapport tokens for light
const rapportLightProps = `  /* Rapport Design Tokens (Light Theme) */
  --bg: #ebe8e1;
  --mesh-a: #f2d3bd;
  --mesh-b: #cfdfcd;
  --mesh-c: #f1e4bf;
  --glass: rgba(255, 255, 255, 0.46);
  --glass-2: rgba(255, 255, 255, 0.64);
  --glass-3: rgba(255, 255, 255, 0.82);
  --solid: #f6f4ef;
  --float: #fdfcf9;
  --well: rgba(23, 25, 26, 0.06);
  --line: rgba(23, 25, 26, 0.09);
  --line-2: rgba(23, 25, 26, 0.16);
  --rim: rgba(255, 255, 255, 0.78);
  --shadow-bento: 0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 24px 48px -30px rgba(70, 50, 30, 0.28);
  --shadow-pop: 0 24px 60px -18px rgba(40, 30, 20, 0.32), 0 2px 6px rgba(40, 30, 20, 0.08);
  --text: #17191a;
  --muted: #676a66;
  --faint: #8e918c;
  --cream: #fbf8f2;
  --butter: #f2c94c;
  --on-butter: #17191a;
  --pine: #2f5c50;
  --on-pine: #fbf8f2;
  --tomato: #c8431f;
  --on-tomato: #fbf8f2;
  --ink: #17191a;
  --on-ink: #fbf8f2;
  --plain: rgba(255, 255, 255, 0.58);
  --on-plain: #17191a;
  --good: #2f7a52;
  --bad: #c8431f;
  --dock: #17191a;
  --on-dock: #fbf8f2;
  --pill: #17191a;
  --on-pill: #fbf8f2;
  --deal-card-bg: #17191a;
  --deal-card-text: #ffffff;
  --r-card: 26px;
  --r-tile: 22px;
  --r-ctl: 999px;
  --dock-w: 60px;
  --dock-x: 20px;
  --app-max: 1840px;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --font-urbanist: "Urbanist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;`;

// Define Rapport tokens for dark
const rapportDarkProps = `  /* Rapport Design Tokens (Dark Theme) */
  --bg: #111412;
  --mesh-a: rgba(200, 67, 31, 0.28);
  --mesh-b: rgba(47, 92, 80, 0.50);
  --mesh-c: rgba(242, 201, 76, 0.10);
  --glass: rgba(255, 255, 255, 0.05);
  --glass-2: rgba(255, 255, 255, 0.09);
  --glass-3: #222624;
  --solid: #1c201e;
  --float: #242927;
  --well: rgba(255, 255, 255, 0.06);
  --line: rgba(255, 255, 255, 0.08);
  --line-2: rgba(255, 255, 255, 0.16);
  --rim: rgba(255, 255, 255, 0.07);
  --shadow-bento: 0 1px 0 rgba(255, 255, 255, 0.05) inset, 0 24px 48px -30px rgba(0, 0, 0, 0.7);
  --shadow-pop: 0 24px 60px -18px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08);
  --text: #f1eee8;
  --muted: #a3a6a0;
  --faint: #7d807b;
  --cream: #fbf8f2;
  --butter: #f2c94c;
  --on-butter: #17191a;
  --pine: #3d7a69;
  --on-pine: #fbf8f2;
  --tomato: #d8532d;
  --on-tomato: #fbf8f2;
  --ink: #f1eee8;
  --on-ink: #17191a;
  --plain: rgba(255, 255, 255, 0.07);
  --on-plain: #f1eee8;
  --good: #6cc59a;
  --bad: #f08a68;
  --dock: rgba(255, 255, 255, 0.08);
  --on-dock: #f1eee8;
  --pill: #f1eee8;
  --on-pill: #17191a;
  --deal-card-bg: #FAF6F1;
  --deal-card-text: #17191a;
  --r-card: 26px;
  --r-tile: 22px;
  --r-ctl: 999px;
  --dock-w: 60px;
  --dock-x: 20px;
  --app-max: 1840px;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --font-urbanist: "Urbanist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;`;

// 1. Inject into :root (before the closing brace of :root)
const rootEndIdx = css.indexOf("\n}\n\n/* ───", css.indexOf(":root {"));
if (rootEndIdx === -1) {
  throw new Error("Could not find end of :root block");
}
css = css.slice(0, rootEndIdx) + "\n" + rapportLightProps + css.slice(rootEndIdx);

// 2. Inject into [data-theme="light"]
const lightEndIdx = css.indexOf("\n}\n\n[data-theme=\"dark\"]", css.indexOf('[data-theme="light"] {'));
if (lightEndIdx === -1) {
  throw new Error("Could not find end of [data-theme=\"light\"] block");
}
css = css.slice(0, lightEndIdx) + "\n" + rapportLightProps + css.slice(lightEndIdx);

// 3. Inject into [data-theme="dark"]
const darkEndIdx = css.indexOf("\n}\n\n/* ───", css.indexOf('[data-theme="dark"] {'));
if (darkEndIdx === -1) {
  throw new Error("Could not find end of [data-theme=\"dark\"] block");
}
css = css.slice(0, darkEndIdx) + "\n" + rapportDarkProps + css.slice(darkEndIdx);

// 4. Update font-sans in @theme inline
css = css.replace(
  "--font-sans:\n    var(--font-atkinson),",
  "--font-sans:\n    var(--font-urbanist), var(--font-atkinson),"
);

// 5. Append Rapport utilities (mesh background and classes)
const meshStyles = `
/* ─────────────────────────────────────────────────────────────────────────
   Rapport Visual Design — Radial Mesh Background & Bento Utilities
   ───────────────────────────────────────────────────────────────────────── */
.mesh {
  z-index: -1;
  pointer-events: none;
  position: fixed;
  inset: 0px;
  overflow: hidden;
}

.mesh i {
  filter: blur(60px);
  opacity: 0.95;
  will-change: transform;
  border-radius: 50%;
  position: absolute;
}

.mesh__a {
  background: radial-gradient(closest-side, var(--mesh-a), transparent);
  width: 62vmax;
  height: 62vmax;
  top: -24vmax;
  left: -18vmax;
}

.mesh__b {
  background: radial-gradient(closest-side, var(--mesh-b), transparent);
  width: 70vmax;
  height: 70vmax;
  bottom: -30vmax;
  right: -24vmax;
}

.mesh__c {
  background: radial-gradient(closest-side, var(--mesh-c), transparent);
  width: 46vmax;
  height: 46vmax;
  top: -16vmax;
  right: 8vmax;
}

/* Bento Surface Cards */
.card-bento {
  background-color: var(--glass);
  border: 1px solid var(--rim);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-bento);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: box-shadow var(--duration-base) var(--ease), border-color var(--duration-base) var(--ease);
}

.card-bento:hover {
  box-shadow: var(--shadow-pop);
}

/* Inverted Deal Cards (Dark in Light mode, Cream in Dark mode) */
.card-deal {
  background-color: var(--deal-card-bg);
  color: var(--deal-card-text);
  border-radius: var(--r-tile);
  border: 1px solid var(--line-2);
}

/* Circle Icon Buttons */
.btn-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--plain);
  border: 1px solid var(--line);
  color: var(--text);
  transition: transform var(--duration-fast) var(--ease), background-color var(--duration-fast) var(--ease), border-color var(--duration-fast) var(--ease);
}

.btn-circle:hover {
  transform: scale(1.05);
  border-color: var(--line-2);
}

.btn-circle:active {
  transform: scale(0.96);
}
`;

css += meshStyles;

fs.writeFileSync(globalsPath, css, "utf8");
console.log("Successfully applied CP1 design tokens to app/globals.css!");
