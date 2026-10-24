import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getConversationDetails, updateConversation } from "@/lib/alien-matrix/whatsapp-inbox-service";

const updateConvSchema = z.object({
  assignedUserId: z.string().uuid().optional().nullable(),
  status: z.enum(["open", "pending", "snoozed", "closed"]).optional(),
  priority: z.enum(["urgent", "high", "normal", "low"]).optional(),
  labels: z.array(z.string()).optional(),
  dealId: z.string().uuid().optional().nullable(),
  snoozedUntil: z.string().optional().nullable(),
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
    const details = await getConversationDetails(org.orgId, id);
    return ok(details, { requestId });
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
    const parsed = updateConvSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid update payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const updated = await updateConversation(
      org.orgId,
      id,
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
