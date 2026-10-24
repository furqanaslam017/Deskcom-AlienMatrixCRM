import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTenantAiSettings } from "@/lib/alien-matrix/ai-settings-service";
import { listAgentPersonas } from "@/lib/alien-matrix/ai-personas-service";
import { listKnowledgeItems } from "@/lib/alien-matrix/ai-knowledge-service";
import { listAIInsights } from "@/lib/alien-matrix/ai-insights-service";
import { listAIHandoffs } from "@/lib/alien-matrix/ai-handoff-service";
import { getTenantUsageTelemetry } from "@/lib/alien-matrix/ai-usage-service";
import { AiLayerConsoleViewClient } from "@/components/alien-matrix/AiLayerConsoleViewClient";

export const metadata = {
  title: "AlienMatrix AI Console",
};

export default async function AlienMatrixAiPage() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) {
    redirect("/login");
  }
  const { org } = authz;
  const orgId = org.orgId;

  const supabase = createAdminClient();

  const [settings, personas, knowledge, insights, handoffs, telemetry] = await Promise.all([
    getTenantAiSettings(supabase, orgId),
    listAgentPersonas(supabase, orgId),
    listKnowledgeItems(supabase, orgId),
    listAIInsights(supabase, orgId),
    listAIHandoffs(supabase, orgId),
    getTenantUsageTelemetry(supabase, orgId),
  ]);

  return (
    <div className="py-6">
      <AiLayerConsoleViewClient
        initialSettings={settings}
        initialPersonas={personas}
        initialKnowledge={knowledge}
        initialInsights={insights}
        initialHandoffs={handoffs}
        initialTelemetry={telemetry}
      />
    </div>
  );
}
