import { headers } from "next/headers";
import { type NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getConversations } from "@/lib/alien-matrix/whatsapp-inbox-service";

export async function GET(req: NextRequest) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const numberId = searchParams.get("numberId") || undefined;
    const assignedUserId = searchParams.get("assignedUserId") || undefined;

    const conversations = await getConversations(org.orgId, {
      status,
      numberId,
      assignedUserId,
    });
    return ok(conversations, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
