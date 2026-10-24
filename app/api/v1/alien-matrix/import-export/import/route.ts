import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { importRecords, parseCsv } from "@/lib/alien-matrix/import-export-service";

const importSchema = z.object({
  entity: z.enum(["contacts", "leads", "products"]),
  csvContent: z.string().min(1),
  fieldMapping: z.record(z.string()),
});

export async function POST(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("agent", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = importSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid import payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const rows = parseCsv(parsed.data.csvContent);
    if (rows.length < 2) {
      return fail("validation_error", "CSV must have at least a header row and one data row", 400, {
        requestId,
      });
    }

    const headersList = rows[0]!;
    const dataRows = rows.slice(1);

    const result = await importRecords(org.orgId, {
      entity: parsed.data.entity,
      headers: headersList,
      rows: dataRows,
      fieldMapping: parsed.data.fieldMapping,
      userId: user.id,
      requestId,
    });

    return ok(result, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
