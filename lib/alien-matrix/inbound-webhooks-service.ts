import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface CreateWebhookInput {
  name: string;
  targetEntity?: "lead" | "contact" | "custom_record";
  fieldMapping?: Record<string, string>; // e.g. { "user_email": "email", "client_name": "name" }
  isActive?: boolean;
}

export async function getInboundWebhooks(orgId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_inbound_webhooks")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("[alienmatrix] failed to get inbound webhooks", { error });
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createInboundWebhook(
  orgId: string,
  input: CreateWebhookInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const token = `whk_${randomBytes(16).toString("hex")}`;

  const { data, error } = await admin
    .from("crm_inbound_webhooks")
    .insert({
      organization_id: orgId,
      name: input.name,
      token,
      target_entity: input.targetEntity || "lead",
      field_mapping: input.fieldMapping || {},
      is_active: input.isActive !== undefined ? input.isActive : true,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create webhook: ${error?.message}`);
  }

  await audit({
    action: "crm_webhook.created",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_inbound_webhooks",
    resourceId: data.id,
    requestId: options?.requestId,
    metadata: { name: data.name, token_prefix: token.slice(0, 8) },
  });

  return data;
}

export async function deleteInboundWebhook(orgId: string, webhookId: string) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("crm_inbound_webhooks")
    .delete()
    .eq("organization_id", orgId)
    .eq("id", webhookId);

  if (error) throw new Error(error.message);
  return { success: true };
}

/**
 * Handles incoming webhook calls from Zapier, Make, n8n, Typeform, etc.
 */
export async function processInboundWebhook(token: string, payload: Record<string, any>) {
  const admin = createAdminClient();

  const { data: webhook } = await admin
    .from("crm_inbound_webhooks")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (!webhook || !webhook.is_active) {
    throw new Error("Invalid or inactive webhook token");
  }

  const orgId = webhook.organization_id;
  const mapping = (webhook.field_mapping as Record<string, string>) || {};

  // Map payload
  const mapped: Record<string, any> = {};
  for (const [externalKey, internalKey] of Object.entries(mapping)) {
    if (payload[externalKey] !== undefined) {
      mapped[internalKey] = payload[externalKey];
    }
  }

  const name = mapped.name || payload.name || payload.full_name || "Lead via Webhook";
  const email = mapped.email || payload.email || null;
  const phone = mapped.phone || payload.phone || payload.phone_number || null;

  // 1. Create or match contact
  let contactId: string | null = null;
  if (email || phone) {
    let existing = null;
    if (email) {
      const { data } = await admin.from("contacts").select("id").eq("organization_id", orgId).eq("email", String(email).toLowerCase()).maybeSingle();
      existing = data;
    }
    if (!existing && phone) {
      const { data } = await admin.from("contacts").select("id").eq("organization_id", orgId).eq("phone_number", String(phone)).maybeSingle();
      existing = data;
    }
    if (existing) contactId = existing.id;
  }

  if (!contactId) {
    const { data: newContact } = await admin
      .from("contacts")
      .insert({
        organization_id: orgId,
        name,
        email: email ? String(email).toLowerCase().trim() : null,
        phone_number: phone ? String(phone).trim() : null,
        source: `webhook:${webhook.name}`,
      })
      .select("id")
      .single();
    contactId = newContact?.id || null;
  }

  // 2. Create lead
  const valCents = Math.round(Number(mapped.value || payload.value || 0) * 100);
  const { data: lead } = await admin
    .from("crm_leads")
    .insert({
      organization_id: orgId,
      contact_id: contactId,
      title: mapped.title || `${name} — Oportunidade`,
      value_cents: valCents,
      currency: mapped.currency || payload.currency || "USD",
      status: "open",
      source: "inbound_webhook",
      source_metadata: {
        webhook_id: webhook.id,
        raw_payload: payload,
      },
    })
    .select("id")
    .single();

  // 3. Increment usage counter
  await admin
    .from("crm_inbound_webhooks")
    .update({
      calls_count: (webhook.calls_count || 0) + 1,
      last_called_at: new Date().toISOString(),
    })
    .eq("id", webhook.id);

  // 4. Audit
  await audit({
    action: "crm_webhook.called",
    organizationId: orgId,
    resourceType: "crm_inbound_webhooks",
    resourceId: webhook.id,
    metadata: {
      webhook_name: webhook.name,
      lead_id: lead?.id,
    },
  });

  return { success: true, leadId: lead?.id, contactId };
}
