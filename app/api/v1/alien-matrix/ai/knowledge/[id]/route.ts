import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  updateKnowledgeItem,
  deleteKnowledgeItem,
} from "@/lib/alien-matrix/ai-knowledge-service";

const updateKnowledgeSchema = z.object({
  title: z.string().min(2).optional(),
  type: z.enum(["doc", "faq", "url", "policy"]).optional(),
  source_url: z.string().url().optional().or(z.literal("")),
  content: z.string().min(5).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(["ready", "processing", "failed"]).optional(),
});

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("admin", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = updateKnowledgeSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid knowledge item", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const supabase = createAdminClient();
    const updated = await updateKnowledgeItem(
      supabase,
      org.orgId,
      id,
      {
        ...parsed.data,
        source_url: parsed.data.source_url || undefined,
      },
      user.id
    );

    return ok(updated, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("admin", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const supabase = createAdminClient();
    await deleteKnowledgeItem(supabase, org.orgId, id, user.id);
    return ok({ success: true }, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
