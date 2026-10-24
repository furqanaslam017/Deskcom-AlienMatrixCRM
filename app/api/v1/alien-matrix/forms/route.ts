import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getLeadForms, createLeadForm } from "@/lib/alien-matrix/lead-forms-service";

const createFormSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  targetPipelineId: z.string().uuid().optional().nullable(),
  targetStageId: z.string().uuid().optional().nullable(),
  fieldsConfig: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(["text", "email", "phone", "number", "textarea", "select"]),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional(),
  })).min(1),
  primaryColorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  successMessage: z.string().max(500).optional(),
  redirectUrl: z.string().url().optional().or(z.literal("")).nullable(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const forms = await getLeadForms(org.orgId);
    return ok(forms, { requestId });
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
    const parsed = createFormSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid form configuration", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const created = await createLeadForm(
      org.orgId,
      {
        ...parsed.data,
        redirectUrl: parsed.data.redirectUrl || null,
      },
      {
        userId: user.id,
        requestId,
      }
    );
    return ok(created, { status: 201, requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
