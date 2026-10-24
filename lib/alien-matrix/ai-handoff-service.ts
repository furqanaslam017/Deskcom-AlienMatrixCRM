import type { SupabaseClient } from "@supabase/supabase-js";
import { audit } from "@/lib/audit";

export interface AIHandoffLog {
  id: string;
  organization_id: string;
  conversation_id: string | null;
  contact_id: string | null;
  lead_id: string | null;
  trigger_reason:
    | "sentiment_frustrated"
    | "explicit_request"
    | "high_value_deal"
    | "unanswered_questions"
    | "out_of_scope";
  ai_summary: string;
  lead_sentiment: string;
  urgency: "low" | "medium" | "high" | "urgent";
  suggested_action: string | null;
  assigned_to_user_id: string | null;
  resolved_at: string | null;
  status: "pending" | "accepted" | "resolved";
  created_at: string;
}

export async function createAIHandoff(
  supabase: SupabaseClient,
  organizationId: string,
  input: {
    conversation_id?: string;
    contact_id?: string;
    lead_id?: string;
    trigger_reason: AIHandoffLog["trigger_reason"];
    ai_summary: string;
    lead_sentiment?: string;
    urgency?: AIHandoffLog["urgency"];
    suggested_action?: string;
    assigned_to_user_id?: string;
  },
  actorUserId?: string
): Promise<AIHandoffLog> {
  const { data, error } = await supabase
    .from("crm_ai_handoff_logs")
    .insert({
      organization_id: organizationId,
      conversation_id: input.conversation_id || null,
      contact_id: input.contact_id || null,
      lead_id: input.lead_id || null,
      trigger_reason: input.trigger_reason,
      ai_summary: input.ai_summary,
      lead_sentiment: input.lead_sentiment || "neutral",
      urgency: input.urgency || "medium",
      suggested_action: input.suggested_action || null,
      assigned_to_user_id: input.assigned_to_user_id || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create AI handoff: ${error.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_ai_handoff.triggered",
    resourceType: "crm_ai_handoff_logs",
    resourceId: data.id,
    metadata: {
      reason: input.trigger_reason,
      urgency: input.urgency,
      conversationId: input.conversation_id,
    },
  });

  return data as AIHandoffLog;
}

export async function listAIHandoffs(
  supabase: SupabaseClient,
  organizationId: string,
  statusFilter?: string
): Promise<AIHandoffLog[]> {
  let query = supabase
    .from("crm_ai_handoff_logs")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list AI handoffs: ${error.message}`);
  }

  return (data || []) as AIHandoffLog[];
}

export async function resolveAIHandoff(
  supabase: SupabaseClient,
  organizationId: string,
  id: string,
  status: "accepted" | "resolved",
  assignedToUserId?: string,
  actorUserId?: string
): Promise<AIHandoffLog> {
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "resolved") {
    updates.resolved_at = new Date().toISOString();
  }
  if (assignedToUserId) {
    updates.assigned_to_user_id = assignedToUserId;
  }

  const { data, error } = await supabase
    .from("crm_ai_handoff_logs")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update AI handoff: ${error.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_ai_handoff.resolved",
    resourceType: "crm_ai_handoff_logs",
    resourceId: id,
    metadata: { status, assignedToUserId },
  });

  return data as AIHandoffLog;
}
