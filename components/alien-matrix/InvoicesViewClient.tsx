"use client";

import React, { useState } from "react";
import {
  Receipt,
  Plus,
  MagnifyingGlass,
  Printer,
  CheckCircle,
  Clock,
  X,
  CircleNotch,
  ArrowSquareOut,
  Check,
} from "@/lib/ui/icons";

interface Invoice {
  id: string;
  invoice_number: string;
  kind: "invoice" | "quote" | "proforma";
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  title: string;
  total_cents: number;
  currency: string;
  issue_date: string;
  due_date?: string | null;
  contact?: { name: string; email?: string } | null;
  company?: { trade_name: string } | null;
  items?: Array<{ id: string; description: string; quantity: number; unit_price_cents: number; total_cents: number }>;
}

interface InvoicesViewClientProps {
  initialInvoices: Invoice[];
  products: Array<{ id: string; name: string; unit_price_cents: number; currency: string }>;
  contacts: Array<{ id: string; name: string }>;
}

export function InvoicesViewClient({
  initialInvoices,
  products,
  contacts,
}: InvoicesViewClientProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal form states
  const [kind, setKind] = useState<"quote" | "invoice">("invoice");
  const [title, setTitle] = useState("");
  const [contactId, setContactId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    { description: "", quantity: 1, unitPrice: "100.00" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic KPI Calculations
  const totalInvoicedCents = invoices.reduce((sum, inv) => sum + (inv.total_cents || 0), 0);
  const totalCollectedCents = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + (inv.total_cents || 0), 0);
  const totalOutstandingCents = invoices
    .filter((inv) => inv.status === "sent" || inv.status === "overdue" || inv.status === "draft")
    .reduce((sum, inv) => sum + (inv.total_cents || 0), 0);

  const filtered = invoices.filter((inv) => {
    if (kindFilter !== "all" && inv.kind !== kindFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchNum = inv.invoice_number.toLowerCase().includes(q);
      const matchTitle = inv.title.toLowerCase().includes(q);
      const matchClient =
        inv.contact?.name.toLowerCase().includes(q) ||
        inv.company?.trade_name.toLowerCase().includes(q);
      if (!matchNum && !matchTitle && !matchClient) return false;
    }
    return true;
  });

  const formatMoney = (cents: number, cur = "USD") => {
    return (cents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: cur,
    });
  };

  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: "0.00" }]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  }

  function updateItem(index: number, field: string, value: any) {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return { ...item, [field]: value };
      })
    );
  }

  function onSelectProductForItem(index: number, prodId: string) {
    const prod = products.find((p) => p.id === prodId);
    if (!prod) return;
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          description: prod.name,
          unitPrice: (prod.unit_price_cents / 100).toFixed(2),
        };
      })
    );
  }

  const modalTotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/alien-matrix/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title: title.trim(),
          contactId: contactId || undefined,
          currency,
          dueDate: dueDate || undefined,
          notes: notes.trim() || undefined,
          items: items.map((it) => ({
            description: it.description.trim() || "Item",
            quantity: Number(it.quantity) || 1,
            unitPriceCents: Math.round((parseFloat(it.unitPrice) || 0) * 100),
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || "Error saving invoice document");
      }

      const created = json.data || json;
      const contactObj = contacts.find((c) => c.id === contactId);

      setInvoices((prev) => [
        {
          ...created,
          contact: contactObj ? { name: contactObj.name } : null,
        },
        ...prev,
      ]);

      setIsModalOpen(false);
      setTitle("");
      setNotes("");
      setItems([{ description: "", quantity: 1, unitPrice: "100.00" }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      const res = await fetch(`/api/v1/alien-matrix/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      if (res.ok) {
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === id ? { ...inv, status: "paid" } : inv))
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top 3 Bento KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Total Invoiced */}
        <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--muted)]">Total Invoiced</span>
            <span className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--well)] text-[var(--text)] border border-[var(--line-2)]">
              <Receipt size={16} />
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-[var(--text)] font-numeric">
              {formatMoney(totalInvoicedCents)}
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-1">
              Across all generated quotes and invoices
            </div>
          </div>
        </div>

        {/* KPI 2: Collected Revenue */}
        <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--muted)]">Collected Revenue</span>
            <span className="badge badge--pine text-[10px] font-bold">PAID</span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-numeric">
              {formatMoney(totalCollectedCents)}
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-1">
              Confirmed settled transactions
            </div>
          </div>
        </div>

        {/* KPI 3: Outstanding / Pending */}
        <div className="p-5 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--muted)]">Outstanding &amp; Overdue</span>
            <span className="badge badge--butter text-[10px] font-bold">PENDING</span>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-[var(--tomato)] font-numeric">
              {formatMoney(totalOutstandingCents)}
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-1">
              Awaiting client authorization or settlement
            </div>
          </div>
        </div>
      </div>

      {/* Control Header: Search, Filter Tabs, and Action Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <MagnifyingGlass size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice number, title, or client..."
              className="w-full sm:w-72 rounded-full border border-[var(--line-2)] bg-[var(--well)] pl-9 pr-4 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
            />
          </div>

          {/* Segmented Filter Pills */}
          <div className="tabs__track p-1 flex items-center gap-1 overflow-x-auto">
            {[
              { id: "all", label: "All Documents" },
              { id: "invoice", label: "Invoices" },
              { id: "quote", label: "Quotations" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setKindFilter(t.id)}
                data-active={kindFilter === t.id}
                className="tab text-xs"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn--ink inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2 w-full sm:w-auto"
        >
          <Plus size={15} weight="bold" />
          Create Invoice / Quote
        </button>
      </div>

      {/* Invoices Bento Table */}
      <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--well)]/80 border-b border-[var(--line-2)] uppercase font-semibold text-[var(--muted)] tracking-wider">
              <tr>
                <th className="py-3 px-4">Number</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Title / Description</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-2)]">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-[var(--well)]/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[var(--text)]">
                    {inv.invoice_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="badge badge--plain text-[10px] uppercase font-bold tracking-wider">
                      {inv.kind}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[var(--text)]">
                    {inv.title}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--muted)]">
                    {inv.contact?.name || inv.company?.trade_name || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-[var(--muted)]">
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "Immediate"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-[var(--text)] font-numeric">
                    {formatMoney(inv.total_cents, inv.currency)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`badge text-[10px] font-bold uppercase ${
                        inv.status === "paid"
                          ? "badge--pine"
                          : inv.status === "overdue"
                          ? "badge--tomato"
                          : "badge--butter"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`/api/v1/alien-matrix/invoices/${inv.id}/export`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn--ghost btn--sm p-1.5 inline-flex items-center"
                        title="View / Print PDF Document"
                      >
                        <Printer size={15} />
                      </a>

                      {inv.status !== "paid" && (
                        <button
                          onClick={() => handleMarkPaid(inv.id)}
                          className="btn btn--ghost btn--sm p-1.5 text-emerald-600 dark:text-emerald-400 inline-flex items-center"
                          title="Mark Invoice as Paid"
                        >
                          <CheckCircle size={15} weight="bold" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[var(--muted)]">
                    No invoices or proposals found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Invoice / Quote Bento Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-[var(--r-card)] bg-[var(--solid)] border border-[var(--rim)] shadow-[var(--shadow-pop)] p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-[var(--line-2)]">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[var(--well)] border border-[var(--line-2)] flex items-center justify-center text-[var(--tomato)]">
                  <Receipt size={16} weight="bold" />
                </span>
                <h3 className="text-sm font-bold text-[var(--text)]">
                  Generate New {kind === "quote" ? "Commercial Quotation" : "Tax Invoice"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)] transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {error && (
                <div className="p-3 text-xs text-rose-600 dark:text-rose-400 rounded-[var(--r-tile)] bg-rose-500/10 border border-rose-500/20">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Document Type
                  </label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as any)}
                    className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  >
                    <option value="invoice">Official Invoice</option>
                    <option value="quote">Commercial Quotation (Quote)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Client / Contact
                  </label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  >
                    <option value="">Select a contact...</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Title / Subject *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Software Licensing & Implementation Proposal"
                  className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              {/* Line Items */}
              <div className="space-y-2 pt-2 border-t border-[var(--line-2)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Line Items &amp; Services
                  </span>
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn btn--ghost btn--sm text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Line
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {products.length > 0 && (
                        <select
                          onChange={(e) => onSelectProductForItem(idx, e.target.value)}
                          className="w-36 rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3 py-1.5 text-xs text-[var(--text)]"
                        >
                          <option value="">Select product...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      )}

                      <input
                        type="text"
                        required
                        placeholder="Item or service description"
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        className="flex-1 rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                      />

                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        className="w-16 rounded-full border border-[var(--line-2)] bg-[var(--well)] px-2 py-1.5 text-xs text-[var(--text)] text-center focus:outline-none focus:border-[var(--pill)]"
                      />

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                        className="w-24 rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3 py-1.5 text-xs text-[var(--text)] text-right focus:outline-none focus:border-[var(--pill)]"
                      />

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-rose-500 hover:bg-[var(--well)]"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2 text-sm font-bold text-[var(--text)] font-numeric">
                  Estimated Total: ${modalTotal.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Terms &amp; Settlement Conditions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Validity period, payment routing instructions, bank details, etc."
                  className="w-full rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--line-2)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn--ghost btn--sm text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn--ink btn--sm text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  {isSubmitting ? <CircleNotch size={14} className="animate-spin" /> : <Check size={14} />}
                  Issue Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
