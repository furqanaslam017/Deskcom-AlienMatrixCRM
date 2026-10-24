import type { Metadata } from "next";
import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CalendarViewClient } from "@/components/alien-matrix/CalendarViewClient";
import { getCalendarFeed } from "@/lib/alien-matrix/calendar-service";
import { CalendarCheck } from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Calendário & Atividades | CRM" };

export default async function CrmCalendarPage() {
  const user = await requireAuth();
  const activeOrg = await resolveActiveOrg(user);

  if (!activeOrg) {
    return (
      <div className="p-8 text-center text-sm text-zinc-500">
        Nenhuma organização ativa selecionada.
      </div>
    );
  }

  const events = await getCalendarFeed(activeOrg.orgId);

  const admin = createAdminClient();
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
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <CalendarCheck size={24} weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Calendário & Linha do Tempo de Atividades
            </h1>
            <p className="text-xs text-zinc-500">
              Acompanhe reuniões agendadas, ligações registradas e prazos de tarefas comerciais em um só lugar.
            </p>
          </div>
        </div>
      </div>

      <CalendarViewClient
        initialEvents={events}
        contacts={contacts ?? []}
      />
    </div>
  );
}
