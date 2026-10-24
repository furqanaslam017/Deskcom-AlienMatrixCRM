import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getChatbots, createChatbot } from "@/lib/alien-matrix/whatsapp-chatbots-service";

const createChatbotSchema = z.object({
  name: z.string().min(1).max(100),
  whatsappNumberId: z.string().uuid().optional(),
  keywords: z.array(z.string()).min(1),
  flowType: z.enum(["keyword", "menu", "business_hours"]).optional(),
  menuOptions: z.array(z.object({
    key: z.string(),
    label: z.string(),
    action: z.string(),
  })).optional(),
  responseText: z.string().min(1),
  fallbackMode: z.enum(["ai_agent", "human_handoff", "end"]).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const chatbots = await getChatbots(org.orgId);
    return ok(chatbots, { requestId });
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
    const parsed = createChatbotSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid chatbot configuration", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const created = await createChatbot(
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
