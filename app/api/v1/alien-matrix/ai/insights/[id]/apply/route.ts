import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyExtractedFields } from "@/lib/alien-matrix/ai-insights-service";

const applySchema = z.object({
  contact_id: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional(),
});

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("agent", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid apply payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const supabase = createAdminClient();
    const updated = await applyExtractedFields(
      supabase,
      org.orgId,
      id,
      parsed.data.contact_id,
      parsed.data.lead_id,
      user.id
    );

    return ok(updated, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
