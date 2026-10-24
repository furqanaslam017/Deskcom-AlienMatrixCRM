import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getBroadcastCampaigns, createBroadcastCampaign } from "@/lib/alien-matrix/whatsapp-campaigns-service";

const createBroadcastSchema = z.object({
  name: z.string().min(1).max(100),
  whatsappNumberId: z.string().uuid().optional(),
  templateName: z.string().optional(),
  messageBody: z.string().min(1),
  targetSegment: z.record(z.string(), z.any()).optional(),
  throttleDelaySeconds: z.number().int().min(1).max(60).optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const campaigns = await getBroadcastCampaigns(org.orgId);
    return ok(campaigns, { requestId });
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
    const parsed = createBroadcastSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid broadcast configuration", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const created = await createBroadcastCampaign(
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
