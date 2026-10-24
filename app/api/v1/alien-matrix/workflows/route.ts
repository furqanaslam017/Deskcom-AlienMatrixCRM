import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getWorkflows, createWorkflow } from "@/lib/alien-matrix/workflow-engine";

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  triggerType: z.enum(["record_created", "stage_changed", "message_received", "time_based", "webhook"]),
  triggerConfig: z.record(z.unknown()).optional(),
  conditions: z.array(z.object({
    field: z.string(),
    op: z.enum(["equals", "not_equals", "contains", "gte", "lte", "is_empty", "is_not_empty"]),
    value: z.unknown().optional(),
  })).optional(),
  actions: z.array(z.object({
    type: z.enum(["send_whatsapp", "send_email", "create_task", "update_field", "assign_owner", "call_webhook", "run_ai_agent"]),
    params: z.record(z.unknown()),
  })).min(1, "Workflow must have at least 1 action"),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const workflows = await getWorkflows(org.orgId);
    return ok(workflows, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function POST(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("manager", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = createWorkflowSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid workflow payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const created = await createWorkflow(org.orgId, parsed.data as any, {
      userId: user.id,
      requestId,
    });
    return ok(created, { status: 201, requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
