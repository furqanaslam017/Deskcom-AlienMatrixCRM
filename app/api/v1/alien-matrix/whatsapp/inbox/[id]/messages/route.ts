import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { sendWhatsAppMessage } from "@/lib/alien-matrix/whatsapp-inbox-service";

const sendMessageSchema = z.object({
  messageType: z.enum(["text", "image", "video", "audio", "document", "location", "contact", "sticker", "invoice", "quote"]).optional(),
  content: z.string().min(1),
  mediaUrl: z.string().url().optional(),
  mediaMetadata: z.record(z.string(), z.any()).optional(),
  quotedMessageId: z.string().uuid().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("agent", { requestId });
  if (!authz.ok) return authz.response;
  const { user, org } = authz;

  try {
    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid message payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const message = await sendWhatsAppMessage(
      org.orgId,
      {
        conversationId: id,
        ...parsed.data,
      },
      {
        userId: user.id,
        requestId,
      }
    );

    return ok(message, { status: 201, requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
