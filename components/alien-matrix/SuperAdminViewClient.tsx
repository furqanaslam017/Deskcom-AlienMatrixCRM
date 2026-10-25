"use client";

import React, { useState } from "react";
import {
  Buildings,
  CurrencyDollar,
  Database,
  MagnifyingGlass,
  ShieldCheck,
  Users,
} from "@/lib/ui/icons";
import type { PlatformMetrics } from "@/lib/alien-matrix/platform-admin-service";

interface SuperAdminViewClientProps {
  metrics: PlatformMetrics;
  tenants: any[];
}

export function SuperAdminViewClient({ metrics, tenants }: SuperAdminViewClientProps) {
  const [search, setSearch] = useState("");

  const filteredTenants = tenants.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        t.name?.toLowerCase().includes(q) ||
        t.slug?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatMoney = (cents: number) => {
    return (cents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  return (
    <div className="space-y-6">
      {/* Platform Overview Bento Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Tenants */}
        <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] p-5 shadow-[var(--shadow-bento)] backdrop-blur-md transition-all hover:border-[var(--line)]">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-semibold uppercase tracking-wider">
            <span>Active Tenants</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
              <Buildings size={16} weight="bold" />
            </div>
          </div>
          <div className="mt-3 font-numeric text-3xl font-bold tracking-tight text-[var(--ink)]">
            {metrics.totalTenants.toLocaleString("en-US")}
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">Organizations active in cluster</div>
        </div>

        {/* Metric 2: Pipeline Volume */}
        <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] p-5 shadow-[var(--shadow-bento)] backdrop-blur-md transition-all hover:border-[var(--line)]">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-semibold uppercase tracking-wider">
            <span>Pipeline Volume</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CurrencyDollar size={16} weight="bold" />
            </div>
          </div>
          <div className="mt-3 font-numeric text-3xl font-bold tracking-tight text-[var(--ink)]">
            {formatMoney(metrics.totalDealsValueCents)}
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            {metrics.totalLeads.toLocaleString("en-US")} registered opportunities
          </div>
        </div>

        {/* Metric 3: Custom Objects */}
        <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] p-5 shadow-[var(--shadow-bento)] backdrop-blur-md transition-all hover:border-[var(--line)]">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-semibold uppercase tracking-wider">
            <span>Custom Objects</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Database size={16} weight="bold" />
            </div>
          </div>
          <div className="mt-3 font-numeric text-3xl font-bold tracking-tight text-[var(--ink)]">
            {metrics.totalCustomObjects.toLocaleString("en-US")}
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            {metrics.totalCustomRecords.toLocaleString("en-US")} dynamic data records
          </div>
        </div>

        {/* Metric 4: Billed Invoices */}
        <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] p-5 shadow-[var(--shadow-bento)] backdrop-blur-md transition-all hover:border-[var(--line)]">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-semibold uppercase tracking-wider">
            <span>Billed Invoices</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldCheck size={16} weight="bold" />
            </div>
          </div>
          <div className="mt-3 font-numeric text-3xl font-bold tracking-tight text-[var(--ink)]">
            {formatMoney(metrics.totalInvoicesValueCents)}
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">Proposals & invoices billed</div>
        </div>
      </div>

      {/* Control Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative">
          <MagnifyingGlass
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant by name or slug..."
            className="w-full sm:w-80 rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--solid)] pl-10 pr-4 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="text-xs text-[var(--muted)] font-medium">
          <span className="font-numeric font-bold text-[var(--ink)]">{filteredTenants.length}</span>{" "}
          tenants found
        </div>
      </div>

      {/* Tenants Table Container */}
      <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] overflow-hidden shadow-[var(--shadow-bento)] backdrop-blur-md">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[600px] sm:min-w-full">
            <thead className="bg-[var(--surface-tint)] border-b border-[var(--line-2)] uppercase font-semibold text-[var(--muted)] text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-5">Company / Organization</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4">Locale / Currency</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-5 text-right">Members</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-2)]/50">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-[var(--muted)]">
                    No organization tenants matched your search query.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((org) => {
                  const cs = org.custom_settings?.[0] || {};
                  const memberCount = org.members?.[0]?.count ?? 1;

                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-[var(--surface-tint)]/60 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="font-semibold text-[var(--ink)] flex items-center gap-2.5">
                          <span
                            className="h-2.5 w-2.5 rounded-full ring-2 ring-[var(--line-2)]"
                            style={{ backgroundColor: cs.primary_color_hex || "var(--accent)" }}
                          />
                          <span>{cs.brand_name || org.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-[11px] text-[var(--muted)]">
                        {org.slug || "—"}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 font-medium text-[var(--ink)]">
                          <span className="uppercase font-bold text-[10px] bg-[var(--surface-tint)] border border-[var(--line-2)] px-2 py-0.5 rounded-[var(--r-ctl)] text-[var(--muted)]">
                            {cs.language || "en"}
                          </span>
                          <span className="text-xs font-mono">{cs.currency || "USD"}</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-[var(--muted)] font-mono text-[11px]">
                        {new Date(org.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-4 px-5 text-right font-numeric font-medium text-[var(--ink)]">
                        <span className="inline-flex items-center gap-1">
                          <Users size={13} className="text-[var(--muted)]" />
                          {memberCount}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
