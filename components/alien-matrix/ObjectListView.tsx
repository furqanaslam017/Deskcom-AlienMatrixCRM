"use client";

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
      <div className="p-12 text-center text-xs text-[var(--muted)] rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] shadow-[var(--shadow-bento)]">
        No {object.plural_name.toLowerCase()} found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {records.map((record) => (
        <div
          key={record.id}
          onClick={() => onSelectRecord(record)}
          className="rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--glass)] p-5 shadow-[var(--shadow-bento)] backdrop-blur-md cursor-pointer hover:border-[var(--line)] hover:shadow-lg transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-sm text-[var(--ink)] line-clamp-1">
                {record.title}
              </h3>
              {Boolean(record.values["status"]) && (
                <span className="inline-flex items-center rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--surface-tint)] px-2.5 py-0.5 text-[10px] font-mono font-medium text-[var(--ink)] uppercase">
                  {String(record.values["status"])}
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-[var(--muted)] my-3">
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
                  <div key={f.id} className="flex justify-between items-center text-[11px]">
                    <span className="text-[var(--muted)]">{f.label}:</span>
                    <span className="font-medium text-[var(--ink)] truncate max-w-[160px]">
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
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--line-2)] text-[11px] text-[var(--muted)] flex justify-between items-center font-mono">
            <span>
              {new Date(record.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <span className="text-[var(--accent)] hover:underline font-sans font-medium text-xs">
              View Details &rarr;
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
