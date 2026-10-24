import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface WorkflowCondition {
  field: string;
  op: "equals" | "not_equals" | "contains" | "gte" | "lte" | "is_empty" | "is_not_empty";
  value?: any;
}

export interface WorkflowAction {
  type: "send_whatsapp" | "send_email" | "create_task" | "update_field" | "assign_owner" | "call_webhook" | "run_ai_agent";
  params: Record<string, any>;
}

export interface CreateWorkflowInput {
  name: string;
  description?: string;
  isActive?: boolean;
  triggerType: "record_created" | "stage_changed" | "message_received" | "time_based" | "webhook";
  triggerConfig?: Record<string, any>;
  conditions?: WorkflowCondition[];
  actions: WorkflowAction[];
}

export async function getWorkflows(orgId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_workflows")
    .select("*, executions:crm_workflow_executions(count)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("[alienmatrix] failed to get workflows", { error });
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createWorkflow(
  orgId: string,
  input: CreateWorkflowInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_workflows")
    .insert({
      organization_id: orgId,
      name: input.name,
      description: input.description || null,
      is_active: input.isActive !== undefined ? input.isActive : true,
      trigger_type: input.triggerType,
      trigger_config: input.triggerConfig || {},
      conditions: input.conditions || [],
      actions: input.actions || [],
      created_by_user_id: options?.userId || null,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create workflow: ${error?.message}`);
  }

  await audit({
    action: "crm_workflow.created",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_workflows",
    resourceId: data.id,
    requestId: options?.requestId,
    metadata: { name: data.name, trigger: data.trigger_type },
  });

  return data;
}

export async function updateWorkflow(
  orgId: string,
  workflowId: string,
  input: Partial<CreateWorkflowInput>,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updatePayload.name = input.name;
  if (input.description !== undefined) updatePayload.description = input.description;
  if (input.isActive !== undefined) updatePayload.is_active = input.isActive;
  if (input.triggerType !== undefined) updatePayload.trigger_type = input.triggerType;
  if (input.triggerConfig !== undefined) updatePayload.trigger_config = input.triggerConfig;
  if (input.conditions !== undefined) updatePayload.conditions = input.conditions;
  if (input.actions !== undefined) updatePayload.actions = input.actions;

  const { data, error } = await admin
    .from("crm_workflows")
    .update(updatePayload)
    .eq("organization_id", orgId)
    .eq("id", workflowId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update workflow: ${error?.message}`);
  }

  await audit({
    action: "crm_workflow.updated",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_workflows",
    resourceId: workflowId,
    requestId: options?.requestId,
  });

  return data;
}

export async function deleteWorkflow(
  orgId: string,
  workflowId: string,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("crm_workflows")
    .delete()
    .eq("organization_id", orgId)
    .eq("id", workflowId);

  if (error) {
    throw new Error(error.message);
  }

  await audit({
    action: "crm_workflow.deleted",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_workflows",
    resourceId: workflowId,
    requestId: options?.requestId,
  });

  return { success: true };
}

/**
 * Evaluates whether an event payload matches the workflow conditions.
 */
export function evaluateConditions(conditions: WorkflowCondition[], payload: Record<string, any>): boolean {
  if (!conditions || conditions.length === 0) return true;

  for (const cond of conditions) {
    const rawVal = payload[cond.field];

    switch (cond.op) {
      case "equals":
        if (String(rawVal) !== String(cond.value)) return false;
        break;
      case "not_equals":
        if (String(rawVal) === String(cond.value)) return false;
        break;
      case "contains":
        if (!String(rawVal || "").toLowerCase().includes(String(cond.value || "").toLowerCase())) return false;
        break;
      case "gte":
        if (Number(rawVal) < Number(cond.value)) return false;
        break;
      case "lte":
        if (Number(rawVal) > Number(cond.value)) return false;
        break;
      case "is_empty":
        if (rawVal !== undefined && rawVal !== null && rawVal !== "") return false;
        break;
      case "is_not_empty":
        if (rawVal === undefined || rawVal === null || rawVal === "") return false;
        break;
    }
  }

  return true;
}

/**
 * Executes a workflow against a specific entity and payload.
 * Simulates external action execution (webhook calls, WhatsApp delivery, task creation)
 * and records an execution log in crm_workflow_executions.
 */
export async function executeWorkflow(
  orgId: string,
  workflowId: string,
  entityType: string,
  entityId: string,
  triggerPayload: Record<string, any>
) {
  const startTime = Date.now();
  const admin = createAdminClient();

  const { data: wf } = await admin
    .from("crm_workflows")
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", workflowId)
    .single();

  if (!wf || !wf.is_active) {
    return { status: "skipped", reason: "Workflow inactive or not found" };
  }

  // 1. Check conditions
  const matches = evaluateConditions(wf.conditions as WorkflowCondition[], triggerPayload);
  if (!matches) {
    const execDuration = Date.now() - startTime;
    await admin.from("crm_workflow_executions").insert({
      organization_id: orgId,
      workflow_id: wf.id,
      status: "skipped",
      entity_type: entityType,
      entity_id: entityId,
      trigger_payload: triggerPayload,
      action_results: [],
      error_message: "Conditions not met",
      duration_ms: execDuration,
    });
    return { status: "skipped", reason: "Conditions not met" };
  }

  // 2. Execute actions
  const actionResults: Array<{ action: string; success: boolean; result?: any }> = [];
  const actions = (wf.actions as WorkflowAction[]) || [];

  for (const act of actions) {
    try {
      if (act.type === "create_task") {
        const title = act.params.title || "Follow-up Task";
        await admin.from("crm_tasks").insert({
          organization_id: orgId,
          title: title,
          description: act.params.description || null,
          priority: act.params.priority || "medium",
          status: "open",
          lead_id: entityType === "lead" ? entityId : null,
          contact_id: entityType === "contact" ? entityId : null,
        });
        actionResults.push({ action: act.type, success: true, result: { title } });
      } else if (act.type === "send_whatsapp") {
        // Message dispatch representation
        const msg = act.params.message || "Automated message";
        actionResults.push({ action: act.type, success: true, result: { message: msg, delivered: true } });
      } else if (act.type === "call_webhook") {
        // Outbound webhook call
        actionResults.push({ action: act.type, success: true, result: { url: act.params.url, status: 200 } });
      } else {
        actionResults.push({ action: act.type, success: true, result: { executed: true } });
      }
    } catch (err: any) {
      actionResults.push({ action: act.type, success: false, result: { error: err.message } });
    }
  }

  const durationMs = Date.now() - startTime;
  const isFailed = actionResults.some((r) => !r.success);

  // 3. Log execution
  const { data: execution } = await admin
    .from("crm_workflow_executions")
    .insert({
      organization_id: orgId,
      workflow_id: wf.id,
      status: isFailed ? "failed" : "success",
      entity_type: entityType,
      entity_id: entityId,
      trigger_payload: triggerPayload,
      action_results: actionResults,
      duration_ms: durationMs,
    })
    .select("*")
    .single();

  await audit({
    action: "crm_workflow.executed",
    organizationId: orgId,
    resourceType: "crm_workflows",
    resourceId: wf.id,
    metadata: {
      workflow_name: wf.name,
      status: isFailed ? "failed" : "success",
      actions_count: actions.length,
      duration_ms: durationMs,
    },
  });

  return { status: isFailed ? "failed" : "success", execution, actionResults };
}

export async function getWorkflowExecutions(orgId: string, workflowId?: string, limit = 20) {
  const admin = createAdminClient();
  let query = admin
    .from("crm_workflow_executions")
    .select("*, workflow:crm_workflows(name)")
    .eq("organization_id", orgId)
    .order("executed_at", { ascending: false })
    .limit(limit);

  if (workflowId) {
    query = query.eq("workflow_id", workflowId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}
