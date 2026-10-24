import { headers } from "next/headers";
import { ok, fail } from "@/lib/api/wrappers";
import { submitLeadForm } from "@/lib/alien-matrix/lead-forms-service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  try {
    const contentType = req.headers.get("content-type") || "";
    let submissionData: Record<string, any> = {};

    if (contentType.includes("application/json")) {
      submissionData = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      for (const [key, value] of formData.entries()) {
        submissionData[key] = value;
      }
    } else {
      submissionData = await req.json().catch(() => ({}));
    }

    const result = await submitLeadForm(id, submissionData);
    return ok(result, { status: 201, requestId });
  } catch (err) {
    return fail("submission_failed", (err as Error).message, 400, { requestId });
  }
}
