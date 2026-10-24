# Component Inventory — Rapport UI System Re-engineered for AlienMatrix CRM

This inventory audits every visual component pattern extracted from the Rapport dashboard demo, categorized for modular implementation into AlienMatrix CRM (`components/ui-rapport` and `@/components/ui` skins).

---

## 1. Application Shell & Layout Primitives

| Component | Visual Characteristics | Light Theme Behavior | Dark Theme Behavior |
| :--- | :--- | :--- | :--- |
| **`MeshBackground`** | Fixed viewport canvas with 3 blurred radial gradient nodes (`blur(60px)`) | Peach (`#f2d3bd`), Sage (`#cfdfcd`), Yellow (`#f1e4bf`) over `#ebe8e1` | Vermilion glow (`#c8431f47`), Pine glow (`#2f5c5080`), Gold glow (`#f2c94c1a`) over `#111412` |
| **`FloatingSidebar`** (Dock) | Vertically centered floating pill (`60px` wide, `radius: 999px`), fixed left offset `20px` | Solid near-black `#17191a`, white/cream icons `#fbf8f2` | Translucent glass `#ffffff14` with subtle rim border, off-white icons `#f1eee8` |
| **`TopNav`** | Sticky top bar spanning header: Brand logo on left, centered segmented pill tabs, right action cluster | Transparent background, active pill in black `#17191a` with white text | Transparent background, active pill in cream `#f1eee8` with dark text |
| **`MobileDock`** | Fixed bottom navigation dock (< 768px viewport) replacing the left sidebar | Bottom pill dock with horizontal icon distribution | Bottom pill dock with dark translucent styling |

---

## 2. Card & Surface Primitives

| Component | Visual Characteristics | Radius & Padding | Theme Inversion / Adaptation |
| :--- | :--- | :--- | :--- |
| **`SurfaceCard`** (Bento Card) | Translucent backdrop blur (`backdrop-filter: blur(20px)`), hairline rim highlight (`inset 0 1px 0`), soft drop shadow | `radius: 26px - 32px`, `padding: 24px` | Light: White glass (`rgba(255,255,255,0.46)`), Dark: Charcoal glass (`rgba(255,255,255,0.05)`) |
| **`DealCard`** | High-contrast inverted card for active/won deals, compact nested tile | `radius: 20px - 22px`, `padding: 16px` | **INVERTS:** In Light theme it is **Dark** (`#17191a` bg, white text); in Dark theme it is **Cream** (`#FAF6F1` bg, dark text) |
| **`TeamQuotaCard`** | Featured target performance card with deep forest green background | `radius: 26px`, `padding: 24px` | Dark Pine `#2f5c50` in light; deeper emerald/pine `#1e3b33` in dark |
| **`KpiTile`** | Metric counter with circular icon badge, primary value, trend badge, and micro-label | Inline or grid tile, `radius: 20px` | Neutral glass background matching surface cards |

---

## 3. Interactive Controls & Micro-Components

| Component | Visual Characteristics | Behaviors & States |
| :--- | :--- | :--- |
| **`CircleIconButton`** | Perfect circular button (`40px - 44px`), hairline border, centered thin icon | Hover scales subtly (`scale(1.04)`), active drops opacity. Light: `rgba(255,255,255,0.7)`, Dark: `rgba(255,255,255,0.08)` |
| **`SegmentedControl`** | Pill container with sliding active pill indicator (Framer Motion `layoutId="activePill"`) | Active item has high contrast pill (white on dark or dark on light); inactive items are muted text |
| **`StatPill` / `TrendBadge`** | Compact rounded pill with `+` / `-` percentage indicator | Positive: Forest Green pill (`#2f5c50` or `#2f7a52`) with white text; Neutral/Alert: Vermilion pill (`#c8431f`) |
| **`AvatarStack`** | Overlapping circular avatar discs with thin rim border matching card surface | Overlap `-8px`, hover brings disc to front with scale |
| **`GaugeArc` / `DonutChart`** | Circular SVG progress meter with warm butter/yellow arc (`#f2c94c`) on muted ring track | Animated stroke dash offset transition on mount |
| **`AreaChartCard`** | Smooth cubic spline area chart with vermilion stroke (`#c8431f`), gradient fill to transparent, and dashed target benchmark line | Interactive crosshair vertical line with custom floating bento tooltip |
| **`StageMixBar`** | Stacked progress bar representing deals distribution across pipeline stages | Segmented rounded bars with stage color mapping and hover count tooltips |

---

## 4. Typography Hierarchy (Font: Urbanist)

| Element | Size & Weight | Letter Spacing & Line Height | Color (Light / Dark) |
| :--- | :--- | :--- | :--- |
| **Page Title (H1)** | `38px - 44px` (Bold / SemiBold) | `-0.03em`, line-height `1.05` | `#17191a` / `#f1eee8` |
| **Card Header (H2/H3)** | `18px - 22px` (SemiBold) | `-0.02em`, line-height `1.2` | `#17191a` / `#f1eee8` |
| **Big KPI Numbers** | `32px - 40px` (Bold, Tabular) | `-0.03em`, line-height `1.1` | `#17191a` / `#f1eee8` |
| **Body / Primary** | `14px` (Medium 500) | Normal, line-height `1.45` | `#17191a` / `#f1eee8` |
| **Muted Caption** | `12px - 13px` (Medium 500) | `+0.01em`, line-height `1.3` | `#676a66` / `#a3a6a0` |
