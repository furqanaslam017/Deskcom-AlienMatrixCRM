import { headers } from "next/headers";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { startBroadcastCampaign } from "@/lib/alien-matrix/whatsapp-campaigns-service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("manager", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const started = await startBroadcastCampaign(org.orgId, id, {
      userId: user.id,
      requestId,
    });
    return ok(started, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
