import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listScheduledReports,
  createScheduledReport,
} from "@/lib/alien-matrix/reports-service";

const scheduleSchema = z.object({
  report_id: z.string().uuid(),
  frequency: z.enum(["daily", "weekly", "monthly"]),
  recipient_emails: z.array(z.string().email()),
  format: z.enum(["pdf", "csv"]).optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const supabase = createAdminClient();
    const scheduled = await listScheduledReports(supabase, org.orgId);
    return ok(scheduled, { requestId });
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
    const parsed = scheduleSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid scheduling payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const supabase = createAdminClient();
    const scheduled = await createScheduledReport(
      supabase,
      org.orgId,
      parsed.data,
      user.id
    );

    return ok(scheduled, { status: 201, requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
