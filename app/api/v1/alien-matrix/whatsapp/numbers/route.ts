import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getWhatsAppNumbers, createWhatsAppNumber } from "@/lib/alien-matrix/whatsapp-numbers-service";

const createNumberSchema = z.object({
  name: z.string().min(1).max(100),
  phoneNumber: z.string().min(5).max(30),
  provider: z.enum(["waha", "meta_cloud"]).optional(),
  wahaSessionName: z.string().optional(),
  metaPhoneNumberId: z.string().optional(),
  metaWabaId: z.string().optional(),
  metaAccessToken: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const numbers = await getWhatsAppNumbers(org.orgId);
    return ok(numbers, { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}

export async function POST(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("admin", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = createNumberSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid WhatsApp number configuration", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const created = await createWhatsAppNumber(
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
