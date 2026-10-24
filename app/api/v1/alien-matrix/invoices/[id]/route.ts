import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getInvoiceById, updateInvoiceStatus } from "@/lib/alien-matrix/invoices-service";

const updateStatusSchema = z.object({
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  const { id: invoiceId } = await params;

  try {
    const invoice = await getInvoiceById(org.orgId, invoiceId);
    return ok(invoice, { requestId });
  } catch (err) {
    return fail("not_found", (err as Error).message, 404, { requestId });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("agent", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  const { id: invoiceId } = await params;

  try {
    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid status payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const updated = await updateInvoiceStatus(org.orgId, invoiceId, parsed.data.status, {
      userId: user.id,
      requestId,
    });
    return ok(updated, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
