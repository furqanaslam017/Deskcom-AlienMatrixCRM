import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { updateWorkflow, deleteWorkflow } from "@/lib/alien-matrix/workflow-engine";

const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  conditions: z.array(z.any()).optional(),
  actions: z.array(z.any()).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("manager", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  const { id: workflowId } = await params;

  try {
    const body = await req.json();
    const parsed = updateWorkflowSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid workflow update payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const updated = await updateWorkflow(org.orgId, workflowId, parsed.data, {
      userId: user.id,
      requestId,
    });
    return ok(updated, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("manager", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  const { id: workflowId } = await params;

  try {
    const result = await deleteWorkflow(org.orgId, workflowId, {
      userId: user.id,
      requestId,
    });
    return ok(result, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
