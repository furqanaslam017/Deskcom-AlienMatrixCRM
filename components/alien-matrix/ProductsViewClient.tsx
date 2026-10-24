"use client";

import React, { useState } from "react";
import {
  Package,
  Plus,
  MagnifyingGlass,
  Tag,
  Download,
  Trash,
  Check,
  X,
  CircleNotch,
} from "@/lib/ui/icons";

interface Product {
  id: string;
  sku?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  unit_price_cents: number;
  currency: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
}

interface ProductsViewClientProps {
  initialProducts: Product[];
}

export function ProductsViewClient({ initialProducts }: ProductsViewClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New product form states
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("99.00");
  const [currency, setCurrency] = useState("USD");
  const [stock, setStock] = useState("10");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean) as string[])
  );

  const filtered = products.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku?.toLowerCase().includes(q);
      if (!matchName && !matchSku) return false;
    }
    return true;
  });

  const formatMoney = (cents: number, cur = "USD") => {
    return (cents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: cur,
    });
  };

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const valNum = parseFloat(price) || 0;
      const res = await fetch("/api/v1/alien-matrix/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim() || undefined,
          category: category.trim() || undefined,
          unitPriceCents: Math.round(valNum * 100),
          currency,
          stockQuantity: parseInt(stock, 10) || 0,
          description: description.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || json.message || "Error saving product");
      }

      setProducts((prev) => [json.data || json, ...prev]);
      setIsModalOpen(false);
      setName("");
      setSku("");
      setDescription("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/v1/alien-matrix/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleExportCsv() {
    window.location.href = "/api/v1/alien-matrix/import-export/export?entity=products";
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Action Header: Search, Category Filter, and Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <MagnifyingGlass size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name or SKU..."
              className="w-full sm:w-64 rounded-full border border-[var(--line-2)] bg-[var(--well)] pl-9 pr-4 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
            />
          </div>

          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-full border border-[var(--line-2)] bg-[var(--well)] px-4 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCsv}
            className="flex-1 sm:flex-none btn btn--ghost btn--sm text-xs font-semibold inline-flex items-center justify-center gap-1.5 px-3.5 py-2"
          >
            <Download size={14} />
            Export CSV
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none btn btn--ink inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-4 py-2"
          >
            <Plus size={15} weight="bold" />
            New Product
          </button>
        </div>
      </div>

      {/* Products Bento Table */}
      <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--well)]/80 border-b border-[var(--line-2)] uppercase font-semibold text-[var(--muted)] tracking-wider">
              <tr>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Product / Service</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Stock Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line-2)]">
              {filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-[var(--well)]/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-[var(--muted)]">
                    {prod.sku || "—"}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[var(--text)]">{prod.name}</div>
                    {prod.description && (
                      <div className="text-[11px] text-[var(--muted)] truncate max-w-xs">{prod.description}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    {prod.category ? (
                      <span className="badge badge--plain text-[11px] font-medium inline-flex items-center gap-1">
                        <Tag size={12} /> {prod.category}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-[var(--text)] font-numeric">
                    {prod.stock_quantity}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 font-numeric">
                    {formatMoney(prod.unit_price_cents, prod.currency)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`badge text-[10px] font-bold uppercase ${
                        prod.is_active ? "badge--pine" : "badge--plain"
                      }`}
                    >
                      {prod.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="w-7 h-7 rounded-full inline-flex items-center justify-center text-[var(--muted)] hover:text-rose-600 hover:bg-[var(--well)] transition-colors"
                      title="Delete product"
                    >
                      <Trash size={15} />
                    </button>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--muted)]">
                    No products or services found in catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Bento Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-[var(--r-card)] bg-[var(--solid)] border border-[var(--rim)] shadow-[var(--shadow-pop)] p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-[var(--line-2)]">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[var(--well)] border border-[var(--line-2)] flex items-center justify-center text-[var(--tomato)]">
                  <Package size={16} weight="bold" />
                </span>
                <h3 className="text-sm font-bold text-[var(--text)]">
                  Add Product / Service
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--well)] transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-3.5">
              {error && (
                <div className="p-3 text-xs text-rose-600 dark:text-rose-400 rounded-[var(--r-tile)] bg-rose-500/10 border border-rose-500/20">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Monthly Strategic Advisory"
                  className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    SKU / Code
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="SRV-001"
                    className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Services"
                    className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Unit Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Initial Stock Quantity
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full rounded-full border border-[var(--line-2)] bg-[var(--well)] px-3.5 py-2 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--pill)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional item details or scope of service..."
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
