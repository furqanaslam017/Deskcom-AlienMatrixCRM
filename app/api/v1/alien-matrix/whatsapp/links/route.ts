import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getWhatsAppLinks, createWhatsAppLink } from "@/lib/alien-matrix/whatsapp-links-service";

const createLinkSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().min(1).max(50),
  whatsappNumberId: z.string().uuid().optional(),
  prefilledText: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  targetPipelineId: z.string().uuid().optional(),
  targetStageId: z.string().uuid().optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const links = await getWhatsAppLinks(org.orgId);
    return ok(links, { requestId });
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
    const parsed = createLinkSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid WhatsApp link configuration", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const created = await createWhatsAppLink(
      org.orgId,
      parsed.data,
      {
        userId: user.id,
        requestId,
      }
    );

    return ok(created, { status: 201, requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
