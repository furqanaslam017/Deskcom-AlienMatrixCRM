import type { SupabaseClient } from "@supabase/supabase-js";
import { audit } from "@/lib/audit";

export interface TenantAiSettings {
  organization_id: string;
  active_provider: "anthropic" | "openai" | "google" | "openrouter" | "local_ollama";
  primary_model: string;
  fast_model: string;
  embedding_provider: "openai" | "google";
  api_keys: Record<string, string>;
  monthly_token_budget: number;
  monthly_cost_limit_cents: number;
  budget_alert_threshold_percent: number;
  hard_stop_on_budget: boolean;
  lead_scoring_enabled: boolean;
  sentiment_analysis_enabled: boolean;
  auto_fill_fields_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 8) return "••••••••";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

export const DEFAULT_AI_SETTINGS: Omit<TenantAiSettings, "organization_id"> = {
  active_provider: "anthropic",
  primary_model: "claude-3-5-sonnet-20241022",
  fast_model: "claude-3-5-haiku-20241022",
  embedding_provider: "openai",
  api_keys: {},
  monthly_token_budget: 1000000,
  monthly_cost_limit_cents: 5000,
  budget_alert_threshold_percent: 80,
  hard_stop_on_budget: true,
  lead_scoring_enabled: true,
  sentiment_analysis_enabled: true,
  auto_fill_fields_enabled: true,
};

export async function getTenantAiSettings(
  supabase: SupabaseClient,
  organizationId: string
): Promise<TenantAiSettings> {
  const { data, error } = await supabase
    .from("crm_tenant_ai_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load AI settings: ${error.message}`);
  }

  if (!data) {
    return {
      organization_id: organizationId,
      ...DEFAULT_AI_SETTINGS,
    };
  }

  // Mask sensitive keys before returning
  const maskedKeys: Record<string, string> = {};
  if (data.api_keys && typeof data.api_keys === "object") {
    for (const [provider, k] of Object.entries(data.api_keys)) {
      if (typeof k === "string") {
        maskedKeys[provider] = maskApiKey(k);
      }
    }
  }

  return {
    ...data,
    api_keys: maskedKeys,
  };
}

export async function updateTenantAiSettings(
  supabase: SupabaseClient,
  organizationId: string,
  settings: Partial<TenantAiSettings>,
  actorUserId?: string
): Promise<TenantAiSettings> {
  // If api_keys are provided, preserve existing ones if masked values were submitted
  let mergedKeys: Record<string, string> | undefined = undefined;
  if (settings.api_keys) {
    const { data: current } = await supabase
      .from("crm_tenant_ai_settings")
      .select("api_keys")
      .eq("organization_id", organizationId)
      .maybeSingle();

    const existingKeys = (current?.api_keys as Record<string, string>) || {};
    mergedKeys = { ...existingKeys };

    for (const [provider, val] of Object.entries(settings.api_keys)) {
      if (val && !val.includes("••••")) {
        mergedKeys[provider] = val;
      }
    }
  }

  const payload: Record<string, unknown> = {
    organization_id: organizationId,
    updated_at: new Date().toISOString(),
  };

  if (settings.active_provider !== undefined) payload.active_provider = settings.active_provider;
  if (settings.primary_model !== undefined) payload.primary_model = settings.primary_model;
  if (settings.fast_model !== undefined) payload.fast_model = settings.fast_model;
  if (settings.embedding_provider !== undefined) payload.embedding_provider = settings.embedding_provider;
  if (mergedKeys !== undefined) payload.api_keys = mergedKeys;
  if (settings.monthly_token_budget !== undefined) payload.monthly_token_budget = settings.monthly_token_budget;
  if (settings.monthly_cost_limit_cents !== undefined) payload.monthly_cost_limit_cents = settings.monthly_cost_limit_cents;
  if (settings.budget_alert_threshold_percent !== undefined) payload.budget_alert_threshold_percent = settings.budget_alert_threshold_percent;
  if (settings.hard_stop_on_budget !== undefined) payload.hard_stop_on_budget = settings.hard_stop_on_budget;
  if (settings.lead_scoring_enabled !== undefined) payload.lead_scoring_enabled = settings.lead_scoring_enabled;
  if (settings.sentiment_analysis_enabled !== undefined) payload.sentiment_analysis_enabled = settings.sentiment_analysis_enabled;
  if (settings.auto_fill_fields_enabled !== undefined) payload.auto_fill_fields_enabled = settings.auto_fill_fields_enabled;

  const { data, error } = await supabase
    .from("crm_tenant_ai_settings")
    .upsert(payload, { onConflict: "organization_id" })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update AI settings: ${error.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_ai_settings.updated",
    resourceType: "crm_tenant_ai_settings",
    resourceId: organizationId,
    metadata: {
      active_provider: payload.active_provider,
      primary_model: payload.primary_model,
      lead_scoring_enabled: payload.lead_scoring_enabled,
    },
  });

  return getTenantAiSettings(supabase, organizationId);
}
