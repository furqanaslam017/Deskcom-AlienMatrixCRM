import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import {
  getCustomObjects,
  createCustomObject,
  ensureBuiltInObjects,
} from "@/lib/alien-matrix/service";

const createObjectSchema = z.object({
  slug: z.string().min(2).max(64),
  name: z.string().min(1).max(128),
  singular_name: z.string().min(1).max(64),
  plural_name: z.string().min(1).max(64),
  description: z.string().max(500).optional(),
  icon: z.string().max(64).optional(),
  primary_field_slug: z.string().max(64).optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    // Ensure standard built-in objects exist for this org
    await ensureBuiltInObjects(org.orgId);

    const objects = await getCustomObjects(org.orgId);
    return ok(objects, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function POST(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("manager", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = createObjectSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid object payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const created = await createCustomObject(org.orgId, user.id, parsed.data);
    return ok(created, { status: 201, requestId });
  } catch (err) {
    return fail("conflict", (err as Error).message, 400, { requestId });
  }
}
