import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { convertLead } from "@/lib/alien-matrix/lead-conversion";

const convertSchema = z.object({
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  companyName: z.string().optional(),
  createDeal: z.boolean().optional().default(true),
  dealTitle: z.string().optional(),
  pipelineId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  dealValueCents: z.number().int().nonnegative().optional(),
  dealCurrency: z.string().max(8).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("agent", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  const { id: leadId } = await params;
  if (!leadId) {
    return fail("validation_error", "Missing lead ID", 400, { requestId });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = convertSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid conversion payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const result = await convertLead(
      org.orgId,
      {
        leadId,
        ...parsed.data,
        convertedByUserId: user.id,
      },
      { requestId }
    );

    return ok(result, { requestId, status: 200 });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
