import type { Metadata } from "next";
import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProductsViewClient } from "@/components/alien-matrix/ProductsViewClient";
import { Package } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Produtos & Preços | CRM" };

export default async function CrmProductsPage() {
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

  const { data: products } = await admin
    .from("crm_products")
    .select("*")
    .eq("organization_id", activeOrg.orgId)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Package size={24} weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Produtos, Serviços & Preços
            </h1>
            <p className="text-xs text-zinc-500">
              Gerencie o catálogo de produtos e serviços para compor propostas, orçamentos e itens de negócio.
            </p>
          </div>
        </div>
      </div>

      <ProductsViewClient initialProducts={(products as any) ?? []} />
    </div>
  );
}
