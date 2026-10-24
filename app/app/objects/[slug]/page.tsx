"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { ObjectTableView } from "@/components/alien-matrix/ObjectTableView";
import { ObjectKanbanView } from "@/components/alien-matrix/ObjectKanbanView";
import { ObjectListView } from "@/components/alien-matrix/ObjectListView";
import { RecordDrawer } from "@/components/alien-matrix/RecordDrawer";
import { AddFieldModal } from "@/components/alien-matrix/AddFieldModal";
import { MagnifyingGlass } from "@/lib/ui/icons";
import type {
  CustomObject,
  CustomField,
  CustomRecord,
  CustomViewType,
  CustomFieldType,
  SelectOption,
} from "@/lib/alien-matrix/types";

export default function CustomObjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [object, setObject] = useState<(CustomObject & { fields: CustomField[] }) | null>(null);
  const [records, setRecords] = useState<CustomRecord[]>([]);
  const [viewType, setViewType] = useState<CustomViewType>("table");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isRecordDrawerOpen, setIsRecordDrawerOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CustomRecord | null>(null);
  const [isAddFieldOpen, setIsAddFieldOpen] = useState(false);

  const fetchObjectAndRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const objRes = await fetch(`/api/v1/alien-matrix/objects/${slug}`);
      const objJson = await objRes.json();
      if (!objJson.data) return;

      const objData = objJson.data as CustomObject & { fields: CustomField[] };
      setObject(objData);

      const recRes = await fetch(`/api/v1/alien-matrix/objects/${objData.id}/records`);
      const recJson = await recRes.json();
      if (recJson.data) {
        setRecords(recJson.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchObjectAndRecords();
  }, [fetchObjectAndRecords]);

  // Handle Save (Create or Update)
  const handleSaveRecord = async (data: { title: string; values: Record<string, unknown> }) => {
    if (!object) return;

    if (selectedRecord) {
      // Update
      const res = await fetch(
        `/api/v1/alien-matrix/objects/${object.id}/records/${selectedRecord.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (res.ok) {
        await fetchObjectAndRecords();
      }
    } else {
      // Create
      const res = await fetch(`/api/v1/alien-matrix/objects/${object.id}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchObjectAndRecords();
      }
    }
  };

  // Handle Delete
  const handleDeleteRecord = async (recordId: string) => {
    if (!object) return;
    const res = await fetch(`/api/v1/alien-matrix/objects/${object.id}/records/${recordId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      await fetchObjectAndRecords();
    }
  };

  // Inline update in Spreadsheet Table View
  const handleInlineUpdate = async (recordId: string, fieldSlug: string, value: unknown) => {
    if (!object) return;

    // Optimistic local update
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== recordId) return r;
        const newVals = { ...r.values, [fieldSlug]: value };
        const newTitle = fieldSlug === object.primary_field_slug ? String(value) : r.title;
        return { ...r, title: newTitle, values: newVals };
      })
    );

    await fetch(`/api/v1/alien-matrix/objects/${object.id}/records/${recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fieldSlug === object.primary_field_slug ? String(value) : undefined,
        values: { [fieldSlug]: value },
      }),
    });
  };

  // Handle Add Field
  const handleAddField = async (fieldInput: {
    slug: string;
    label: string;
    field_type: CustomFieldType;
    description?: string;
    is_required?: boolean;
    options?: SelectOption[];
  }) => {
    if (!object) return;
    const res = await fetch(`/api/v1/alien-matrix/objects/${object.id}/fields`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fieldInput),
    });
    if (res.ok) {
      await fetchObjectAndRecords();
    }
  };

  const filteredRecords = records.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      Object.values(r.values).some((v) =>
        String(v).toLowerCase().includes(search.toLowerCase())
      )
  );

  if (isLoading && !object) {
    return (
      <div className="p-16 text-center text-xs text-[var(--muted)]">
        Loading object configuration...
      </div>
    );
  }

  if (!object) {
    return (
      <div className="p-16 text-center rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)]">
        <h2 className="text-base font-bold text-[var(--ink)] mb-2">Object not found</h2>
        <p className="text-xs text-[var(--muted)] mb-5">
          The requested custom object slug &quot;{slug}&quot; does not exist.
        </p>
        <Link href="/app/objects">
          <button className="btn btn--ghost text-xs">
            &larr; Return to Objects Hub
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
        <Link href="/app/objects" className="hover:text-[var(--ink)] transition-colors">
          Custom Objects
        </Link>
        <span>/</span>
        <span className="font-semibold text-[var(--ink)]">{object.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--line-2)] pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
              {object.plural_name}
            </h1>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-mono font-semibold bg-[var(--surface-tint)] border border-[var(--line-2)] text-[var(--muted)]">
              <span className="font-numeric">{records.length}</span> record{records.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs text-[var(--muted)]">
            {object.description || `Manage ${object.plural_name.toLowerCase()} in your custom schema.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddFieldOpen(true)}
            className="btn btn--ghost text-xs"
          >
            + Add Field
          </button>
          <button
            onClick={() => {
              setSelectedRecord(null);
              setIsRecordDrawerOpen(true);
            }}
            className="btn btn--ink text-xs"
          >
            + New {object.singular_name}
          </button>
        </div>
      </div>

      {/* View Switcher, Filters, Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Segmented Track Switcher */}
        <div className="tabs__track">
          <button
            type="button"
            onClick={() => setViewType("table")}
            className="tab"
            data-active={viewType === "table"}
          >
            Spreadsheet Table
          </button>
          <button
            type="button"
            onClick={() => setViewType("kanban")}
            className="tab"
            data-active={viewType === "kanban"}
          >
            Kanban Board
          </button>
          <button
            type="button"
            onClick={() => setViewType("list")}
            className="tab"
            data-active={viewType === "list"}
          >
            Card List
          </button>
        </div>

        {/* Pill Search */}
        <div className="relative">
          <MagnifyingGlass
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            placeholder={`Search ${object.plural_name.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--solid)] pl-9 pr-4 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      {/* Active View */}
      {viewType === "table" ? (
        <ObjectTableView
          object={object}
          records={filteredRecords}
          onSelectRecord={(rec) => {
            setSelectedRecord(rec);
            setIsRecordDrawerOpen(true);
          }}
          onInlineUpdate={handleInlineUpdate}
        />
      ) : viewType === "kanban" ? (
        <ObjectKanbanView
          object={object}
          records={filteredRecords}
          onSelectRecord={(rec) => {
            setSelectedRecord(rec);
            setIsRecordDrawerOpen(true);
          }}
        />
      ) : (
        <ObjectListView
          object={object}
          records={filteredRecords}
          onSelectRecord={(rec) => {
            setSelectedRecord(rec);
            setIsRecordDrawerOpen(true);
          }}
        />
      )}

      {/* Record Drawer (Create/Edit Form) */}
      <RecordDrawer
        isOpen={isRecordDrawerOpen}
        onClose={() => setIsRecordDrawerOpen(false)}
        object={object}
        record={selectedRecord}
        onSave={handleSaveRecord}
        onDelete={handleDeleteRecord}
      />

      {/* Add Field Modal */}
      <AddFieldModal
        isOpen={isAddFieldOpen}
        onClose={() => setIsAddFieldOpen(false)}
        onAddField={handleAddField}
      />
    </div>
  );
}
