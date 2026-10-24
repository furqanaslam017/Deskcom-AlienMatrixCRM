import type { SupabaseClient } from "@supabase/supabase-js";
import { audit } from "@/lib/audit";

export interface BillingPlan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_monthly_cents: number;
  price_yearly_cents: number;
  currency: string;
  max_seats: number;
  max_whatsapp_numbers: number;
  monthly_ai_tokens: number;
  max_custom_objects: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface TenantSubscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "paused";
  payment_provider: "stripe" | "pix_local" | "manual";
  billing_cycle: "monthly" | "yearly";
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  plan?: BillingPlan;
}

export const DEFAULT_PLANS: Array<Omit<BillingPlan, "id" | "created_at">> = [
  {
    slug: "starter",
    name: "Starter",
    description: "Ideal para pequenas empresas e autônomos iniciando vendas no WhatsApp.",
    price_monthly_cents: 14900, // R$ 149,00
    price_yearly_cents: 149000, // R$ 1.490,00
    currency: "BRL",
    max_seats: 3,
    max_whatsapp_numbers: 1,
    monthly_ai_tokens: 1000000,
    max_custom_objects: 3,
    features: [
      "1 Número de WhatsApp Conectado",
      "Até 3 Usuários na Equipe",
      "1.000.000 Tokens de IA / mês",
      "Funis de Vendas Ilimitados",
      "Suporte por Email e WhatsApp",
    ],
    is_active: true,
  },
  {
    slug: "pro",
    name: "Professional",
    description: "Para equipes em crescimento com múltiplos números e IA avançada.",
    price_monthly_cents: 34900, // R$ 349,00
    price_yearly_cents: 349000, // R$ 3.490,00
    currency: "BRL",
    max_seats: 10,
    max_whatsapp_numbers: 4,
    monthly_ai_tokens: 5000000,
    max_custom_objects: 15,
    features: [
      "4 Números de WhatsApp (WAHA + Meta Cloud)",
      "Até 10 Usuários na Equipe",
      "5.000.000 Tokens de IA / mês (Claude 3.5 Sonnet)",
      "Objetos Customizados e Templates de Nicho",
      "Workflows de Automação e Webhooks",
      "Disparo em Massa Anti-Ban com Throttling",
    ],
    is_active: true,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    description: "Operação de alto volume com IA ilimitada, infraestrutura dedicada e SLA.",
    price_monthly_cents: 89000, // R$ 890,00
    price_yearly_cents: 890000, // R$ 8.900,00
    currency: "BRL",
    max_seats: 50,
    max_whatsapp_numbers: 15,
    monthly_ai_tokens: 25000000,
    max_custom_objects: 50,
    features: [
      "15+ Números de WhatsApp com Balanceamento",
      "Usuários Ilimitados",
      "25.000.000 Tokens de IA / mês",
      "Base de Conhecimento RAG Ilimitada",
      "Gerente de Conta Dedicado e SLA de 1h",
      "Opção de Pagamento Local (PIX/Boleto com NF-e)",
    ],
    is_active: true,
  },
];

export async function listBillingPlans(supabase: SupabaseClient): Promise<BillingPlan[]> {
  const { data, error } = await supabase
    .from("crm_billing_plans")
    .select("*")
    .eq("is_active", true)
    .order("price_monthly_cents", { ascending: true });

  if (error) {
    throw new Error(`Failed to list billing plans: ${error.message}`);
  }

  return (data || []) as BillingPlan[];
}

export async function getTenantSubscription(
  supabase: SupabaseClient,
  organizationId: string
): Promise<TenantSubscription | null> {
  const { data, error } = await supabase
    .from("crm_tenant_subscriptions")
    .select("*, plan:crm_billing_plans(*)")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get subscription: ${error.message}`);
  }

  return data as TenantSubscription | null;
}

export async function updateTenantSubscription(
  supabase: SupabaseClient,
  organizationId: string,
  input: {
    plan_id: string;
    payment_provider?: TenantSubscription["payment_provider"];
    billing_cycle?: TenantSubscription["billing_cycle"];
  },
  actorUserId?: string
): Promise<TenantSubscription> {
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 86400000).toISOString();

  const { data, error } = await supabase
    .from("crm_tenant_subscriptions")
    .upsert(
      {
        organization_id: organizationId,
        plan_id: input.plan_id,
        payment_provider: input.payment_provider || "stripe",
        billing_cycle: input.billing_cycle || "monthly",
        status: "active",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd,
        updated_at: now.toISOString(),
      },
      { onConflict: "organization_id" }
    )
    .select("*, plan:crm_billing_plans(*)")
    .single();

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  await audit({
    organizationId,
    actorUserId: actorUserId || null,
    action: "crm_subscription.plan_changed",
    resourceType: "crm_tenant_subscriptions",
    resourceId: data.id,
    metadata: { plan_id: input.plan_id, provider: data.payment_provider, cycle: data.billing_cycle },
  });

  return data as TenantSubscription;
}

export async function verifyUsageLimits(
  supabase: SupabaseClient,
  organizationId: string
): Promise<{
  seats_used: number;
  max_seats: number;
  seats_ok: boolean;
  numbers_used: number;
  max_numbers: number;
  numbers_ok: boolean;
  objects_used: number;
  max_objects: number;
  objects_ok: boolean;
}> {
  const sub = await getTenantSubscription(supabase, organizationId);
  const plan = sub?.plan;

  const maxSeats = plan?.max_seats || 5;
  const maxNumbers = plan?.max_whatsapp_numbers || 2;
  const maxObjects = plan?.max_custom_objects || 10;

  // Count current members
  const { count: membersCount } = await supabase
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  // Count whatsapp numbers
  const { count: numbersCount } = await supabase
    .from("crm_whatsapp_numbers")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  // Count custom objects
  const { count: objectsCount } = await supabase
    .from("custom_objects")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const seatsUsed = membersCount || 1;
  const numbersUsed = numbersCount || 0;
  const objectsUsed = objectsCount || 0;

  return {
    seats_used: seatsUsed,
    max_seats: maxSeats,
    seats_ok: seatsUsed <= maxSeats,
    numbers_used: numbersUsed,
    max_numbers: maxNumbers,
    numbers_ok: numbersUsed <= maxNumbers,
    objects_used: objectsUsed,
    max_objects: maxObjects,
    objects_ok: objectsUsed <= maxObjects,
  };
}
