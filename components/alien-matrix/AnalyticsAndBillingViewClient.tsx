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
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
              <ChartBar size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                AlienMatrix Analytics & Billing
              </h1>
              <p className="text-sm text-muted-foreground">
                Revenue dashboards, weighted forecast, channel performance, scheduled email reports, and billing tiers.
              </p>
            </div>
          </div>
        </div>

        {/* Current plan status badge */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-lg border border-border bg-card flex items-center gap-2 text-xs">
            <CreditCard size={14} className="text-blue-500" />
            <span className="text-muted-foreground">Current Plan:</span>
            <span className="font-semibold text-foreground uppercase">
              {currentSub?.plan?.name || "Professional"} ({currentSub?.status || "Active"})
            </span>
          </div>
        </div>
      </div>

      {notification && (
        <div
          className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
            notification.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? <CheckCircle size={16} /> : <Warning size={16} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <span className="text-xs text-muted-foreground flex items-center justify-between">
            Total Pipeline Value
            <Funnel size={14} className="text-blue-500" />
          </span>
          <p className="text-2xl font-bold text-foreground mt-1">
            {formatCurrency(dashboard.total_pipeline_value_cents)}
          </p>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {dashboard.open_deals_count} active deals in progress
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <span className="text-xs text-muted-foreground flex items-center justify-between">
            Weighted Forecast
            <TrendUp size={14} className="text-emerald-500" />
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(dashboard.weighted_forecast_cents)}
          </p>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            Average probability calculated per stage
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <span className="text-xs text-muted-foreground flex items-center justify-between">
            Overall Win Rate
            <CheckCircle size={14} className="text-purple-500" />
          </span>
          <p className="text-2xl font-bold text-foreground mt-1">
            {dashboard.overall_win_rate_percent}%
          </p>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {dashboard.won_deals_count} won vs {dashboard.lost_deals_count} lost
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
          <span className="text-xs text-muted-foreground flex items-center justify-between">
            Avg First Response Time
            <Clock size={14} className="text-amber-500" />
          </span>
          <p className="text-2xl font-bold text-foreground mt-1">
            {dashboard.avg_first_response_minutes} min
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            92% answered by AI Agent in &lt; 2 min
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border gap-6 overflow-x-auto text-sm font-medium">
        <button
          onClick={() => setActiveTab("dashboard")}
          data-testid="tab-dashboard"
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === "dashboard"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ChartBar size={16} />
          Executive Dashboard
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          data-testid="tab-reports"
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === "reports"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Download size={16} />
          Custom Reports & Export ({currentReports.length})
        </button>

        <button
          onClick={() => setActiveTab("scheduled")}
          data-testid="tab-scheduled"
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === "scheduled"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar size={16} />
          Scheduled Deliveries ({currentScheduled.length})
        </button>

        <button
          onClick={() => setActiveTab("billing")}
          data-testid="tab-billing"
          className={`pb-3 border-b-2 flex items-center gap-2 transition ${
            activeTab === "billing"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard size={16} />
          Plans & Billing
        </button>
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Funnel Conversion by Stage */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Funnel size={16} className="text-blue-600" />
                  Sales Funnel & Stage Conversion
                </h3>
                <span className="text-xs text-muted-foreground">Total: {dashboard.open_deals_count} active</span>
              </div>

              <div className="space-y-3">
                {dashboard.stages_funnel.map((st) => (
                  <div key={st.stage_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{st.stage_name}</span>
                      <span className="text-muted-foreground font-mono">
                        {st.deals_count} deals · {formatCurrency(st.total_value_cents)} ({st.conversion_rate_percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.max(5, st.conversion_rate_percent)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leads by Source & Channel */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Megaphone size={16} className="text-purple-600" />
                  Lead Sources & Channel Attribution
                </h3>
                <span className="text-xs text-muted-foreground">Last 30 days</span>
              </div>

              <div className="space-y-3">
                {dashboard.leads_by_source.map((src) => (
                  <div key={src.source} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 text-xs">
                    <span className="font-medium text-foreground">{src.source}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{src.count} leads</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold text-[10px]">
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
            <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users size={16} className="text-emerald-600" />
                Sales Reps & AI Agents Leaderboard
              </h3>

              <div className="space-y-3">
                {dashboard.rep_leaderboard.map((rep, idx) => (
                  <div
                    key={rep.owner_id}
                    className="p-3 rounded-lg border border-border bg-background flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-[11px]">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-semibold text-foreground block">{rep.owner_name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {rep.deals_won_count} deals closed · Win Rate: {rep.win_rate_percent}%
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600 text-sm">
                      {formatCurrency(rep.won_value_cents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp & AI Operational Metrics */}
            <div className="p-5 rounded-xl border border-border bg-card shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Robot size={16} className="text-blue-600" />
                Operational Efficiency: AI vs Human
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-blue-50/40 border border-blue-200">
                  <span className="text-muted-foreground block mb-1">WhatsApp Volume</span>
                  <p className="text-lg font-bold text-blue-900">
                    {dashboard.whatsapp_volume.total_messages} msgs
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {dashboard.whatsapp_volume.inbound_messages} in / {dashboard.whatsapp_volume.outbound_messages} out
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-200">
                  <span className="text-muted-foreground block mb-1">AI Autonomous Resolution</span>
                  <p className="text-lg font-bold text-emerald-900">
                    {dashboard.ai_vs_human.ai_resolution_percent}%
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {dashboard.ai_vs_human.ai_resolved_count} resolved without human handoff
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground flex items-center justify-between">
                <span>Average Full Resolution Time:</span>
                <strong className="text-foreground">{dashboard.avg_resolution_minutes} min</strong>
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
              <h2 className="text-base font-semibold text-foreground">Custom Reports & Data Export</h2>
              <p className="text-xs text-muted-foreground">
                Generate reports with customized filters and instantly download datasets in CSV or PDF format.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/api/v1/alien-matrix/analytics/reports/export?type=sales_funnel"
                download
                className="px-3.5 py-2 border border-border text-foreground hover:bg-muted text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
              >
                <Download size={14} />
                Export Funnel CSV
              </a>

              <a
                href="/api/v1/alien-matrix/analytics/reports/export?type=rep_leaderboard"
                download
                className="px-3.5 py-2 border border-border text-foreground hover:bg-muted text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
              >
                <Download size={14} />
                Export Leaderboard CSV
              </a>

              <button
                onClick={() => setShowReportModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
              >
                <Plus size={14} />
                New Report
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentReports.map((rep) => (
              <div key={rep.id} className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {rep.report_type}
                  </span>
                  {rep.is_favorite && (
                    <span className="text-[10px] text-amber-500 font-semibold">★ Favorite</span>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-xs text-foreground">{rep.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Created on {new Date(rep.created_at).toLocaleDateString("en-US")}
                  </p>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                  <a
                    href={`/api/v1/alien-matrix/analytics/reports/export?type=${rep.report_type}`}
                    download
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Download size={12} />
                    Download CSV
                  </a>
                  <button
                    onClick={async () => {
                      await fetch(`/api/v1/alien-matrix/analytics/reports/${rep.id}`, { method: "DELETE" });
                      setCurrentReports((prev) => prev.filter((r) => r.id !== rep.id));
                      notify("Report deleted successfully.");
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Modal New Report */}
          {showReportModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-semibold text-base text-foreground">Create Custom Report</h3>
                  <button onClick={() => setShowReportModal(false)} className="text-muted-foreground hover:text-foreground">
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Report Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Monthly WhatsApp Conversion Analysis"
                      value={newReport.title}
                      onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Metric Type</label>
                    <select
                      value={newReport.report_type}
                      onChange={(e) => setNewReport({ ...newReport, report_type: e.target.value as any })}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                    >
                      <option value="sales_funnel">Sales Funnel & Stage Conversion</option>
                      <option value="whatsapp_performance">WhatsApp Volume & Response Speed</option>
                      <option value="rep_leaderboard">Sales Rep Performance Leaderboard</option>
                      <option value="revenue_forecast">Weighted Revenue Forecast</option>
                      <option value="ai_resolution">AI Resolutions vs Human Handoffs</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateReport}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
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
              <h2 className="text-base font-semibold text-foreground">Scheduled Email Deliveries</h2>
              <p className="text-xs text-muted-foreground">
                Receive automated executive summaries in PDF format or CSV spreadsheets directly in your team's inbox.
              </p>
            </div>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
            >
              <Plus size={14} />
              Schedule Delivery
            </button>
          </div>

          <div className="space-y-3">
            {currentScheduled.map((sc) => (
              <div key={sc.id} className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-sm">
                      {sc.report?.title || "Scheduled Report"}
                    </span>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                      {sc.frequency}
                    </span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      {sc.format}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    Recipients: {sc.recipient_emails?.join(", ")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle size={14} /> Active
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Modal Schedule */}
          {showScheduleModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-semibold text-base text-foreground">Schedule Periodic Report</h3>
                  <button onClick={() => setShowScheduleModal(false)} className="text-muted-foreground hover:text-foreground">
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Base Report</label>
                    <select
                      value={newSchedule.report_id}
                      onChange={(e) => setNewSchedule({ ...newSchedule, report_id: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
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
                      <label className="text-xs font-semibold text-foreground block mb-1">Frequency</label>
                      <select
                        value={newSchedule.frequency}
                        onChange={(e) => setNewSchedule({ ...newSchedule, frequency: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                      >
                        <option value="daily">Daily (Every day at 08:00 AM)</option>
                        <option value="weekly">Weekly (Monday at 08:00 AM)</option>
                        <option value="monthly">Monthly (1st of month)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">Format</label>
                      <select
                        value={newSchedule.format}
                        onChange={(e) => setNewSchedule({ ...newSchedule, format: e.target.value as any })}
                        className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                      >
                        <option value="pdf">PDF Document</option>
                        <option value="csv">CSV Spreadsheet</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Recipient Emails (comma separated)
                    </label>
                    <input
                      type="text"
                      placeholder="leadership@alienmatrix.io, sales@alienmatrix.io"
                      value={newSchedule.recipient_emails}
                      onChange={(e) => setNewSchedule({ ...newSchedule, recipient_emails: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-lg border border-border bg-background"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 border border-border rounded-lg text-xs font-medium hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSchedule}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium"
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
              <h2 className="text-base font-semibold text-foreground">Plans, Subscriptions & Limits</h2>
              <p className="text-xs text-muted-foreground">
                Select the plan that best fits your commercial operations and configure billing details.
              </p>
            </div>

            {/* Cycle toggle */}
            <div className="p-1 bg-muted rounded-lg flex items-center gap-1 self-start">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  billingCycle === "monthly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                  billingCycle === "yearly" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Yearly
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  -17% off
                </span>
              </button>
            </div>
          </div>

          {/* Usage Limits Card */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Tenant Resource Utilization
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seats / Team Members:</span>
                  <span className="font-semibold text-foreground">
                    {limits.seats_used} / {limits.max_seats}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (limits.seats_used / limits.max_seats) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WhatsApp Channels:</span>
                  <span className="font-semibold text-foreground">
                    {limits.numbers_used} / {limits.max_numbers}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (limits.numbers_used / limits.max_numbers) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custom Objects:</span>
                  <span className="font-semibold text-foreground">
                    {limits.objects_used} / {limits.max_objects}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, (limits.objects_used / limits.max_objects) * 100)}%` }}
                  ></div>
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
                  className={`p-6 rounded-2xl border transition flex flex-col justify-between ${
                    isCurrent
                      ? "border-blue-500 bg-blue-50/15 shadow-md relative"
                      : "border-border bg-card shadow-sm"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                      Current Plan
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{p.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-foreground">
                          {formatCurrency(priceCents)}
                        </span>
                        <span className="text-xs text-muted-foreground">/ month</span>
                      </div>
                      {billingCycle === "yearly" && (
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          Billed annually ({formatCurrency(p.price_yearly_cents)}/yr)
                        </span>
                      )}
                    </div>

                    <div className="pt-4 border-t border-border space-y-2 text-xs">
                      {p.features?.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-foreground">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border mt-6 space-y-2">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider"
                      >
                        Active Subscription
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleChangePlan(p.id, "stripe")}
                          className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition"
                        >
                          Credit Card (Stripe)
                        </button>
                        <button
                          onClick={() => handleChangePlan(p.id, "pix_local")}
                          className="py-2.5 px-3 border border-border hover:bg-muted text-foreground text-xs font-semibold rounded-xl transition"
                        >
                          Local Payment / PIX
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
