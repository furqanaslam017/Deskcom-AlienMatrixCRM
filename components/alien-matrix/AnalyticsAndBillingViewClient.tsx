"use client";

import { useState } from "react";
import {
  ChartBar,
  Funnel,
  TrendUp,
  Clock,
  ChatCircle,
  Robot,
  Users,
  CreditCard,
  Download,
  Calendar,
  CheckCircle,
  Warning,
  Plus,
  Trash,
  Lightning,
  ShieldCheck,
  Megaphone,
} from "@/lib/ui/icons";
import type { AnalyticsDashboardData } from "@/lib/alien-matrix/analytics-service";
import type { AnalyticsReport, ScheduledReport } from "@/lib/alien-matrix/reports-service";
import type { BillingPlan, TenantSubscription } from "@/lib/alien-matrix/billing-service";

interface UsageLimitsData {
  seats_used: number;
  max_seats: number;
  seats_ok: boolean;
  numbers_used: number;
  max_numbers: number;
  numbers_ok: boolean;
  objects_used: number;
  max_objects: number;
  objects_ok: boolean;
}

export function AnalyticsAndBillingViewClient({
  dashboard,
  reports = [],
  scheduledReports = [],
  plans = [],
  subscription,
  limits,
}: {
  dashboard: AnalyticsDashboardData;
  reports: AnalyticsReport[];
  scheduledReports: ScheduledReport[];
  plans: BillingPlan[];
  subscription: TenantSubscription | null;
  limits: UsageLimitsData;
}) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "reports" | "scheduled" | "billing">(
    "dashboard"
  );

  const [currentReports, setCurrentReports] = useState<AnalyticsReport[]>(reports);
  const [currentScheduled, setCurrentScheduled] = useState<ScheduledReport[]>(scheduledReports);
  const [currentSub, setCurrentSub] = useState<TenantSubscription | null>(subscription);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [notification, setNotification] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // New Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [newReport, setNewReport] = useState({
    title: "",
    report_type: "sales_funnel" as AnalyticsReport["report_type"],
  });

  // Schedule Report Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    report_id: reports[0]?.id || "",
    frequency: "weekly" as ScheduledReport["frequency"],
    recipient_emails: "",
    format: "pdf" as ScheduledReport["format"],
  });

  const notify = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  // Create Report
  const handleCreateReport = async () => {
    if (!newReport.title) {
      notify("Please enter a report title", "error");
      return;
    }
    try {
      const res = await fetch("/api/v1/alien-matrix/analytics/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReport),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create report");
      setCurrentReports((prev) => [data.data, ...prev]);
      setShowReportModal(false);
      setNewReport({ title: "", report_type: "sales_funnel" });
      notify("Custom report created successfully!");
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  // Schedule Report
  const handleCreateSchedule = async () => {
    if (!newSchedule.recipient_emails || !newSchedule.report_id) {
      notify("Please select a report and provide at least one recipient email", "error");
      return;
    }
    const emails = newSchedule.recipient_emails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/v1/alien-matrix/analytics/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSchedule,
          recipient_emails: emails,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to schedule report delivery");
      setCurrentScheduled((prev) => [data.data, ...prev]);
      setShowScheduleModal(false);
      notify("Scheduled report delivery configured successfully!");
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  // Change Plan
  const handleChangePlan = async (planId: string, provider: "stripe" | "pix_local" = "stripe") => {
    try {
      const res = await fetch("/api/v1/alien-matrix/billing/subscription", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: planId,
          payment_provider: provider,
          billing_cycle: billingCycle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update subscription");
      setCurrentSub(data.data);
      notify(`Plan updated to ${data.data?.plan?.name || "new plan"}!`);
    } catch (err: any) {
      notify(err.message, "error");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[var(--app-max)] mx-auto p-4 md:p-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--line-2)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--well)] text-[var(--text)] border border-[var(--line-2)]">
              <ChartBar size={22} weight="bold" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--text)]">
                Analytics &amp; Resource Operations
              </h1>
              <p className="text-xs text-[var(--muted)] mt-1">
                Executive revenue forecasts, stage conversions, rep leaderboards, scheduled PDF reports, and billing tiers.
              </p>
            </div>
          </div>
        </div>

        {/* Current plan status badge */}
        <div className="flex items-center gap-2">
          <div className="px-4 py-2 rounded-full border border-[var(--line-2)] bg-[var(--solid)] flex items-center gap-2 text-xs shadow-sm">
            <CreditCard size={15} className="text-[var(--tomato)]" />
            <span className="text-[var(--muted)]">Active Plan:</span>
            <span className="badge badge--pine text-[11px] font-bold uppercase">
              {currentSub?.plan?.name || "Professional"}
            </span>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-[var(--r-tile)] text-xs flex items-center justify-between shadow-[var(--shadow-pop)] animate-in fade-in duration-150 ${
            notification.type === "success"
              ? "bg-[var(--solid)] border border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              : "bg-[var(--solid)] border border-rose-500/30 text-rose-700 dark:text-rose-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? <CheckCircle size={16} /> : <Warning size={16} />}
            <span>{notification.msg}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--text)] ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top 4 KPI Metrics Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md flex flex-col justify-between">
          <span className="text-xs font-semibold text-[var(--muted)] flex items-center justify-between">
            Total Pipeline Value
            <Funnel size={15} className="text-[var(--tomato)]" />
          </span>
          <div className="mt-2">
            <p className="text-2xl font-bold tracking-tight text-[var(--text)] font-numeric">
              {formatCurrency(dashboard.total_pipeline_value_cents)}
            </p>
            <span className="text-[11px] text-[var(--muted)] mt-1 block">
              {dashboard.open_deals_count} active deals in progress
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md flex flex-col justify-between">
          <span className="text-xs font-semibold text-[var(--muted)] flex items-center justify-between">
            Weighted Forecast
            <TrendUp size={15} className="text-emerald-600 dark:text-emerald-400" />
          </span>
          <div className="mt-2">
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-numeric">
              {formatCurrency(dashboard.weighted_forecast_cents)}
            </p>
            <span className="text-[11px] text-[var(--muted)] mt-1 block">
              Calculated by historical stage probability
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md flex flex-col justify-between">
          <span className="text-xs font-semibold text-[var(--muted)] flex items-center justify-between">
            Overall Win Rate
            <CheckCircle size={15} className="text-purple-600 dark:text-purple-400" />
          </span>
          <div className="mt-2">
            <p className="text-2xl font-bold tracking-tight text-[var(--text)] font-numeric">
              {dashboard.overall_win_rate_percent}%
            </p>
            <span className="text-[11px] text-[var(--muted)] mt-1 block">
              {dashboard.won_deals_count} won vs {dashboard.lost_deals_count} lost
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md flex flex-col justify-between">
          <span className="text-xs font-semibold text-[var(--muted)] flex items-center justify-between">
            Avg First Response Time
            <Clock size={15} className="text-amber-500" />
          </span>
          <div className="mt-2">
            <p className="text-2xl font-bold tracking-tight text-[var(--text)] font-numeric">
              {dashboard.avg_first_response_minutes} min
            </p>
            <span className="badge badge--pine text-[10px] mt-1 inline-block">
              92% answered by AI Agent &lt; 2 min
            </span>
          </div>
        </div>
      </div>

      {/* Rapport Segmented Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <div className="tabs__track p-1 flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            data-testid="tab-dashboard"
            data-active={activeTab === "dashboard"}
            className="tab"
          >
            <ChartBar size={15} />
            Executive Dashboard
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            data-testid="tab-reports"
            data-active={activeTab === "reports"}
            className="tab"
          >
            <Download size={15} />
            Custom Reports &amp; Export ({currentReports.length})
          </button>

          <button
            onClick={() => setActiveTab("scheduled")}
            data-testid="tab-scheduled"
            data-active={activeTab === "scheduled"}
            className="tab"
          >
            <Calendar size={15} />
            Scheduled Deliveries ({currentScheduled.length})
          </button>

          <button
            onClick={() => setActiveTab("billing")}
            data-testid="tab-billing"
            data-active={activeTab === "billing"}
            className="tab"
          >
            <CreditCard size={15} />
            Plans &amp; Billing
          </button>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel Conversion by Stage */}
            <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[var(--text)] flex items-center gap-2">
                  <Funnel size={16} className="text-[var(--tomato)]" />
                  Sales Funnel &amp; Stage Conversion
                </h3>
                <span className="text-[11px] text-[var(--muted)]">Total: {dashboard.open_deals_count} active</span>
              </div>

              <div className="space-y-3.5">
                {dashboard.stages_funnel.map((st) => (
                  <div key={st.stage_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--text)]">{st.stage_name}</span>
                      <span className="text-[var(--muted)] font-mono text-[11px]">
                        {st.deals_count} deals · {formatCurrency(st.total_value_cents)} ({st.conversion_rate_percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-[var(--well)] rounded-full h-2 overflow-hidden border border-[var(--line-2)]">
                      <div
                        className="bg-[var(--pill)] h-2 rounded-full transition-all"
                        style={{ width: `${Math.max(5, st.conversion_rate_percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leads by Source & Channel */}
            <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-[var(--text)] flex items-center gap-2">
                  <Megaphone size={16} className="text-purple-600 dark:text-purple-400" />
                  Lead Sources &amp; Channel Attribution
                </h3>
                <span className="text-[11px] text-[var(--muted)]">Last 30 days</span>
              </div>

              <div className="space-y-2.5">
                {dashboard.leads_by_source.map((src) => (
                  <div
                    key={src.source}
                    className="flex items-center justify-between p-3 rounded-[var(--r-tile)] bg-[var(--solid)] border border-[var(--line-2)] text-xs shadow-sm"
                  >
                    <span className="font-medium text-[var(--text)]">{src.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text)] font-numeric">{src.count} leads</span>
                      <span className="badge badge--plain text-[10px] font-bold">
                        {src.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Owner & Agent Leaderboard */}
            <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md space-y-4">
              <h3 className="text-xs font-semibold text-[var(--text)] flex items-center gap-2">
                <Users size={16} className="text-emerald-600 dark:text-emerald-400" />
                Sales Reps &amp; AI Agents Leaderboard
              </h3>

              <div className="space-y-2.5">
                {dashboard.rep_leaderboard.map((rep, idx) => (
                  <div
                    key={rep.owner_id}
                    className="p-3 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] flex items-center justify-between text-xs shadow-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-[var(--well)] border border-[var(--line-2)] flex items-center justify-center font-bold text-[11px] text-[var(--text)]">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-[var(--text)] block">{rep.owner_name}</span>
                        <span className="text-[11px] text-[var(--muted)]">
                          {rep.deals_won_count} closed · Win Rate: {rep.win_rate_percent}%
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs font-numeric">
                      {formatCurrency(rep.won_value_cents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp & AI Operational Metrics */}
            <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md space-y-4">
              <h3 className="text-xs font-semibold text-[var(--text)] flex items-center gap-2">
                <Robot size={16} className="text-[var(--tomato)]" />
                Operational Efficiency: AI vs Human
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-[var(--r-tile)] bg-[var(--solid)] border border-[var(--line-2)] shadow-sm">
                  <span className="text-[var(--muted)] block mb-1">WhatsApp Volume</span>
                  <p className="text-lg font-bold text-[var(--text)] font-numeric">
                    {dashboard.whatsapp_volume.total_messages} msgs
                  </p>
                  <span className="text-[10px] text-[var(--muted)]">
                    {dashboard.whatsapp_volume.inbound_messages} in / {dashboard.whatsapp_volume.outbound_messages} out
                  </span>
                </div>

                <div className="p-3.5 rounded-[var(--r-tile)] bg-[var(--solid)] border border-[var(--line-2)] shadow-sm">
                  <span className="text-[var(--muted)] block mb-1">AI Autonomous Resolution</span>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-numeric">
                    {dashboard.ai_vs_human.ai_resolution_percent}%
                  </p>
                  <span className="text-[10px] text-[var(--muted)]">
                    {dashboard.ai_vs_human.ai_resolved_count} without human handoff
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-[var(--r-tile)] bg-[var(--well)] border border-[var(--line-2)] text-xs text-[var(--muted)] flex items-center justify-between">
                <span>Average Full Resolution Time:</span>
                <strong className="text-[var(--text)] font-numeric">{dashboard.avg_resolution_minutes} min</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOM REPORTS & EXPORT */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text)]">Custom Reports &amp; Data Export</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Generate reports with customized filters and instantly download datasets in CSV or PDF format.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/api/v1/alien-matrix/analytics/reports/export?type=sales_funnel"
                download
                className="btn btn--ghost btn--sm text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Download size={14} />
                Export Funnel CSV
              </a>

              <a
                href="/api/v1/alien-matrix/analytics/reports/export?type=rep_leaderboard"
                download
                className="btn btn--ghost btn--sm text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Download size={14} />
                Export Leaderboard CSV
              </a>

              <button
                onClick={() => setShowReportModal(true)}
                className="btn btn--ink inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2"
              >
                <Plus size={14} weight="bold" />
                New Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentReports.map((rep) => (
              <div
                key={rep.id}
                className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="badge badge--plain text-[10px] uppercase font-bold tracking-wider">
                      {rep.report_type}
                    </span>
                    {rep.is_favorite && (
                      <span className="text-[10px] text-amber-500 font-semibold">★ Favorite</span>
                    )}
                  </div>

                  <h3 className="font-semibold text-xs text-[var(--text)]">{rep.title}</h3>
                  <p className="text-[11px] text-[var(--muted)] mt-1">
                    Created on {new Date(rep.created_at).toLocaleDateString("en-US")}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--line-2)] flex items-center justify-between text-xs">
                  <a
                    href={`/api/v1/alien-matrix/analytics/reports/export?type=${rep.report_type}`}
                    download
                    className="text-[var(--text)] font-semibold hover:underline inline-flex items-center gap-1 text-xs"
                  >
                    <Download size={13} />
                    Download CSV
                  </a>
                  <button
                    onClick={async () => {
                      await fetch(`/api/v1/alien-matrix/analytics/reports/${rep.id}`, { method: "DELETE" });
                      setCurrentReports((prev) => prev.filter((r) => r.id !== rep.id));
                      notify("Report deleted successfully.");
                    }}
                    className="w-7 h-7 rounded-full inline-flex items-center justify-center text-[var(--muted)] hover:text-rose-600 hover:bg-[var(--well)] transition-colors"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal New Report */}
          {showReportModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[var(--solid)] border border-[var(--rim)] rounded-[var(--r-card)] shadow-[var(--shadow-pop)] w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-3">
                  <h3 className="font-bold text-sm text-[var(--text)]">Create Custom Report</h3>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)]"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text)] block mb-1">Report Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Monthly WhatsApp Conversion Analysis"
                      value={newReport.title}
                      onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--text)] block mb-1">Metric Type</label>
                    <select
                      value={newReport.report_type}
                      onChange={(e) => setNewReport({ ...newReport, report_type: e.target.value as any })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                    >
                      <option value="sales_funnel">Sales Funnel &amp; Stage Conversion</option>
                      <option value="whatsapp_performance">WhatsApp Volume &amp; Response Speed</option>
                      <option value="rep_leaderboard">Sales Rep Performance Leaderboard</option>
                      <option value="revenue_forecast">Weighted Revenue Forecast</option>
                      <option value="ai_resolution">AI Resolutions vs Human Handoffs</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line-2)]">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="btn btn--ghost btn--sm text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateReport}
                    className="btn btn--ink btn--sm text-xs font-semibold"
                  >
                    Save Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SCHEDULED REPORTS */}
      {activeTab === "scheduled" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text)]">Scheduled Email Deliveries</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Automated executive summaries delivered in PDF format or CSV spreadsheets directly to your leadership team.
              </p>
            </div>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="btn btn--ink inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2"
            >
              <Plus size={14} weight="bold" />
              Schedule Delivery
            </button>
          </div>

          <div className="space-y-3">
            {currentScheduled.map((sc) => (
              <div
                key={sc.id}
                className="p-4 rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text)] text-sm">
                      {sc.report?.title || "Scheduled Report"}
                    </span>
                    <span className="badge badge--plain text-[10px] uppercase font-bold">
                      {sc.frequency}
                    </span>
                    <span className="badge badge--plain text-[10px] uppercase font-mono">
                      {sc.format}
                    </span>
                  </div>
                  <p className="text-[var(--muted)]">
                    Recipients: {sc.recipient_emails?.join(", ")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="badge badge--pine text-xs font-semibold inline-flex items-center gap-1">
                    <CheckCircle size={14} /> Active
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Schedule */}
          {showScheduleModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-[var(--solid)] border border-[var(--rim)] rounded-[var(--r-card)] shadow-[var(--shadow-pop)] w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-3">
                  <h3 className="font-bold text-sm text-[var(--text)]">Schedule Periodic Report</h3>
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)]"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-[var(--text)] block mb-1">Base Report</label>
                    <select
                      value={newSchedule.report_id}
                      onChange={(e) => setNewSchedule({ ...newSchedule, report_id: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                    >
                      {currentReports.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title} ({r.report_type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[var(--text)] block mb-1">Frequency</label>
                      <select
                        value={newSchedule.frequency}
                        onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value as any })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                      >
                        <option value="daily">Daily (Every day at 08:00 AM)</option>
                        <option value="weekly">Weekly (Monday at 08:00 AM)</option>
                        <option value="monthly">Monthly (1st of month)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[var(--text)] block mb-1">Format</label>
                      <select
                        value={newSchedule.format}
                        onChange={(e) => setNewSchedule({ ...newSchedule, format: e.target.value as any })}
                        className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                      >
                        <option value="pdf">PDF Document</option>
                        <option value="csv">CSV Spreadsheet</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[var(--text)] block mb-1">
                      Recipient Emails (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="leadership@alienmatrix.io, sales@alienmatrix.io"
                      value={newSchedule.recipient_emails}
                      onChange={(e) => setNewSchedule({ ...newSchedule, recipient_emails: e.target.value })}
                      className="w-full text-xs px-3.5 py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line-2)]">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="btn btn--ghost btn--sm text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSchedule}
                    className="btn btn--ink btn--sm text-xs font-semibold"
                  >
                    Activate Schedule
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PLANS & BILLING */}
      {activeTab === "billing" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text)]">Plans, Subscriptions &amp; Resource Limits</h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Select the plan that matches your operations and manage subscription billing.
              </p>
            </div>

            {/* Cycle toggle as segmented tabs */}
            <div className="tabs__track p-1 flex items-center gap-1 self-start">
              <button
                onClick={() => setBillingCycle("monthly")}
                data-active={billingCycle === "monthly"}
                className="tab text-xs"
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                data-active={billingCycle === "yearly"}
                className="tab text-xs inline-flex items-center gap-1.5"
              >
                Yearly
                <span className="badge badge--pine text-[10px]">
                  -17% off
                </span>
              </button>
            </div>
          </div>

          {/* Usage Limits Bento Card */}
          <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-3.5">
              Tenant Resource Utilization
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Seats / Team Members:</span>
                  <span className="font-semibold text-[var(--text)] font-numeric">
                    {limits.seats_used} / {limits.max_seats}
                  </span>
                </div>
                <div className="w-full bg-[var(--well)] rounded-full h-1.5 border border-[var(--line-2)] overflow-hidden">
                  <div
                    className="bg-[var(--pill)] h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (limits.seats_used / limits.max_seats) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">WhatsApp Channels:</span>
                  <span className="font-semibold text-[var(--text)] font-numeric">
                    {limits.numbers_used} / {limits.max_numbers}
                  </span>
                </div>
                <div className="w-full bg-[var(--well)] rounded-full h-1.5 border border-[var(--line-2)] overflow-hidden">
                  <div
                    className="bg-[var(--pill)] h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (limits.numbers_used / limits.max_numbers) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Custom Objects:</span>
                  <span className="font-semibold text-[var(--text)] font-numeric">
                    {limits.objects_used} / {limits.max_objects}
                  </span>
                </div>
                <div className="w-full bg-[var(--well)] rounded-full h-1.5 border border-[var(--line-2)] overflow-hidden">
                  <div
                    className="bg-[var(--pill)] h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (limits.objects_used / limits.max_objects) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const isCurrent = currentSub?.plan?.slug === p.slug;
              const priceCents =
                billingCycle === "monthly" ? p.price_monthly_cents : Math.round(p.price_yearly_cents / 12);

              return (
                <div
                  key={p.id}
                  className={`p-6 rounded-[var(--r-card)] border transition flex flex-col justify-between backdrop-blur-md ${
                    isCurrent
                      ? "border-[var(--tomato)] bg-[var(--solid)] shadow-[var(--shadow-pop)] relative"
                      : "border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)]"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-6 badge badge--pine text-[10px] font-bold uppercase tracking-wider">
                      Current Plan
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-[var(--text)]">{p.name}</h3>
                      <p className="text-xs text-[var(--muted)] mt-1">{p.description}</p>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-[var(--text)] font-numeric">
                          {formatCurrency(priceCents)}
                        </span>
                        <span className="text-xs text-[var(--muted)]">/ month</span>
                      </div>
                      {billingCycle === "yearly" && (
                        <span className="text-[10px] text-[var(--muted)] block mt-0.5">
                          Billed annually ({formatCurrency(p.price_yearly_cents)}/yr)
                        </span>
                      )}
                    </div>

                    <div className="pt-4 border-t border-[var(--line-2)] space-y-2 text-xs">
                      {p.features?.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                          <span className="text-[var(--text)]">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[var(--line-2)] mt-6 space-y-2">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-full border border-[var(--line-2)] bg-[var(--well)] text-[var(--text)] text-xs font-bold uppercase tracking-wider"
                      >
                        Active Subscription
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleChangePlan(p.id, "stripe")}
                          className="btn btn--ink text-xs font-semibold py-2"
                        >
                          Credit Card (Stripe)
                        </button>
                        <button
                          onClick={() => handleChangePlan(p.id, "pix_local")}
                          className="btn btn--ghost text-xs font-semibold py-2"
                        >
                          Local / PIX
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
