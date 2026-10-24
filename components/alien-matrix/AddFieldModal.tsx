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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          <DialogHeader className="pb-3 border-b">
            <DialogTitle>Add Custom Field</DialogTitle>
            <DialogDescription>
              Define a new attribute to track on this object.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="field_label">Field Label *</Label>
              <Input
                id="field_label"
                required
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g. Bed Count, Fee Status, Property Type"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="field_slug">Field Key (API Identifier) *</Label>
              <Input
                id="field_slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. bed_count, fee_status"
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="field_type">Field Type</Label>
              <Select
                value={fieldType}
                onValueChange={(val) => setFieldType(val as CustomFieldType)}
              >
                <SelectTrigger id="field_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {FIELD_TYPES.map((ft) => (
                    <SelectItem key={ft.type} value={ft.type}>
                      <span className="font-medium">{ft.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">({ft.desc})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(fieldType === "select" || fieldType === "multi_select") && (
              <div className="space-y-1.5">
                <Label htmlFor="field_options">Dropdown Options (comma-separated)</Label>
                <Input
                  id="field_options"
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="field_required">Mandatory Field</Label>
                <p className="text-xs text-muted-foreground">Require this field on record creation</p>
              </div>
              <Switch id="field_required" checked={isRequired} onCheckedChange={setIsRequired} />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Field"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
