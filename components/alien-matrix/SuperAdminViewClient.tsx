"use client";

import React, { useState } from "react";
import { Buildings, Users, CurrencyDollar, Database, MagnifyingGlass, DownloadSimple, ShieldCheck } from "@phosphor-icons/react";
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
        t.name.toLowerCase().includes(q) ||
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
      {/* Platform Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            <span>Tenants Ativos</span>
            <Buildings size={18} className="text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {metrics.totalTenants}
          </div>
          <div className="mt-1 text-xs text-zinc-500">Organizações no cluster</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            <span>Volume de Pipeline</span>
            <CurrencyDollar size={18} className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatMoney(metrics.totalDealsValueCents)}
          </div>
          <div className="mt-1 text-xs text-zinc-500">{metrics.totalLeads} negócios registrados</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            <span>Objetos Customizados</span>
            <Database size={18} className="text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {metrics.totalCustomObjects}
          </div>
          <div className="mt-1 text-xs text-zinc-500">{metrics.totalCustomRecords} registros dinâmicos</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            <span>Faturamento Faturado</span>
            <ShieldCheck size={18} className="text-pink-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatMoney(metrics.totalInvoicesValueCents)}
          </div>
          <div className="mt-1 text-xs text-zinc-500">Em propostas e faturas</div>
        </div>
      </div>

      {/* Control Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tenant por nome ou slug..."
            className="w-72 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs text-zinc-500 font-medium">
          {filteredTenants.length} tenants encontrados
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 uppercase font-semibold text-zinc-500 tracking-wider">
            <tr>
              <th className="py-3 px-4">Empresa / Organização</th>
              <th className="py-3 px-4">Slug</th>
              <th className="py-3 px-4">Idioma / Moeda</th>
              <th className="py-3 px-4">Criado em</th>
              <th className="py-3 px-4 text-right">Membros</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredTenants.map((org) => {
              const cs = org.custom_settings?.[0] || {};
              const memberCount = org.members?.[0]?.count ?? 1;

              return (
                <tr key={org.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cs.primary_color_hex || "#2563eb" }}
                      />
                      {cs.brand_name || org.name}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-500">
                    {org.slug || "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                      <span className="uppercase font-bold text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                        {cs.language || "en"}
                      </span>
                      <span>{cs.currency || "USD"}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    {memberCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
