import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getCustomViews, saveCustomView } from "@/lib/alien-matrix/service";
import type { CustomViewType } from "@/lib/alien-matrix/types";

const saveViewSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  view_type: z.enum(["table", "kanban", "list"]),
  config: z.object({
    visible_columns: z.array(z.string()).optional(),
    filters: z.array(z.object({
      field: z.string(),
      operator: z.enum(["eq", "neq", "contains", "gt", "gte", "lt", "lte", "is_null", "is_not_null"]),
      value: z.unknown(),
    })).optional(),
    sort: z.array(z.object({
      field: z.string(),
      direction: z.enum(["asc", "desc"]),
    })).optional(),
    group_by_field: z.string().optional(),
  }),
  is_default: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;
  const { id: objectId } = await params;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const views = await getCustomViews(org.orgId, objectId);
    return ok(views, { requestId });
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
    const parsed = saveViewSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid view configuration", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const saved = await saveCustomView(org.orgId, user.id, objectId, {
      ...parsed.data,
      view_type: parsed.data.view_type as CustomViewType,
    });
    return ok(saved, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
