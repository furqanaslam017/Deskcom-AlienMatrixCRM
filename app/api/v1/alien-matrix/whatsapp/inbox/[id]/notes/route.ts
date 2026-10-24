import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { addInternalNote } from "@/lib/alien-matrix/whatsapp-inbox-service";

const addNoteSchema = z.object({
  content: z.string().min(1).max(2000),
  mentionedUserIds: z.array(z.string().uuid()).optional(),
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
    const parsed = addNoteSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid note payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const note = await addInternalNote(
      org.orgId,
      {
        conversationId: id,
        content: parsed.data.content,
        mentionedUserIds: parsed.data.mentionedUserIds,
      },
      {
        userId: user.id,
        requestId,
      }
    );

    return ok(note, { status: 201, requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
