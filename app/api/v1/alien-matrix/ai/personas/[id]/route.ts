import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  updateAgentPersona,
  deleteAgentPersona,
} from "@/lib/alien-matrix/ai-personas-service";

const updatePersonaSchema = z.object({
  name: z.string().min(2).optional(),
  role_title: z.string().optional(),
  tone: z
    .enum(["formal", "casual", "professional_friendly", "assertive_sales", "empathetic_support"])
    .optional(),
  language: z.string().optional(),
  system_prompt: z.string().min(10).optional(),
  first_message_greeting: z.string().optional(),
  fallback_behavior: z.enum(["handoff", "book_call", "ask_rephrase"]).optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
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
    const parsed = updatePersonaSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid persona payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const supabase = createAdminClient();
    const updated = await updateAgentPersona(
      supabase,
      org.orgId,
      id,
      parsed.data,
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
    await deleteAgentPersona(supabase, org.orgId, id, user.id);
    return ok({ success: true }, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
