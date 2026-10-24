import { headers } from "next/headers";
import { requireRole } from "@/lib/auth/require-role";
import { getInvoiceById, renderInvoiceHtml } from "@/lib/alien-matrix/invoices-service";

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
    const html = renderInvoiceHtml(invoice, invoice.items || [], {
      companyName: org.name || "AlienMatrix CRM",
    });

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Request-Id": requestId || "",
      },
    });
  } catch (err) {
    return new Response(`<h1>Invoice not found</h1><p>${(err as Error).message}</p>`, {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
