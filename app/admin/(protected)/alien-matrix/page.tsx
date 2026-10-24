import type { Metadata } from "next";
import { getPlatformOverview, getAllTenantsSummary } from "@/lib/alien-matrix/platform-admin-service";
import { SuperAdminViewClient } from "@/components/alien-matrix/SuperAdminViewClient";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AlienMatrix Super-Admin | Plataforma" };

export default async function AlienMatrixPlatformPage() {
  const [metrics, tenants] = await Promise.all([
    getPlatformOverview(),
    getAllTenantsSummary(),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <ShieldCheck size={24} weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              AlienMatrix Platform Owner Console
            </h1>
            <p className="text-xs text-zinc-500">
              Painel de super-administração para monitorar tenants, volume de dados, faturamento e adoção de custom objects.
            </p>
          </div>
        </div>
      </div>

      <SuperAdminViewClient metrics={metrics} tenants={tenants} />
    </div>
  );
}
