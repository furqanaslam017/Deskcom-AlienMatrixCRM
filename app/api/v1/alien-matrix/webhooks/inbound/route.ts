import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import {
  getInboundWebhooks,
  createInboundWebhook,
  deleteInboundWebhook,
} from "@/lib/alien-matrix/inbound-webhooks-service";

const createWebhookSchema = z.object({
  name: z.string().min(1).max(100),
  targetEntity: z.enum(["lead", "contact", "custom_record"]).optional(),
  fieldMapping: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const webhooks = await getInboundWebhooks(org.orgId);
    return ok(webhooks, { requestId });
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
    const parsed = createWebhookSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid webhook configuration", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const created = await createInboundWebhook(
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
