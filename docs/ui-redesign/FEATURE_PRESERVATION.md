# Feature & Contract Preservation Specification
**Project:** DESKCOM AlienMatrixCRM  
**Scope:** UI Redesign to Rapport CRM Visual Aesthetics (Light & Dark Themes)  
**Rule:** Zero Degradation of Functionality, Security, APIs, or Data Contracts  
**Date:** October 25, 2026

---

## 1. Prime Directive

> **PRESENTATION LAYER ONLY.**  
> The visual redesign of AlienMatrix CRM to match the aesthetic of Rapport CRM must alter **only CSS, styling classes, component presentation markup, and layout visual composition**.  
> **Under no circumstances** may database schemas, RLS policies, API routes, authentication flows, authorization guards, worker queues, WhatsApp connectors, AI integrations, or i18n architectures be modified, degraded, or bypassed.

---

## 2. Security & Multi-Tenancy Invariants

### 2.1 Row-Level Security (RLS) Isolation
- **Tenant Isolation**: Every database query affecting tenant data must operate under Postgres Row-Level Security via the authenticated session client (`lib/supabase/server.ts`), or explicitly include `where organization_id = :orgId` when using the service role client (`lib/supabase/admin.ts`).
- **Security Definer Helpers**: RLS relies on canonical Postgres helper functions:
  - `fn_user_org_ids()`: Returns the list of organization IDs accessible to the current user.
  - `fn_user_role_in_org(org_id)`: Returns the user's role in the specified organization.
- **Service Role Governance**: The service role client bypasses RLS. Handlers using `createAdminClient()` must never trust the client request body for `organization_id`; it must be resolved exclusively from verified server session cookies, signed tokens, or authenticated webhooks.

### 2.2 Authentication & Session Management
- **Server Verification**: Authentication on the server must **always** call `getUser()`, never `getSession()`. (Supabase SSR security doctrine: `getSession()` is unverified client-side data; `getUser()` validates the token against Supabase Auth).
- **Edge Middleware (`proxy.ts`)**: Edge middleware injects `X-Request-Id` and `x-pathname`, validating cookies before traffic reaches route handlers. Any newly introduced path that requires public access must be explicitly declared in `lib/auth/public-paths.ts`.
- **MFA Policy**: Two-factor TOTP authentication rules are enforced by pure logic in `lib/auth/politica-mfa.ts`. When an organization or platform mandates MFA, users without verified TOTP must be routed to `/login/mfa` and prevented from accessing tenant desks.

### 2.3 Role-Based Access Control (RBAC)
- All protected API routes and UI actions must strictly use `requireRole()` (`lib/auth/require-role.ts`) or `requirePlatformAdmin()`.
- The role hierarchy is strictly ordered:
  $$\text{viewer} < \text{agent} < \text{manager} < \text{admin}$$
- Handlers performing mutations in `app/api/v1/` must also invoke `requireSupportWrite()` to block write operations when an administrator is in read-only support impersonation mode.

---

## 3. API & Communication Contracts

### 3.1 Standard Response Envelopes
Every route handler in `app/api/v1/` and `app/api/v1/alien-matrix/` must return responses created exclusively with `ok()` or `fail()` from `lib/api/wrappers.ts`:
```ts
// Success standard
return ok({ data: results });

// Error standard
return fail("NOT_FOUND", "The requested record does not exist", 404);
```
- No handler may construct raw `new Response(...)` or unstandardized JSON payloads.
- Every response must include the standard `X-Request-Id` header for end-to-end audit correlation.
- Error codes must strictly conform to the catalog defined in `lib/api/errors.ts`.

### 3.2 Zod Input Validation
- Every API endpoint accepting external input (query parameters, JSON bodies, route slugs) must validate that input using a strict Zod 4 schema before processing business logic.
- Input types must remain strictly typed and validated; redesign work must not change payload shapes.

---

## 4. WhatsApp Omnichannel & Flagship Invariants

### 4.1 Gateway Connectors
- **Dual Gateway Support**: The system supports both **WAHA Plus (NOWEB engine)** and **Meta WhatsApp Cloud API**. Both adapters must remain completely operational.
- **Session Lifecycle**: Connecting via QR code, monitoring session health status (`WORKING`, `SCAN_QR_CODE`, `FAILED`), and reconnecting numbers must function seamlessly through `app/api/v1/alien-matrix/whatsapp/numbers/*`.

### 4.2 Webhook Idempotency & Message Safety
- Inbound webhooks must enforce HMAC verification and path token validation.
- Message ingestion must maintain strict idempotency using:
  ```sql
  unique (organization_id, external_id)
  ```
  and catch Postgres unique violation error code `23505`.
- Inbound messages must flow through `event_log` and background worker processors; database triggers must **never** make outbound HTTP requests directly.
- WhatsApp media files (images, audio notes, documents) must be stored in the private Supabase storage bucket `whatsapp-media` and served strictly through authenticated, signed URLs.

---

## 5. Autonomous AI Engine & RAG Invariants

### 5.1 Provider-Agnostic Gateway
- The AI runtime in `lib/agent-engine/` and `lib/ai/` interacts through the Vercel AI Gateway (`@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`).
- Multi-persona configurations, prompts, and tool calling capabilities must remain intact.

### 5.2 Multi-Tenant RAG & Embeddings
- Knowledge base embeddings stored in Postgres (`pgvector`) must always be scoped by `organization_id`.
- Tenant A must never be able to retrieve or match vector embeddings belonging to Tenant B.

### 5.3 Guardrails & Human Handoff
- Before any AI-generated response is dispatched to WhatsApp, it must pass through tenant-configured guardrails (`lib/agent-engine/guardrails/`).
- When a human handoff trigger occurs (sentiment threshold, keyword match, or explicit user request), the conversation status must transition to `awaiting_human`, incrementing the pending cases counter (`ContadorDeCasos`).

---

## 6. Workflows & Automation Engine Invariants

- The visual workflow builder (`components/alien-matrix/WorkflowsViewClient.tsx`) connects to `/api/v1/alien-matrix/workflows/*`.
- Triggers supported:
  - `deal_stage_changed`
  - `whatsapp_message_received`
  - `lead_form_submitted`
  - `custom_object_created`
- Action execution engine runs asynchronously via event workers with retry counters and failure dead-letter queues. The graph structure (nodes, edges, execution conditions) must not be corrupted by visual redesign.

---

## 7. Dynamic Custom Objects Engine Invariants

- AlienMatrix allows tenants to define arbitrary CRM entities (e.g., Vehicles, Properties, Medical Records, Consultations) at runtime.
- The schema metadata (`custom_objects`), field definitions (`custom_fields`), and dynamic records (`custom_records`) must remain dynamically fetchable and renderable.
- The redesign will enhance the presentation of `ObjectTableView`, `ObjectKanbanView`, and `RecordDrawer` using Rapport cards, but must preserve all dynamic field rendering (text, currency, date, relationship lookups).

---

## 8. Internationalization & English Language Rule

- **100% English**: The entire application UI must remain in English.
- **Zero Hardcoded Strings**: All new or modified UI labels, tooltips, dialogs, and messages must source from `lib/i18n/traducoes/en.json` via the `useT()` hook or `t(...)` function.
- No Portuguese text may be introduced into components, buttons, or error banners.

---

## 9. Brand & Whitelabeling Invariants

- **Multi-Tenant White-Labeling**: The platform is sold as a white-label self-hosted CRM. The system must resolve the product name and branding dynamically from the database (`platform_branding` and `organizations.settings.branding`).
- **No Hardcoded Trademarks**: The name "Deskcomm" or "Rapport" must never appear in user-facing UI markup. The brand name resolves via `useMarcaDaInstalacao()` or `marcaDaSaida()`.
- `tests/unit/branding.test.ts` scans all source files in `app`, `components`, `lib`, and `workers` to fail the build if unapproved brand strings are introduced.

---

## 10. Theme System & Token Symmetry Invariants

- The application uses `data-theme="light"` and `data-theme="dark"` on `document.documentElement`.
- Theme switches must be instantaneous, zero-flash (via inline `THEME_INIT_SCRIPT`), and hydration-safe (via `useSyncExternalStore` in `lib/theme.tsx`).
- **Token Symmetry Test Constraint**: `tests/unit/branding-tema-claro-escopavel.test.ts` scans `app/globals.css` and strictly enforces that every token in `:root` and `[data-theme="light"]` has an exact match in `[data-theme="dark"]`. Any CSS token addition or modification must be symmetrically added to both themes.

---

## 11. Verification Checklist for UI Changes

Before any redesigned component or view is marked complete, the following verification gates must pass:
1. `pnpm typecheck` — 0 TypeScript errors across the entire repository.
2. `pnpm vitest run tests/unit/branding-tema-claro-escopavel.test.ts` — 100% theme token parity.
3. `pnpm vitest run tests/unit/branding.test.ts` — 100% brand whitelist compliance.
4. Functional verification — API payloads, form submissions, and WebSocket/Realtime subscriptions continue functioning without regression.
