"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CustomFieldType, SelectOption } from "@/lib/alien-matrix/types";

interface AddFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddField: (field: {
    slug: string;
    label: string;
    field_type: CustomFieldType;
    description?: string;
    is_required?: boolean;
    options?: SelectOption[];
  }) => Promise<void>;
}

const FIELD_TYPES: { type: CustomFieldType; label: string; desc: string }[] = [
  { type: "text", label: "Single-line Text", desc: "Names, codes, short titles" },
  { type: "long_text", label: "Multi-line Text", desc: "Notes, descriptions, addresses" },
  { type: "number", label: "Number", desc: "Quantities, counts, ages" },
  { type: "currency", label: "Currency", desc: "Prices, deal amounts, fees" },
  { type: "date", label: "Date", desc: "Birthdays, deadlines, milestones" },
  { type: "datetime", label: "Date & Time", desc: "Appointments, scheduled events" },
  { type: "boolean", label: "Yes / No (Boolean)", desc: "Switches, flags, checkboxes" },
  { type: "select", label: "Dropdown Select", desc: "Statuses, stages, categories" },
  { type: "email", label: "Email Address", desc: "Clickable email with validation" },
  { type: "phone", label: "Phone / WhatsApp", desc: "Phone numbers with direct link" },
  { type: "url", label: "Web Link / URL", desc: "Website links and social profiles" },
];

export function AddFieldModal({ isOpen, onClose, onAddField }: AddFieldModalProps) {
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("text");
  const [description, setDescription] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [optionsText, setOptionsText] = useState("Open, In Progress, Closed");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLabelChange = (val: string) => {
    setLabel(val);
    if (!slug || slug === label.toLowerCase().replace(/[^a-z0-9_]/g, "_")) {
      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !slug.trim()) return;

    let options: SelectOption[] | undefined = undefined;
    if (fieldType === "select" || fieldType === "multi_select") {
      options = optionsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((val) => ({
          label: val,
          value: val.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        }));
    }

    setIsSubmitting(true);
    try {
      await onAddField({
        slug,
        label,
        field_type: fieldType,
        description: description.trim() || undefined,
        is_required: isRequired,
        options,
      });
      onClose();
      setLabel("");
      setSlug("");
      setDescription("");
      setIsRequired(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="pb-3 border-b border-[var(--line-2)]">
            <DialogTitle className="text-base font-bold text-[var(--ink)]">Add Custom Field</DialogTitle>
            <DialogDescription className="text-xs text-[var(--muted)]">
              Define a new attribute to track on this object.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="field_label" className="text-xs font-semibold text-[var(--ink)]">Field Label *</Label>
              <input
                id="field_label"
                required
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g. Bed Count, Fee Status, Property Type"
                className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--solid)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="field_slug" className="text-xs font-semibold text-[var(--ink)]">Field Key (API Identifier) *</Label>
              <input
                id="field_slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. bed_count, fee_status"
                className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--solid)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="field_type" className="text-xs font-semibold text-[var(--ink)]">Field Type</Label>
              <Select
                value={fieldType}
                onValueChange={(val) => setFieldType(val as CustomFieldType)}
              >
                <SelectTrigger id="field_type" className="rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--solid)] text-xs text-[var(--ink)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-[var(--r-card)] border border-[var(--rim)] bg-[var(--solid)] shadow-[var(--shadow-bento)]">
                  {FIELD_TYPES.map((ft) => (
                    <SelectItem key={ft.type} value={ft.type} className="text-xs text-[var(--ink)]">
                      <span className="font-medium">{ft.label}</span>
                      <span className="text-xs text-[var(--muted)] ml-2">({ft.desc})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(fieldType === "select" || fieldType === "multi_select") && (
              <div className="space-y-1.5">
                <Label htmlFor="field_options" className="text-xs font-semibold text-[var(--ink)]">Dropdown Options (comma-separated)</Label>
                <input
                  id="field_options"
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder="Option 1, Option 2, Option 3"
                  className="w-full rounded-[var(--r-ctl)] border border-[var(--line-2)] bg-[var(--solid)] px-3.5 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] shadow-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="field_required" className="text-xs font-semibold text-[var(--ink)]">Mandatory Field</Label>
                <p className="text-xs text-[var(--muted)]">Require this field on record creation</p>
              </div>
              <Switch id="field_required" checked={isRequired} onCheckedChange={setIsRequired} />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-[var(--line-2)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn--ghost text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn--ink text-xs"
            >
              {isSubmitting ? "Adding..." : "Add Field"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
