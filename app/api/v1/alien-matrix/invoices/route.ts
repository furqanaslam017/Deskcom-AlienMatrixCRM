import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getInvoices, createInvoice } from "@/lib/alien-matrix/invoices-service";

const createInvoiceSchema = z.object({
  kind: z.enum(["invoice", "quote", "proforma"]).optional().default("invoice"),
  title: z.string().min(1).max(255),
  leadId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  currency: z.string().max(8).optional().default("USD"),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().max(3000).optional(),
  paymentInstructions: z.string().max(3000).optional(),
  paymentUrl: z.string().url().optional().or(z.literal("")),
  items: z.array(
    z.object({
      productId: z.string().uuid().optional(),
      description: z.string().min(1),
      quantity: z.number().positive().default(1),
      unitPriceCents: z.number().int().nonnegative(),
      discountCents: z.number().int().nonnegative().optional().default(0),
      taxRatePercent: z.number().min(0).max(100).optional().default(0),
      position: z.number().int().optional(),
    })
  ).min(1, "Invoice must contain at least 1 line item"),
});

export async function GET(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") as any;
  const status = searchParams.get("status") as any;
  const contactId = searchParams.get("contact_id") || undefined;
  const leadId = searchParams.get("lead_id") || undefined;
  const search = searchParams.get("search") || undefined;

  try {
    const invoices = await getInvoices(org.orgId, {
      kind,
      status,
      contactId,
      leadId,
      search,
    });
    return ok(invoices, { requestId });
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
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid invoice payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const created = await createInvoice(
      org.orgId,
      {
        ...parsed.data,
        paymentUrl: parsed.data.paymentUrl || undefined,
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
