# AlienMatrix CRM — Complete A to Z Technical & Operational Documentation

> **Version:** 2.0.0 (Enterprise Generic Edition)  
> **Base Codebase:** DeskcommCRM (MIT License)  
> **Architecture:** Generic Multi-Tenant · WhatsApp-First · Native AI Agents · 100% English · Self-Hosted / Docker-Optional  
> **Target Audience:** Developers, System Administrators, DevOps Engineers, and Business Operators.

---

## Table of Contents

1. [Executive Overview & Vision](#1-executive-overview--vision)
2. [System Architecture & Technology Stack](#2-system-architecture--technology-stack)
3. [Multi-Tenancy & Security Doctrine](#3-multi-tenancy--security-doctrine)
4. [Comprehensive Module Guide (Phases 1 — 8)](#4-comprehensive-module-guide-phases-1--8)
   - [Phase 1: Generic Custom Objects Engine & Industry Packs](#phase-1-generic-custom-objects-engine--industry-packs)
   - [Phase 2: Core CRM Modules, Invoicing & Product Catalog](#phase-2-core-crm-modules-invoicing--product-catalog)
   - [Phase 3: Roles, Granular Security & Super-Admin Console](#phase-3-roles-granular-security--super-admin-console)
   - [Phase 4: Visual Workflows & Automation Engine](#phase-4-visual-workflows--automation-engine)
   - [Phase 5: WhatsApp Flagship Platform & Pre-Send Guardrails](#phase-5-whatsapp-flagship-platform--pre-send-guardrails)
   - [Phase 6: Advanced AI Intelligence Layer & RAG Knowledge Base](#phase-6-advanced-ai-intelligence-layer--rag-knowledge-base)
   - [Phase 7: Executive Analytics, Custom Reports & Tiered Billing](#phase-7-executive-analytics-custom-reports--tiered-billing)
   - [Phase 8: Global English Localization & Zero-Docker Architecture](#phase-8-global-english-localization--zero-docker-architecture)
5. [Database Schema & Migrations Reference](#5-database-schema--migrations-reference)
6. [REST API Reference & Endpoints Catalog](#6-rest-api-reference--endpoints-catalog)
7. [Installation, Setup & Deployment Guide](#7-installation-setup--deployment-guide)
8. [Operations Playbook & User Manual](#8-operations-playbook--user-manual)
9. [Developer Guide & Upstream Merge Doctrine](#9-developer-guide--upstream-merge-doctrine)

---

## 1. Executive Overview & Vision

**AlienMatrix CRM** is an enterprise-grade generic multi-tenant CRM evolved from the open-source DeskcommCRM foundation. While Deskcomm focused on specific market segments, AlienMatrix expands the platform into a generic customer relationship operating system that any company in any industry can adapt to its exact business model (Real Estate, Healthcare/Clinics, Education/Schools, B2B Professional Services, Retail, and E-Commerce).

### Core Pillars

1. **Generic Custom Objects Model:** Rather than forcing businesses into rigid tables, AlienMatrix provides a dynamic Custom Objects Engine where organizations can create arbitrary entities (e.g., Plots, Properties, Students, Patients, Vehicles, Contracts) with custom field types, relationships, dynamic views, and spreadsheet-style inline editing.
2. **WhatsApp as Primary Channel:** WhatsApp is not a secondary add-on; it is the core conversational gateway. Supports multi-number management, session health monitoring, QR code connect via WAHA NOWEB, and Meta's Official WhatsApp Cloud API.
3. **Native AI Sales Agents:** Autonomous AI agents capable of holding multi-turn conversations, answering questions from tenant RAG knowledge bases, qualifying leads, calculating purchase scores (0-100), triggering tools (creating deals, moving pipeline stages, scheduling meetings, drafting quotes), and performing intelligent handoffs to human reps.
4. **Safety & Compliance (7 Guardrails & LGPD/GDPR):** All outbound automated messages are evaluated against 7 pre-send safety guardrails (opt-out compliance, privacy verification, anti-ban pacing, 24-hour messaging window, text spinning, semantic promise verification, and virtual assistant disclosure).
5. **Self-Host & Docker-Optional Native Execution:** Distributed as complete code under the MIT License. Runs natively with Node.js and pnpm with zero Docker daemon requirements, while also supporting production Docker Compose / VPS deployments.
6. **100% English Global Localization:** Clean, unified English interface with over 10,392 cataloged translation keys, standardized `en-US` date formatting, and USD (`$`) currency displays.

---

## 2. System Architecture & Technology Stack

AlienMatrix CRM combines a Next.js 16 App Router frontend with a Supabase PostgreSQL backend, edge middleware authentication, and background event-driven workers.

```mermaid
flowchart TD
    subgraph Client["Browser & Client Applications"]
        UI["Next.js 16 UI (React 19, Tailwind 4, shadcn/ui)"]
        Forms["Public Embeddable Lead Forms"]
        WA_App["WhatsApp Mobile / Web Users"]
    end

    subgraph Edge["Edge & Middleware Routing"]
        Proxy["proxy.ts: Middleware (X-Request-Id, Auth, Impersonation)"]
    end

    subgraph AppServer["Application Server (Next.js App Router)"]
        AppRoutes["Page Routes (/app/*, /admin/*)"]
        API["REST Route Handlers (/api/v1/alien-matrix/*)"]
        DualAuth["Dual-Auth Guard (Cookie / Bearer Token)"]
        AI_Gateway["Vercel AI SDK Gateway (Claude, GPT, Gemini, Groq)"]
        WorkflowEngine["Visual Workflow Engine (Triggers & Actions)"]
    end

    subgraph Gateway["Communication Gateways"]
        WAHA["WAHA NOWEB Engine (QR Connect)"]
        MetaCloud["Meta WhatsApp Cloud API"]
    end

    subgraph Workers["Background Tasks & Event Processing"]
        Worker["Event Worker (tsx native / Docker)"]
        Cron["Scheduled Crons & Follow-up Timers"]
    end

    subgraph Database["Supabase PostgreSQL 15+"]
        RLS["Row Level Security (fn_user_org_ids)"]
        CoreTables["Tenants, Users, Custom Objects, Leads, Deals"]
        AuditLog["Immutable Audit Events Trail"]
        Storage["Private S3 Storage (whatsapp-media)"]
    end

    UI --> Proxy
    Forms --> API
    Proxy --> AppRoutes
    Proxy --> API
    API --> DualAuth
    DualAuth --> Database
    API --> AI_Gateway
    API --> WorkflowEngine
    WA_App <--> WAHA
    WA_App <--> MetaCloud
    WAHA --> API
    MetaCloud --> API
    Worker --> Database
    Cron --> API
```

### Canonical Tech Stack

| Layer | Technology | Specification / Role |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server Components default; `"use client"` for interactive state; Turbopack engine |
| **Language** | TypeScript 5.9+ / Node 22 | Strict typing (`noUncheckedIndexedAccess`, `strict: true`) |
| **UI Styling** | Tailwind CSS 4 + shadcn/ui | Configuration in CSS (`app/globals.css`), `new-york` variant, Phosphor Icons |
| **Database** | Supabase PostgreSQL 15+ | Multi-tenant RLS policies, migrations in `supabase/migrations/` |
| **Authentication** | Supabase Auth + `@supabase/ssr` | Cookie `SameSite=Strict`, `getUser()` verification on server, MFA TOTP |
| **AI Gateway** | Vercel AI SDK (`@ai-sdk/*`) | Anthropic Claude 3.5 Sonnet, OpenAI GPT-4o, Google Gemini 2.5, Groq, Ollama |
| **WhatsApp Gateways**| WAHA NOWEB + Meta Cloud API | Dual-provider support per number; webhook event ingestion |
| **Validation** | Zod 4 | Strict input validation on external request bodies, queries, and headers |
| **Testing** | Vitest 4 + Playwright 1 | Unit tests (`tests/unit/`), invariant tests, end-to-end visual tests |

---

## 3. Multi-Tenancy & Security Doctrine

Every entity in AlienMatrix CRM is strictly isolated by tenant identity.

### 1. Row-Level Security (RLS) Enforcement
Every tenant-aware table includes:
```sql
organization_id uuid not null references public.organizations(id) on delete cascade
```
RLS is enabled on every table with policies enforcing:
```sql
create policy "tenant_isolation_select" on public.custom_objects
  for select using (organization_id in (select fn_user_org_ids()));

create policy "tenant_isolation_all" on public.custom_objects
  for all using (organization_id in (select fn_user_org_ids()))
  with check (organization_id in (select fn_user_org_ids()));
```
The helper function `fn_user_org_ids()` runs with `SECURITY DEFINER` and retrieves the list of organizations the authenticated user belongs to.

### 2. Service Role & Admin Access Safety
When service role clients (`lib/supabase/admin.ts`) bypass RLS, handlers are strictly required to filter `organization_id` manually from trusted server session context—**never** from user request bodies.

### 3. Canonical Route Handler Pattern
Every API route follows this deterministic 6-step lifecycle:
1. **Zod Validation:** Validate all incoming parameters (body, query, path).
2. **Canonical Role Guard:** Verify permissions via `requireRole("manager", { requestId })` or `requirePlatformAdmin()`.
3. **Trusted Org Resolution:** Retrieve `organization_id` from verified session tokens.
4. **Tenant Scoped Query:** Execute query constrained by tenant identity.
5. **Audit Logging:** Invoke `audit()` for every mutating action (create, update, delete).
6. **Standardized Response:** Return via `ok(data)` or `fail(code, message, status)`.

---

## 4. Comprehensive Module Guide (Phases 1 — 8)

### Phase 1: Generic Custom Objects Engine & Industry Packs

The Custom Objects Engine allows organizations to model arbitrary domain entities beyond standard leads and contacts.

- **Data Tables:**
  - `custom_objects`: Defines custom entity types (`slug`, `name`, `singular_name`, `plural_name`, `icon`, `primary_field_slug`, `settings`).
  - `custom_fields`: Defines attributes for an entity (`field_type`, `label`, `is_required`, `is_unique`, `default_value`, `options`, `validation_rules`, `position`).
  - `custom_records`: Stores individual record data with structured JSONB values (`values`), full-text search indexing, and soft delete tracking.
  - `custom_relations`: Defines one-to-many and many-to-many relationships between custom objects.
- **15 Supported Field Types:**
  `text`, `long_text`, `number`, `currency`, `date`, `datetime`, `boolean`, `select`, `multi_select`, `email`, `phone`, `url`, `file`, `relation`, `user`.
- **Dynamic Interactive Views:**
  - **Spreadsheet Table View:** Inline editable cell grid with instant auto-save, column visibility toggles, and multi-row selection.
  - **Kanban Board View:** Drag-and-drop cards between select/status stages with column value aggregations.
  - **Record Drawer View:** Detailed side-panel displaying record fields, related objects, timeline activity, and edit actions.
  - **Dynamic Form Modal:** Automatically generates responsive forms based on field type definitions with real-time validation.
- **5 One-Click Industry Packs:**
  - **Real Estate:** Properties / Listings, Plots, Inquiries, Property Owners.
  - **Healthcare & Clinics:** Patients, Appointments, Medical Records, Prescriptions.
  - **Education & Schools:** Students, Courses, Batches, Enrollments, Fee Schedules.
  - **Agencies & Services:** Clients, Projects, Retainers, Milestones, Deliverables.
  - **Retail & Distribution:** Products, Warehouses, Inventory Lots, Supplier Orders.
- **UI Route:** [`/app/objects`](file:///d:/1%20Softwares/DeskcommCRM/app/app/objects/page.tsx)

---

### Phase 2: Core CRM Modules, Invoicing & Product Catalog

Extends the sales pipeline with comprehensive lead tracking, deal stages, price lists, quotations, and invoicing.

- **Lead to Deal Conversion Pipeline:**
  - Single-click lead qualification that converts raw leads into linked Contacts, Companies, and Deals with historical attribution preserved.
- **Multiple Sales Pipelines:**
  - Unlimited configurable pipelines per tenant with custom stage sequences, win probabilities (0-100%), and win/loss reason categorization.
- **Quotes, Proposals & Invoices:**
  - Structured billing documents with line-item management, tax calculations, discounts, payment status tracking (`draft`, `sent`, `paid`, `overdue`, `cancelled`).
  - Native client-side SVG/PDF document rendering and instant download.
- **Products & Price Lists:**
  - Product catalog (`crm_products`) with SKU codes, unit costs, retail prices, tax rates, and inventory stock tracking.
  - Tiered price lists (`crm_price_lists`, `crm_price_list_items`) for wholesale, retail, and promotional rates.
- **Tasks, Meetings & Calendar View:**
  - Operational scheduling with task priorities (`low`, `medium`, `high`, `urgent`), due dates, assignee filters, and interactive calendar day/week/month views.
- **Universal Attachments & Call Logs:**
  - Direct file upload linking to records, and call activity tracking with duration, recording URLs, and outcome summaries.
- **Bulk CSV Import/Export:**
  - Column-mapping CSV import engine with duplicate prevention and one-click data export.
- **UI Routes:**
  - Deals Pipeline: [`/app/crm/deals`](file:///d:/1%20Softwares/DeskcommCRM/app/app/crm/deals/page.tsx)
  - Invoices & Quotes: [`/app/crm/invoices`](file:///d:/1%20Softwares/DeskcommCRM/app/app/crm/invoices/page.tsx)
  - Products & Price Lists: [`/app/crm/products`](file:///d:/1%20Softwares/DeskcommCRM/app/app/crm/products/page.tsx)
  - Calendar & Activities: [`/app/crm/calendar`](file:///d:/1%20Softwares/DeskcommCRM/app/app/crm/calendar/page.tsx)

---

### Phase 3: Roles, Granular Security & Super-Admin Console

Enterprise governance, identity management, and platform administration.

- **Granular Role-Based Access Control (RBAC):**
  - Canonical system roles: `owner`, `admin`, `manager`, `agent`, `viewer`.
  - Custom roles engine (`crm_custom_roles`, `crm_role_assignments`) allowing arbitrary permission sets.
  - Object-level permissions (`can_read`, `can_write`, `can_delete`, `can_export`).
  - Field-level security (`hidden`, `read_only`, `editable`).
- **Enterprise Security & SSO:**
  - Multi-factor authentication (MFA TOTP) policy enforcement per tenant.
  - Single Sign-On (SSO) configuration for Google Workspace, Microsoft Azure AD / Entra ID, and generic SAML 2.0 / OIDC.
  - Allowed IP range whitelisting and configurable session timeouts.
- **Soft Delete & Recycle Bin:**
  - `crm_soft_deletes` tracks deleted entities across all modules, allowing instant record restoration or permanent purge by administrators.
- **Full Immutable Audit Trail:**
  - `audit_events` logs all tenant mutations with actor ID, IP address, user agent, before/after diffs, and correlated `X-Request-Id`.
- **Super-Admin Platform Console:**
  - Dedicated console for instance owners to view total tenants, active users, subscription tier distribution, system health, and database size.
- **UI Routes:**
  - Super-Admin Console: [`/admin/alien-matrix`](file:///d:/1%20Softwares/DeskcommCRM/app/admin/%28protected%29/alien-matrix/page.tsx)
  - Tenant Security Settings: [`/app/settings/alien-matrix`](file:///d:/1%20Softwares/DeskcommCRM/app/app/settings/alien-matrix/page.tsx)

---

### Phase 4: Visual Workflows & Automation Engine

Node-based workflow automation enabling complex trigger-condition-action sequences without code.

- **Triggers:**
  - `record_created`: Triggers when any custom object, lead, contact, or deal is created.
  - `record_updated`: Triggers when specific fields change value.
  - `stage_changed`: Triggers when a deal or lead changes pipeline stage.
  - `message_received`: Triggers on incoming WhatsApp or chat message.
  - `webhook_received`: Triggers on external HTTP POST to dedicated webhook endpoints.
  - `cron_scheduled`: Time-based recurring or delayed schedule execution.
- **Conditional Branching:**
  - Multi-rule condition evaluation (`equals`, `not_equals`, `contains`, `greater_than`, `less_than`, `is_empty`, `is_not_empty`) with logical `AND` / `OR` grouping.
- **Automated Actions:**
  - `send_whatsapp`: Dispatches templated or dynamic WhatsApp messages to contacts.
  - `send_email`: Sends transactional emails via Resend or SMTP.
  - `create_task`: Automatically assigns operational tasks with due dates to team members.
  - `update_field`: Mutates field values on the triggering or related record.
  - `call_webhook`: Dispatches outbound HTTP POST with cryptographic HMAC signature.
  - `run_ai_agent`: Executes an autonomous AI turn to analyze conversation or draft a response.
- **Inbound & Outbound Webhooks:**
  - Token-based inbound webhook endpoints (`/api/v1/alien-matrix/webhooks`) for Zapier, Make, and n8n integrations.
  - Delivery logging with duration, payload inspection, and retry policies.
- **Public Lead Capture Forms:**
  - Embeddable web forms (`crm_lead_forms`) with shareable direct URLs, customizable fields, and automatic pipeline routing.
- **UI Route:** [`/app/crm/workflows`](file:///d:/1%20Softwares/DeskcommCRM/app/app/crm/workflows/page.tsx)

---

### Phase 5: WhatsApp Flagship Platform & Pre-Send Guardrails

The primary customer engagement engine, engineered for reliability, team collaboration, and anti-ban safety.

- **Multi-Number Architecture:**
  - Connect and manage multiple phone numbers per tenant with independent session states (`connected`, `qr_ready`, `disconnected`, `reconnecting`).
  - Automated session health monitoring with battery telemetry and auto-reconnect logic.
- **Dual Gateway Engine:**
  - **WAHA NOWEB:** Connect any personal or business WhatsApp number via QR code without Meta business verification.
  - **Meta Cloud API:** Direct connection to Meta's Official WhatsApp Cloud API for verified accounts with high-throughput template messaging.
- **Shared Team Inbox:**
  - Real-time conversation assignment to sales reps.
  - Private internal team notes with `@mentions` directly inside conversation threads.
  - Conversation categorization with custom color tags, priority flags, and snooze controls.
  - SLA breach warnings and response time timers.
- **Rich Multimedia Messaging:**
  - Full support for inbound and outbound images, videos, audio voice notes (PTT), documents (PDF/DOCX), location pins, vCards, and quick reply buttons.
- **Anti-Ban Smart Broadcast Engine:**
  - Segmented mass messaging with intelligent rate-limiting.
  - Randomized jitter delays (5 to 15 seconds) between dispatches to mimic natural human typing cadence.
  - Automated opt-out tracking: stops dispatches if a contact sends "STOP" or "SAIR".
- **The 7 Configurable Pre-Send Guardrails:**
  1. *Opt-Out Compliance:* Blocks dispatch if the contact requested to stop receiving messages.
  2. *Privacy (LGPD/GDPR):* Blocks messaging to anonymized or consent-revoked contacts.
  3. *Anti-Ban Pacing:* Enforces hourly rate caps per number.
  4. *24-Hour Messaging Window:* Prevents free-form messaging outside Meta's 24-hour service window.
  5. *Text Spinning:* Automatically varies greetings and sentence structures across broadcast batches.
  6. *Semantic Promise Audit:* Blocks AI responses that promise prices or dates conflicting with approved price sheets.
  7. *Virtual Assistant Disclosure:* Enforces clear disclosure that the customer is communicating with an AI assistant.
  - Guardrails can be toggled or tuned per tenant via `crm_tenant_guardrails`.
- **UI Route:** [`/app/channels/whatsapp`](file:///d:/1%20Softwares/DeskcommCRM/app/app/channels/whatsapp/page.tsx)

---

### Phase 6: Advanced AI Intelligence Layer & RAG Knowledge Base

Transforms customer communications with autonomous, grounded AI capabilities.

- **Multi-Provider AI Gateway:**
  - Tenant-level configuration and encrypted storage of API keys for:
    - **Anthropic:** Claude 3.5 Sonnet (primary complex model), Claude 3.5 Haiku (fast model)
    - **OpenAI:** GPT-4o, GPT-4o-mini, text-embedding-3-small
    - **Google:** Gemini 2.5 Flash, Gemini 2.5 Pro
    - **Groq & Ollama:** Ultra-low latency open-source models (Llama 3.3 70B)
- **Agent Personas:**
  - Create specialized agent personas (`crm_agent_personas`) with dedicated roles (e.g., SDR, Senior Real Estate Consultant, Technical Triage).
  - Configurable tone of voice (`consultative`, `friendly`, `executive`, `direct`).
  - Custom system instructions and personalized greeting messages.
- **Tenant RAG Knowledge Base:**
  - Ingest product manuals, PDFs, website URLs, and FAQs into `crm_knowledge_items`.
  - Semantic vector search matches incoming customer questions to verified organization reference material, eliminating hallucinations.
- **Predictive Lead Scoring & Sentiment Analysis:**
  - Evaluates conversation turns in real-time to compute purchase intent scores (0-100), temperature (`hot`, `warm`, `cold`), and customer sentiment (`positive`, `neutral`, `negative`, `urgent`).
  - Suggests next-best actions (e.g., "Schedule demo", "Send quotation", "Escalate to human manager").
- **Automatic Field Extraction (Auto-Fill):**
  - Parses conversation transcripts to automatically extract and populate contact fields (email, address, budget, timeframe, preferred product).
- **Token Budget & Telemetry Tracking:**
  - Enforces daily and monthly token and cost limits per tenant (`crm_tenant_ai_settings`).
  - Hard stops prevent unexpected billing spikes.
- **Intelligent Human Escalation:**
  - Detects complex queries, angry customers, or explicit human requests.
  - Automatically freezes AI turns, tags conversation as `awaiting_human`, and generates a structured handoff briefing summarizing customer intent and key data points.
- **UI Route:** [`/app/ai/alien-matrix`](file:///d:/1%20Softwares/DeskcommCRM/app/app/ai/alien-matrix/page.tsx)

---

### Phase 7: Executive Analytics, Custom Reports & Tiered Billing

Data visualization, operational telemetry, and subscription management.

- **Executive Revenue Dashboard:**
  - **Total Pipeline Value:** Aggregated valuation of all active deals in progress.
  - **Weighted Forecast:** Mathematically weighted deal value multiplied by stage conversion probability.
  - **Overall Win Rate:** Ratio of won vs lost deals.
  - **Average First Response Time:** Operational speed metric tracking initial response duration.
  - **Stage Conversion Funnel:** Visual drop-off analysis showing progression through every pipeline stage.
  - **Lead Source Attribution:** Acquisition channel breakdown (WhatsApp Ads, Website, Referrals, Organic).
  - **Sales Rep & AI Leaderboard:** Performance ranking by deals closed, win rate, and total revenue.
- **Operational WhatsApp & AI Telemetry:**
  - Inbound vs outbound message volume tracking.
  - Autonomous AI resolution rate (% of conversations resolved without human intervention).
  - Average full resolution time.
- **Custom Report Builder:**
  - Generate ad-hoc reports (`sales_funnel`, `whatsapp_performance`, `rep_leaderboard`, `revenue_forecast`, `ai_resolution`).
  - One-click dataset export to CSV.
- **Automated Scheduled Email Deliveries:**
  - Schedule recurring dispatches of executive summaries (Daily at 08:00 AM, Weekly on Mondays, Monthly on the 1st) in PDF or CSV formats directly to stakeholder emails.
- **Subscription Billing & Tiered Plans:**
  - Three standardized pricing tiers configured in `crm_billing_plans`:
    - **Starter Plan:** $49/mo (3 seats, 1 WhatsApp number, 5 custom objects)
    - **Professional Plan:** $149/mo (10 seats, 3 WhatsApp numbers, 20 custom objects, full AI & Workflows)
    - **Enterprise Plan:** $399/mo (Unlimited seats, 10 WhatsApp numbers, unlimited objects, priority SLA)
  - Dual payment provider integration: Stripe for international credit cards, plus local payment options.
  - Monthly and Annual billing cycles (with automated -17% annual discount calculation).
  - Tenant usage limits monitor tracking seats, phone numbers, and custom objects against plan quotas.
- **UI Route:** [`/app/analise/alien-matrix`](file:///d:/1%20Softwares/DeskcommCRM/app/app/analise/alien-matrix/page.tsx)

---

### Phase 8: Global English Localization & Zero-Docker Architecture

Complete internationalization polish and operational independence.

- **100% English Language Enforcement:**
  - English is established as the sole default and registered system language in `lib/i18n/registro.ts` and `lib/i18n/idiomas.ts`.
  - Root layout configured with `<html lang="en">`.
  - The language switcher dropdown in `SeletorDeIdioma.tsx` is automatically hidden when a single active language is configured.
  - Standardized all UI components to use `en-US` date formats and USD (`$`) currency displays.
- **Universal 10,392-Key Translation Catalog:**
  - `lib/i18n/traducoes/en.json` contains **10,392 verified translation keys**, covering every single interface string, notification, button, validation error, and dialog across the entire codebase.
  - `lib/i18n/dicionario.ts` resolves every Portuguese UI key directly into clean English with zero fallback leakage.
- **Direct English Component Typography:**
  - All AlienMatrix components (`components/alien-matrix/*`) are written natively in English, eliminating translation overhead.
- **Zero-Docker Native Execution:**
  - The application server, development environment, and background workers run natively via Node.js and pnpm with zero Docker daemon requirements.
  - Docker Compose remains fully supported for self-hosting production deployments on VPS instances.

---

## 5. Database Schema & Migrations Reference

All AlienMatrix database migrations are versioned under `supabase/migrations/` and appended idempotently to `supabase/baseline.sql`:

| Migration File | Phase | Key Tables Created | Purpose |
|---|---|---|---|
| `20261022080000_0704_alienmatrix_custom_objects_engine.sql` | Phase 1 | `custom_objects`<br>`custom_fields`<br>`custom_records`<br>`custom_relations` | Custom objects engine, JSONB attributes, field definitions, and relations. |
| `20261022090000_0705_alienmatrix_core_crm_modules.sql` | Phase 2 | `crm_products`<br>`crm_price_lists`<br>`crm_price_list_items`<br>`crm_invoices`<br>`crm_invoice_items`<br>`crm_tasks`<br>`crm_call_logs`<br>`crm_attachments` | Product catalog, price lists, quotations, invoicing, task scheduling, and call logs. |
| `20261022100000_0706_alienmatrix_roles_security_admin.sql` | Phase 3 | `crm_custom_roles`<br>`crm_role_assignments`<br>`crm_security_settings`<br>`crm_soft_deletes`<br>`crm_tenant_settings` | Granular custom roles, enterprise SSO/2FA security, recycle bin, and tenant branding. |
| `20261022110000_0707_alienmatrix_automation_and_workflows.sql` | Phase 4 | `crm_workflows`<br>`crm_workflow_executions`<br>`crm_lead_forms`<br>`crm_inbound_webhooks` | Visual workflow builder, execution logs, public embeddable lead forms, and webhooks. |
| `20261022130000_0708_alienmatrix_whatsapp_flagship.sql` | Phase 5 | `crm_whatsapp_numbers`<br>`crm_whatsapp_conversations`<br>`crm_whatsapp_messages`<br>`crm_whatsapp_internal_notes`<br>`crm_whatsapp_broadcasts`<br>`crm_tenant_guardrails` | Multi-number WhatsApp sessions, shared team inbox, broadcast campaigns, and 7 guardrails. |
| `20261022140000_0709_alienmatrix_ai_layer_upgrade.sql` | Phase 6 | `crm_tenant_ai_settings`<br>`crm_agent_personas`<br>`crm_knowledge_items`<br>`crm_lead_scores`<br>`crm_ai_insights`<br>`crm_ai_handoff_logs`<br>`crm_ai_usage_logs` | Multi-provider AI settings, agent personas, RAG knowledge base, scoring, and handoffs. |
| `20261022150000_0710_alienmatrix_analytics_and_billing.sql` | Phase 7 | `crm_analytics_reports`<br>`crm_scheduled_reports`<br>`crm_billing_plans`<br>`crm_tenant_subscriptions` | Custom analytics reports, recurring email deliveries, billing tiers, and subscriptions. |

---

## 6. REST API Reference & Endpoints Catalog

All AlienMatrix REST endpoints are versioned under `/api/v1/alien-matrix/` and follow canonical JSON responses:
```json
{ "data": { ... }, "error": null }
```
or on error:
```json
{ "data": null, "error": { "code": "NOT_FOUND", "message": "Record not found" } }
```

### Endpoints Inventory

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/alien-matrix/custom-objects` | Lists all custom objects for active tenant | Cookie / Bearer |
| `POST` | `/api/v1/alien-matrix/custom-objects` | Creates a new custom object definition | Manager+ |
| `GET` | `/api/v1/alien-matrix/custom-objects/[slug]/records` | Queries records of a custom object with pagination | Cookie / Bearer |
| `POST` | `/api/v1/alien-matrix/custom-objects/[slug]/records` | Inserts a new record into a custom object | Agent+ |
| `GET` | `/api/v1/alien-matrix/leads` | Lists all leads with score and stage | Agent+ |
| `POST` | `/api/v1/alien-matrix/leads/convert` | Converts a lead into Contact, Company & Deal | Agent+ |
| `GET` | `/api/v1/alien-matrix/deals` | Retrieves deals grouped by pipeline stages | Agent+ |
| `POST` | `/api/v1/alien-matrix/invoices` | Creates a new quote or invoice with line items | Agent+ |
| `GET` | `/api/v1/alien-matrix/invoices/[id]/pdf` | Generates and exports client-ready PDF invoice | Agent+ |
| `GET` | `/api/v1/alien-matrix/workflows` | Lists visual automation workflows | Manager+ |
| `POST` | `/api/v1/alien-matrix/workflows` | Creates or updates a workflow structure | Manager+ |
| `POST` | `/api/v1/alien-matrix/webhooks/[token]` | Public inbound webhook receiver for third-party events | Webhook Token |
| `GET` | `/api/v1/alien-matrix/whatsapp/numbers` | Lists connected WhatsApp numbers and session health | Agent+ |
| `POST` | `/api/v1/alien-matrix/whatsapp/numbers` | Connects a new number (WAHA session or Cloud API) | Manager+ |
| `POST` | `/api/v1/alien-matrix/whatsapp/broadcasts` | Launches a rate-limited anti-ban broadcast campaign | Manager+ |
| `PUT` | `/api/v1/alien-matrix/whatsapp/guardrails` | Configures tenant-level safety guardrails | Manager+ |
| `GET` | `/api/v1/alien-matrix/ai/settings` | Retrieves multi-provider AI model configurations | Admin+ |
| `PUT` | `/api/v1/alien-matrix/ai/settings` | Updates active AI provider, model keys, and budget | Admin+ |
| `GET` | `/api/v1/alien-matrix/ai/personas` | Lists agent personas | Agent+ |
| `POST` | `/api/v1/alien-matrix/ai/rag/documents` | Ingests new reference document or URL into RAG base | Manager+ |
| `GET` | `/api/v1/alien-matrix/analytics/dashboard` | Returns full executive dashboard metrics & KPIs | Agent+ |
| `POST` | `/api/v1/alien-matrix/analytics/reports` | Saves a custom analytics report configuration | Manager+ |
| `GET` | `/api/v1/alien-matrix/analytics/reports/export` | Downloads raw CSV dataset for specified metric | Agent+ |
| `POST` | `/api/v1/alien-matrix/analytics/scheduled` | Configures recurring automated email report delivery | Manager+ |
| `GET` | `/api/v1/alien-matrix/billing/plans` | Lists available subscription plans and pricing | Public / Authenticated |
| `PUT` | `/api/v1/alien-matrix/billing/subscription` | Changes tenant subscription tier and payment method | Owner / Admin |

---

## 7. Installation, Setup & Deployment Guide

### Prerequisites
- **Node.js:** Version ≥ 22.0.0
- **Package Manager:** `pnpm` Version ≥ 9.15.9
- **Database:** Supabase project or PostgreSQL 15+ with pgvector

### Native Development Setup (No Docker Required)

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/melgarafael/DeskcommCRM.git alienmatrix-crm
   cd alienmatrix-crm
   ```

2. **Install Dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure Environment Variables:**
   Create `.env.local` based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Ensure the following essential keys are configured:
   ```ini
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   SUPABASE_DB_URL=postgresql://postgres.your-project:password@aws-0-region.pooler.supabase.com:6543/postgres?sslmode=require
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_ADMIN_URL=http://localhost:3000
   INTERNAL_SECRET=your-random-32-char-secret
   INTERNAL_CRON_SECRET=your-random-cron-secret
   ```

4. **Verify Database Schema:**
   Run the verification audit script to test database connectivity:
   ```bash
   node scripts/verify_all_phases.mjs
   ```

5. **Start Development Server:**
   ```bash
   pnpm dev
   ```
   Open `http://localhost:3000` in your web browser.

6. **Start Background Event Worker (Optional for local queues):**
   ```bash
   pnpm worker
   ```

---

### Production Self-Hosting on VPS (Docker Compose)

For production deployment on an Ubuntu VPS (HostGator, Hetzner, DigitalOcean, AWS):

1. **Topological Architecture:**
   - `app`: Production Next.js container running on port 3000.
   - `waha`: WhatsApp HTTP API container (engine NOWEB) on port 3008.
   - `redis`: In-memory queue and rate-limiting store on port 6379.
   - `caddy` / `traefik`: Automatic SSL reverse proxy managing HTTPS certificates.

2. **Deploy Commands:**
   ```bash
   # Clone repository on VPS
   git clone https://github.com/melgarafael/DeskcommCRM.git /opt/alienmatrix
   cd /opt/alienmatrix

   # Set permissions
   chmod +x hostgator-setup-kit/*.sh

   # Run automated setup
   bash hostgator-setup-kit/install.sh
   ```

---

## 8. Operations Playbook & User Manual

### Day-to-Day User Workflows

#### 1. How to Model a New Business Niche with Custom Objects
1. Navigate to **Custom Objects** (`/app/objects`).
2. Click **Install Industry Pack** to select a pre-configured template (e.g., Real Estate or Clinic), or click **Create Object** to build an entity from scratch.
3. Define the Object Name (e.g., `Listing`), Plural Name (`Listings`), and Icon.
4. Click **Add Field** to specify custom fields (e.g., `Price` as Currency, `Bedrooms` as Number, `Status` as Select).
5. Switch between **Table View** (for mass spreadsheet data entry) and **Kanban View** (for tracking progression).

#### 2. How to Connect a WhatsApp Phone Number
1. Navigate to **WhatsApp Channels** (`/app/channels/whatsapp`).
2. Click **Connect Number**.
3. Select the provider:
   - For **WAHA:** Click **Start Session**, open WhatsApp on your phone, go to **Linked Devices > Link a Device**, and scan the displayed QR code.
   - For **Meta Cloud API:** Enter your Phone Number, Phone Number ID, and permanent Meta System User Access Token.
4. Once connected, incoming chats automatically appear in the **Shared Team Inbox**.

#### 3. How to Configure an Autonomous AI Agent Persona
1. Navigate to **AI Console** (`/app/ai/alien-matrix`).
2. Go to **Providers & Models** and enter your API key for Anthropic Claude or OpenAI GPT-4o.
3. Switch to the **Personas** tab and click **Create Persona**.
4. Define the persona name (e.g., `Senior Sales Advisor`), select the Tone (`Consultative`), and input System Prompt guidelines.
5. Switch to the **Knowledge Base** tab and upload your product catalog PDF or add FAQ pairs. The agent will now answer customer queries using real company data.

#### 4. How to Create an Automated Lead Qualification Workflow
1. Navigate to **Workflows** (`/app/crm/workflows`).
2. Click **New Workflow**.
3. Set Trigger to `record_created` with Entity `Lead`.
4. Add a Condition: `lead_score > 70`.
5. Add Actions:
   - Action 1: `send_whatsapp` (Send meeting booking invitation).
   - Action 2: `create_task` (Assign high-priority call task to senior sales rep).
6. Click **Activate Workflow**.

---

## 9. Developer Guide & Upstream Merge Doctrine

To allow clean, conflict-free merges when upstream DeskcommCRM releases new updates, AlienMatrix strictly isolates new features in modular directories:

### Directory Architecture

```text
alienmatrix-crm/
├── app/
│   ├── admin/(protected)/alien-matrix/  --> Super-Admin Console
│   ├── app/
│   │   ├── ai/alien-matrix/             --> AI Layer Console
│   │   ├── analise/alien-matrix/        --> Executive Analytics & Billing
│   │   ├── channels/whatsapp/           --> WhatsApp Flagship & Guardrails
│   │   ├── crm/
│   │   │   ├── calendar/                --> Scheduled Tasks & Calendar
│   │   │   ├── deals/                   --> Core CRM Pipeline
│   │   │   ├── invoices/                --> Proposals & Invoicing
│   │   │   ├── products/                --> Product Catalog
│   │   │   └── workflows/               --> Visual Workflows Builder
│   │   ├── objects/                     --> Custom Objects Engine Views
│   │   └── settings/alien-matrix/       --> Tenant Settings & Security
│   └── api/v1/alien-matrix/             --> All AlienMatrix REST Endpoints
├── components/alien-matrix/             --> Pure React 19 Client Components
├── lib/alien-matrix/                    --> Business Logic & Service Layers
├── supabase/migrations/
│   ├── 0001_... to 0703_...             --> Deskcomm Original Migrations
│   ├── 0704_... to 0710_...             --> AlienMatrix Additive Migrations
│   └── baseline.sql                     --> Idempotent Self-Host Baseline
└── tests/unit/alien-matrix*.test.ts     --> AlienMatrix Automated Test Suite
```

### Merging Upstream Deskcomm Updates
When pulling updates from `upstream/main`:
```bash
git fetch upstream
git merge upstream/main --no-commit
```
Because all AlienMatrix additions live in dedicated `alien-matrix/` directories and additive migrations (`0704` to `0710`), upstream changes to core engine files merge cleanly without destructive collisions.

---

## 10. Verification & Quality Assurance

AlienMatrix includes an automated full-system verification audit script that validates the database schema, all active tables, all 8 development phases, translation catalogs, and live HTTP routes:

```bash
node scripts/verify_all_phases.mjs
```

### Audit Status
- **Phase 1 (Custom Objects):** `custom_objects`, `custom_fields`, `custom_records` — **PASS**
- **Phase 2 (Core CRM & Invoices):** `crm_products`, `crm_invoices`, `crm_tasks` — **PASS**
- **Phase 3 (Roles & Security):** `crm_custom_roles`, `crm_security_settings` — **PASS**
- **Phase 4 (Workflows & Forms):** `crm_workflows`, `crm_lead_forms`, `crm_inbound_webhooks` — **PASS**
- **Phase 5 (WhatsApp Flagship):** `crm_whatsapp_numbers`, `crm_tenant_guardrails` — **PASS**
- **Phase 6 (AI Engine & RAG):** `crm_tenant_ai_settings`, `crm_agent_personas`, `crm_knowledge_items` — **PASS**
- **Phase 7 (Analytics & Billing):** `crm_analytics_reports`, `crm_billing_plans`, `crm_tenant_subscriptions` — **PASS**
- **Phase 8 (English Localization):** 10,392 keys in `en.json`, strict `en-US` locale — **PASS**
- **Live HTTP Routes:** All 7 application views returning HTTP 200 / 307 — **PASS**
