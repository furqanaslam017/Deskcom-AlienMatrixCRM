import type { Metadata } from "next";
import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DealsViewClient } from "@/components/alien-matrix/DealsViewClient";
import { Handshake } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Negócios & Oportunidades | CRM" };

export default async function CrmDealsPage() {
  const user = await requireAuth();
  const activeOrg = await resolveActiveOrg(user);

  if (!activeOrg) {
    return (
      <div className="p-8 text-center text-sm text-zinc-500">
        Nenhuma organização ativa selecionada.
      </div>
    );
  }

  const admin = createAdminClient();

  // Load pipelines
  const { data: pipelines } = await admin
    .from("crm_pipelines")
    .select("id, name, is_default")
    .eq("organization_id", activeOrg.orgId)
    .order("is_default", { ascending: false });

  // Load stages
  const { data: stages } = await admin
    .from("crm_stages")
    .select("id, name, pipeline_id, color, position")
    .eq("organization_id", activeOrg.orgId)
    .eq("is_archived", false)
    .order("position", { ascending: true });

  // Load leads/deals
  const { data: leads } = await admin
    .from("crm_leads")
    .select(`
      id,
      title,
      status,
      value_cents,
      currency,
      created_at,
      contact:contacts(id, name, email, phone_number),
      stage:crm_stages(id, name, color),
      pipeline:crm_pipelines(id, name)
    `)
    .eq("organization_id", activeOrg.orgId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Handshake size={24} weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Negócios & Oportunidades
            </h1>
            <p className="text-xs text-zinc-500">
              Gestão de pipeline de vendas, estágios de fechamento e conversão de leads qualificados.
            </p>
          </div>
        </div>
      </div>

      <DealsViewClient
        initialDeals={(leads as any) ?? []}
        pipelines={pipelines ?? []}
        stages={stages ?? []}
      />
    </div>
  );
}
