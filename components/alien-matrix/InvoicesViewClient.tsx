"use client";

import React, { useState } from "react";
import { Receipt, Plus, MagnifyingGlass, Printer, CheckCircle, Clock, X, CircleNotch, ArrowSquareOut, Check } from "@phosphor-icons/react";

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
        throw new Error(json.error || json.message || "Error saving invoice");
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
    <div className="space-y-6">
      {/* Control Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número, título ou cliente..."
              className="w-72 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-9 pr-4 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-0.5 text-xs">
            {["all", "invoice", "quote"].map((t) => (
              <button
                key={t}
                onClick={() => setKindFilter(t)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  kindFilter === t
                    ? "bg-blue-600 text-white"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                {t === "all" ? "Todos" : t === "invoice" ? "Faturas" : "Propostas/Cotações"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
        >
          <Plus size={16} weight="bold" />
          Nova Fatura / Proposta
        </button>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 uppercase font-semibold text-zinc-500 tracking-wider">
              <tr>
                <th className="py-3 px-4">Número</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Título / Assunto</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {inv.invoice_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block uppercase text-[10px] font-bold tracking-wider rounded px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {inv.kind}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                    {inv.title}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300">
                    {inv.contact?.name || inv.company?.trade_name || "—"}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-500">
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "À vista"}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                    {formatMoney(inv.total_cents, inv.currency)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inv.status === "paid"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : inv.status === "sent"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
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
                        className="inline-flex items-center gap-1 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Visualizar / Imprimir PDF"
                      >
                        <Printer size={15} />
                      </a>

                      {inv.status !== "paid" && (
                        <button
                          onClick={() => handleMarkPaid(inv.id)}
                          className="inline-flex items-center gap-1 p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                          title="Marcar como Pago"
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
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    No invoices or proposals found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Invoice / Quote Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Receipt size={20} className="text-blue-500" />
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Emitir Nova {kind === "quote" ? "Proposta Comercial" : "Fatura de Cobrança"}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              {error && (
                <div className="p-3 text-xs text-red-600 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Tipo de Documento
                  </label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as any)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="invoice">Fatura Oficial (Invoice)</option>
                    <option value="quote">Proposta / Cotação (Quote)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Cliente / Contato
                  </label>
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Selecione um contato...</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Título / Assunto *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Proposta de Implantação e Licenciamento Anual"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Line Items */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Itens / Serviços
                  </span>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    <Plus size={14} /> Adicionar Linha
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {products.length > 0 && (
                        <select
                          onChange={(e) => onSelectProductForItem(idx, e.target.value)}
                          className="w-36 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-xs text-zinc-700 dark:text-zinc-300"
                        >
                          <option value="">Catálogo...</option>
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
                        placeholder="Descrição do item ou serviço"
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />

                      <input
                        type="number"
                        min="1"
                        placeholder="Qtd"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        className="w-16 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 text-center"
                      />

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Preço"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                        className="w-24 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 text-right"
                      />

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 text-zinc-400 hover:text-red-500"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Total Estimado: ${modalTotal.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Observações e Condições de Pagamento
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Validade da proposta, chave PIX, conta bancária, etc."
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {isSubmitting ? <CircleNotch size={14} className="animate-spin" /> : <Check size={14} />}
                  Emitir Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
