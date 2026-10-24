import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { updateLeadForm, deleteLeadForm, getLeadForms } from "@/lib/alien-matrix/lead-forms-service";

const updateFormSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  targetPipelineId: z.string().uuid().optional().nullable(),
  targetStageId: z.string().uuid().optional().nullable(),
  fieldsConfig: z.array(z.object({
    name: z.string(),
    label: z.string(),
    type: z.enum(["text", "email", "phone", "number", "textarea", "select"]),
    required: z.boolean().optional(),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional(),
  })).optional(),
  primaryColorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  successMessage: z.string().max(500).optional(),
  redirectUrl: z.string().url().optional().or(z.literal("")).nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const forms = await getLeadForms(org.orgId);
    const form = forms.find((f: any) => f.id === id);
    if (!form) {
      return fail("not_found", "Form not found", 404, { requestId });
    }
    return ok(form, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("agent", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = updateFormSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid update payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const updated = await updateLeadForm(
      org.orgId,
      id,
      {
        ...parsed.data,
        redirectUrl: parsed.data.redirectUrl || null,
      },
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

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("manager", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const res = await deleteLeadForm(org.orgId, id, {
      userId: user.id,
      requestId,
    });
    return ok(res, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
