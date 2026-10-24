import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getCustomRecords, createCustomRecord } from "@/lib/alien-matrix/service";

const createRecordSchema = z.object({
  title: z.string().min(1).max(255),
  values: z.record(z.string(), z.unknown()),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;
  const { id: objectId } = await params;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || undefined;
  const limit = url.searchParams.get("limit") ? parseInt(url.searchParams.get("limit")!, 10) : 50;
  const offset = url.searchParams.get("offset") ? parseInt(url.searchParams.get("offset")!, 10) : 0;
  const sortBy = url.searchParams.get("sortBy") || "created_at";
  const sortOrder = (url.searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  try {
    const result = await getCustomRecords(org.orgId, objectId, {
      search,
      limit,
      offset,
      sortBy,
      sortOrder,
    });
    return ok(result.records, {
      requestId,
      meta: { total: result.total, limit, offset },
    });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;
  const { id: objectId } = await params;

  const authz = await requireRole("agent", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = createRecordSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid record payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const record = await createCustomRecord(org.orgId, user.id, objectId, parsed.data);
    return ok(record, { status: 201, requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
