# Route Inventory: DESKCOM AlienMatrixCRM
**Date:** October 25, 2026  
**Auditor:** Senior Software Architect & Frontend Reverse Engineering Specialist  
**Application Base:** Next.js 16 App Router  
**Scope:** Complete inventory of all public, authenticated tenant, platform admin, and API routes.

---

## 1. Summary of Application Surfaces

The application contains 172 UI pages (`page.tsx`) and 537 API route handlers (`route.ts`) structured into four primary functional zones:

1. **Public & Onboarding Zone** (`app/(public)/*`, `app/onboarding/*`, `app/page.tsx`): 17 pages.
2. **Authenticated Tenant CRM Zone** (`app/app/*`): 111 pages covering core CRM, WhatsApp flagship inbox, AI operations, workflows, custom objects, analytics, and tenant settings.
3. **Platform Superadmin Zone** (`app/admin/(protected)/*`): 31 pages covering cross-tenant management, system health, platform branding, billing plans, and quotas.
4. **API & Webhook Services** (`app/api/v1/*`, `app/api/mcp/*`): 537 route handlers, including 65 dedicated AlienMatrix endpoints under `app/api/v1/alien-matrix/*`.

---

## 2. Public & Authentication Routes

All routes in this zone are accessible without an authenticated session cookie (or handle session initiation). Wrapped by `app/(public)/layout.tsx` or `app/onboarding/layout.tsx`.

| Path | Page File Path | Client / Logic Component | Guard / Access | Business Purpose | Key Layout Elements |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `app/page.tsx` | Server redirect | Public | Root redirect to `/app` (if logged in) or `/login`. | Splash redirect |
| `/login` | `app/(public)/login/page.tsx` | `LoginForm.tsx` | Public | User email/password authentication & OAuth sign-in. | Centered auth card, inputs, submit button, forgot link |
| `/login/continuar` | `app/(public)/login/continuar/page.tsx` | `ContinuarSessao.tsx` | Public | Session resume after email magic link or invite. | Spinner, status banner |
| `/login/forgot` | `app/(public)/login/forgot/page.tsx` | `ForgotPasswordForm.tsx` | Public | Password recovery request initiation. | Email form, back to login link |
| `/login/reset` | `app/(public)/login/reset/page.tsx` | `ResetPasswordForm.tsx` | Token/Hash | Password reset entry with new password confirmation. | Password fields, validation checklist |
| `/login/mfa` | `app/(public)/login/mfa/page.tsx` | `MfaChallengeForm.tsx` | Session pending MFA | TOTP 6-digit verification code entry. | Code input grid, verify button |
| `/login/recovery` | `app/(public)/login/recovery/page.tsx` | `RecoveryCodeForm.tsx` | Session pending MFA | Backup recovery code entry when TOTP device is lost. | Single text code input, verify button |
| `/signup` | `app/(public)/signup/page.tsx` | `SignupForm.tsx` | Public | User self-registration & workspace creation. | Registration form, company name, terms checkbox |
| `/onboarding` | `app/onboarding/page.tsx` | `OnboardingWizard.tsx` | Authenticated | Step 0: Welcome and workspace profile setup. | Stepper header, setup card, next button |
| `/onboarding/welcome` | `app/onboarding/welcome/page.tsx` | `WelcomeStep.tsx` | Authenticated | Step 1: Industry segment selection and template picker. | Industry cards grid, template preview |
| `/onboarding/connect-whatsapp` | `app/onboarding/connect-whatsapp/page.tsx` | `ConnectWhatsappStep.tsx` | Authenticated | Step 2: WAHA QR code or Meta Cloud API pairing. | QR code frame, connection status poller |
| `/onboarding/connect-nuvemshop`| `app/onboarding/connect-nuvemshop/page.tsx` | `ConnectNuvemshopStep.tsx` | Authenticated | Step 3 (Optional): E-commerce integration setup. | OAuth button, store credentials |
| `/onboarding/funil` | `app/onboarding/funil/page.tsx` | `FunilStep.tsx` | Authenticated | Step 4: Pipeline stages and deal custom field customization. | Pipeline stages reorder list |
| `/onboarding/setup-ai` | `app/onboarding/setup-ai/page.tsx` | `SetupAiStep.tsx` | Authenticated | Step 5: Initial AI sales agent persona & tone configuration. | Prompt box, tone slider, guardrails |
| `/onboarding/invite-team` | `app/onboarding/invite-team/page.tsx` | `InviteTeamStep.tsx` | Authenticated | Step 6: Team member email invitation and role assignment. | Dynamic email invite rows |
| `/onboarding/testar` | `app/onboarding/testar/page.tsx` | `TestarStep.tsx` | Authenticated | Step 7: Live simulator for WhatsApp agent conversation. | Chat mockup simulator, send message |
| `/onboarding/done` | `app/onboarding/done/page.tsx` | `DoneStep.tsx` | Authenticated | Final: Confirmation, completion celebration, jump to CRM. | Success badge, launch CRM button |

---

## 3. Authenticated Tenant CRM Routes (`app/app/*`)

All routes in this zone require a valid user session cookie and are wrapped by `app/app/layout.tsx` (`AppShell`). Every route is tenant-isolated with RLS.

### 3.1 Primary Navigation Hubs & Core Desk
| Path | Page File Path | Target Client Component | Min Role | Business Purpose | Key Layout Elements |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/app` | `app/app/page.tsx` | Server router / redirect | `viewer` | Resolves tenant entry point (inbox or executive dashboard). | Redirector |
| `/app/inbox` | `app/app/inbox/page.tsx` | `InboxView.tsx` | `agent` | Realtime multi-agent conversation inbox with queue tabs. | 3-pane layout: conversation list, message thread, contact info |
| `/app/channels/whatsapp` | `app/app/channels/whatsapp/page.tsx` | `WhatsAppFlagshipViewClient.tsx` | `agent` | **Flagship WhatsApp Workspace**: multi-number selector, WAHA/Cloud sessions, quick notes, deal conversion drawer, audio playback. | Bento container, number pills, chat stream, conversion drawer, audio visualizer |
| `/app/prospecting` | `app/app/prospecting/page.tsx` | `ProspectingView.tsx` | `agent` | Outbound prospecting campaigns and cold lead lists. | Filter toolbar, lead table, batch action bar |
| `/app/radar` | `app/app/radar/page.tsx` | `RadarView.tsx` | `agent` | Priority queue of conversations needing immediate attention. | Urgency score cards, quick reply actions |
| `/app/agenda` | `app/app/agenda/page.tsx` | `AgendaView.tsx` | `agent` | Appointments, scheduled calls, and follow-up activities. | Calendar grid, scheduled items list, time slot picker |

### 3.2 CRM Modules (`/app/crm/*`)
| Path | Page File Path | Target Client Component | Min Role | Business Purpose | Key Layout Elements |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/app/crm` | `app/app/crm/page.tsx` | `CrmHubView.tsx` | `viewer` | CRM Hub index page directing to deals, leads, products, etc. | Bento navigation grid with module cards |
| `/app/crm/deals` | `app/app/crm/deals/page.tsx` | `DealsViewClient.tsx` | `agent` | **Deals Pipeline**: Interactive Drag-and-Drop Kanban & data table with stage filters, value aggregations, and quick deal creator. | Kanban board columns, deal cards, stage summary pill, view switcher (Kanban/Table) |
| `/app/crm/invoices` | `app/app/crm/invoices/page.tsx` | `InvoicesViewClient.tsx` | `agent` | Invoices & Billing orders: status tracking, line items, and export. | Metrics cards, data table, invoice creation modal, export CSV |
| `/app/crm/products` | `app/app/crm/products/page.tsx` | `ProductsViewClient.tsx` | `agent` | Product & Service Catalog: SKUs, pricing, descriptions, stock. | Search bar, product cards/table, add product dialog |
| `/app/crm/calendar` | `app/app/crm/calendar/page.tsx` | `CalendarViewClient.tsx` | `agent` | Team Activity & Meeting Calendar: Day/Week/Month scheduler. | View mode toggle, interactive event calendar, event modal |
| `/app/crm/workflows` | `app/app/crm/workflows/page.tsx` | `WorkflowsViewClient.tsx` | `manager` | **Workflow Automation Builder**: Visual drag/chain workflow editor with triggers, conditions, actions, and execution logs. | Workflow list, visual graph nodes, trigger selector, execution history |
| `/app/objects` | `app/app/objects/page.tsx` | `CustomObjectsTableView.tsx` | `agent` | **Custom Objects Engine**: Dynamic generic entity manager supporting custom schemas, custom fields, views, and record drawers. | Object switcher tabs, dynamic data table, schema editor modal, record slide-out drawer |
| `/app/contacts` | `app/app/contacts/page.tsx` | `ContactsView.tsx` | `agent` | Customer contacts directory with phone numbers and tags. | Filter bar, contacts table, contact detail sheet |
| `/app/companies` | `app/app/companies/page.tsx` | `CompaniesView.tsx` | `agent` | Organization/Company accounts directory and child contacts. | Companies table, company stats, add company drawer |
| `/app/tasks` | `app/app/tasks/page.tsx` | `TasksView.tsx` | `agent` | User and team CRM tasks, deadlines, and reminders. | Task checklist, due date badges, filter tabs |
| `/app/proposals` | `app/app/proposals/page.tsx` | `ProposalsView.tsx` | `agent` | Commercial proposals, quotes, and document status tracking. | Proposal list, status badges, PDF viewer modal |
| `/app/campaigns` | `app/app/campaigns/page.tsx` | `CampaignsView.tsx` | `manager` | WhatsApp broadcast campaigns and scheduled messaging. | Campaign cards, broadcast stats, compose broadcast modal |

### 3.3 AI Operations (`/app/ai/*`)
| Path | Page File Path | Target Client Component | Min Role | Business Purpose | Key Layout Elements |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/app/ai` | `app/app/ai/page.tsx` | `AiHubView.tsx` | `viewer` | Hub navigating to all AI sub-modules. | Sectioned navigation cards |
| `/app/ai/alien-matrix` | `app/app/ai/alien-matrix/page.tsx` | `AiLayerConsoleViewClient.tsx` | `manager` | **Autonomous AI Agents Console**: Multi-persona management, RAG knowledge indexing, tone sliders, and live handoff queue. | Personas grid, RAG document manager, tone & guardrails panel, handoff queue table |
| `/app/ai/agents` | `app/app/ai/agents/page.tsx` | `AiAgentsView.tsx` | `manager` | Agent configurations, prompts, and tool attachments. | Agent cards, prompt editor, tool switches |
| `/app/ai/knowledge/sources` | `app/app/ai/knowledge/sources/page.tsx`| `KnowledgeSourcesView.tsx`| `manager` | Document uploads (PDF, DOCX, TXT) for RAG vectorization. | File dropzone, indexed documents list, chunking status |
| `/app/ai/memory` | `app/app/ai/memory/page.tsx` | `AiMemoryView.tsx` | `manager` | Long-term memory records stored per customer. | Memory search, key-value inspector, purge controls |
| `/app/ai/cases` | `app/app/ai/cases/page.tsx` | `AiCasesView.tsx` | `agent` | Cases escalated by AI requiring human resolution. | Case escalation cards, resolution actions |
| `/app/ai/runs` | `app/app/ai/runs/page.tsx` | `AiRunsView.tsx` | `admin` | Realtime AI execution logs, token counts, and latency metrics. | Execution log table, latency charts, token breakdown |
| `/app/ai/usage` | `app/app/ai/usage/page.tsx` | `AiUsageView.tsx` | `admin` | AI token budget tracking, cost meters, and model allocations. | Cost progress bars, monthly consumption chart |

### 3.4 Analytics & Intelligence (`/app/analise/*`)
| Path | Page File Path | Target Client Component | Min Role | Business Purpose | Key Layout Elements |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/app/analise` | `app/app/analise/page.tsx` | `AnaliseHubView.tsx` | `viewer` | Hub directing to executive analytics, metrics, and activity logs. | Analytics navigation grid |
| `/app/analise/alien-matrix` | `app/app/analise/alien-matrix/page.tsx` | `AnalyticsAndBillingViewClient.tsx` | `viewer` | **Executive Analytics & Billing**: Pipeline conversion, WhatsApp volume, AI vs human resolution, custom reports builder, and billing subscriptions. | Bento KPIs, conversion funnel charts, report generator tab, billing tier switcher |
| `/app/metrics` | `app/app/metrics/page.tsx` | `MetricsView.tsx` | `manager` | Sales and support team performance metrics and leaderboards. | Leaderboards, response time graphs |
| `/app/activities` | `app/app/activities/page.tsx` | `ActivitiesView.tsx` | `viewer` | Audit log of all actions performed within the tenant. | Timeline feed, user action filters |

### 3.5 Tenant Settings & Configuration (`/app/settings/*`)
| Path | Page File Path | Target Client Component | Min Role | Business Purpose | Key Layout Elements |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/app/settings` | `app/app/settings/page.tsx` | `SettingsHubView.tsx` | `viewer` | General organization settings overview hub. | Categorized settings grid |
| `/app/settings/alien-matrix` | `app/app/settings/alien-matrix/page.tsx`| `AlienMatrixAdminViewClient.tsx` | `admin` | **AlienMatrix Enterprise Settings**: Industry templates, custom object designer, global WhatsApp rules, and security controls. | Tabbed settings cards, schema manager, security switches |
| `/app/settings/tenant` | `app/app/settings/tenant/page.tsx` | `TenantSettingsView.tsx` | `admin` | Organization details, legal name, timezone, and fiscal data. | Organization profile form |
| `/app/settings/billing` | `app/app/settings/billing/page.tsx` | `BillingSettingsView.tsx` | `admin` | Subscription plan, Stripe/Asaas invoice history, payment method. | Plan badge, payment card details, upgrade button |
| `/app/settings/marca` | `app/app/settings/marca/page.tsx` | `BrandSettingsView.tsx` | `admin` | White-label branding: logo upload, accent color, and custom CSS. | Logo uploader, color picker, live preview |
| `/app/team` | `app/app/team/page.tsx` | `TeamView.tsx` | `admin` | Team members, invitation sender, and role assignments. | Members table, invite modal, role selector |
| `/app/settings/security` | `app/app/settings/security/page.tsx` | `SecuritySettingsView.tsx` | `viewer` | User password change, session revocation, and MFA enrollment. | 2FA toggle, QR code modal, active sessions list |
| `/app/settings/api-tokens` | `app/app/settings/api-tokens/page.tsx` | `ApiTokensView.tsx` | `admin` | API tokens for REST and MCP external integrations. | Token list, generate token dialog |
| `/app/lgpd/requests` | `app/app/lgpd/requests/page.tsx` | `LgpdRequestsView.tsx` | `admin` | Privacy and data export/erasure compliance requests. | Compliance requests table, export buttons |

---

## 4. Platform Superadmin Routes (`app/admin/*`)

Accessible only to users with `is_platform_admin: true` verified by `requirePlatformAdmin()`. Wrapped by `app/admin/layout.tsx`.

| Path | Page File Path | Target Client Component | Business Purpose | Key Layout Elements |
| :--- | :--- | :--- | :--- | :--- |
| `/admin` | `app/admin/(protected)/page.tsx` | `AdminDashboardView.tsx` | Cross-tenant metrics: active organizations, MRR, system load. | Platform summary metrics, health status |
| `/admin/alien-matrix` | `app/admin/(protected)/alien-matrix/page.tsx` | `SuperAdminViewClient.tsx` | **AlienMatrix SuperAdmin Console**: Global tenant management, plan provisioning, feature toggles, and white-label overrides. | Tenant table, quota editor modal, system feature toggles |
| `/admin/tenants` | `app/admin/(protected)/tenants/page.tsx` | `AdminTenantsView.tsx` | Comprehensive listing of all registered tenant organizations. | Filterable tenant directory, status pills |
| `/admin/tenants/new` | `app/admin/(protected)/tenants/new/page.tsx` | `AdminNewTenantView.tsx` | Manual tenant organization provisioning form. | Form fields, admin email, initial plan picker |
| `/admin/tenants/[id]` | `app/admin/(protected)/tenants/[id]/page.tsx` | `AdminTenantDetailView.tsx` | Deep inspection of specific tenant: members, usage, quotas. | Tenant summary, tabs (usage, members, settings) |
| `/admin/cobranca` | `app/admin/(protected)/cobranca/page.tsx` | `AdminBillingView.tsx` | Platform-level billing overview, gateways (Stripe/Asaas) status. | Revenue chart, delinquent tenant list |
| `/admin/marca` | `app/admin/(protected)/marca/page.tsx` | `AdminBrandView.tsx` | Platform root white-label branding, global logos, and domains. | Platform brand form, favicon uploader |
| `/admin/platform-admins` | `app/admin/(protected)/platform-admins/page.tsx` | `AdminAdminsView.tsx` | Management of platform superadmin users. | Superadmin user list, add superadmin modal |
| `/admin/sistema` | `app/admin/(protected)/sistema/page.tsx` | `AdminSystemView.tsx` | Infrastructure status: database connections, WAHA clusters, Redis. | Service status indicators, ping times |
| `/admin/audit` | `app/admin/(protected)/audit/page.tsx` | `AdminAuditView.tsx` | Global audit trail of all administrative and tenant actions. | High-volume audit table, filtering tools |
| `/admin/usage` | `app/admin/(protected)/usage/page.tsx` | `AdminUsageView.tsx` | AI token consumption and storage metrics across all tenants. | Usage graphs by tenant, quota alerts |
| `/admin/forbidden` | `app/admin/forbidden/page.tsx` | `AdminForbiddenView.tsx` | Error boundary page when non-superadmin attempts admin access. | 403 Forbidden alert card, return button |

---

## 5. API Endpoints Inventory (`app/api/v1/alien-matrix/*`)

AlienMatrix exposes 65 specialized REST endpoints that power modern CRM operations. All require strict Zod validation, role checking, trusted org extraction, and standard `ok()`/`fail()` response formatting:

```
/api/v1/alien-matrix/
├── activities/calls              # Call activity logs and duration tracking
├── ai/
│   ├── handoffs                  # Human handoff queue listing
│   ├── handoffs/[id]             # Resolve, claim, or dismiss handoff
│   ├── insights                  # AI generated sales suggestions
│   ├── insights/[id]/apply       # Apply insight to CRM record
│   ├── knowledge                 # Upload & index RAG documents
│   ├── knowledge/[id]            # Manage/delete knowledge source
│   ├── personas                  # Custom AI persona management
│   ├── personas/[id]             # Update persona prompt & capabilities
│   ├── settings                  # Tenant AI guardrails & model choices
│   └── usage                     # Token consumption metrics
├── analytics/
│   ├── dashboard                 # Pipeline and conversion analytics
│   ├── reports                   # Custom report templates
│   ├── reports/[id]              # Report execution & filtering
│   ├── reports/export            # CSV/JSON report data export
│   └── scheduled                 # Scheduled email report subscriptions
├── billing/
│   ├── limits                    # Current tier usage vs plan limits
│   ├── plans                     # Available subscription tiers
│   └── subscription              # Tenant subscription status & change
├── calendar                      # Team events and meeting CRUD
├── duplicates                    # Deduplication detection engine
├── duplicates/merge              # Record merge executor
├── export-all                    # Full tenant data export bundle
├── forms                         # Web lead capture forms
├── forms/[id]                    # Form definition & fields
├── forms/[id]/submit             # Public form submission receiver
├── import-export/
│   ├── export                    # Batch entity export
│   └── import                    # CSV bulk data import
├── invoices                      # Invoicing records CRUD
├── invoices/[id]                 # Invoice details & items
├── invoices/[id]/export          # Invoice PDF/CSV generation
├── leads/[id]/convert            # Convert Lead to Contact + Deal
├── objects                       # Custom Object Schemas
├── objects/[id]                  # Schema modification
├── objects/[id]/fields           # Custom Fields definition
├── objects/[id]/records          # Custom Entity records CRUD
├── objects/[id]/records/[recordId] # Record detail & update
├── objects/[id]/views            # Custom saved views (Kanban/Table)
├── products                      # Product catalog CRUD
├── products/[id]                 # Product pricing & inventory
├── roles                         # Custom RBAC role definitions
├── roles/[id]                    # Role permission toggles
├── security                      # Tenant security & session policies
├── templates                     # WhatsApp message templates
├── tenant-settings               # AlienMatrix tenant configurations
├── trash                         # Soft-deleted records bin
├── trash/[id]/restore            # Restore soft-deleted record
├── webhooks/inbound              # Inbound generic webhooks
├── webhooks/inbound/[token]      # Token-authenticated inbound hook
├── whatsapp/
│   ├── broadcasts                # WhatsApp broadcast campaigns
│   ├── broadcasts/[id]/start     # Dispatch broadcast run
│   ├── chatbots                  # Automated chat flow rules
│   ├── guardrails                # Pre-send message safety checks
│   ├── inbox                     # Flagship conversation listing
│   ├── inbox/[id]                # Conversation details & metadata
│   ├── inbox/[id]/messages       # Thread message history & send
│   ├── inbox/[id]/notes          # Internal private conversation notes
│   ├── links                     # Click-to-WhatsApp link generator
│   ├── numbers                   # Connected WAHA & Cloud numbers
│   └── numbers/[id]/reconnect    # Re-trigger pairing/QR code
└── workflows                     # Workflow automation rules
    ├── [id]                      # Workflow graph editor
    └── [id]/execute              # Manually trigger workflow run
```

---

## 6. Route Presentation Mapping Strategy

To ensure zero breakage while achieving visual identity parity with Rapport CRM:
1. **Master Shell**: Redesign `AppShell.tsx`, `Sidebar.tsx`, and `TopBar.tsx` to replicate Rapport's floating pill vertical dock, header bar, and warm cream mesh canvas background.
2. **Modular Views**: Re-skin `DealsViewClient.tsx`, `WhatsAppFlagshipViewClient.tsx`, `AnalyticsAndBillingViewClient.tsx`, and `AiLayerConsoleViewClient.tsx` using Rapport's signature large-radius bento cards (`--r-card: 26px`), clean typography, circular hairline control buttons, and translucent glass surfaces.
3. **Preserved Bindings**: All routes retain their exact URL structure, Next.js page paths, parameter conventions, role gates, and client data bindings.
