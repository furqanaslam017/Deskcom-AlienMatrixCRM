import type { SupabaseClient } from "@supabase/supabase-js";
import { audit } from "@/lib/audit";
import { getTenantAiSettings } from "./ai-settings-service";

export interface AIUsageLog {
  id: string;
  organization_id: string;
  model: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_cents: number;
  operation_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Model pricing in cents per 1,000 tokens (e.g. Claude 3.5 Sonnet: ~$0.003/1k input = 0.3c, $0.015/1k output = 1.5c)
export const MODEL_PRICING_CENTS_PER_1K: Record<
  string,
  { inputCents: number; outputCents: number }
> = {
  "claude-3-5-sonnet-20241022": { inputCents: 0.3, outputCents: 1.5 },
  "claude-3-5-haiku-20241022": { inputCents: 0.08, outputCents: 0.4 },
  "gpt-4o": { inputCents: 0.25, outputCents: 1.0 },
  "gpt-4o-mini": { inputCents: 0.015, outputCents: 0.06 },
  "gemini-1.5-pro": { inputCents: 0.125, outputCents: 0.5 },
  "gemini-1.5-flash": { inputCents: 0.0075, outputCents: 0.03 },
  "local-llama-3": { inputCents: 0.0, outputCents: 0.0 },
};

export function calculateUsageCostCents(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING_CENTS_PER_1K[model] ?? {
    inputCents: 0.1,
    outputCents: 0.5,
  };
  const inputCost = (promptTokens / 1000) * pricing.inputCents;
  const outputCost = (completionTokens / 1000) * pricing.outputCents;
  return Math.max(1, Math.round(inputCost + outputCost));
}

export async function logAIUsage(
  supabase: SupabaseClient,
  organizationId: string,
  input: {
    model: string;
    provider: string;
    prompt_tokens: number;
    completion_tokens: number;
    operation_type: string;
    metadata?: Record<string, unknown>;
  }
): Promise<AIUsageLog> {
  const totalTokens = input.prompt_tokens + input.completion_tokens;
  const costCents = calculateUsageCostCents(input.model, input.prompt_tokens, input.completion_tokens);

  const { data, error } = await supabase
    .from("crm_ai_usage_logs")
    .insert({
      organization_id: organizationId,
      model: input.model,
      provider: input.provider,
      prompt_tokens: input.prompt_tokens,
      completion_tokens: input.completion_tokens,
      total_tokens: totalTokens,
      cost_cents: costCents,
      operation_type: input.operation_type,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to log AI usage: ${error.message}`);
  }

  return data as AIUsageLog;
}

export async function getTenantUsageTelemetry(
  supabase: SupabaseClient,
  organizationId: string
): Promise<{
  monthly_token_budget: number;
  monthly_cost_limit_cents: number;
  used_tokens: number;
  used_cost_cents: number;
  token_usage_percent: number;
  cost_usage_percent: number;
  budget_alert_active: boolean;
  hard_stop_triggered: boolean;
  total_operations: number;
}> {
  const settings = await getTenantAiSettings(supabase, organizationId);

  // Calculate current month bounds
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: logs, error } = await supabase
    .from("crm_ai_usage_logs")
    .select("total_tokens, cost_cents")
    .eq("organization_id", organizationId)
    .gte("created_at", startOfMonth);

  if (error) {
    throw new Error(`Failed to load usage logs: ${error.message}`);
  }

  let usedTokens = 0;
  let usedCostCents = 0;
  const totalOps = logs?.length || 0;

  for (const log of logs || []) {
    usedTokens += log.total_tokens || 0;
    usedCostCents += log.cost_cents || 0;
  }

  const tokenUsagePercent = Math.min(
    100,
    Math.round((usedTokens / Math.max(1, settings.monthly_token_budget)) * 100)
  );
  const costUsagePercent = Math.min(
    100,
    Math.round((usedCostCents / Math.max(1, settings.monthly_cost_limit_cents)) * 100)
  );

  const maxPercent = Math.max(tokenUsagePercent, costUsagePercent);
  const budgetAlertActive = maxPercent >= settings.budget_alert_threshold_percent;
  const hardStopTriggered = settings.hard_stop_on_budget && maxPercent >= 100;

  return {
    monthly_token_budget: settings.monthly_token_budget,
    monthly_cost_limit_cents: settings.monthly_cost_limit_cents,
    used_tokens: usedTokens,
    used_cost_cents: usedCostCents,
    token_usage_percent: tokenUsagePercent,
    cost_usage_percent: costUsagePercent,
    budget_alert_active: budgetAlertActive,
    hard_stop_triggered: hardStopTriggered,
    total_operations: totalOps,
  };
}
