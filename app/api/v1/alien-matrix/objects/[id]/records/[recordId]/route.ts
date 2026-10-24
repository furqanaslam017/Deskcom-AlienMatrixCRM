import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import {
  getCustomRecordById,
  updateCustomRecord,
  deleteCustomRecord,
} from "@/lib/alien-matrix/service";

const updateRecordSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  values: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;
  const { recordId } = await params;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const record = await getCustomRecordById(org.orgId, recordId);
    if (!record) {
      return fail("not_found", "Record not found", 404, { requestId });
    }
    return ok(record, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;
  const { recordId } = await params;

  const authz = await requireRole("agent", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = updateRecordSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid record update", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const updated = await updateCustomRecord(org.orgId, user.id, recordId, parsed.data);
    return ok(updated, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;
  const { recordId } = await params;

  const authz = await requireRole("agent", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    await deleteCustomRecord(org.orgId, user.id, recordId);
    return ok({ deleted: true }, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
