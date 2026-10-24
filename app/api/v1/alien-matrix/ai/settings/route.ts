import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantAiSettings, updateTenantAiSettings } from "@/lib/alien-matrix/ai-settings-service";

const settingsSchema = z.object({
  active_provider: z.enum(["anthropic", "openai", "google", "openrouter", "local_ollama"]).optional(),
  primary_model: z.string().optional(),
  fast_model: z.string().optional(),
  embedding_provider: z.enum(["openai", "google"]).optional(),
  api_keys: z.record(z.string(), z.string()).optional(),
  monthly_token_budget: z.number().int().min(1000).optional(),
  monthly_cost_limit_cents: z.number().int().min(100).optional(),
  budget_alert_threshold_percent: z.number().int().min(10).max(100).optional(),
  hard_stop_on_budget: z.boolean().optional(),
  lead_scoring_enabled: z.boolean().optional(),
  sentiment_analysis_enabled: z.boolean().optional(),
  auto_fill_fields_enabled: z.boolean().optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const supabase = createAdminClient();
    const settings = await getTenantAiSettings(supabase, org.orgId);
    return ok(settings, { requestId });
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
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid AI settings", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const supabase = createAdminClient();
    const updated = await updateTenantAiSettings(
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
