import { type NextRequest } from "next/server";
import { ok, fail } from "@/lib/api/wrappers";
import { resolveAuthDual } from "@/lib/api/auth-dual";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  const authz = await resolveAuthDual(req, {
    requestId,
    resource: "crm_leads",
    role: "viewer",
    scope: "mcp:read",
  });

  if (!authz.ok) return authz.response;
  const { organizationId } = authz;

  try {
    const admin = createAdminClient();
    const { data: leads, error } = await admin
      .from("crm_leads")
      .select("*, contact:contacts(id, name, email, phone_number), stage:crm_stages(name)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return fail("internal_error", error.message, 500, { requestId });
    }

    return ok(leads ?? [], { requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
