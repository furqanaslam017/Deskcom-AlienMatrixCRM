import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { updateProduct, deleteProduct } from "@/lib/alien-matrix/products-service";

const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sku: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  unitPriceCents: z.number().int().nonnegative().optional(),
  currency: z.string().max(8).optional(),
  costPriceCents: z.number().int().nonnegative().optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
  stockQuantity: z.number().int().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("agent", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  const { id: productId } = await params;

  try {
    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid product update payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const updated = await updateProduct(org.orgId, productId, parsed.data, {
      userId: user.id,
      requestId,
    });
    return ok(updated, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("manager", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  const { id: productId } = await params;

  try {
    const result = await deleteProduct(org.orgId, productId, {
      userId: user.id,
      requestId,
    });
    return ok(result, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
