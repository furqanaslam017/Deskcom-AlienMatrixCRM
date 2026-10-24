import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getTenantGuardrails, updateTenantGuardrails } from "@/lib/alien-matrix/tenant-guardrails-service";

const updateGuardrailsSchema = z.object({
  stopOptoutEnabled: z.boolean().optional(),
  lgpdEnabled: z.boolean().optional(),
  antiBanPacingEnabled: z.boolean().optional(),
  messagingWindowEnabled: z.boolean().optional(),
  spinningEnabled: z.boolean().optional(),
  promiseSemanticEnabled: z.boolean().optional(),
  disclosureEnabled: z.boolean().optional(),
  maxHourlySends: z.number().int().min(1).max(500).optional(),
  emergencyKillswitch: z.boolean().optional(),
  customBlockedWords: z.array(z.string()).optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const config = await getTenantGuardrails(org.orgId);
    return ok(config, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function PATCH(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("admin", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = updateGuardrailsSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid guardrail configuration", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const updated = await updateTenantGuardrails(
      org.orgId,
      parsed.data,
      {
        userId: user.id,
        requestId,
      }
    );

    return ok(updated, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
