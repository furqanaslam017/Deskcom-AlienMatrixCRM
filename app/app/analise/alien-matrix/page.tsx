import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnalyticsDashboard } from "@/lib/alien-matrix/analytics-service";
import { listReports, listScheduledReports } from "@/lib/alien-matrix/reports-service";
import { listBillingPlans, getTenantSubscription, verifyUsageLimits } from "@/lib/alien-matrix/billing-service";
import { AnalyticsAndBillingViewClient } from "@/components/alien-matrix/AnalyticsAndBillingViewClient";

export const metadata = {
  title: "AlienMatrix Analytics & Billing",
};

export default async function AlienMatrixAnalyticsPage() {
  const hdrs = await headers();
  const requestId = hdrs.get("x-request-id") ?? undefined;

  const authz = await requireRole("viewer", { requestId });
  if (!authz.ok) {
    redirect("/login");
  }
  const { org } = authz;
  const orgId = org.orgId;

  const supabase = createAdminClient();

  const [dashboard, reports, scheduledReports, plans, subscription, limits] = await Promise.all([
    getAnalyticsDashboard(supabase, orgId),
    listReports(supabase, orgId),
    listScheduledReports(supabase, orgId),
    listBillingPlans(supabase),
    getTenantSubscription(supabase, orgId),
    verifyUsageLimits(supabase, orgId),
  ]);

  return (
    <div className="py-6">
      <AnalyticsAndBillingViewClient
        dashboard={dashboard}
        reports={reports}
        scheduledReports={scheduledReports}
        plans={plans}
        subscription={subscription}
        limits={limits}
      />
    </div>
  );
}
