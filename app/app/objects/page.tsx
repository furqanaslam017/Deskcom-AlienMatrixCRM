"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { IndustryTemplateModal } from "@/components/alien-matrix/IndustryTemplateModal";
import { MagnifyingGlass, Database, Sparkle } from "@/lib/ui/icons";
import type { CustomObject } from "@/lib/alien-matrix/types";

export default function CustomObjectsHubPage() {
  const [objects, setObjects] = useState<CustomObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isNewObjectModalOpen, setIsNewObjectModalOpen] = useState(false);

  // New Object Form state
  const [newObjName, setNewObjName] = useState("");
  const [newObjSlug, setNewObjSlug] = useState("");
  const [newObjSingular, setNewObjSingular] = useState("");
  const [newObjPlural, setNewObjPlural] = useState("");
  const [newObjDesc, setNewObjDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchObjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/alien-matrix/objects");
      const json = await res.json();
      if (json.data) {
        setObjects(json.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchObjects();
  }, [fetchObjects]);

  const handleNameChange = (val: string) => {
    setNewObjName(val);
    const clean = val.trim();
    if (!newObjSingular) setNewObjSingular(clean);
    if (!newObjPlural) setNewObjPlural(clean ? `${clean}s` : "");
    if (!newObjSlug) setNewObjSlug(clean.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
  };

  const handleCreateObject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjName.trim() || !newObjSlug.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/v1/alien-matrix/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newObjName.trim(),
          slug: newObjSlug.trim(),
          singular_name: newObjSingular.trim() || newObjName.trim(),
          plural_name: newObjPlural.trim() || `${newObjName.trim()}s`,
          description: newObjDesc.trim() || undefined,
        }),
      });
      if (res.ok) {
        setIsNewObjectModalOpen(false);
        setNewObjName("");
        setNewObjSlug("");
        setNewObjSingular("");
        setNewObjPlural("");
        setNewObjDesc("");
        await fetchObjects();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleApplyTemplate = async (templateSlug: string) => {
    const res = await fetch("/api/v1/alien-matrix/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template_slug: templateSlug }),
    });
    if (res.ok) {
      await fetchObjects();
    }
  };

  const filtered = objects.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase()) ||
      (o.description && o.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--line-2)] pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
              Custom Objects & Data Schema
            </h1>
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase bg-[var(--surface-tint)] border border-[var(--line-2)] text-[var(--muted)]">
              Generic CRM Engine
            </span>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Shape and customize the CRM data architecture for any industry or business vertical.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="btn btn--ghost text-xs inline-flex items-center gap-1.5"
          >
            <Sparkle size={14} className="text-amber-500" />
            Industry Packs
          </button>
          <button
            onClick={() => setIsNewObjectModalOpen(true)}
            className="btn btn--ink text-xs inline-flex items-center gap-1.5"
          >
            <Database size={14} />
            + New Custom Object
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative">
          <MagnifyingGlass
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            placeholder="Filter objects by name, slug or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--solid)] pl-9 pr-4 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div className="text-xs text-[var(--muted)] font-medium">
          <span className="font-numeric font-bold text-[var(--ink)]">{filtered.length}</span> object{filtered.length !== 1 ? "s" : ""} registered
        </div>
      </div>

      {/* Objects Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-[var(--muted)] text-xs">
          Loading custom objects...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)] mx-auto mb-3">
            <Database size={22} weight="bold" />
          </div>
          <h3 className="font-bold text-sm text-[var(--ink)] mb-1">No custom objects found</h3>
          <p className="text-xs text-[var(--muted)] mb-5 max-w-sm mx-auto">
            Create an object or install an industry template pack to configure specialized data structures.
          </p>
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="btn btn--ink text-xs inline-flex items-center gap-1.5"
          >
            <Sparkle size={14} /> Browse Industry Packs
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((obj) => (
            <Link key={obj.id} href={`/app/objects/${obj.slug}`} className="block group">
              <div className="h-full rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] p-5 shadow-[var(--shadow-bento)] backdrop-blur-md hover:border-[var(--line)] hover:shadow-lg transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                      {obj.name}
                    </h3>
                    {obj.is_system ? (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold bg-[var(--surface-tint)] border border-[var(--line-2)] text-[var(--muted)]">
                        Core CRM
                      </span>
                    ) : (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-[var(--accent)]">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)] line-clamp-2">
                    {obj.description || `Manage ${obj.plural_name.toLowerCase()} and dynamic attributes.`}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-[var(--line-2)] pt-3 text-xs text-[var(--muted)] font-mono">
                  <span>
                    <span className="font-numeric font-bold text-[var(--ink)]">{obj.records_count ?? 0}</span> record{(obj.records_count ?? 0) !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[var(--accent)] group-hover:translate-x-0.5 transition-transform font-sans font-medium">
                    Open View &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Industry Templates Modal */}
      <IndustryTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* New Object Modal */}
      <Dialog open={isNewObjectModalOpen} onOpenChange={setIsNewObjectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateObject}>
            <DialogHeader className="pb-3 border-b border-[var(--line-2)]">
              <DialogTitle className="text-base font-bold text-[var(--ink)]">Create Custom Object</DialogTitle>
              <DialogDescription className="text-xs text-[var(--muted)]">
                Add a new data entity to your CRM (e.g. Properties, Students, Patients, Projects).
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="obj_name" className="text-xs font-semibold text-[var(--ink)]">Object Name *</Label>
                <input
                  id="obj_name"
                  required
                  placeholder="e.g. Property, Student, Patient"
                  value={newObjName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--solid)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="obj_singular" className="text-xs font-semibold text-[var(--ink)]">Singular Name *</Label>
                  <input
                    id="obj_singular"
                    required
                    placeholder="e.g. Property"
                    value={newObjSingular}
                    onChange={(e) => setNewObjSingular(e.target.value)}
                    className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--solid)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="obj_plural" className="text-xs font-semibold text-[var(--ink)]">Plural Name *</Label>
                  <input
                    id="obj_plural"
                    required
                    placeholder="e.g. Properties"
                    value={newObjPlural}
                    onChange={(e) => setNewObjPlural(e.target.value)}
                    className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--solid)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="obj_slug" className="text-xs font-semibold text-[var(--ink)]">API Identifier (Slug) *</Label>
                <input
                  id="obj_slug"
                  required
                  className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--solid)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)] font-mono"
                  placeholder="e.g. properties"
                  value={newObjSlug}
                  onChange={(e) => setNewObjSlug(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="obj_desc" className="text-xs font-semibold text-[var(--ink)]">Description</Label>
                <input
                  id="obj_desc"
                  placeholder="What does this object track?"
                  value={newObjDesc}
                  onChange={(e) => setNewObjDesc(e.target.value)}
                  className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--solid)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-[var(--line-2)]">
              <button
                type="button"
                onClick={() => setIsNewObjectModalOpen(false)}
                disabled={isCreating}
                className="btn btn--ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="btn btn--ink text-xs"
              >
                {isCreating ? "Creating..." : "Create Object"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
