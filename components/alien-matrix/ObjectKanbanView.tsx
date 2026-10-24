"use client";

import { useMemo } from "react";
import type { CustomField, CustomRecord, CustomObject } from "@/lib/alien-matrix/types";

interface ObjectKanbanViewProps {
  object: CustomObject & { fields: CustomField[] };
  records: CustomRecord[];
  groupByFieldSlug?: string;
  onSelectRecord: (record: CustomRecord) => void;
  onMoveRecord?: (recordId: string, targetValue: string) => Promise<void>;
}

export function ObjectKanbanView({
  object,
  records,
  groupByFieldSlug,
  onSelectRecord,
}: ObjectKanbanViewProps) {
  // Find a select field to group by
  const groupField = useMemo(() => {
    if (groupByFieldSlug) {
      const match = object.fields.find((f) => f.slug === groupByFieldSlug);
      if (match) return match;
    }
    // Default to first select field found, or status/stage
    return (
      object.fields.find(
        (f) => f.field_type === "select" && (f.slug === "status" || f.slug === "stage")
      ) || object.fields.find((f) => f.field_type === "select")
    );
  }, [object.fields, groupByFieldSlug]);

  const columns = useMemo(() => {
    if (!groupField || !groupField.options || groupField.options.length === 0) {
      return [{ label: "All Items", value: "all", color: "#6b7280" }];
    }
    return groupField.options;
  }, [groupField]);

  const groupedRecords = useMemo(() => {
    const map: Record<string, CustomRecord[]> = {};
    columns.forEach((col) => {
      map[col.value] = [];
    });
    map["__unassigned__"] = [];

    records.forEach((rec) => {
      if (!groupField) {
        if (!map["all"]) map["all"] = [];
        map["all"].push(rec);
        return;
      }
      const val = String(rec.values[groupField.slug] || "");
      const targetCol = map[val];
      if (targetCol) {
        targetCol.push(rec);
      } else {
        const unassigned = map["__unassigned__"];
        if (unassigned) {
          unassigned.push(rec);
        } else {
          map["__unassigned__"] = [rec];
        }
      }
    });

    return map;
  }, [columns, records, groupField]);

  if (!groupField) {
    return (
      <div className="p-8 text-center text-[var(--muted)] text-xs rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)]">
        This object has no &quot;select&quot; field to group into Kanban stages. Add a status or stage
        field to enable Kanban view.
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[500px] snap-x snap-mandatory">
      {columns.map((col) => {
        const colRecords = groupedRecords[col.value] || [];

        return (
          <div
            key={col.value}
            className="flex-shrink-0 w-[85vw] sm:w-80 snap-center rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)] backdrop-blur-md flex flex-col max-h-[80vh] overflow-hidden"
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-[var(--line-2)] flex items-center justify-between bg-[var(--surface-tint)]">
              <div className="flex items-center gap-2">
                {col.color && (
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block ring-2 ring-[var(--line-2)]"
                    style={{ backgroundColor: col.color }}
                  />
                )}
                <h3 className="font-semibold text-xs uppercase tracking-wider text-[var(--ink)]">
                  {col.label}
                </h3>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-mono font-semibold bg-[var(--solid)] border border-[var(--line-2)] text-[var(--muted)]">
                {colRecords.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
              {colRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--muted)]/60 italic">
                  No records in this stage
                </div>
              ) : (
                colRecords.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => onSelectRecord(record)}
                    className="rounded-[var(--r-tile)] border border-[var(--line-2)] bg-[var(--solid)] p-3.5 cursor-pointer hover:border-[var(--line)] hover:shadow-md transition-all space-y-2"
                  >
                    <div className="text-xs font-semibold leading-snug line-clamp-2 text-[var(--ink)]">
                      {record.title}
                    </div>

                    <div className="space-y-1 text-xs text-[var(--muted)]">
                      {object.fields
                        .filter(
                          (f) =>
                            f.slug !== object.primary_field_slug &&
                            f.slug !== groupField.slug &&
                            record.values[f.slug] !== undefined &&
                            record.values[f.slug] !== null &&
                            record.values[f.slug] !== ""
                        )
                        .slice(0, 3)
                        .map((f) => (
                          <div key={f.id} className="flex justify-between items-center text-[11px]">
                            <span className="text-[var(--muted)]">{f.label}:</span>
                            <span className="font-medium text-[var(--ink)] truncate max-w-[140px]">
                              {f.field_type === "currency" ? (
                                <span className="font-numeric">
                                  {new Intl.NumberFormat(undefined, {
                                    style: "currency",
                                    currency: "USD",
                                  }).format(Number(record.values[f.slug]))}
                                </span>
                              ) : (
                                String(record.values[f.slug])
                              )}
                            </span>
                          </div>
                        ))}
                      <div className="pt-2 flex justify-between items-center text-[10px] text-[var(--muted)]/70 border-t border-[var(--line-2)]/60 font-mono">
                        <span>{new Date(record.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
