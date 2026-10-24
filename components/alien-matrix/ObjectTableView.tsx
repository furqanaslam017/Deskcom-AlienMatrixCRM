"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { CustomField, CustomRecord, CustomObject } from "@/lib/alien-matrix/types";

interface ObjectTableViewProps {
  object: CustomObject & { fields: CustomField[] };
  records: CustomRecord[];
  onSelectRecord: (record: CustomRecord) => void;
  onInlineUpdate: (recordId: string, fieldSlug: string, value: unknown) => Promise<void>;
}

export function ObjectTableView({
  object,
  records,
  onSelectRecord,
  onInlineUpdate,
}: ObjectTableViewProps) {
  const [editingCell, setEditingCell] = useState<{ recordId: string; fieldSlug: string } | null>(
    null
  );
  const [editValue, setEditValue] = useState<string>("");

  const handleStartEdit = (record: CustomRecord, field: CustomField) => {
    // Only allow editing text, number, currency, select fields inline easily
    if (["file", "relation", "user"].includes(field.field_type)) {
      onSelectRecord(record);
      return;
    }
    setEditingCell({ recordId: record.id, fieldSlug: field.slug });
    const current = record.values[field.slug];
    setEditValue(current !== undefined && current !== null ? String(current) : "");
  };

  const handleBlurOrEnter = async (recordId: string, field: CustomField) => {
    if (!editingCell) return;
    setEditingCell(null);

    let val: unknown = editValue;
    if (field.field_type === "number" || field.field_type === "currency") {
      val = editValue === "" ? null : Number(editValue);
    } else if (field.field_type === "boolean") {
      val = editValue.toLowerCase() === "true" || editValue === "1";
    }

    await onInlineUpdate(recordId, field.slug, val);
  };

  const renderCellContent = (record: CustomRecord, field: CustomField) => {
    const isEditing =
      editingCell?.recordId === record.id && editingCell?.fieldSlug === field.slug;

    if (isEditing) {
      return (
        <input
          autoFocus
          className="h-7 text-xs py-1 px-2.5 min-w-[130px] rounded-[var(--r-ctl)] border border-[var(--accent)] bg-[var(--solid)] text-[var(--ink)] shadow-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleBlurOrEnter(record.id, field)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleBlurOrEnter(record.id, field);
            if (e.key === "Escape") setEditingCell(null);
          }}
        />
      );
    }

    const val = record.values[field.slug];
    if (val === undefined || val === null || val === "") {
      return <span className="text-[var(--muted)]/50 italic text-xs">—</span>;
    }

    if (field.field_type === "select") {
      const opt = field.options?.find((o) => o.value === String(val));
      return (
        <span
          className="inline-flex items-center rounded-[var(--r-ctl)] border border-[var(--line-2)] px-2.5 py-0.5 text-[11px] font-mono font-medium"
          style={
            opt?.color
              ? { backgroundColor: `${opt.color}15`, color: opt.color, borderColor: `${opt.color}35` }
              : { backgroundColor: "var(--surface-tint)", color: "var(--ink)" }
          }
        >
          {opt?.label || String(val)}
        </span>
      );
    }

    if (field.field_type === "currency") {
      const num = Number(val);
      return (
        <span className="font-numeric font-medium text-xs text-[var(--ink)]">
          {isNaN(num)
            ? String(val)
            : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(num)}
        </span>
      );
    }

    if (field.field_type === "boolean") {
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            val
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-[var(--surface-tint)] text-[var(--muted)] border border-[var(--line-2)]"
          }`}
        >
          {val ? "Yes" : "No"}
        </span>
      );
    }

    if (field.field_type === "email") {
      return (
        <a
          href={`mailto:${val}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[var(--accent)] hover:underline text-xs"
        >
          {String(val)}
        </a>
      );
    }

    if (field.field_type === "phone") {
      return (
        <a
          href={`tel:${val}`}
          onClick={(e) => e.stopPropagation()}
          className="text-[var(--accent)] hover:underline text-xs font-mono"
        >
          {String(val)}
        </a>
      );
    }

    return <span className="text-xs text-[var(--ink)] truncate block max-w-xs">{String(val)}</span>;
  };

  return (
    <div className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-[var(--surface-tint)] border-b border-[var(--line-2)] hover:bg-[var(--surface-tint)]">
            <TableHead className="w-12 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              #
            </TableHead>
            <TableHead className="font-semibold text-[11px] text-[var(--muted)] uppercase tracking-wider min-w-[180px]">
              {object.singular_name} Title
            </TableHead>
            {object.fields
              .filter((f) => f.slug !== object.primary_field_slug)
              .map((field) => (
                <TableHead
                  key={field.id}
                  className="font-semibold text-[11px] text-[var(--muted)] uppercase tracking-wider min-w-[140px]"
                >
                  {field.label}
                </TableHead>
              ))}
            <TableHead className="w-28 text-right text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
              Created
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-[var(--line-2)]/50">
          {records.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={object.fields.length + 2}
                className="h-32 text-center text-[var(--muted)] text-xs"
              >
                No {object.plural_name.toLowerCase()} found. Click &quot;+ New {object.singular_name}&quot; to add your first record!
              </TableCell>
            </TableRow>
          ) : (
            records.map((record, index) => (
              <TableRow
                key={record.id}
                className="cursor-pointer hover:bg-[var(--surface-tint)]/60 transition-colors border-b border-[var(--line-2)]/40"
                onClick={() => onSelectRecord(record)}
              >
                <TableCell className="text-xs text-[var(--muted)] font-mono">
                  {index + 1}
                </TableCell>
                <TableCell className="font-semibold text-xs text-[var(--ink)]">
                  {record.title}
                </TableCell>
                {object.fields
                  .filter((f) => f.slug !== object.primary_field_slug)
                  .map((field) => (
                    <TableCell
                      key={field.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(record, field);
                      }}
                      className="hover:bg-[var(--surface-tint)] transition-colors cursor-text"
                    >
                      {renderCellContent(record, field)}
                    </TableCell>
                  ))}
                <TableCell className="text-right text-[11px] text-[var(--muted)] whitespace-nowrap font-mono">
                  {new Date(record.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
