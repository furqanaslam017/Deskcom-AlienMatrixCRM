"use client";

import React, { useState } from "react";
import { Handshake, User, Buildings, CurrencyDollar, X, Check, CircleNotch } from "@phosphor-icons/react";

interface ConvertLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: {
    id: string;
    title: string;
    value_cents?: number;
    currency?: string;
  } | null;
  onConverted?: () => void;
}

export function ConvertLeadModal({
  isOpen,
  onClose,
  lead,
  onConverted,
}: ConvertLeadModalProps) {
  const [contactName, setContactName] = useState(lead?.title || "");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [dealTitle, setDealTitle] = useState(lead?.title ? `Deal — ${lead.title}` : "");
  const [dealValue, setDealValue] = useState(
    lead?.value_cents ? (lead.value_cents / 100).toString() : "1000"
  );
  const [dealCurrency, setDealCurrency] = useState(lead?.currency || "USD");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!lead?.id) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const valNum = parseFloat(dealValue) || 0;
      const res = await fetch(`/api/v1/alien-matrix/leads/${lead.id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: contactName.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          companyName: companyName.trim() || undefined,
          createDeal: true,
          dealTitle: dealTitle.trim() || undefined,
          dealValueCents: Math.round(valNum * 100),
          dealCurrency,
          notes: notes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || "Failed to convert lead");
      }

      onConverted?.();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-[var(--r-card)] bg-[var(--solid)] border border-[var(--rim)] shadow-[var(--shadow-bento)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[var(--line-2)] px-6 py-4 bg-[var(--surface-tint)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
              <Handshake size={20} weight="bold" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--ink)]">
                Convert Lead to Opportunity
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Creates a qualified Contact, Company, and Pipeline Deal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--surface-tint)] hover:text-[var(--ink)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleConvert} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-[var(--r-tile)] bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Contact Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              <User size={14} /> Qualified Contact
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[var(--ink)] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--glass)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--glass)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink)] mb-1">
                  WhatsApp / Phone
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--glass)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="space-y-3 pt-3 border-t border-[var(--line-2)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              <Buildings size={14} /> Company (Optional)
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink)] mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp Inc"
                className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--glass)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Deal Details */}
          <div className="space-y-3 pt-3 border-t border-[var(--line-2)]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              <CurrencyDollar size={14} /> Pipeline Deal / Opportunity
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--ink)] mb-1">
                Deal Title *
              </label>
              <input
                type="text"
                required
                value={dealTitle}
                onChange={(e) => setDealTitle(e.target.value)}
                placeholder="e.g. Enterprise Annual Contract"
                className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--glass)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--ink)] mb-1">
                  Estimated Value
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={dealValue}
                  onChange={(e) => setDealValue(e.target.value)}
                  className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--glass)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)] font-numeric"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--ink)] mb-1">
                  Currency
                </label>
                <select
                  value={dealCurrency}
                  onChange={(e) => setDealCurrency(e.target.value)}
                  className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--glass)] px-3.5 py-2 text-xs text-[var(--ink)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="BRL">BRL (R$)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="pt-3 border-t border-[var(--line-2)]">
            <label className="block text-xs font-medium text-[var(--ink)] mb-1">
              Conversion Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Conversation summary, special requirements, timeline..."
              className="w-full rounded-2xl border border-[var(--line-2)] bg-[var(--glass)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-[var(--line-2)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-tint)] rounded-[var(--r-ctl)] border border-[var(--line-2)] transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-[var(--r-ctl)] bg-[var(--ink)] text-[var(--solid)] hover:opacity-90 px-5 py-2 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <CircleNotch size={14} className="animate-spin" /> Converting...
                </>
              ) : (
                <>
                  <Check size={14} weight="bold" /> Confirm Conversion
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
