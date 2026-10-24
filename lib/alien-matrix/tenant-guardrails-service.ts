import { createAdminClient } from "@/lib/supabase/admin";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";

export interface TenantGuardrailsConfig {
  stopOptoutEnabled: boolean;
  lgpdEnabled: boolean;
  antiBanPacingEnabled: boolean;
  messagingWindowEnabled: boolean;
  spinningEnabled: boolean;
  promiseSemanticEnabled: boolean;
  disclosureEnabled: boolean;
  maxHourlySends: number;
  emergencyKillswitch: boolean;
  customBlockedWords: string[];
}

export const DEFAULT_GUARDRAILS: TenantGuardrailsConfig = {
  stopOptoutEnabled: true,
  lgpdEnabled: true,
  antiBanPacingEnabled: true,
  messagingWindowEnabled: true,
  spinningEnabled: true,
  promiseSemanticEnabled: true,
  disclosureEnabled: true,
  maxHourlySends: 60,
  emergencyKillswitch: false,
  customBlockedWords: ["grátis garantido", "100% de lucro sem risco", "dinheiro fácil"],
};

export async function getTenantGuardrails(orgId: string): Promise<TenantGuardrailsConfig> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("crm_tenant_guardrails")
    .select("*")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (error) {
    logger.error("[alienmatrix] failed to get guardrails", { error });
  }

  if (!data) {
    return DEFAULT_GUARDRAILS;
  }

  return {
    stopOptoutEnabled: data.stop_optout_enabled,
    lgpdEnabled: data.lgpd_enabled,
    antiBanPacingEnabled: data.anti_ban_pacing_enabled,
    messagingWindowEnabled: data.messaging_window_enabled,
    spinningEnabled: data.spinning_enabled,
    promiseSemanticEnabled: data.promise_semantic_enabled,
    disclosureEnabled: data.disclosure_enabled,
    maxHourlySends: data.max_hourly_sends,
    emergencyKillswitch: data.emergency_killswitch,
    customBlockedWords: Array.isArray(data.custom_blocked_words) ? data.custom_blocked_words : [],
  };
}

export async function updateTenantGuardrails(
  orgId: string,
  config: Partial<TenantGuardrailsConfig>,
  options?: { userId?: string; requestId?: string }
) {
  const admin = createAdminClient();
  const payload: Record<string, any> = {
    organization_id: orgId,
    updated_at: new Date().toISOString(),
  };

  if (config.stopOptoutEnabled !== undefined) payload.stop_optout_enabled = config.stopOptoutEnabled;
  if (config.lgpdEnabled !== undefined) payload.lgpd_enabled = config.lgpdEnabled;
  if (config.antiBanPacingEnabled !== undefined) payload.anti_ban_pacing_enabled = config.antiBanPacingEnabled;
  if (config.messagingWindowEnabled !== undefined) payload.messaging_window_enabled = config.messagingWindowEnabled;
  if (config.spinningEnabled !== undefined) payload.spinning_enabled = config.spinningEnabled;
  if (config.promiseSemanticEnabled !== undefined) payload.promise_semantic_enabled = config.promiseSemanticEnabled;
  if (config.disclosureEnabled !== undefined) payload.disclosure_enabled = config.disclosureEnabled;
  if (config.maxHourlySends !== undefined) payload.max_hourly_sends = config.maxHourlySends;
  if (config.emergencyKillswitch !== undefined) payload.emergency_killswitch = config.emergencyKillswitch;
  if (config.customBlockedWords !== undefined) payload.custom_blocked_words = config.customBlockedWords;

  const { data, error } = await admin
    .from("crm_tenant_guardrails")
    .upsert(payload, { onConflict: "organization_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update guardrails: ${error?.message}`);
  }

  await audit({
    action: "crm_guardrails.updated",
    organizationId: orgId,
    actorUserId: options?.userId || null,
    resourceType: "crm_tenant_guardrails",
    resourceId: orgId,
    requestId: options?.requestId,
    metadata: { config },
  });

  return data;
}
