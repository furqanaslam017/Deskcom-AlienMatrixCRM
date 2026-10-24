import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getTenantSubscription,
  updateTenantSubscription,
} from "@/lib/alien-matrix/billing-service";

const updateSubSchema = z.object({
  plan_id: z.string().uuid(),
  payment_provider: z.enum(["stripe", "pix_local", "manual"]).optional(),
  billing_cycle: z.enum(["monthly", "yearly"]).optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const supabase = createAdminClient();
    const sub = await getTenantSubscription(supabase, org.orgId);
    return ok(sub, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function PUT(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("admin", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = updateSubSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid subscription update", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const supabase = createAdminClient();
    const updated = await updateTenantSubscription(
      supabase,
      org.orgId,
      parsed.data,
      user.id
    );

    return ok(updated, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
