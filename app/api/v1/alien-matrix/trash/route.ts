import { headers } from "next/headers";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getDeletedRecords } from "@/lib/alien-matrix/soft-delete-service";

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const trash = await getDeletedRecords(org.orgId);
    return ok(trash, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
