import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getCustomFields, createCustomField } from "@/lib/alien-matrix/service";
import type { CustomFieldType } from "@/lib/alien-matrix/types";

const createFieldSchema = z.object({
  slug: z.string().min(1).max(64),
  label: z.string().min(1).max(128),
  field_type: z.enum([
    "text", "long_text", "number", "currency", "date", "datetime",
    "boolean", "select", "multi_select", "email", "phone", "url",
    "file", "relation", "user"
  ]),
  description: z.string().max(500).optional(),
  is_required: z.boolean().optional(),
  is_unique: z.boolean().optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
    color: z.string().optional(),
  })).optional(),
  relation_target_object_id: z.string().uuid().optional(),
  position: z.number().optional(),
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
    const fields = await getCustomFields(org.orgId, objectId);
    return ok(fields, { requestId });
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

  const authz = await requireRole("manager", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = createFieldSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid field payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const field = await createCustomField(
      org.orgId,
      user.id,
      objectId,
      parsed.data as {
        slug: string;
        label: string;
        field_type: CustomFieldType;
        description?: string;
        is_required?: boolean;
        is_unique?: boolean;
        options?: { label: string; value: string; color?: string }[];
        relation_target_object_id?: string;
        position?: number;
      }
    );
    return ok(field, { status: 201, requestId });
  } catch (err) {
    return fail("conflict", (err as Error).message, 400, { requestId });
  }
}
