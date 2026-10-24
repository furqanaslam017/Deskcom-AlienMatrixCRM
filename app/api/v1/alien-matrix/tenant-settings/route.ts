import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getTenantSettings, updateTenantSettings } from "@/lib/alien-matrix/tenant-settings-service";

const updateTenantSchema = z.object({
  brandName: z.string().max(100).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  primaryColorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  customDomain: z.string().max(255).optional().or(z.literal("")),
  timezone: z.string().max(100).optional(),
  currency: z.string().max(8).optional(),
  language: z.enum(["en", "ur", "ar", "pt-BR"]).optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const settings = await getTenantSettings(org.orgId);
    return ok(settings, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function PATCH(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("admin", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = updateTenantSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid tenant settings", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const updated = await updateTenantSettings(
      org.orgId,
      {
        ...parsed.data,
        logoUrl: parsed.data.logoUrl || null,
        customDomain: parsed.data.customDomain || null,
      },
      {
        userId: user.id,
        requestId,
      }
    );
    return ok(updated, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
