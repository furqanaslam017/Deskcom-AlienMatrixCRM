import { headers } from "next/headers";
import { ok, fail } from "@/lib/api/wrappers";
import { processInboundWebhook } from "@/lib/alien-matrix/inbound-webhooks-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  try {
    const payload = await req.json().catch(() => ({}));
    const result = await processInboundWebhook(token, payload);
    return ok(result, { status: 200, requestId });
  } catch (err) {
    return fail("webhook_processing_failed", (err as Error).message, 400, { requestId });
  }
}
