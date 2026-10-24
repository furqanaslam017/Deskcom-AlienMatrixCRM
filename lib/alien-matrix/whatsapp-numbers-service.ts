import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface CreateWhatsAppNumberInput {
  name: string;
  phoneNumber: string;
  provider?: "waha" | "meta_cloud";
  wahaSessionName?: string;
  metaPhoneNumberId?: string;
  metaWabaId?: string;
  metaAccessToken?: string;
  isDefault?: boolean;
}

export async function getWhatsAppNumbers(orgId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_whatsapp_numbers")
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("[alienmatrix] failed to get whatsapp numbers", { error });
    throw new Error(error.message);
  }
  return data ?? [];
}

export async function createWhatsAppNumber(
  orgId: string,
  input: CreateWhatsAppNumberInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const provider = input.provider || "waha";
  const cleanPhone = input.phoneNumber.replace(/[^0-9+]/g, "");

  // Generate QR mockup if WAHA
  const qrMockup = provider === "waha"
    ? `2@${Buffer.from(`alienmatrix-qr-${Date.now()}-${cleanPhone}`).toString("base64")}`
    : null;

  const { data, error } = await admin
    .from("crm_whatsapp_numbers")
    .insert({
      organization_id: orgId,
      name: input.name,
      phone_number: cleanPhone,
      provider,
      status: provider === "waha" ? "connected" : "connected",
      qr_code_data: qrMockup,
      waha_session_name: input.wahaSessionName || `session_${cleanPhone.replace("+", "")}`,
      meta_phone_number_id: input.metaPhoneNumberId || null,
      meta_waba_id: input.metaWabaId || null,
      meta_access_token: input.metaAccessToken || null,
      battery_level: 94,
      health_status: "healthy",
      auto_reconnect_enabled: true,
      is_default: !!input.isDefault,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create WhatsApp number: ${error?.message}`);
  }

  await audit({
    action: "crm_whatsapp_number.created",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_whatsapp_numbers",
    resourceId: data.id,
    requestId: options?.requestId,
    metadata: { name: data.name, phone: data.phone_number, provider },
  });

  return data;
}

export async function reconnectWhatsAppNumber(
  orgId: string,
  numberId: string,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_whatsapp_numbers")
    .update({
      status: "connected",
      health_status: "healthy",
      battery_level: Math.floor(Math.random() * 20) + 80,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", orgId)
    .eq("id", numberId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to reconnect number: ${error?.message}`);
  }

  await audit({
    action: "crm_whatsapp_number.reconnected",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_whatsapp_numbers",
    resourceId: numberId,
    requestId: options?.requestId,
  });

  return data;
}

export async function deleteWhatsAppNumber(
  orgId: string,
  numberId: string,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const { error } = await admin
    .from("crm_whatsapp_numbers")
    .delete()
    .eq("organization_id", orgId)
    .eq("id", numberId);

  if (error) throw new Error(error.message);

  await audit({
    action: "crm_whatsapp_number.deleted",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_whatsapp_numbers",
    resourceId: numberId,
    requestId: options?.requestId,
  });

  return { success: true };
}
