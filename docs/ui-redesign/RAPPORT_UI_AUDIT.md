# Rapport UI Reverse Engineering Audit
**Date:** October 25, 2026  
**Auditor:** Senior UI Reverse Engineering Engineer  
**Reference Target:** `https://demo.codeandchill.store/rapport/#/overview`  
**Tooling Used:** Real Browser Reverse Engineering via Playwright (Chrome & Edge) + REA Inspection Harness  
**Artifacts Generated:** 42 high-resolution screenshots saved to `docs/ui-redesign/screenshots/reference/`

---

## 1. Tooling & Environment Verification

### 1.1 REA (Reverse Engineer Anything) Status
- The official REA repository (`https://github.com/morluto/rea.git`) was inspected at `tools/rea/`.
- REA requires a compiled runtime environment (`npm ci && npm run build:cached`) with heavy native binary disassembly tooling (Hopper, Ghidra, JADX) intended for native desktop apps and binary packages.
- As specified in the execution instructions (*"fallback: Playwright headless, wait for network idle"*), a headless browser automation harness was deployed using the repository's native Playwright toolchain driven by Google Chrome.
- **Result**: 100% operational access to the live Rapport application, with real-time DOM element introspection, computed style measurement, theme attribute inspection, and comprehensive multi-viewport screenshot capture.

---

## 2. Deep Reference UI Analysis (20 Dimensions)

### 2.1 Main Application Layout
- **Container Structure**:
  - Full-width canvas constrained to `--app-max: 1840px` centered on large displays.
  - Fixed background canvas (`div.mesh`) with 3 large blurred radial gradient orbs (`mesh__a`, `mesh__b`, `mesh__c`) providing a dynamic, soft, warm lighting effect behind all cards.
  - Floating vertical navigation dock pinned to the left margin (`left: max(20px, calc((100vw - 1840px)/2 + 20px))`).
  - Fluid main content column offset from the dock by `clamp(16px, 1.6vw, 28px)` gutter spacing.

### 2.2 Sidebar Design & Navigation (The Vertical Dock)
- **Visual Design**:
  - Tall, slender, pill-shaped floating dock (`width: 60px`, `border-radius: 999px`).
  - **Light Theme**: Deep ink black background (`#17191a`), floating with elevation shadow `0 20px 40px -18px rgba(0,0,0,0.45)`.
  - **Dark Theme**: Glass elevated dark pill (`#ffffff14`), bordered by hairline border `1px solid rgba(255,255,255,0.08)`.
- **Button Controls**:
  - Circular buttons (`44px x 44px`, `border-radius: 50%`) with thin SVG line icons.
  - Hover state: `background: rgba(255, 255, 255, 0.12)`, opacity transitions from 0.74 to 1.0.
  - Active indicator: A 5px butter-yellow dot (`--butter: #f2c94c`) on the right rim of the active button.
  - Floating tooltips (`.dock__tip`): White/dark elevated cards with shortcut keys (`kbd`) fading in on hover at `left: calc(100% + 14px)`.
  - Divider: 1px subtle hairline divider (`height: 1px`, `background: rgba(255,255,255,0.14)`).
  - Bottom controls: More actions menu and Theme switch button (`dock__theme`).

### 2.3 Header & Top Navigation Bar
- **Grid Layout**: 3-column grid (`grid-template-columns: auto 1fr auto`, `gap: 20px`, `margin-bottom: 26px`).
- **Brand Mark**:
  - Left anchor: Rounded squircle logo icon (`38px x 38px`, `border-radius: 12px`, `background: var(--pill)`, `color: var(--on-pill)`) next to bold lowercase brand text (`21px`, `font-weight: 700`).
- **Pill Tab Navigation**:
  - Horizontally centered pill navigation track (`border-radius: 999px`, `padding: 4px`).
  - Active tab: Rendered as a solid dark pill (`background: var(--pill)`, `color: var(--on-pill)` in light theme; white pill in dark theme).
  - Inactive tabs: Clean text with subtle hover well highlight (`background: var(--well)`).
- **Utility Tools (Right side)**:
  - Circular glass icon buttons (`ibtn ibtn--glass`): Activity timeline, Notifications bell (with tomato unread count dot), User avatar menu (`me magnetic`).

### 2.4 Dashboard Composition (Bento Architecture)
- Flexible CSS grid (`.grid`, `gap: 16px`) arranging heterogeneous cards into a cohesive visual tapestry.
- Primary Hero Card: Overview metric with team quota, progress arc, and deal trajectory.
- Secondary Bento Cards: Recent deals, quick actions, schedule agenda, performance graphs.
- Focus Mode (`.card.is-focus`): Cards can expand into an elevated modal view with backdrop scrim (`--shadow-pop`).

### 2.5 Cards & Widgets
- **Border Radius**: Large, friendly, modern curve (`--r-card: 26px`, tile radius `--r-tile: 22px`).
- **Surface Material**:
  - **Light Theme**: Translucent off-white glass (`--glass: #ffffff75` at ~46% opacity) with white top-inset rim highlight (`--rim: #ffffffc7`, `--shadow: 0 1px 0 #ffffffb3 inset, 0 24px 48px -30px #46321e47`).
  - **Dark Theme**: Deep charcoal glass (`--glass: #ffffff0d`, `--shadow: 0 1px 0 #ffffff0d inset, 0 24px 48px -30px #000000b3`).
- **Internal Padding**: 18px padding standard.
- **Card Header**: 40px height with title (`15px`, `font-weight: 600`), subtitle (`12.5px`, `color: var(--muted)`), and action toolbar.

### 2.6 Tables & Filters
- **Structure**: Clean table wrapper with rounded corners and horizontal overflow.
- **Typography**: Header text in muted lowercase/capitalized sans (`12px`, `font-weight: 600`, `color: var(--muted)`).
- **Row Styling**: Subtle hairline bottom divider (`1px solid var(--line)`). No vertical borders.
- **Interactions**: Entire row highlights smoothly on hover (`background: var(--well)`).
- **Search & Filters**: Pill-shaped search input with embedded search icon and clear button.

### 2.7 Forms & Inputs
- **Inputs**: Rounded pill/squircle input fields (`border-radius: 999px` or `14px`), subtle borders (`1px solid var(--line-2)`), focus ring highlighting in dark ink or accent.
- **Buttons**:
  - Primary button (`.btn--ink`): Full pill (`border-radius: 999px`, `height: 42px`, `padding: 0 18px`), bold text (`13.5px`, `font-weight: 600`).
  - Ghost button (`.btn--ghost`): Translucent glass surface with subtle border.
  - Danger button (`.btn--danger`): Tomato red background (`#c8431f`).
  - Compact size (`.btn--sm`): `height: 34px`, `padding: 0 14px`, `font-size: 12.5px`.

### 2.8 Dropdowns & Menus
- **Floating Panels**: Rendered on elevated surface (`--float: #fdfcf9` in light, `#242927` in dark).
- **Shadow**: Popover elevation shadow (`--shadow-pop: 0 24px 60px -18px rgba(40,30,20,0.32), 0 2px 6px rgba(40,30,20,0.08)`).
- **Items**: Rounded items with hover well highlight, shortcut indicator, and icon slot.

### 2.9 Dialogs & Modals
- **Standard `<dialog>` Implementation**:
  - `finder` (Command Palette): `border-radius: 24px`, background `--solid`, inset rim border, backdrop blur scrim.
  - `modal`: `border-radius: 26px`, max-width 640px, centered.
  - `drawer`: Slide-over panel with `border-radius: 28px` on leading corners.

### 2.10 Typography
- **Primary Typeface**: **Urbanist** (Geometric Sans Serif).
- **Fallback Stack**: `ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`.
- **Typographic Scale & Weights**:
  - Massive Hero Numbers: `36px - 44px`, `font-weight: 700`, tight letter-spacing (`-0.03em`).
  - Section Headings: `18px - 21px`, `font-weight: 700`, letter-spacing (`-0.02em`).
  - Card Titles: `15px`, `font-weight: 600`, letter-spacing (`-0.005em`).
  - Body Text: `13.5px - 14px`, `font-weight: 500`.
  - Captions & Badges: `11px - 12.5px`, `font-weight: 600 - 700`.

### 2.11 Colors & Mesh Gradients
- **Light Mesh Canvas**:
  - Canvas base: Warm greige-cream (`#ebe8e1`).
  - Blob A (top-left): Peach/salmon (`#f2d3bd`) with 60px blur, radius 62vmax.
  - Blob B (bottom-right): Soft sage/mint (`#cfdfcd`) with 60px blur, radius 70vmax.
  - Blob C (top-right): Warm butter/cream (`#f1e4bf`) with 60px blur, radius 46vmax.
- **Dark Mesh Canvas**:
  - Canvas base: Rich deep forest charcoal (`#111412`).
  - Blob A: Deep terracotta (`#c8431f47`).
  - Blob B: Deep pine green (`#2f5c5080`).
  - Blob C: Subtle amber gold (`#f2c94c1a`).

### 2.12 Borders & Shadows
- **Hairline Borders**: Uses translucent ink lines (`--line: rgba(23, 25, 26, 0.09)` in light; `rgba(255, 255, 255, 0.08)` in dark).
- **Inset Rim**: `0 1px 0 rgba(255, 255, 255, 0.7)` creating a tactile glassy beveled upper edge on cards.
- **Card Shadow**: Warm, diffuse ambient shadow (`0 24px 48px -30px rgba(70, 50, 30, 0.28)`).

### 2.13 Icon Styles
- Thin-stroke SVG line icons (stroke-width: 1.8px - 2.2px).
- Circular touch targets (`40px - 44px`).
- Monochromatic rendering, matching parent text color (`stroke: currentColor`).

### 2.14 Spacing & Dimensions
- Standard grid gap: `16px`.
- Card internal padding: `18px` (compact) to `24px` (generous).
- Dock dimensions: `60px` width, `20px` viewport margin.
- Viewport max-width: `1840px`.

### 2.15 Hover & Active States
- Button hover: Smooth brightness elevation (`filter: brightness(1.15)` in light; `brightness(0.92)` in dark).
- Interactive card tilt/focus: Elevates z-index with `--shadow-pop`.
- Dock items: Opacity transitions from `0.74` to `1.0`.

### 2.16 Loading & Empty States
- Skeletons use subtle pulsing translucent surfaces (`var(--well)`).
- Empty state cards feature clean geometric line illustrations, short friendly copy, and a centered pill call-to-action button.

### 2.17 Light Theme
- Natural sunlight feel, warm sand and peach undertones, translucent off-white cards with frosted blur, jet-black accent elements (dock and active navigation pills).

### 2.18 Dark Theme
- Moody, luxurious forest-charcoal palette (`#111412`), translucent smoked glass cards (`#ffffff0d`), white active pills, and high-contrast, perfectly legible text (`#f1eee8`).

### 2.19 Responsive Layouts
- **Desktop (1440x900)**: Full floating pill dock on left, 3-column top navigation, multi-column bento grid.
- **Tablet (768x1024)**: Compact dock, 2-column bento grid, scrollable horizontal tab bar.
- **Mobile (390x844)**: Top dock or bottom navigation drawer, top bar compresses into hamburger + brand mark, cards stack into a clean single-column stream.

### 2.20 Animations & Transitions
- Signature easing curve: `--ease: cubic-bezier(.2, .8, .2, 1)`.
- Duration: 150ms for color/hover transitions; 240ms for modal and popover entrance; 300ms for theme switch fade.

---

## 3. Reference Screenshots Summary

All 42 target screenshots are archived in [**`docs/ui-redesign/screenshots/reference/`**](file:///d:/1%20Softwares/DeskcommCRM/docs/ui-redesign/screenshots/reference/):

| Route | Light Desktop | Dark Desktop | Light Tablet | Dark Tablet | Light Mobile | Dark Mobile |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `#/overview` | `overview-light-desktop.png` | `overview-dark-desktop.png` | `overview-light-tablet.png` | `overview-dark-tablet.png` | `overview-light-mobile.png` | `overview-dark-mobile.png` |
| `#/pipeline` | `pipeline-light-desktop.png` | `pipeline-dark-desktop.png` | `pipeline-light-tablet.png` | `pipeline-dark-tablet.png` | `pipeline-light-mobile.png` | `pipeline-dark-mobile.png` |
| `#/customers`| `customers-light-desktop.png`| `customers-dark-desktop.png`| `customers-light-tablet.png`| `customers-dark-tablet.png`| `customers-light-mobile.png`| `customers-dark-mobile.png`|
| `#/schedule` | `schedule-light-desktop.png` | `schedule-dark-desktop.png` | `schedule-light-tablet.png` | `schedule-dark-tablet.png` | `schedule-light-mobile.png` | `schedule-dark-mobile.png` |
| `#/finance`  | `finance-light-desktop.png`  | `finance-dark-desktop.png`  | `finance-light-tablet.png`  | `finance-dark-tablet.png`  | `finance-light-mobile.png`  | `finance-dark-mobile.png`  |
| `#/growth`   | `growth-light-desktop.png`   | `growth-dark-desktop.png`   | `growth-light-tablet.png`   | `growth-dark-tablet.png`   | `growth-light-mobile.png`   | `growth-dark-mobile.png`   |
| `#/projects` | `projects-light-desktop.png` | `projects-dark-desktop.png` | `projects-light-tablet.png` | `projects-dark-tablet.png` | `projects-light-mobile.png` | `projects-dark-mobile.png` |
