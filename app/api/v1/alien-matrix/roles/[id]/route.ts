import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { updateCustomRole, deleteCustomRole } from "@/lib/alien-matrix/roles-service";

const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  permissions: z.object({
    objects: z.record(z.array(z.string())).optional(),
    fields: z.record(z.enum(["readonly", "hidden", "editable"])).optional(),
    allRecordsVisibility: z.boolean().optional(),
  }).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("admin", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  const { id: roleId } = await params;

  try {
    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid role update payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const updated = await updateCustomRole(org.orgId, roleId, parsed.data, {
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

  const authz = await requireRole("admin", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  const { id: roleId } = await params;

  try {
    const result = await deleteCustomRole(org.orgId, roleId, {
      userId: user.id,
      requestId,
    });
    return ok(result, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
