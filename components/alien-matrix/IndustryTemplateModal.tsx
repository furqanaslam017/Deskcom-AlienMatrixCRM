"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { INDUSTRY_TEMPLATES } from "@/lib/alien-matrix/templates";
import type { IndustryTemplatePack } from "@/lib/alien-matrix/types";

interface IndustryTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (templateSlug: string) => Promise<void>;
}

export function IndustryTemplateModal({
  isOpen,
  onClose,
  onApplyTemplate,
}: IndustryTemplateModalProps) {
  const [applyingSlug, setApplyingSlug] = useState<string | null>(null);

  const handleApply = async (template: IndustryTemplatePack) => {
    if (
      !confirm(
        `Install "${template.name}" pack? This will add custom objects, fields, and pipelines for ${template.industry}.`
      )
    )
      return;

    setApplyingSlug(template.slug);
    try {
      await onApplyTemplate(template.slug);
      onClose();
    } finally {
      setApplyingSlug(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3 border-b border-[var(--line-2)]">
          <DialogTitle className="text-lg font-bold text-[var(--ink)]">
            One-Click Industry Template Packs
          </DialogTitle>
          <DialogDescription className="text-xs text-[var(--muted)]">
            Instantly configure specialized CRM data architectures with pre-built objects, custom fields,
            and specialized workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INDUSTRY_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.slug}
                className="rounded-[var(--r-card)] border border-[var(--line-2)] bg-[var(--solid)] p-5 hover:border-[var(--line)] hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase bg-[var(--surface-tint)] border border-[var(--line-2)] text-[var(--muted)]">
                      {tmpl.industry}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--ink)] mb-1">{tmpl.name}</h3>
                  <p className="text-xs text-[var(--muted)] line-clamp-2 mb-3">
                    {tmpl.description}
                  </p>

                  <div className="space-y-1.5 mb-2">
                    <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider block">
                      Included Objects:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tmpl.objects.map((obj) => (
                        <span
                          key={obj.slug}
                          className="rounded-full px-2 py-0.5 text-[11px] font-mono bg-[var(--surface-tint)] border border-[var(--line-2)] text-[var(--ink)]"
                        >
                          {obj.name} ({obj.fields.length} fields)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn--ink w-full text-xs"
                  onClick={() => handleApply(tmpl)}
                  disabled={applyingSlug !== null}
                >
                  {applyingSlug === tmpl.slug ? "Installing Pack..." : "Install 1-Click Pack"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
