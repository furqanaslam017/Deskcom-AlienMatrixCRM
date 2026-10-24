import { headers } from "next/headers";
import { fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { exportReportCsv } from "@/lib/alien-matrix/reports-service";

export async function GET(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "sales_funnel";

  try {
    const supabase = createAdminClient();
    const csvData = await exportReportCsv(supabase, org.orgId, type);

    return new Response(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="alienmatrix-report-${type}.csv"`,
        "X-Request-Id": requestId || "",
      },
    });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
