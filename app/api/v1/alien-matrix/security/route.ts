import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getSecuritySettings, updateSecuritySettings } from "@/lib/alien-matrix/security-service";

const updateSecuritySchema = z.object({
  enforce2fa: z.boolean().optional(),
  ssoProvider: z.enum(["none", "google", "microsoft", "saml_oidc"]).optional(),
  ssoDomain: z.string().optional().or(z.literal("")),
  ssoClientId: z.string().optional().or(z.literal("")),
  ssoMetadataUrl: z.string().url().optional().or(z.literal("")),
  sessionTimeoutMinutes: z.number().int().min(15).max(43200).optional(),
  allowedIpRanges: z.array(z.string()).optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const settings = await getSecuritySettings(org.orgId);
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
    const parsed = updateSecuritySchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid security settings", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const updated = await updateSecuritySettings(
      org.orgId,
      {
        ...parsed.data,
        ssoDomain: parsed.data.ssoDomain || null,
        ssoClientId: parsed.data.ssoClientId || null,
        ssoMetadataUrl: parsed.data.ssoMetadataUrl || null,
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
