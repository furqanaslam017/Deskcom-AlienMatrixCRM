import type { SupabaseClient } from "@supabase/supabase-js";
import { audit } from "@/lib/audit";
import { getAnalyticsDashboard } from "./analytics-service";

export interface AnalyticsReport {
  id: string;
  organization_id: string;
  title: string;
  report_type: "sales_funnel" | "whatsapp_performance" | "rep_leaderboard" | "ai_resolution" | "revenue_forecast";
  parameters: Record<string, unknown>;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledReport {
  id: string;
  organization_id: string;
  report_id: string;
  frequency: "daily" | "weekly" | "monthly";
  recipient_emails: string[];
  format: "pdf" | "csv";
  is_active: boolean;
  last_sent_at: string | null;
  created_at: string;
  report?: AnalyticsReport;
}

export async function listReports(
  supabase: SupabaseClient,
  organizationId: string
): Promise<AnalyticsReport[]> {
  const { data, error } = await supabase
    .from("crm_analytics_reports")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list reports: ${error.message}`);
  }

  return (data || []) as AnalyticsReport[];
}

export async function createReport(
  supabase: SupabaseClient,
  organizationId: string,
  input: {
    title: string;
    report_type: AnalyticsReport["report_type"];
    parameters?: Record<string, unknown>;
    is_favorite?: boolean;
  },
  actorUserId?: string
): Promise<AnalyticsReport> {
  const { data, error } = await supabase
    .from("crm_analytics_reports")
    .insert({
      organization_id: organizationId,
      title: input.title,
      report_type: input.report_type,
      parameters: input.parameters || {},
      is_favorite: input.is_favorite ?? false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create report: ${error.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_report.created",
    resourceType: "crm_analytics_reports",
    resourceId: data.id,
    metadata: { title: data.title, type: data.report_type },
  });

  return data as AnalyticsReport;
}

export async function deleteReport(
  supabase: SupabaseClient,
  organizationId: string,
  id: string,
  actorUserId?: string
): Promise<void> {
  const { error } = await supabase
    .from("crm_analytics_reports")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    throw new Error(`Failed to delete report: ${error.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_report.deleted",
    resourceType: "crm_analytics_reports",
    resourceId: id,
    metadata: { deleted: true },
  });
}

export async function listScheduledReports(
  supabase: SupabaseClient,
  organizationId: string
): Promise<ScheduledReport[]> {
  const { data, error } = await supabase
    .from("crm_scheduled_reports")
    .select("*, report:crm_analytics_reports(*)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list scheduled reports: ${error.message}`);
  }

  return (data || []) as ScheduledReport[];
}

export async function createScheduledReport(
  supabase: SupabaseClient,
  organizationId: string,
  input: {
    report_id: string;
    frequency: ScheduledReport["frequency"];
    recipient_emails: string[];
    format?: ScheduledReport["format"];
  },
  actorUserId?: string
): Promise<ScheduledReport> {
  const { data, error } = await supabase
    .from("crm_scheduled_reports")
    .insert({
      organization_id: organizationId,
      report_id: input.report_id,
      frequency: input.frequency,
      recipient_emails: input.recipient_emails,
      format: input.format || "pdf",
      is_active: true,
    })
    .select("*, report:crm_analytics_reports(*)")
    .single();

  if (error) {
    throw new Error(`Failed to schedule report: ${error.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_scheduled_report.created",
    resourceType: "crm_scheduled_reports",
    resourceId: data.id,
    metadata: { frequency: data.frequency, recipients: data.recipient_emails },
  });

  return data as ScheduledReport;
}

export async function exportReportCsv(
  supabase: SupabaseClient,
  organizationId: string,
  reportType: string
): Promise<string> {
  const dashboard = await getAnalyticsDashboard(supabase, organizationId);

  if (reportType === "rep_leaderboard") {
    let csv = "Vendedor,Negócios Ganhos,Receita Fechada (BRL),Taxa de Conversão (%)\n";
    for (const r of dashboard.rep_leaderboard) {
      csv += `"${r.owner_name}",${r.deals_won_count},${(r.won_value_cents / 100).toFixed(2)},${r.win_rate_percent}%\n`;
    }
    return csv;
  }

  if (reportType === "leads_by_source") {
    let csv = "Origem do Lead,Quantidade,Participação (%)\n";
    for (const s of dashboard.leads_by_source) {
      csv += `"${s.source}",${s.count},${s.percentage}%\n`;
    }
    return csv;
  }

  // Default: stages funnel
  let csv = "Etapa do Funil,Quantidade de Negócios,Valor Total (BRL),Conversão (%)\n";
  for (const st of dashboard.stages_funnel) {
    csv += `"${st.stage_name}",${st.deals_count},${(st.total_value_cents / 100).toFixed(2)},${st.conversion_rate_percent}%\n`;
  }
  return csv;
}
