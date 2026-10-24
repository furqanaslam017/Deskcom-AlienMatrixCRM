import { headers } from "next/headers";
import { fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { exportRecords } from "@/lib/alien-matrix/import-export-service";

export async function GET(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  const { searchParams } = new URL(req.url);
  const entity = (searchParams.get("entity") || "contacts") as "contacts" | "products" | "leads";

  if (!["contacts", "products", "leads"].includes(entity)) {
    return fail("validation_error", "Entity must be contacts, products, or leads", 400, {
      requestId,
    });
  }

  try {
    const csvData = await exportRecords(org.orgId, entity);

    return new Response(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${entity}-export-${new Date().toISOString().split("T")[0]}.csv"`,
        "X-Request-Id": requestId || "",
      },
    });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
