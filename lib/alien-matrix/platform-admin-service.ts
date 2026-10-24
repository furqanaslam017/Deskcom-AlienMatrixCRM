import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export interface PlatformMetrics {
  totalTenants: number;
  totalLeads: number;
  totalDealsValueCents: number;
  totalCustomObjects: number;
  totalCustomRecords: number;
  totalProducts: number;
  totalInvoicesValueCents: number;
}

export async function getPlatformOverview(): Promise<PlatformMetrics> {
  const admin = createAdminClient();

  // 1. Tenants count
  const { count: tenantCount } = await admin
    .from("organizations")
    .select("*", { count: "exact", head: true });

  // 2. Leads count
  const { count: leadCount } = await admin
    .from("crm_leads")
    .select("*", { count: "exact", head: true });

  // 3. Pipeline value sum
  const { data: leadValues } = await admin
    .from("crm_leads")
    .select("value_cents");
  const totalDealsVal = (leadValues ?? []).reduce((sum, l) => sum + (Number(l.value_cents) || 0), 0);

  // 4. Custom objects & records count
  const { count: objectsCount } = await admin
    .from("custom_objects")
    .select("*", { count: "exact", head: true });

  const { count: recordsCount } = await admin
    .from("custom_records")
    .select("*", { count: "exact", head: true });

  // 5. Products count
  const { count: productsCount } = await admin
    .from("crm_products")
    .select("*", { count: "exact", head: true });

  // 6. Invoices value sum
  const { data: invValues } = await admin
    .from("crm_invoices")
    .select("total_cents");
  const totalInvVal = (invValues ?? []).reduce((sum, i) => sum + (Number(i.total_cents) || 0), 0);

  return {
    totalTenants: tenantCount ?? 1,
    totalLeads: leadCount ?? 0,
    totalDealsValueCents: totalDealsVal,
    totalCustomObjects: objectsCount ?? 0,
    totalCustomRecords: recordsCount ?? 0,
    totalProducts: productsCount ?? 0,
    totalInvoicesValueCents: totalInvVal,
  };
}

export async function getAllTenantsSummary() {
  const admin = createAdminClient();
  const { data: orgs, error } = await admin
    .from("organizations")
    .select(`
      id,
      name,
      slug,
      created_at,
      settings,
      members:organization_members(count),
      custom_settings:crm_tenant_settings(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("[alienmatrix] failed to get tenants summary", { error });
    return [];
  }

  return orgs ?? [];
}

/**
 * Full data export for a tenant (JSON format).
 */
export async function exportTenantData(orgId: string) {
  const admin = createAdminClient();

  const [
    { data: org },
    { data: customObjects },
    { data: customRecords },
    { data: contacts },
    { data: leads },
    { data: products },
    { data: invoices },
    { data: callLogs },
  ] = await Promise.all([
    admin.from("organizations").select("*").eq("id", orgId).single(),
    admin.from("custom_objects").select("*, custom_fields(*)").eq("organization_id", orgId),
    admin.from("custom_records").select("*").eq("organization_id", orgId),
    admin.from("contacts").select("*").eq("organization_id", orgId),
    admin.from("crm_leads").select("*").eq("organization_id", orgId),
    admin.from("crm_products").select("*").eq("organization_id", orgId),
    admin.from("crm_invoices").select("*, items:crm_invoice_items(*)").eq("organization_id", orgId),
    admin.from("crm_call_logs").select("*").eq("organization_id", orgId),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    organization: org,
    customObjects,
    customRecords,
    contacts,
    leads,
    products,
    invoices,
    callLogs,
  };
}
