"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomField, CustomRecord, CustomObject } from "@/lib/alien-matrix/types";

interface RecordDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  object: CustomObject & { fields: CustomField[] };
  record: CustomRecord | null;
  onSave: (data: { title: string; values: Record<string, unknown> }) => Promise<void>;
  onDelete?: (recordId: string) => Promise<void>;
}

export function RecordDrawer({
  isOpen,
  onClose,
  object,
  record,
  onSave,
  onDelete,
}: RecordDrawerProps) {
  const [title, setTitle] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (record) {
      setTitle(record.title);
      setValues(record.values || {});
    } else {
      setTitle("");
      const initial: Record<string, unknown> = {};
      object.fields.forEach((f) => {
        if (f.default_value !== null && f.default_value !== undefined) {
          initial[f.slug] = f.default_value;
        } else if (f.field_type === "boolean") {
          initial[f.slug] = false;
        }
      });
      setValues(initial);
    }
  }, [record, object, isOpen]);

  const handleChange = (fieldSlug: string, val: unknown) => {
    setValues((prev) => ({ ...prev, [fieldSlug]: val }));
    if (fieldSlug === object.primary_field_slug && typeof val === "string") {
      setTitle(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title && values[object.primary_field_slug]) {
      setTitle(String(values[object.primary_field_slug]));
    }
    const finalTitle = title.trim() || String(values[object.primary_field_slug] || "Untitled");

    setIsSaving(true);
    try {
      await onSave({ title: finalTitle, values });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!record || !onDelete) return;
    if (!confirm(`Are you sure you want to delete this ${object.singular_name}?`)) return;
    setIsDeleting(true);
    try {
      await onDelete(record.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle>
              {record ? `Edit ${object.singular_name}` : `New ${object.singular_name}`}
            </SheetTitle>
            <SheetDescription>
              {record
                ? `Update details and custom fields for ${record.title}`
                : `Fill in details to create a new ${object.singular_name} in your CRM.`}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 py-6 space-y-5">
            {/* Primary Field / Title */}
            <div className="space-y-1.5">
              <Label htmlFor="record_title" className="font-semibold text-sm">
                {object.singular_name} Title / Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="record_title"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  handleChange(object.primary_field_slug, e.target.value);
                }}
                placeholder={`Enter ${object.singular_name.toLowerCase()} name...`}
              />
            </div>

            {/* Custom Fields */}
            {object.fields
              .filter((f) => f.slug !== object.primary_field_slug)
              .map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.slug} className="text-sm font-medium">
                      {field.label}
                      {field.is_required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {field.description && (
                      <span className="text-xs text-muted-foreground">{field.description}</span>
                    )}
                  </div>

                  {field.field_type === "long_text" ? (
                    <Textarea
                      id={field.slug}
                      value={String(values[field.slug] || "")}
                      onChange={(e) => handleChange(field.slug, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      rows={3}
                    />
                  ) : field.field_type === "boolean" ? (
                    <div className="flex items-center gap-2 pt-1">
                      <Switch
                        id={field.slug}
                        checked={Boolean(values[field.slug])}
                        onCheckedChange={(checked) => handleChange(field.slug, checked)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {values[field.slug] ? "Yes" : "No"}
                      </span>
                    </div>
                  ) : field.field_type === "select" ? (
                    <Select
                      value={String(values[field.slug] || "")}
                      onValueChange={(val) => handleChange(field.slug, val)}
                    >
                      <SelectTrigger id={field.slug}>
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-2">
                              {opt.color && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-block"
                                  style={{ backgroundColor: opt.color }}
                                />
                              )}
                              <span>{opt.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.field_type === "number" || field.field_type === "currency" ? (
                    <Input
                      id={field.slug}
                      type="number"
                      step={field.field_type === "currency" ? "0.01" : "1"}
                      value={values[field.slug] !== undefined ? String(values[field.slug]) : ""}
                      onChange={(e) =>
                        handleChange(
                          field.slug,
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder={field.field_type === "currency" ? "0.00" : "0"}
                    />
                  ) : field.field_type === "date" ? (
                    <Input
                      id={field.slug}
                      type="date"
                      value={String(values[field.slug] || "")}
                      onChange={(e) => handleChange(field.slug, e.target.value)}
                    />
                  ) : field.field_type === "datetime" ? (
                    <Input
                      id={field.slug}
                      type="datetime-local"
                      value={String(values[field.slug] || "")}
                      onChange={(e) => handleChange(field.slug, e.target.value)}
                    />
                  ) : (
                    <Input
                      id={field.slug}
                      type={
                        field.field_type === "email"
                          ? "email"
                          : field.field_type === "phone"
                          ? "tel"
                          : field.field_type === "url"
                          ? "url"
                          : "text"
                      }
                      value={String(values[field.slug] || "")}
                      onChange={(e) => handleChange(field.slug, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  )}
                </div>
              ))}
          </div>

          <SheetFooter className="pt-4 border-t flex items-center justify-between gap-3">
            {record && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : record ? "Save Changes" : `Create ${object.singular_name}`}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
