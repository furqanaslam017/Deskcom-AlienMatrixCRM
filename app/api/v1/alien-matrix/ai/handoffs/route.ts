import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listAIHandoffs,
  createAIHandoff,
} from "@/lib/alien-matrix/ai-handoff-service";

const createHandoffSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  lead_id: z.string().uuid().optional(),
  trigger_reason: z.enum([
    "sentiment_frustrated",
    "explicit_request",
    "high_value_deal",
    "unanswered_questions",
    "out_of_scope",
  ]),
  ai_summary: z.string().min(10),
  lead_sentiment: z.string().optional(),
  urgency: z.enum(["low", "medium", "high", "urgent"]).optional(),
  suggested_action: z.string().optional(),
  assigned_to_user_id: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;

  try {
    const supabase = createAdminClient();
    const handoffs = await listAIHandoffs(supabase, org.orgId, status);
    return ok(handoffs, { requestId });
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
    const parsed = createHandoffSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid handoff payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const supabase = createAdminClient();
    const handoff = await createAIHandoff(supabase, org.orgId, parsed.data, user.id);
    return ok(handoff, { status: 201, requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
