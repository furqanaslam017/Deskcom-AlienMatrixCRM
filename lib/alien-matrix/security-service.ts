import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface SecuritySettingsInput {
  enforce2fa?: boolean;
  ssoProvider?: "none" | "google" | "microsoft" | "saml_oidc";
  ssoDomain?: string | null;
  ssoClientId?: string | null;
  ssoMetadataUrl?: string | null;
  sessionTimeoutMinutes?: number;
  allowedIpRanges?: string[];
}

export async function getSecuritySettings(orgId: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("crm_security_settings")
    .select("*")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!data) {
    // Return default values
    return {
      organization_id: orgId,
      enforce_2fa: false,
      sso_provider: "none",
      sso_domain: null,
      sso_client_id: null,
      sso_metadata_url: null,
      session_timeout_minutes: 1440,
      allowed_ip_ranges: [],
    };
  }

  return data;
}

export async function updateSecuritySettings(
  orgId: string,
  input: SecuritySettingsInput,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.enforce2fa !== undefined) payload.enforce_2fa = input.enforce2fa;
  if (input.ssoProvider !== undefined) payload.sso_provider = input.ssoProvider;
  if (input.ssoDomain !== undefined) payload.sso_domain = input.ssoDomain?.trim() || null;
  if (input.ssoClientId !== undefined) payload.sso_client_id = input.ssoClientId?.trim() || null;
  if (input.ssoMetadataUrl !== undefined) payload.sso_metadata_url = input.ssoMetadataUrl?.trim() || null;
  if (input.sessionTimeoutMinutes !== undefined) payload.session_timeout_minutes = input.sessionTimeoutMinutes;
  if (input.allowedIpRanges !== undefined) payload.allowed_ip_ranges = input.allowedIpRanges;

  const { data, error } = await admin
    .from("crm_security_settings")
    .upsert({
      organization_id: orgId,
      ...payload,
    }, { onConflict: "organization_id" })
    .select("*")
    .single();

  if (error || !data) {
    logger.error("[alienmatrix] failed to update security settings", { error });
    throw new Error(`Failed to update security settings: ${error?.message}`);
  }

  await audit({
    action: "crm_security.updated",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_security_settings",
    resourceId: data.id,
    requestId: options?.requestId,
    metadata: {
      enforce_2fa: data.enforce_2fa,
      sso_provider: data.sso_provider,
    },
  });

  return data;
}
