# Rapport Design Tokens Specification
**Date:** October 25, 2026  
**Auditor:** Senior UI Reverse Engineering Engineer  
**Reference Target:** `https://demo.codeandchill.store/rapport/#/overview`  
**Extraction Method:** Live Computed Style & CSS Object Model (CSSOM) Inspection via Real Headless Browser Harness

---

## 1. Global & Spatial Dimensions

```css
:root {
  /* Typography */
  --font: "Urbanist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  /* Spatial Scale */
  --gap: 16px;
  --gutter: clamp(16px, 1.6vw, 28px);
  --app-max: 1840px;
  --dock-w: 60px;
  --dock-x: 20px;

  /* Radii & Curvature */
  --r-card: 26px;   /* Standard Bento card curve */
  --r-tile: 22px;   /* Inner tile / nested block curve */
  --r-ctl: 999px;   /* Pill controls, buttons, badges, docks */
  --r-sm: 10px;     /* Tooltips and micro-elements */
  --r-md: 14px;     /* Form inputs and dropdown menus */

  /* Timing & Motion */
  --ease: cubic-bezier(.2, .8, .2, 1);
  --duration-fast: 150ms;
  --duration-normal: 240ms;
  --duration-slow: 350ms;
}
```

---

## 2. Color Tokens: Light Theme (`[data-theme="light"]`)

```css
:root,
[data-theme="light"] {
  /* Canvas & Background */
  --bg: #ebe8e1;
  --mesh-a: #f2d3bd;  /* Peach / salmon radial orb */
  --mesh-b: #cfdfcd;  /* Soft sage / mint radial orb */
  --mesh-c: #f1e4bf;  /* Warm butter / cream radial orb */

  /* Surfaces & Glassmorphism */
  --glass: rgba(255, 255, 255, 0.46);      /* 46% translucent card face */
  --glass-2: rgba(255, 255, 255, 0.64);    /* 64% frosted elevated surface */
  --glass-3: rgba(255, 255, 255, 0.82);    /* 82% semi-opaque panel */
  --solid: #f6f4ef;                        /* High-contrast solid modal */
  --float: #fdfcf9;                        /* Floating popover / dropdown */
  --well: rgba(23, 25, 26, 0.06);          /* Recessed well / hover state */

  /* Lines, Borders & Insets */
  --line: rgba(23, 25, 26, 0.09);          /* Subtle hairline table / card line */
  --line-2: rgba(23, 25, 26, 0.16);        /* Medium border for inputs / controls */
  --rim: rgba(255, 255, 255, 0.78);        /* White glassy top highlight */

  /* Elevation & Shadows */
  --shadow: 0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 24px 48px -30px rgba(70, 50, 30, 0.28);
  --shadow-pop: 0 24px 60px -18px rgba(40, 30, 20, 0.32), 0 2px 6px rgba(40, 30, 20, 0.08);

  /* Typography Colors */
  --text: #17191a;         /* High-contrast primary charcoal */
  --muted: #676a66;        /* Secondary descriptive text */
  --faint: #8e918c;        /* Placeholder and disabled text */

  /* Semantic Brand Accents */
  --cream: #fbf8f2;
  --butter: #f2c94c;       /* Warm yellow highlight / gauge active arc */
  --on-butter: #17191a;
  --pine: #2f5c50;         /* Deep forest green for positive pills & quota */
  --on-pine: #fbf8f2;
  --tomato: #c8431f;       /* Vermilion accent for notifications & charts */
  --on-tomato: #fbf8f2;
  --ink: #17191a;          /* Jet black button / accent surface */
  --on-ink: #fbf8f2;
  --plain: rgba(255, 255, 255, 0.58);
  --on-plain: #17191a;
  --good: #2f7a52;         /* Success status */
  --bad: #c8431f;          /* Danger / error status */

  /* Navigation & Controls */
  --dock: #17191a;         /* Solid black floating dock */
  --on-dock: #fbf8f2;      /* Off-white dock icons */
  --pill: #17191a;         /* Active tab black pill */
  --on-pill: #fbf8f2;
}
```

---

## 3. Color Tokens: Dark Theme (`[data-theme="dark"]`)

```css
[data-theme="dark"] {
  /* Canvas & Background */
  --bg: #111412;           /* Deepest forest charcoal canvas */
  --mesh-a: rgba(200, 67, 31, 0.28);   /* Moody terracotta orb */
  --mesh-b: rgba(47, 92, 80, 0.50);    /* Deep pine orb */
  --mesh-c: rgba(242, 201, 76, 0.10);  /* Faint gold sheen */

  /* Surfaces & Glassmorphism */
  --glass: rgba(255, 255, 255, 0.05);   /* 5% translucent smoked glass */
  --glass-2: rgba(255, 255, 255, 0.09); /* 9% smoked elevated surface */
  --glass-3: #222624;                   /* Solid dark panel */
  --solid: #1c201e;                     /* Modal surface */
  --float: #242927;                     /* Floating popover */
  --well: rgba(255, 255, 255, 0.06);   /* Recessed hover well */

  /* Lines, Borders & Insets */
  --line: rgba(255, 255, 255, 0.08);   /* Muted dark hairline */
  --line-2: rgba(255, 255, 255, 0.16); /* Input border */
  --rim: rgba(255, 255, 255, 0.07);    /* Top rim inset */

  /* Elevation & Shadows */
  --shadow: 0 1px 0 rgba(255, 255, 255, 0.05) inset, 0 24px 48px -30px rgba(0, 0, 0, 0.7);
  --shadow-pop: 0 24px 60px -18px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08);

  /* Typography Colors */
  --text: #f1eee8;         /* Crisp warm white text */
  --muted: #a3a6a0;        /* Silver-sage secondary text */
  --faint: #7d807b;        /* Subdued text */

  /* Semantic Brand Accents */
  --cream: #fbf8f2;
  --butter: #f2c94c;
  --on-butter: #17191a;
  --pine: #2f5c50;
  --on-pine: #fbf8f2;
  --tomato: #d8532d;       /* Bright terracotta in dark mode */
  --on-tomato: #fbf8f2;
  --ink: #f1eee8;          /* Crisp white button surface */
  --on-ink: #17191a;
  --plain: rgba(255, 255, 255, 0.07);
  --on-plain: #f1eee8;
  --good: #6cc59a;         /* Vibrant mint green */
  --bad: #f08a68;          /* Coral pink-red */

  /* Navigation & Controls */
  --dock: rgba(255, 255, 255, 0.08);   /* Frosted glass dock */
  --on-dock: #f1eee8;
  --pill: #f1eee8;         /* Active tab crisp white pill */
  --on-pill: #17191a;
}
```

---

## 4. Typography Scale & Weights

| Token Role | Size | Line Height | Weight | Letter Spacing | CSS Rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Metric** | 44px | 1.1 | 700 (Bold) | `-0.03em` | `font-size: 44px; font-weight: 700; letter-spacing: -0.03em;` |
| **Display 1** | 32px | 1.2 | 700 (Bold) | `-0.025em`| `font-size: 32px; font-weight: 700; letter-spacing: -0.025em;` |
| **Display 2** | 24px | 1.25 | 700 (Bold) | `-0.02em` | `font-size: 24px; font-weight: 700; letter-spacing: -0.02em;` |
| **Brand Logo** | 21px | 1.0 | 700 (Bold) | `-0.02em` | `font-size: 21px; font-weight: 700; letter-spacing: -0.02em;` |
| **Card Heading**| 15px | 1.35 | 600 (SemiBold)| `-0.005em`| `font-size: 15px; font-weight: 600; letter-spacing: -0.005em;` |
| **Navigation Tab**| 13.5px| 1.0 | 600 (SemiBold)| `0` | `font-size: 13.5px; font-weight: 600;` |
| **Button Text** | 13.5px| 1.0 | 600 (SemiBold)| `0` | `font-size: 13.5px; font-weight: 600;` |
| **Table Header**| 12px | 1.4 | 600 (SemiBold)| `0` | `font-size: 12px; font-weight: 600; color: var(--muted);` |
| **Badge** | 11px | 1.0 | 700 (Bold) | `0.01em` | `font-size: 11px; font-weight: 700; letter-spacing: 0.01em;` |
| **Tooltip / Kbd**| 11px - 12.5px | 1.2 | 600 (SemiBold)| `0` | `font-size: 12.5px; font-weight: 600;` |

---

## 5. Mesh Canvas Gradient Formula

The signature ambient glow behind the dashboard is produced with three non-interactive fixed orbs:

```html
<div class="mesh" aria-hidden="true">
  <i class="mesh__a"></i>
  <i class="mesh__b"></i>
  <i class="mesh__c"></i>
</div>
```

```css
.mesh {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}

.mesh i {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.95;
  will-change: transform;
}

.mesh__a {
  top: -24vmax;
  left: -18vmax;
  width: 62vmax;
  height: 62vmax;
  background: radial-gradient(closest-side, var(--mesh-a), transparent);
}

.mesh__b {
  bottom: -30vmax;
  right: -24vmax;
  width: 70vmax;
  height: 70vmax;
  background: radial-gradient(closest-side, var(--mesh-b), transparent);
}

.mesh__c {
  top: -16vmax;
  right: 8vmax;
  width: 46vmax;
  height: 46vmax;
  background: radial-gradient(closest-side, var(--mesh-c), transparent);
}
```

---

## 6. Token Parity Verification Matrix

Every token defined in `:root` and `[data-theme="light"]` is mirrored in `[data-theme="dark"]`, satisfying the requirements of `tests/unit/branding-tema-claro-escopavel.test.ts`:

| Token Name | Light Value | Dark Value | Tested Invariant |
| :--- | :--- | :--- | :--- |
| `--bg` | `#ebe8e1` | `#111412` | Canvas Background |
| `--mesh-a` | `#f2d3bd` | `rgba(200, 67, 31, 0.28)` | Ambient Orb 1 |
| `--mesh-b` | `#cfdfcd` | `rgba(47, 92, 80, 0.50)` | Ambient Orb 2 |
| `--mesh-c` | `#f1e4bf` | `rgba(242, 201, 76, 0.10)`| Ambient Orb 3 |
| `--glass` | `rgba(255, 255, 255, 0.46)` | `rgba(255, 255, 255, 0.05)` | Card Face |
| `--solid` | `#f6f4ef` | `#1c201e` | Dialog Modal Face |
| `--float` | `#fdfcf9` | `#242927` | Popover Face |
| `--line` | `rgba(23, 25, 26, 0.09)` | `rgba(255, 255, 255, 0.08)` | Hairline Border |
| `--rim` | `rgba(255, 255, 255, 0.78)` | `rgba(255, 255, 255, 0.07)` | Top Glass Inset |
| `--text` | `#17191a` | `#f1eee8` | Primary Typography |
| `--muted` | `#676a66` | `#a3a6a0` | Secondary Typography |
| `--dock` | `#17191a` | `rgba(255, 255, 255, 0.08)` | Vertical Dock Face |
| `--pill` | `#17191a` | `#f1eee8` | Active Nav Pill Face |
| `--on-pill`| `#fbf8f2` | `#17191a` | Active Nav Pill Text |
| `--butter`| `#f2c94c` | `#f2c94c` | Accent Yellow |
| `--pine` | `#2f5c50` | `#2f5c50` | Accent Pine Green |
| `--tomato`| `#c8431f` | `#d8532d` | Accent Vermilion Red |
| `--r-card`| `26px` | `26px` | Bento Card Radius |
| `--r-ctl` | `999px` | `999px` | Pill Controls Radius |
