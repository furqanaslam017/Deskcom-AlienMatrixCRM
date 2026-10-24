import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface CallLogInput {
  leadId?: string;
  contactId?: string;
  activityType?: "call" | "meeting" | "demo" | "video_call" | "whatsapp_call";
  direction?: "inbound" | "outbound";
  outcome?: "connected" | "busy" | "no_answer" | "left_voicemail" | "completed" | "rescheduled" | "cancelled";
  subject: string;
  notes?: string;
  durationSeconds?: number;
  scheduledAt?: string;
  performedAt?: string;
  recordingUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface CalendarEvent {
  id: string;
  type: "task" | "call" | "meeting" | "demo";
  title: string;
  date: string;
  status: string;
  priority?: string;
  contactName?: string;
  leadTitle?: string;
  notes?: string;
  durationMinutes?: number;
}

/**
 * Creates a call log or meeting entry.
 */
export async function createCallLog(
  orgId: string,
  input: CallLogInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_call_logs")
    .insert({
      organization_id: orgId,
      lead_id: input.leadId || null,
      contact_id: input.contactId || null,
      activity_type: input.activityType || "call",
      direction: input.direction || "outbound",
      outcome: input.outcome || "completed",
      subject: input.subject,
      notes: input.notes || null,
      duration_seconds: input.durationSeconds || 0,
      scheduled_at: input.scheduledAt || null,
      performed_at: input.performedAt || new Date().toISOString(),
      performed_by_user_id: options?.userId || null,
      recording_url: input.recordingUrl || null,
      metadata: input.metadata || {},
    })
    .select("*")
    .single();

  if (error || !data) {
    logger.error("[alienmatrix] failed to create call log", { error });
    throw new Error(`Failed to create call log: ${error?.message}`);
  }

  await audit({
    action: "crm_call_log.created",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_call_logs",
    resourceId: data.id,
    requestId: options?.requestId,
    metadata: {
      type: data.activity_type,
      subject: data.subject,
      outcome: data.outcome,
    },
  });

  return data;
}

/**
 * Gets call and meeting logs with related contact/lead info.
 */
export async function getCallLogs(
  orgId: string,
  options?: {
    leadId?: string;
    contactId?: string;
    activityType?: string;
    limit?: number;
  }
) {
  const admin = createAdminClient();
  let query = admin
    .from("crm_call_logs")
    .select(`
      *,
      contact:contacts(id, name, phone_number, email),
      lead:crm_leads(id, title)
    `)
    .eq("organization_id", orgId)
    .order("performed_at", { ascending: false });

  if (options?.leadId) query = query.eq("lead_id", options.leadId);
  if (options?.contactId) query = query.eq("contact_id", options.contactId);
  if (options?.activityType) query = query.eq("activity_type", options.activityType);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/**
 * Aggregates tasks and call/meeting events into a unified calendar feed.
 */
export async function getCalendarFeed(
  orgId: string,
  options?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<CalendarEvent[]> {
  const admin = createAdminClient();
  const events: CalendarEvent[] = [];

  // 1. Fetch tasks with due dates
  let taskQuery = admin
    .from("crm_tasks")
    .select(`
      id,
      title,
      description,
      due_date,
      priority,
      status,
      contact:contacts(name),
      lead:crm_leads(title)
    `)
    .eq("organization_id", orgId)
    .not("due_date", "is", null);

  if (options?.startDate) taskQuery = taskQuery.gte("due_date", options.startDate);
  if (options?.endDate) taskQuery = taskQuery.lte("due_date", options.endDate);

  const { data: tasks } = await taskQuery;
  for (const t of tasks ?? []) {
    events.push({
      id: t.id,
      type: "task",
      title: t.title,
      date: t.due_date,
      status: t.status,
      priority: t.priority,
      contactName: (t.contact as any)?.name,
      leadTitle: (t.lead as any)?.title,
      notes: t.description || undefined,
    });
  }

  // 2. Fetch calls and meetings
  let callQuery = admin
    .from("crm_call_logs")
    .select(`
      id,
      activity_type,
      subject,
      notes,
      scheduled_at,
      performed_at,
      duration_seconds,
      outcome,
      contact:contacts(name),
      lead:crm_leads(title)
    `)
    .eq("organization_id", orgId);

  const { data: calls } = await callQuery;
  for (const c of calls ?? []) {
    const eventDate = c.scheduled_at || c.performed_at;
    if (!eventDate) continue;

    if (options?.startDate && eventDate < options.startDate) continue;
    if (options?.endDate && eventDate > options.endDate) continue;

    events.push({
      id: c.id,
      type: (c.activity_type as any) || "call",
      title: c.subject,
      date: eventDate,
      status: c.outcome,
      contactName: (c.contact as any)?.name,
      leadTitle: (c.lead as any)?.title,
      notes: c.notes || undefined,
      durationMinutes: Math.round((c.duration_seconds || 0) / 60),
    });
  }

  // Sort chronologically
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return events;
}
