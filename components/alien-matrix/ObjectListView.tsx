"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CustomField, CustomRecord, CustomObject } from "@/lib/alien-matrix/types";

interface ObjectListViewProps {
  object: CustomObject & { fields: CustomField[] };
  records: CustomRecord[];
  onSelectRecord: (record: CustomRecord) => void;
}

export function ObjectListView({
  object,
  records,
  onSelectRecord,
}: ObjectListViewProps) {
  if (records.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground bg-card border rounded-lg">
        No {object.plural_name.toLowerCase()} found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {records.map((record) => (
        <Card
          key={record.id}
          onClick={() => onSelectRecord(record)}
          className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                {record.title}
              </h3>
              {Boolean(record.values["status"]) && (
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {String(record.values["status"])}
                </Badge>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-muted-foreground my-3">
              {object.fields
                .filter(
                  (f) =>
                    f.slug !== object.primary_field_slug &&
                    f.slug !== "status" &&
                    record.values[f.slug] !== undefined &&
                    record.values[f.slug] !== null &&
                    record.values[f.slug] !== ""
                )
                .slice(0, 4)
                .map((f) => (
                  <div key={f.id} className="flex justify-between items-center">
                    <span className="text-muted-foreground/80">{f.label}:</span>
                    <span className="font-medium text-foreground truncate max-w-[160px]">
                      {f.field_type === "currency"
                        ? new Intl.NumberFormat(undefined, {
                            style: "currency",
                            currency: "USD",
                          }).format(Number(record.values[f.slug]))
                        : String(record.values[f.slug])}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="pt-2 border-t text-[11px] text-muted-foreground flex justify-between items-center">
            <span>Created: {new Date(record.created_at).toLocaleDateString()}</span>
            <span className="text-primary hover:underline font-medium">View Details &rarr;</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
