import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { listReports, createReport } from "@/lib/alien-matrix/reports-service";

const createReportSchema = z.object({
  title: z.string().min(2),
  report_type: z.enum([
    "sales_funnel",
    "whatsapp_performance",
    "rep_leaderboard",
    "ai_resolution",
    "revenue_forecast",
  ]),
  parameters: z.record(z.string(), z.unknown()).optional(),
  is_favorite: z.boolean().optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const supabase = createAdminClient();
    const reports = await listReports(supabase, org.orgId);
    return ok(reports, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function POST(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("agent", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = createReportSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid report configuration", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const supabase = createAdminClient();
    const report = await createReport(supabase, org.orgId, parsed.data, user.id);
    return ok(report, { status: 201, requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
