import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  listAIInsights,
  generateAIInsight,
} from "@/lib/alien-matrix/ai-insights-service";

const analyzeSchema = z.object({
  target_type: z.enum(["conversation", "lead", "contact"]).default("conversation"),
  target_id: z.string().uuid(),
  content: z.string().min(5),
});

export async function GET(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  const url = new URL(req.url);
  const targetId = url.searchParams.get("target_id") ?? undefined;

  try {
    const supabase = createAdminClient();
    const insights = await listAIInsights(supabase, org.orgId, targetId);
    return ok(insights, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function POST(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("member", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = analyzeSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid analysis request", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const supabase = createAdminClient();
    const insight = await generateAIInsight(
      supabase,
      org.orgId,
      parsed.data.target_type,
      parsed.data.target_id,
      parsed.data.content,
      user.id
    );

    return ok(insight, { status: 201, requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
