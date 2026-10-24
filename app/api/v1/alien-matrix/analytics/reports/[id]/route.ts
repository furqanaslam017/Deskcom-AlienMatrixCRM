import { headers } from "next/headers";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteReport } from "@/lib/alien-matrix/reports-service";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("member", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const supabase = createAdminClient();
    await deleteReport(supabase, org.orgId, id, user.id);
    return ok({ success: true }, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
