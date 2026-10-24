"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-xl">One-Click Industry Template Packs</DialogTitle>
          <DialogDescription>
            Instantly configure AlienMatrix for your industry with pre-built objects, custom fields,
            and specialized workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INDUSTRY_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.slug}
                className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs font-medium">
                      {tmpl.industry}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">{tmpl.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {tmpl.description}
                  </p>

                  <div className="space-y-1 mb-4">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Included Objects:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tmpl.objects.map((obj) => (
                        <Badge key={obj.slug} variant="secondary" className="text-xs">
                          {obj.name} ({obj.fields.length} fields)
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full text-xs"
                  onClick={() => handleApply(tmpl)}
                  disabled={applyingSlug !== null}
                >
                  {applyingSlug === tmpl.slug ? "Installing Pack..." : "Install 1-Click Pack"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
