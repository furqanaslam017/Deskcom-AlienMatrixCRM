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
        <Input
          autoFocus
          className="h-8 text-xs py-1 px-2 min-w-[120px]"
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
      return <span className="text-muted-foreground/40 italic text-xs">—</span>;
    }

    if (field.field_type === "select") {
      const opt = field.options?.find((o) => o.value === String(val));
      return (
        <Badge
          variant="outline"
          className="font-normal text-xs px-2 py-0.5"
          style={
            opt?.color
              ? { backgroundColor: `${opt.color}15`, color: opt.color, borderColor: `${opt.color}40` }
              : undefined
          }
        >
          {opt?.label || String(val)}
        </Badge>
      );
    }

    if (field.field_type === "currency") {
      const num = Number(val);
      return (
        <span className="font-mono font-medium text-xs">
          {isNaN(num)
            ? String(val)
            : new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(num)}
        </span>
      );
    }

    if (field.field_type === "boolean") {
      return (
        <Badge variant={val ? "default" : "secondary"} className="text-[10px] uppercase">
          {val ? "Yes" : "No"}
        </Badge>
      );
    }

    if (field.field_type === "email") {
      return (
        <a
          href={`mailto:${val}`}
          onClick={(e) => e.stopPropagation()}
          className="text-primary hover:underline text-xs"
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
          className="text-primary hover:underline text-xs font-mono"
        >
          {String(val)}
        </a>
      );
    }

    return <span className="text-xs truncate block max-w-xs">{String(val)}</span>;
  };

  return (
    <div className="rounded-md border bg-card overflow-x-auto shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-12 text-xs font-semibold text-muted-foreground">#</TableHead>
            <TableHead className="font-semibold text-xs text-foreground min-w-[180px]">
              {object.singular_name} Title
            </TableHead>
            {object.fields
              .filter((f) => f.slug !== object.primary_field_slug)
              .map((field) => (
                <TableHead key={field.id} className="font-semibold text-xs text-foreground min-w-[140px]">
                  {field.label}
                </TableHead>
              ))}
            <TableHead className="w-24 text-right text-xs font-semibold text-muted-foreground">
              Created
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={object.fields.length + 2}
                className="h-32 text-center text-muted-foreground text-sm"
              >
                No {object.plural_name.toLowerCase()} found. Click &quot;+ New {object.singular_name}&quot; to add your first record!
              </TableCell>
            </TableRow>
          ) : (
            records.map((record, index) => (
              <TableRow
                key={record.id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onSelectRecord(record)}
              >
                <TableCell className="text-xs text-muted-foreground font-mono">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium text-xs text-foreground">
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
                      className="hover:bg-muted/60 transition-colors cursor-text"
                    >
                      {renderCellContent(record, field)}
                    </TableCell>
                  ))}
                <TableCell className="text-right text-[11px] text-muted-foreground whitespace-nowrap font-mono">
                  {new Date(record.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
