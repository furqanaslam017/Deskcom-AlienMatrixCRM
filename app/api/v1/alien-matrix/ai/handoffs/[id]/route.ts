import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAIHandoff } from "@/lib/alien-matrix/ai-handoff-service";

const resolveSchema = z.object({
  status: z.enum(["accepted", "resolved"]),
  assigned_to_user_id: z.string().uuid().optional(),
});

export async function PUT(
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
    const body = await req.json();
    const parsed = resolveSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid resolve payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const supabase = createAdminClient();
    const updated = await resolveAIHandoff(
      supabase,
      org.orgId,
      id,
      parsed.data.status,
      parsed.data.assigned_to_user_id,
      user.id
    );

    return ok(updated, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
