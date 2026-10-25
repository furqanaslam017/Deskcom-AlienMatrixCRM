import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { executeWorkflow } from "@/lib/alien-matrix/workflow-engine";

const executeSchema = z.object({
  entityType: z.string().default("lead"),
  entityId: z.string().default("test-entity"),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("agent", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  const { id: workflowId } = await params;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = executeSchema.safeParse(body);
    const data = parsed.success ? parsed.data : { entityType: "lead", entityId: "manual", payload: {} };

    const result = await executeWorkflow(
      org.orgId,
      workflowId,
      data.entityType,
      data.entityId,
      data.payload
    );

    return ok(result, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
