import { headers } from "next/headers";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { getCallLogs, createCallLog } from "@/lib/alien-matrix/calendar-service";

const createCallLogSchema = z.object({
  leadId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  activityType: z.enum(["call", "meeting", "demo", "video_call", "whatsapp_call"]).optional().default("call"),
  direction: z.enum(["inbound", "outbound"]).optional().default("outbound"),
  outcome: z.enum(["connected", "busy", "no_answer", "left_voicemail", "completed", "rescheduled", "cancelled"]).optional().default("completed"),
  subject: z.string().min(1).max(255),
  notes: z.string().max(3000).optional(),
  durationSeconds: z.number().int().nonnegative().optional().default(0),
  scheduledAt: z.string().optional(),
  performedAt: z.string().optional(),
  recordingUrl: z.string().url().optional().or(z.literal("")),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: Request) {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("lead_id") || undefined;
  const contactId = searchParams.get("contact_id") || undefined;
  const activityType = searchParams.get("type") || undefined;

  try {
    const logs = await getCallLogs(org.orgId, { leadId, contactId, activityType });
    return ok(logs, { requestId });
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
    const parsed = createCallLogSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid call log payload", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const created = await createCallLog(
      org.orgId,
      {
        ...parsed.data,
        recordingUrl: parsed.data.recordingUrl || undefined,
      },
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
