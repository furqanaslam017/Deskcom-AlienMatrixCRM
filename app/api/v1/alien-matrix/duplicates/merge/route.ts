import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { mergeContacts } from "@/lib/alien-matrix/duplicate-detection";

const mergeSchema = z.object({
  primaryId: z.string().uuid(),
  duplicateIds: z.array(z.string().uuid()).min(1),
});

export async function POST(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("manager", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = mergeSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid merge payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const result = await mergeContacts(
      org.orgId,
      parsed.data.primaryId,
      parsed.data.duplicateIds,
      {
        userId: user.id,
        requestId,
      }
    );
    return ok(result, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
