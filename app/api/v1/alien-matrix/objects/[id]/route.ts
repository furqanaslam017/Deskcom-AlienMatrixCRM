import { headers } from "next/headers";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getCustomObjectBySlug } from "@/lib/alien-matrix/service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;
  const { id: slugOrId } = await params;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const object = await getCustomObjectBySlug(org.orgId, slugOrId);
    if (!object) {
      return fail("not_found", "Custom object not found", 404, { requestId });
    }
    return ok(object, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
