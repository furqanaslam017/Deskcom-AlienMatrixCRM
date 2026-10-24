"use client";

import { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <div className="p-8 text-center text-muted-foreground bg-card border rounded-lg">
        This object has no &quot;select&quot; field to group into Kanban stages. Add a status or stage
        field to enable Kanban view.
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[500px]">
      {columns.map((col) => {
        const colRecords = groupedRecords[col.value] || [];

        return (
          <div
            key={col.value}
            className="flex-shrink-0 w-80 bg-muted/40 rounded-lg border flex flex-col max-h-[80vh]"
          >
            {/* Column Header */}
            <div className="p-3 border-b flex items-center justify-between bg-card/60 rounded-t-lg">
              <div className="flex items-center gap-2">
                {col.color && (
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: col.color }}
                  />
                )}
                <h3 className="font-semibold text-sm text-foreground">{col.label}</h3>
              </div>
              <Badge variant="secondary" className="text-xs px-2 py-0.5 font-mono">
                {colRecords.length}
              </Badge>
            </div>

            {/* Column Cards */}
            <div className="p-2 space-y-2 overflow-y-auto flex-1">
              {colRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground/60 italic">
                  No records
                </div>
              ) : (
                colRecords.map((record) => (
                  <Card
                    key={record.id}
                    onClick={() => onSelectRecord(record)}
                    className="p-3 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all bg-card"
                  >
                    <CardHeader className="p-0 pb-1.5">
                      <CardTitle className="text-xs font-semibold leading-snug line-clamp-2">
                        {record.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-1 text-xs text-muted-foreground">
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
                            <span className="text-muted-foreground/80">{f.label}:</span>
                            <span className="font-medium text-foreground truncate max-w-[140px]">
                              {f.field_type === "currency"
                                ? new Intl.NumberFormat(undefined, {
                                    style: "currency",
                                    currency: "USD",
                                  }).format(Number(record.values[f.slug]))
                                : String(record.values[f.slug])}
                            </span>
                          </div>
                        ))}
                      <div className="pt-2 flex justify-between items-center text-[10px] text-muted-foreground/60 border-t border-muted/30">
                        <span>{new Date(record.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
