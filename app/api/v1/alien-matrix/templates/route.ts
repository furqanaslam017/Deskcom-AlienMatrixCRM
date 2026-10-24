import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { INDUSTRY_TEMPLATES } from "@/lib/alien-matrix/templates";
import { applyIndustryTemplate } from "@/lib/alien-matrix/service";

const applyTemplateSchema = z.object({
  template_slug: z.string().min(1),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;

  return ok(INDUSTRY_TEMPLATES, { requestId });
}

export async function POST(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("admin", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = applyTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Missing template_slug", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const result = await applyIndustryTemplate(org.orgId, user.id, parsed.data.template_slug);
    return ok(result, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
