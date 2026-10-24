# Rapport Component Inventory & Design Specifications
**Date:** October 25, 2026  
**Auditor:** Senior UI Reverse Engineering Engineer  
**Reference Target:** `https://demo.codeandchill.store/rapport/#/overview`  
**Purpose:** Reusable component catalog mapping Rapport's UI elements directly to AlienMatrix CRM components.

---

## 1. Ambient Mesh Background (`MeshCanvas`)

### 1.1 Specification & Measurements
- **Purpose**: Ambient, organic radial gradient lighting fixed behind all cards.
- **Positioning**: `position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden;`
- **Orbs**:
  - `mesh__a` (top-left): `width: 62vmax; height: 62vmax; top: -24vmax; left: -18vmax; filter: blur(60px);`
  - `mesh__b` (bottom-right): `width: 70vmax; height: 70vmax; bottom: -30vmax; right: -24vmax; filter: blur(60px);`
  - `mesh__c` (top-right): `width: 46vmax; height: 46vmax; top: -16vmax; right: 8vmax; filter: blur(60px);`
- **Themes**:
  - Light: Peach (`#f2d3bd`), Mint (`#cfdfcd`), Butter (`#f1e4bf`) on canvas `#ebe8e1`.
  - Dark: Terracotta (`#c8431f47`), Pine (`#2f5c5080`), Amber (`#f2c94c1a`) on canvas `#111412`.

---

## 2. Floating Vertical Dock (`RapportDock`)

### 2.1 Specification & Measurements
- **Dimensions**: `width: 60px; height: fit-content; border-radius: 999px; padding: 8px;`
- **Position**: `position: fixed; top: 0; bottom: 0; margin: auto 0; left: max(20px, calc((100vw - 1840px)/2 + 20px)); z-index: 30;`
- **Styling**:
  - Light: `background: #17191a; color: #fbf8f2; box-shadow: 0 20px 40px -18px rgba(0, 0, 0, 0.45);`
  - Dark: `background: rgba(255, 255, 255, 0.08); border: 1px solid var(--line); color: #f1eee8;`

### 2.2 Controls & Interactions
- **Dock Buttons (`dock__btn`)**:
  - `width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; opacity: 0.74;`
  - Hover: `opacity: 1; background: rgba(255, 255, 255, 0.12);`
  - Active Indicator: 5px yellow dot (`--butter: #f2c94c`) on the right margin (`right: 3px; top: 50%; border-radius: 50%;`).
- **Tooltips (`dock__tip`)**:
  - `position: absolute; left: calc(100% + 14px); top: 0; bottom: 0; margin: auto 0; height: fit-content;`
  - `padding: 6px 10px; border-radius: 10px; font-size: 12.5px; font-weight: 600; box-shadow: var(--shadow-pop);`
  - Fades in with transition `opacity 0.18s var(--ease)`.
- **Theme Switcher (`dock__theme`)**:
  - Renders Moon icon in Light theme; Sun icon in Dark theme. Toggles `data-theme` attribute on `<html>`.

---

## 3. Header & Navigation (`RapportHeader`)

### 3.1 Specification & Measurements
- **Grid Layout**: `display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 20px; margin-bottom: 26px;`
- **Brand Squircle (`brand__mark`)**:
  - `width: 38px; height: 38px; border-radius: 12px; background: var(--pill); color: var(--on-pill); display: grid; place-items: center;`
  - Icon: AlienMatrix geometric line symbol (`22px x 22px`, `stroke-width: 2.2px`).
- **Brand Wordmark (`brand`)**:
  - `font-size: 21px; font-weight: 700; letter-spacing: -0.02em; color: var(--text);`

### 3.2 Pill Tab Navigation (`PillTabs`)
- **Container**: `border-radius: 999px; padding: 4px; display: flex; gap: 2px; justify-self: center; max-width: 100%; overflow-x: auto;`
- **Tab Item (`tab`)**:
  - `padding: 10px 17px; font-size: 13.5px; font-weight: 600; border-radius: 999px; white-space: nowrap; transition: background 0.15s;`
  - Inactive Hover: `background: var(--well);`
- **Active Pill (`tabs__pill`)**:
  - Light: Solid ink black pill (`background: #17191a; color: #fbf8f2;`).
  - Dark: Solid white pill (`background: #f1eee8; color: #17191a;`).

### 3.3 Quick Tools (`top__tools`)
- **Circular Glass Icon Buttons (`ibtn ibtn--glass`)**:
  - `width: 40px; height: 40px; border-radius: 50%; background: var(--glass); border: 1px solid var(--rim);`
  - Notification Dot: `8px x 8px`, `background: var(--tomato)`, position top-right.
- **User Avatar (`me magnetic`)**:
  - `width: 40px; height: 40px; border-radius: 50%; border: 1.5px solid var(--rim); object-fit: cover;`

---

## 4. Bento Card Container (`BentoCard`)

### 4.1 Specification & Measurements
- **Curvature**: `border-radius: var(--r-card)` (26px).
- **Surface**:
  - Light: `background: var(--glass)` (46% translucent white), `border: 1px solid var(--rim)`, `box-shadow: var(--shadow)`.
  - Dark: `background: var(--glass)` (5% smoked glass), `border: 1px solid var(--rim)`, `box-shadow: var(--shadow)`.
- **Internal Padding**: `padding: 18px;`
- **Card Header (`card__head`)**:
  - `display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 40px; margin-bottom: 14px;`
  - Title: `font-size: 15px; font-weight: 600; letter-spacing: -0.005em; color: var(--text);`
  - Subtitle: `font-size: 12.5px; color: var(--muted);`
- **Interactive Focus Mode (`card.is-focus`)**:
  - Zooms and elevates into centered modal viewport with `background: var(--solid); box-shadow: var(--shadow-pop); z-index: 60;`.

---

## 5. Buttons & Action Controls

| Class | Shape | Dimensions | Light Theme Colors | Dark Theme Colors | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`.btn--ink`** | Pill (999px) | `h: 42px; px: 18px` | `bg: #17191a; text: #fbf8f2` | `bg: #f1eee8; text: #17191a` | Primary action (Create, Convert, Save) |
| **`.btn--ghost`** | Pill (999px) | `h: 42px; px: 18px` | `bg: var(--glass); border: var(--line-2)` | `bg: var(--glass); border: var(--line-2)` | Secondary action (Filter, View, Cancel) |
| **`.btn--danger`** | Pill (999px) | `h: 42px; px: 18px` | `bg: #c8431f; text: #fbf8f2` | `bg: #d8532d; text: #fbf8f2` | Destructive action (Delete, Disconnect) |
| **`.btn--sm`** | Pill (999px) | `h: 34px; px: 14px` | As above (`font-size: 12.5px`) | As above (`font-size: 12.5px`) | Compact table action buttons |
| **`.ibtn`** | Circle (50%) | `40px x 40px` | `bg: var(--glass); border: var(--rim)` | `bg: var(--glass); border: var(--rim)` | Icon-only tools (Search, Bell, More) |

---

## 6. Status Badges & Pills (`RapportBadge`)

- **Base Styling**: `display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.01em;`
- **Variants**:
  - **Butter (`badge--butter`)**: `background: #f2c94c; color: #17191a;` (Pending, In Progress, Trial).
  - **Pine (`badge--pine`)**: `background: #2f5c50; color: #fbf8f2;` (Won, Connected, Active, Subscribed).
  - **Tomato (`badge--tomato`)**: `background: #c8431f; color: #fbf8f2;` (Lost, Failed, Delinquent, Urgent).
  - **Plain (`badge--plain`)**: `background: var(--glass-2); color: var(--text); border: 1px solid var(--line);` (Draft, Neutral, Category).

---

## 7. Data Tables & List Views

- **Wrapper (`table-wrap`)**: `overflow-x: auto; margin: 0 -6px;`
- **Table Element (`table`)**: `width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13.5px;`
- **Header Cells (`th`)**:
  - `font-size: 12px; font-weight: 600; color: var(--muted); border-bottom: 1px solid var(--line); padding: 10px 12px; text-align: left;`
- **Body Cells (`td`)**:
  - `padding: 12px; border-bottom: 1px solid var(--line); vertical-align: middle;`
- **Row Hover**: Smooth background fade to `var(--well)` (`transition: background-color 0.15s;`).

---

## 8. Modals, Drawers & Popovers

### 8.1 Command Palette (`#finder`)
- **Backdrop**: Translucent blur scrim (`backdrop-filter: blur(8px); background: rgba(0, 0, 0, 0.4);`).
- **Dialog Box**: `width: 580px; border-radius: 24px; background: var(--solid); box-shadow: var(--shadow-pop); border: 1px solid var(--rim);`
- **Header**: Integrated pill search field with real-time fuzzy match list.

### 8.2 Standard Dialog (`#modal`)
- **Dimensions**: `max-width: 620px; border-radius: 26px; padding: 24px; background: var(--solid);`
- **Header**: Title (`18px`, `font-weight: 700`), close circular button.

### 8.3 Slide-Over Drawer (`#drawer`)
- **Position**: Slides in from right margin: `top: 0; right: 0; bottom: 0; width: 480px; border-radius: 28px 0 0 28px;`
- **Surface**: `background: var(--solid); box-shadow: var(--shadow-pop); border-left: 1px solid var(--rim);`

---

## 9. AlienMatrix CRM Component Mapping Matrix

| Rapport UI Pattern | AlienMatrix CRM Component Target | Transformation Plan |
| :--- | :--- | :--- |
| `MeshCanvas` (`.mesh`) | `app/app/layout.tsx` & `app/layout.tsx` | Inject fixed `.mesh` canvas behind `AppShell`. |
| `RapportDock` (`.dock`) | `components/shell/Sidebar.tsx` | Re-skin desktop sidebar into floating pill vertical dock with icon buttons and tooltips. |
| `RapportHeader` (`.top`) | `components/shell/TopBar.tsx` | Replace topbar with centered pill tabs, logo mark squircle, and circular icon buttons. |
| `BentoCard` (`.card`) | `components/ui/card.tsx` | Update card primitives with `--r-card: 26px`, glass translucency, rim border, and ambient shadow. |
| `PillButton` (`.btn`) | `components/ui/button.tsx` | Update button variants to 999px pills with `--btn-ink`, `--btn-ghost`, `--btn-danger`. |
| `StatusBadge` (`.badge`)| `components/ui/badge.tsx` | Re-theme badge variants with butter, pine, tomato, and plain glass styles. |
| `DataTable` (`.table`) | `components/ui/table.tsx` | Style table header, hairline separators, and hover well rows. |
| Bento CRM Views | `components/alien-matrix/*` | Re-skin Deals Kanban, WhatsApp Inbox, AI Console, and Analytics Dashboard into Bento cards. |
