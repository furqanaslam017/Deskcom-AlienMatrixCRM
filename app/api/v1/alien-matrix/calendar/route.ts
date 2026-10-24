import { headers } from "next/headers";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getCalendarFeed } from "@/lib/alien-matrix/calendar-service";

export async function GET(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get("start") || undefined;
  const endDate = searchParams.get("end") || undefined;

  try {
    const feed = await getCalendarFeed(org.orgId, { startDate, endDate });
    return ok(feed, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
