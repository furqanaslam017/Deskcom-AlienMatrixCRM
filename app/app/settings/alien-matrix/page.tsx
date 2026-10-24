import type { Metadata } from "next";
import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { getCustomRoles } from "@/lib/alien-matrix/roles-service";
import { getSecuritySettings } from "@/lib/alien-matrix/security-service";
import { getTenantSettings } from "@/lib/alien-matrix/tenant-settings-service";
import { getDeletedRecords } from "@/lib/alien-matrix/soft-delete-service";
import { AlienMatrixAdminViewClient } from "@/components/alien-matrix/AlienMatrixAdminViewClient";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AlienMatrix Admin | Configurações" };

export default async function AlienMatrixSettingsPage() {
  const user = await requireAuth();
  const activeOrg = await resolveActiveOrg(user);

  if (!activeOrg) {
    return (
      <div className="p-8 text-center text-sm text-zinc-500">
        Nenhuma organização ativa selecionada.
      </div>
    );
  }

  const [roles, security, tenantSettings, trash] = await Promise.all([
    getCustomRoles(activeOrg.orgId),
    getSecuritySettings(activeOrg.orgId),
    getTenantSettings(activeOrg.orgId),
    getDeletedRecords(activeOrg.orgId),
  ]);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <ShieldCheck size={24} weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              AlienMatrix Workspace Admin
            </h1>
            <p className="text-xs text-zinc-500">
              Controle granular de acesso, autenticação em duas etapas, SSO corporativo, idiomas e recuperação de dados.
            </p>
          </div>
        </div>
      </div>

      <AlienMatrixAdminViewClient
        initialRoles={roles}
        initialSecurity={security}
        initialTenantSettings={tenantSettings}
        initialTrash={trash}
      />
    </div>
  );
}
