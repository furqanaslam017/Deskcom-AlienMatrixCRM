import type { Metadata } from "next";
import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WorkflowsViewClient } from "@/components/alien-matrix/WorkflowsViewClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Automações & Workflows | CRM" };

export default async function CrmWorkflowsPage() {
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

  // Load workflows
  const { data: workflows } = await admin
    .from("crm_workflows")
    .select("*")
    .eq("organization_id", activeOrg.orgId)
    .order("created_at", { ascending: false });

  // Load forms
  const { data: forms } = await admin
    .from("crm_lead_forms")
    .select("*, pipeline:crm_pipelines(name), stage:crm_stages(name)")
    .eq("organization_id", activeOrg.orgId)
    .order("created_at", { ascending: false });

  // Load inbound webhooks
  const { data: webhooks } = await admin
    .from("crm_inbound_webhooks")
    .select("*")
    .eq("organization_id", activeOrg.orgId)
    .order("created_at", { ascending: false });

  return (
    <WorkflowsViewClient
      initialWorkflows={workflows ?? []}
      initialForms={forms ?? []}
      initialWebhooks={webhooks ?? []}
    />
  );
}
