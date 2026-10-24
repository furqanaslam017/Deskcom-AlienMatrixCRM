# Interaction & Motion Specification — Rapport Design Language

This document records the exact transition timings, easing curves, hover interactions, tooltip behaviors, and theme-switch dynamics extracted from the Rapport design system.

---

## 1. Global Timing & Easing Curves

```css
/* Canonical Easing Function */
--ease: cubic-bezier(0.2, 0.8, 0.2, 1);

/* Transition Durations */
--duration-fast: 150ms;   /* Micro-actions, button press, icon hover */
--duration-base: 250ms;   /* Tabs sliding, accordion, modal fades, theme switch */
--duration-slow: 400ms;   /* Route transitions, gauge animations, area chart entry */
```

- **Reduced Motion Support:**
  When `prefers-reduced-motion: reduce` is active, all `transition-duration` and `animation-duration` are forced to `0.01ms` (or disabled), and `.mesh i` will-change is turned off.

---

## 2. Interactive Component Behaviors

### 2.1 Floating Sidebar (Dock)
- **Positioning:** Fixed, centered vertically (`top: 50%`, `transform: translateY(-50%)`, left offset `20px`).
- **Icons & Buttons:** Perfect circular buttons with icon inside.
- **Hover State:** Subtle background highlight with `scale(1.05)` and tooltip appearing to the right with a `150ms` ease-out fade.
- **Active State:** Solid pill/dot indicator showing current section.
- **Theme Switcher:** Moon/Sun icon toggle at the bottom of the dock with 360deg rotation and opacity morph (`250ms`).

### 2.2 Top Navigation Tabs (Pill Slider)
- **Active Indicator:** Sliding high-contrast pill container behind active tab text.
- **Animation:** Powered by Framer Motion `layoutId="rapportActivePill"` or CSS `cubic-bezier(0.2, 0.8, 0.2, 1)` transition.
- **Hover Effect:** Non-active tabs show a subtle opacity increase from `0.6` to `0.9` before selection.

### 2.3 Bento Surface Cards
- **Hover State:** Slight elevation drop-shadow expansion (`--shadow-pop` transition over `200ms`) without moving card geometry (no jarring translate).
- **Hairline Rim:** Subtle 1px inset highlight (`inset 0 1px 0 var(--rim)`) creates crisp top edge reflection.

### 2.4 Circle Icon Buttons (`CircleIconButton`)
- **Base State:** Circular button (`40px x 44px`), border hairline `1px solid var(--line)`.
- **Hover:** Border shifts to `var(--line-2)` and background brightens by 6-8%.
- **Active / Click:** Subtle scale down `scale(0.96)`.

### 2.5 Revenue Area Chart & Crosshair Tooltip
- **Crosshair:** Vertical dotted or hairline cursor following mouse X position along chart SVG.
- **Data Point:** Active point expands with concentric halo ring (`stroke: var(--tomato)`, `fill: white`).
- **Tooltip Card:** Bento floating pill/card positioned above cursor showing Month, Won Revenue ($), and Target ($), with smooth position interpolation.

### 2.6 Theme Switch Dynamics
- **Trigger:** Instant toggle on `document.documentElement` switching `data-theme="light"` / `data-theme="dark"`.
- **Color Transition:** Smooth CSS color and background transition (`transition: background-color 250ms var(--ease), color 250ms var(--ease)`).
- **Zero-Flash Guarantee:** `next-themes` with `attribute="data-theme"` (and class fallback) injected in `<head>` via inline script before React hydration.
