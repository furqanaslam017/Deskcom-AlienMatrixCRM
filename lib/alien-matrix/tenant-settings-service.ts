import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";
export {
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
  COMMON_TIMEZONES,
} from "./settings-constants";

export interface TenantSettingsInput {
  brandName?: string | null;
  logoUrl?: string | null;
  primaryColorHex?: string;
  accentColorHex?: string;
  customDomain?: string | null;
  timezone?: string;
  currency?: string;
  language?: "en" | "ur" | "ar" | "pt-BR";
  metadata?: Record<string, unknown>;
}


export async function getTenantSettings(orgId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("crm_tenant_settings")
    .select("*")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!data) {
    // Default AlienMatrix tenant settings
    return {
      organization_id: orgId,
      brand_name: "AlienMatrix CRM",
      logo_url: null,
      primary_color_hex: "#2563eb",
      accent_color_hex: "#3b82f6",
      custom_domain: null,
      timezone: "UTC",
      currency: "USD",
      language: "en",
      metadata: {},
    };
  }

  return data;
}

export async function updateTenantSettings(
  orgId: string,
  input: TenantSettingsInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.brandName !== undefined) payload.brand_name = input.brandName?.trim() || null;
  if (input.logoUrl !== undefined) payload.logo_url = input.logoUrl?.trim() || null;
  if (input.primaryColorHex !== undefined) payload.primary_color_hex = input.primaryColorHex;
  if (input.accentColorHex !== undefined) payload.accent_color_hex = input.accentColorHex;
  if (input.customDomain !== undefined) payload.custom_domain = input.customDomain?.trim() || null;
  if (input.timezone !== undefined) payload.timezone = input.timezone;
  if (input.currency !== undefined) payload.currency = input.currency;
  if (input.language !== undefined) payload.language = input.language;
  if (input.metadata !== undefined) payload.metadata = input.metadata;

  const { data, error } = await admin
    .from("crm_tenant_settings")
    .upsert({
      organization_id: orgId,
      ...payload,
    }, { onConflict: "organization_id" })
    .select("*")
    .single();

  if (error || !data) {
    logger.error("[alienmatrix] failed to update tenant settings", { error });
    throw new Error(`Failed to update tenant settings: ${error?.message}`);
  }

  await audit({
    action: "crm_tenant_settings.updated",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_tenant_settings",
    resourceId: data.id,
    requestId: options?.requestId,
    metadata: {
      brand_name: data.brand_name,
      language: data.language,
      currency: data.currency,
      timezone: data.timezone,
    },
  });

  return data;
}
