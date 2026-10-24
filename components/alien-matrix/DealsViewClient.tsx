"use client";

import React, { useState } from "react";
import {
  Handshake,
  Plus,
  Funnel,
  CurrencyDollar,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  User,
  Kanban,
  Table as TableIcon,
} from "@/lib/ui/icons";
import { ConvertLeadModal } from "./ConvertLeadModal";
import { cn } from "@/lib/utils";

interface Deal {
  id: string;
  title: string;
  status: string;
  value_cents: number;
  currency: string;
  created_at: string;
  contact?: { id: string; name: string; email?: string; phone_number?: string } | null;
  stage?: { id: string; name: string; color?: string } | null;
  pipeline?: { id: string; name: string } | null;
}

interface DealsViewClientProps {
  initialDeals: Deal[];
  pipelines: Array<{ id: string; name: string; is_default: boolean }>;
  stages: Array<{ id: string; name: string; pipeline_id: string; color?: string; position: number }>;
}

export function DealsViewClient({ initialDeals, pipelines, stages }: DealsViewClientProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [search, setSearch] = useState("");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(
    pipelines[0]?.id || ""
  );
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<any>(null);

  const activePipelineStages = stages
    .filter((s) => !selectedPipelineId || s.pipeline_id === selectedPipelineId)
    .sort((a, b) => a.position - b.position);

  const filteredDeals = deals.filter((d) => {
    if (selectedPipelineId && d.pipeline?.id && d.pipeline.id !== selectedPipelineId) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchContact = d.contact?.name.toLowerCase().includes(q);
      if (!matchTitle && !matchContact) return false;
    }
    return true;
  });

  const totalValueCents = filteredDeals.reduce((sum, d) => sum + (d.value_cents || 0), 0);
  const wonDealsCount = filteredDeals.filter((d) => d.status === "won").length;

  const formatMoney = (cents: number, cur = "USD") => {
    return (cents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: cur,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Top KPI Bento Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Pipeline Value */}
        <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] p-5 shadow-[var(--shadow-bento)] backdrop-blur-md">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-semibold uppercase tracking-wider">
            <span>Pipeline Total</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pine)]/15 text-[var(--pine)]">
              <CurrencyDollar size={16} />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            {formatMoney(totalValueCents)}
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            {filteredDeals.length} active opportunities
          </div>
        </div>

        {/* Win Rate */}
        <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] p-5 shadow-[var(--shadow-bento)] backdrop-blur-md">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-semibold uppercase tracking-wider">
            <span>Win Rate</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--butter)]/20 text-[var(--butter)]">
              <CheckCircle size={16} />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            {filteredDeals.length > 0
              ? `${Math.round((wonDealsCount / filteredDeals.length) * 100)}%`
              : "0%"}
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            {wonDealsCount} deals closed won
          </div>
        </div>

        {/* Average Deal Value */}
        <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] p-5 shadow-[var(--shadow-bento)] backdrop-blur-md">
          <div className="flex items-center justify-between text-[var(--muted)] text-xs font-semibold uppercase tracking-wider">
            <span>Average Deal Size</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--tomato)]/15 text-[var(--tomato)]">
              <Funnel size={16} />
            </span>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text)]">
            {filteredDeals.length > 0
              ? formatMoney(Math.round(totalValueCents / filteredDeals.length))
              : "$0.00"}
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            Average per deal
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pill Search */}
          <div className="relative">
            <MagnifyingGlass
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search deals or contacts..."
              className="w-64 rounded-full border border-[var(--line-2)] bg-[var(--solid)] pl-9 pr-4 py-2 text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--pill)] transition-all"
            />
          </div>

          {/* Pipeline Selector Pill */}
          {pipelines.length > 1 && (
            <select
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="rounded-full border border-[var(--line-2)] bg-[var(--solid)] px-3.5 py-2 text-xs font-medium text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--pill)] transition-all cursor-pointer"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  Pipeline: {p.name}
                </option>
              ))}
            </select>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-full border border-[var(--line-2)] bg-[var(--solid)] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                viewMode === "kanban"
                  ? "bg-[var(--pill)] text-[var(--on-pill)] shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              )}
            >
              <Kanban size={14} />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                viewMode === "table"
                  ? "bg-[var(--pill)] text-[var(--on-pill)] shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              )}
            >
              <TableIcon size={14} />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => {
            setSelectedLeadForConvert({
              id: "lead-" + Date.now(),
              title: "Qualified Inbound WhatsApp Deal",
              value_cents: 350000,
              currency: "USD",
            });
            setIsConvertModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--pill)] hover:brightness-110 active:scale-[0.98] px-5 py-2 text-xs font-semibold text-[var(--on-pill)] shadow-xs transition-all cursor-pointer"
        >
          <Handshake size={15} />
          <span>Convert Lead to Deal</span>
        </button>
      </div>

      {/* 3. Main View: Kanban Board or Table */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(activePipelineStages.length > 0
            ? activePipelineStages
            : [{ id: "all", name: "Opportunities", color: "#2f5c50", position: 1 }]
          ).map((stage) => {
            const stageDeals = filteredDeals.filter(
              (d) => !d.stage?.id || d.stage.id === stage.id
            );
            const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value_cents || 0), 0);

            return (
              <div
                key={stage.id}
                className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)]/70 backdrop-blur-md p-4 flex flex-col min-h-[460px] shadow-[var(--shadow-bento)]"
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stage.color || "var(--pine)" }}
                    />
                    <h3 className="text-sm font-semibold tracking-tight text-[var(--text)]">
                      {stage.name}
                    </h3>
                    <span className="rounded-full bg-[var(--well)] px-2 py-0.5 text-[10px] font-bold text-[var(--muted)]">
                      {stageDeals.length}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[var(--muted)]">
                    {formatMoney(stageTotal)}
                  </div>
                </div>

                {/* Cards Container */}
                <div className="mt-3.5 space-y-3 flex-1 overflow-y-auto pr-1">
                  {stageDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="group rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] p-4 shadow-xs hover:shadow-[var(--shadow-pop)] hover:border-[var(--line)] transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--pine)] transition-colors">
                          {deal.title}
                        </h4>
                        <span className="text-xs font-bold text-[var(--pine)] shrink-0">
                          {formatMoney(deal.value_cents, deal.currency)}
                        </span>
                      </div>

                      {deal.contact && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                          <User size={13} />
                          <span className="truncate">{deal.contact.name}</span>
                        </div>
                      )}

                      <div className="mt-3 pt-2.5 border-t border-[var(--line)] flex items-center justify-between text-[11px] text-[var(--muted)]">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{new Date(deal.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className="rounded-full bg-[var(--well)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text)]">
                          {deal.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-36 rounded-[var(--r-tile)] border border-dashed border-[var(--line-2)] text-xs text-[var(--muted)]">
                      No deals in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md overflow-hidden p-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-[var(--line)] uppercase font-semibold text-[var(--muted)] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Deal Title</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="hover:bg-[var(--well)] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-semibold text-[var(--text)]">
                      {deal.title}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--muted)]">
                      {deal.contact?.name || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block rounded-full bg-[var(--well)] px-2 py-0.5 text-[11px] font-medium text-[var(--text)]">
                        {deal.stage?.name || "General"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[var(--muted)]">
                      {new Date(deal.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[var(--pine)]">
                      {formatMoney(deal.value_cents, deal.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block uppercase text-[10px] font-bold rounded-full px-2 py-0.5 bg-[var(--well)] text-[var(--text)]">
                        {deal.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredDeals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-[var(--muted)]">
                      No deals match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Convert Lead Modal */}
      <ConvertLeadModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        lead={selectedLeadForConvert}
        onConverted={() => {
          const newDeal: Deal = {
            id: "deal-" + Date.now(),
            title: selectedLeadForConvert.title,
            status: "open",
            value_cents: selectedLeadForConvert.value_cents || 350000,
            currency: "USD",
            created_at: new Date().toISOString(),
            contact: {
              id: "contact-" + Date.now(),
              name: selectedLeadForConvert.title,
            },
          };
          setDeals((prev) => [newDeal, ...prev]);
        }}
      />
    </div>
  );
}
