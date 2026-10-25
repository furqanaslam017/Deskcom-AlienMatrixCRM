import { type NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail } from "@/lib/api/wrappers";
import { resolveAuthDual } from "@/lib/api/auth-dual";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";

const createLeadActionSchema = z.object({
  name: z.string().min(1).max(150),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  title: z.string().min(1).max(200).optional(),
  value: z.number().nonnegative().optional(),
  currency: z.string().max(3).optional(),
  pipelineId: z.string().uuid().optional().nullable(),
  stageId: z.string().uuid().optional().nullable(),
  source: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  const authz = await resolveAuthDual(req, {
    requestId,
    resource: "crm_leads",
    role: "agent",
    scope: "mcp:write",
  });

  if (!authz.ok) return authz.response;
  const { organizationId, actor } = authz;

  try {
    const body = await req.json();
    const parsed = createLeadActionSchema.safeParse(body);
    if (!parsed.success) {
      return fail("validation_error", "Invalid lead data", 400, {
        requestId,
        details: parsed.error.flatten(),
      });
    }

    const { name, email, phone, title, value = 0, currency = "USD", pipelineId, stageId, source = "integration" } = parsed.data;
    const admin = createAdminClient();

    // 1. Find or create contact
    let contactId: string | null = null;
    if (email || phone) {
      if (email) {
        const { data } = await admin.from("contacts").select("id").eq("organization_id", organizationId).eq("email", email.toLowerCase()).maybeSingle();
        if (data) contactId = data.id;
      }
      if (!contactId && phone) {
        const { data } = await admin.from("contacts").select("id").eq("organization_id", organizationId).eq("phone_number", phone).maybeSingle();
        if (data) contactId = data.id;
      }
    }

    if (!contactId) {
      const { data: newContact, error: contactErr } = await admin
        .from("contacts")
        .insert({
          organization_id: organizationId,
          name,
          email: email ? email.toLowerCase() : null,
          phone_number: phone || null,
          source: `integration:${source}`,
        })
        .select("id")
        .single();

      if (contactErr || !newContact) {
        return fail("internal_error", contactErr?.message ?? "Failed to create contact", 500, { requestId });
      }
      contactId = newContact.id;
    }

    // 2. Resolve default stage if not supplied
    let targetStageId = stageId;
    if (!targetStageId) {
      const { data: stages } = await admin
        .from("crm_stages")
        .select("id")
        .eq("organization_id", organizationId)
        .order("order_index", { ascending: true })
        .limit(1);
      if (stages && stages.length > 0 && stages[0]) {
        targetStageId = stages[0].id;
      }
    }

    // 3. Create lead
    const valueCents = Math.round(value * 100);
    const leadTitle = title || `${name} — ${source}`;

    const { data: lead, error: leadErr } = await admin
      .from("crm_leads")
      .insert({
        organization_id: organizationId,
        contact_id: contactId,
        pipeline_id: pipelineId || null,
        stage_id: targetStageId || null,
        title: leadTitle,
        value_cents: valueCents,
        currency,
        status: "open",
        source,
      })
      .select("*, contact:contacts(id, name, email, phone_number)")
      .single();

    if (leadErr || !lead) {
      return fail("internal_error", leadErr?.message ?? "Failed to create lead", 500, { requestId });
    }

    await audit({
      action: "lead.created",
      organizationId,
      actorUserId: actor.type === "user" ? actor.id : null,
      resourceType: "crm_leads",
      resourceId: lead.id,
      requestId,
      metadata: { source, title: leadTitle, via: authz.via },
    });

    return ok(lead, { status: 201, requestId });
  } catch (err) {
    return fail("internal_error", (err as Error).message, 500, { requestId });
  }
}
