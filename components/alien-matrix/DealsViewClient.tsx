"use client";

import React, { useState } from "react";
import { Handshake, Plus, Funnel, CurrencyDollar, CheckCircle, Clock, MagnifyingGlass, User, Buildings } from "@phosphor-icons/react";
import { ConvertLeadModal } from "./ConvertLeadModal";

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
      {/* Top Bar with Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            <span>Pipeline Total</span>
            <CurrencyDollar size={18} className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatMoney(totalValueCents)}
          </div>
          <div className="mt-1 text-xs text-zinc-500">{filteredDeals.length} negócios no total</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            <span>Win Rate</span>
            <CheckCircle size={18} className="text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {filteredDeals.length > 0 ? `${Math.round((wonDealsCount / filteredDeals.length) * 100)}%` : "0%"}
          </div>
          <div className="mt-1 text-xs text-zinc-500">{wonDealsCount} negócios ganhos</div>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            <span>Ticket Médio</span>
            <Funnel size={18} className="text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {filteredDeals.length > 0
              ? formatMoney(Math.round(totalValueCents / filteredDeals.length))
              : "$0.00"}
          </div>
          <div className="mt-1 text-xs text-zinc-500">Média por oportunidade</div>
        </div>
      </div>

      {/* Control Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar negócio ou contato..."
              className="w-64 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {pipelines.length > 1 && (
            <select
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  Funil: {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={() => {
            setSelectedLeadForConvert({
              id: "demo-lead-" + Date.now(),
              title: "Lead Qualificado WhatsApp",
              value_cents: 350000,
              currency: "USD",
            });
            setIsConvertModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
        >
          <Handshake size={16} weight="bold" />
          Converter Lead em Negócio
        </button>
      </div>

      {/* Kanban / Stage Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(activePipelineStages.length > 0 ? activePipelineStages : [{ id: "all", name: "Oportunidades", color: "#3b82f6", position: 1 }]).map((stage) => {
          const stageDeals = filteredDeals.filter((d) => !d.stage?.id || d.stage.id === stage.id);
          const stageTotal = stageDeals.reduce((sum, d) => sum + (d.value_cents || 0), 0);

          return (
            <div
              key={stage.id}
              className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-4 flex flex-col min-h-[400px]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: stage.color || "#3b82f6" }}
                  />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {stage.name}
                  </h3>
                  <span className="rounded-full bg-zinc-200/80 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                    {stageDeals.length}
                  </span>
                </div>
                <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  {formatMoney(stageTotal)}
                </div>
              </div>

              {/* Cards */}
              <div className="mt-3 space-y-3 flex-1 overflow-y-auto">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {deal.title}
                      </h4>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {formatMoney(deal.value_cents, deal.currency)}
                      </span>
                    </div>

                    {deal.contact && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-zinc-500">
                        <User size={13} />
                        <span className="truncate">{deal.contact.name}</span>
                      </div>
                    )}

                    <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>{new Date(deal.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="capitalize font-medium text-zinc-600 dark:text-zinc-300">
                        {deal.status}
                      </span>
                    </div>
                  </div>
                ))}

                {stageDeals.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
                    No deals in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConvertLeadModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        lead={selectedLeadForConvert}
        onConverted={() => {
          // Add newly converted deal to local list
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
