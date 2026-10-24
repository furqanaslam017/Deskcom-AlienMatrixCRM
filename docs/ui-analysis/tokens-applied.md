# Checkpoint 1 (CP1): Design Tokens Applied — AlienMatrix CRM

This document details the complete design token architecture extracted from the Rapport dashboard demo and applied to AlienMatrix CRM (`app/globals.css`, `app/layout.tsx`, and `lib/theme.tsx`).

---

## 1. Typography & Font Family

- **Extracted Font:** **`Urbanist`** (Google Font, SIL Open Font License).
- **Fallback Stack:** `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- **Implementation:**
  - High-performance, offline-resilient WOFF2 files saved directly in `app/fonts/` (`urbanist-400-latin.woff2`, `urbanist-500-latin.woff2`, `urbanist-600-latin.woff2`, `urbanist-700-latin.woff2`).
  - Loaded via `next/font/local` in `app/layout.tsx` with `variable: "--font-urbanist"` and `display: "swap"`.
  - Injected into `<html>` className and mapped into `--font-sans` as the primary family in `app/globals.css`.
  - Preserved backward compatibility with `--font-atkinson` and `--font-mono`.

---

## 2. Color Palettes & Semantic Variables

### Light Theme (`:root` and `[data-theme="light"]`)
| Token | Value | Visual Purpose |
| :--- | :--- | :--- |
| `--bg` | `#ebe8e1` | Base warm page background |
| `--mesh-a` | `#f2d3bd` | Top-left warm salmon/peach radial glow |
| `--mesh-b` | `#cfdfcd` | Bottom-right sage green radial glow |
| `--mesh-c` | `#f1e4bf` | Top-right soft yellow radial glow |
| `--glass` | `rgba(255, 255, 255, 0.46)` | Bento card translucent glass surface |
| `--glass-2` | `rgba(255, 255, 255, 0.64)` | Elevated bento card surface |
| `--solid` | `#f6f4ef` | Solid cream popover and dropdown surface |
| `--line` | `rgba(23, 25, 26, 0.09)` | Hairline border |
| `--line-2` | `rgba(23, 25, 26, 0.16)` | Secondary / active hairline border |
| `--rim` | `rgba(255, 255, 255, 0.78)` | Card top inset highlight reflection |
| `--text` | `#17191a` | Near-black high-contrast primary text |
| `--muted` | `#676a66` | Muted secondary text and labels |
| `--faint` | `#8e918c` | Low-emphasis metadata text |
| `--tomato` | `#c8431f` | Vermilion accent (charts, active indicators, notification dots) |
| `--pine` | `#2f5c50` | Deep forest green (quota card, positive stat pills) |
| `--butter` | `#f2c94c` | Warm yellow (gauge progress arcs) |
| `--dock` | `#17191a` | Solid dark floating sidebar dock |
| `--on-dock` | `#fbf8f2` | Dock icon color |
| `--pill` | `#17191a` | Active top navigation tab pill |
| `--on-pill` | `#fbf8f2` | Active tab text color |
| `--deal-card-bg` | `#17191a` | Inverted hot deals card (dark surface in light mode) |
| `--deal-card-text` | `#ffffff` | Inverted deal card text |

### Dark Theme (`[data-theme="dark"]`)
| Token | Value | Visual Purpose |
| :--- | :--- | :--- |
| `--bg` | `#111412` | Deep charcoal / warm green-black page background |
| `--mesh-a` | `rgba(200, 67, 31, 0.28)` | Top-left vermilion ambient glow |
| `--mesh-b` | `rgba(47, 92, 80, 0.50)` | Bottom-right pine ambient glow |
| `--mesh-c` | `rgba(242, 201, 76, 0.10)` | Top-right gold ambient glow |
| `--glass` | `rgba(255, 255, 255, 0.05)` | Dark translucent bento card surface |
| `--glass-2` | `rgba(255, 255, 255, 0.09)` | Elevated dark bento card surface |
| `--solid` | `#1c201e` | Solid dark popover and dropdown surface |
| `--line` | `rgba(255, 255, 255, 0.08)` | Dark hairline border |
| `--line-2` | `rgba(255, 255, 255, 0.16)` | Dark secondary hairline border |
| `--rim` | `rgba(255, 255, 255, 0.07)` | Card top inset highlight reflection in dark |
| `--text` | `#f1eee8` | Warm off-white primary text |
| `--muted` | `#a3a6a0` | Muted secondary text in dark |
| `--faint` | `#7d807b` | Low-emphasis metadata text in dark |
| `--tomato` | `#d8532d` | Bright vermilion accent in dark |
| `--pine` | `#3d7a69` | Emerald/pine green in dark |
| `--butter` | `#f2c94c` | Warm yellow in dark |
| `--dock` | `rgba(255, 255, 255, 0.08)` | Translucent floating sidebar dock |
| `--on-dock` | `#f1eee8` | Dock icon color in dark |
| `--pill` | `#f1eee8` | Active tab pill in dark (cream pill) |
| `--on-pill` | `#17191a` | Active tab text in dark (dark text on cream pill) |
| `--deal-card-bg` | `#FAF6F1` | Inverted deal card in dark (cream surface) |
| `--deal-card-text` | `#17191a` | Inverted deal card text in dark |

---

## 3. Radii, Shadows, Blur & Layout Dimensions

- **Radii:**
  - Card: `--r-card: 26px;` (Large bento container cards)
  - Tile: `--r-tile: 22px;` (Deal cards, KPI metric tiles)
  - Control: `--r-ctl: 999px;` (Pills, badges, search bar)
  - Circle: `50%` (Icon buttons, avatars)
- **Shadows:**
  - `--shadow-bento`: `0 1px 0 rgba(255, 255, 255, 0.7) inset, 0 24px 48px -30px rgba(70, 50, 30, 0.28)` in light; `0 1px 0 rgba(255, 255, 255, 0.05) inset, 0 24px 48px -30px rgba(0, 0, 0, 0.7)` in dark.
  - `--shadow-pop`: `0 24px 60px -18px rgba(40, 30, 20, 0.32), 0 2px 6px rgba(40, 30, 20, 0.08)` on card hover.
- **Backdrop Blurs:**
  - Card Glass: `backdrop-filter: blur(20px);`
  - Mesh Nodes: `filter: blur(60px);`
- **Layout Dimensions:**
  - Dock Width: `60px`
  - Dock Offset: `20px` (left screen edge)
  - Max Container Width: `1840px`

---

## 4. Full Viewport Radial Mesh Background

The exact mesh background structure extracted from the reference is integrated via `.mesh`, `.mesh__a`, `.mesh__b`, `.mesh__c` in `app/globals.css`:
```css
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
  width: 62vmax; height: 62vmax; top: -24vmax; left: -18vmax;
}
.mesh__b {
  background: radial-gradient(closest-side, var(--mesh-b), transparent);
  width: 70vmax; height: 70vmax; bottom: -30vmax; right: -24vmax;
}
.mesh__c {
  background: radial-gradient(closest-side, var(--mesh-c), transparent);
  width: 46vmax; height: 46vmax; top: -16vmax; right: 8vmax;
}
```

---

## 5. Seamless Zero-Flash Theme Switching

- **DOM Attribute:** `data-theme="light"` / `data-theme="dark"` on `document.documentElement`.
- **FOUC Prevention:** Fast synchronous inline initialization script (`THEME_INIT_SCRIPT` in `app/layout.tsx`) resolves theme from `localStorage('deskcomm-theme')` or system `prefers-color-scheme` before the first browser paint.
- **Hydration Safe:** Managed via `useSyncExternalStore` in `lib/theme.tsx` preventing any client/server hydration attribute mismatch.
