import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getProducts, createProduct } from "@/lib/alien-matrix/products-service";

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  sku: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  unitPriceCents: z.number().int().nonnegative(),
  currency: z.string().max(8).optional().default("USD"),
  costPriceCents: z.number().int().nonnegative().optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
  stockQuantity: z.number().int().optional().default(0),
  isActive: z.boolean().optional().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const category = searchParams.get("category") || undefined;
  const activeOnly = searchParams.get("active") === "true";

  try {
    const products = await getProducts(org.orgId, {
      search,
      category,
      isActiveOnly: activeOnly,
    });
    return ok(products, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function POST(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("agent", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid product payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const created = await createProduct(org.orgId, parsed.data, {
      userId: user.id,
      requestId,
    });
    return ok(created, { status: 201, requestId });
  } catch (err) {
    return fail("conflict", (err as Error).message, 400, { requestId });
  }
}
