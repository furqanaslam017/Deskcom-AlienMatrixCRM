# Route & Module Mapping — AlienMatrix CRM to Rapport Shell Architecture

This document defines the 1:1 mapping between AlienMatrix CRM's existing business modules and the Rapport top-level pill navigation tabs, floating dock quick-actions, and secondary segmented views.

---

## 1. Top Navigation Pill Tabs Mapping

| Rapport Demo Tab | AlienMatrix Module / Purpose | Primary Route | Underlying Existing Views |
| :--- | :--- | :--- | :--- |
| **Overview** | Executive Sales & Operations Dashboard | `/app/analise/alien-matrix` & `/app` | Pipeline Value, Win Rate, Team Quota, Hot Deals, Revenue Area Chart, AI Agent Volume |
| **Pipeline** | CRM Deals, Leads & Quotes Kanban/List | `/app/crm/deals` | Deals Kanban board, Leads intake, Quotes generation, Weighted forecasts |
| **Customers** | WhatsApp Inbox & Contact Relationship Management | `/app/channels/whatsapp` | Unified WhatsApp chat, Contact directory (`/app/crm/contacts`), Companies, Lead intake |
| **Schedule** | Activities, Calendar & Follow-up Tasks | `/app/crm/calendar` | Team calendar, Follow-up task dispatch, Scheduled touchpoints |
| **Finance** | Invoices, Subscriptions, Products & Billing Plans | `/app/crm/invoices` | Invoices list, Products catalog, Price tiers, Local & Stripe billing |
| **Growth** | Workflows Engine, AI Layer Console & Campaigns | `/app/crm/workflows` | Automation builder, AI Agent Console (`/app/ai/alien-matrix`), Broadcasts, Webhooks |
| **Projects** | Custom Objects Engine & Industry Packs | `/app/objects` | Universal Dynamic Data schema, Industry vertical schemas (Healthcare, Real Estate, E-com) |

---

## 2. Floating Dock (Left Sidebar) Quick Actions Mapping

| Dock Position | Icon / Tooltip | Target Route or Action Handler | Existing Endpoint / Handler |
| :--- | :--- | :--- | :--- |
| **Slot 1** | **Search** (`Search` icon) | Global Command Palette modal (`Cmd + K`) | Universal quick search across contacts, deals, tasks |
| **Slot 2** | **Quick Create** (`Plus` icon) | Universal Quick-Create Popover Menu | Quick create: New Lead, Deal, Task, Invoice, or WhatsApp message |
| **Slot 3** | **Starred / Favorites** (`Star` icon) | Pinned Deals / High-Priority Leads drawer | Filter active pinned items |
| **Slot 4** | **Calendar** (`Calendar` icon) | `/app/crm/calendar` | Immediate schedule access |
| **Slot 5** | **WhatsApp Inbox** (`Phone` / `MessageCircle`) | `/app/channels/whatsapp` | Direct access to primary WhatsApp omnichannel inbox |
| **Slot 6** | **Broadcasts / Campaigns** (`Send` icon) | `/app/crm/broadcasts` | Omnichannel broadcast campaigns |
| **Slot 7** | **Integrations** (`Share2` icon) | `/app/settings/alien-matrix#integrations` | Webhooks, WAHA gateways, MCP tools |
| **Slot 8** | **Import / Export** (`UploadCloud` icon) | `/app/objects/export` | CSV import & export tools |
| *Divider* | *Separation line* | — | Visual separation |
| **Slot 9** | **Settings** (`Settings` icon) | `/app/settings/alien-matrix` | Organization, Team, Branding, Security settings |
| **Slot 10** | **Theme Switcher** (`Moon` / `Sun` icon) | Dynamic toggle | Switches `data-theme` between `light` and `dark` |

---

## 3. Platform Administration Console (Super-Admin)

When accessed by Platform Super-Admins (`/admin/alien-matrix`), the top navigation switches dynamically to the Admin navigation tab set:
- **Tenants** (`/admin/alien-matrix/tenants`)
- **System Health** (`/admin/alien-matrix/health`)
- **Audit Logs** (`/admin/alien-matrix/audit`)
- **Plans & SaaS** (`/admin/alien-matrix/plans`)
- **Back to Tenant CRM** (`/app`)

All role-based access controls (RBAC) and platform guard functions (`requireRole`, `requirePlatformAdmin`) remain completely untouched and enforced.
