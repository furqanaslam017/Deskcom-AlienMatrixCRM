import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getCustomRoles, createCustomRole } from "@/lib/alien-matrix/roles-service";

const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  permissions: z.object({
    objects: z.record(z.string(), z.array(z.string())).optional(),
    fields: z.record(z.string(), z.enum(["readonly", "hidden", "editable"])).optional(),
    allRecordsVisibility: z.boolean().optional(),
  }),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const roles = await getCustomRoles(org.orgId);
    return ok(roles, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function POST(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("admin", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = createRoleSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid role payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const created = await createCustomRole(org.orgId, parsed.data, {
      userId: user.id,
      requestId,
    });
    return ok(created, { status: 201, requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
