import { headers } from "next/headers";
import { fail } from "@/lib/api/wrappers";
import { requireRole } from "@/lib/auth/require-role";
import { exportTenantData } from "@/lib/alien-matrix/platform-admin-service";

export async function GET() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("admin", { requestId });
  if (!authz.ok) return authz.response;
  const { org } = authz;

  try {
    const dump = await exportTenantData(org.orgId);
    const jsonStr = JSON.stringify(dump, null, 2);

    return new Response(jsonStr, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="alienmatrix-export-${org.name.replace(/\s+/g, "_")}-${new Date().toISOString().split("T")[0]}.json"`,
        "X-Request-Id": requestId || "",
      },
    });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
