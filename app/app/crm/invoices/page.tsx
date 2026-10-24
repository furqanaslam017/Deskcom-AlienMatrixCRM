import type { Metadata } from "next";
import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { InvoicesViewClient } from "@/components/alien-matrix/InvoicesViewClient";
import { Receipt } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Faturas & Orçamentos | CRM" };

export default async function CrmInvoicesPage() {
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

  const { data: invoices } = await admin
    .from("crm_invoices")
    .select(`
      id,
      invoice_number,
      kind,
      status,
      title,
      total_cents,
      currency,
      issue_date,
      due_date,
      contact:contacts(name, email),
      company:companies(trade_name)
    `)
    .eq("organization_id", activeOrg.orgId)
    .order("created_at", { ascending: false });

  const { data: products } = await admin
    .from("crm_products")
    .select("id, name, unit_price_cents, currency")
    .eq("organization_id", activeOrg.orgId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  const { data: contacts } = await admin
    .from("contacts")
    .select("id, name")
    .eq("organization_id", activeOrg.orgId)
    .is("merged_at", null)
    .order("name", { ascending: true })
    .limit(50);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Receipt size={24} weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Faturas, Propostas & Orçamentos
            </h1>
            <p className="text-xs text-zinc-500">
              Gere propostas comerciais, emita faturas detalhadas com itens de linha e exporte documentos para impressão ou envio por WhatsApp.
            </p>
          </div>
        </div>
      </div>

      <InvoicesViewClient
        initialInvoices={(invoices as any) ?? []}
        products={products ?? []}
        contacts={contacts ?? []}
      />
    </div>
  );
}
