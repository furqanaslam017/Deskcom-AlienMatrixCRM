"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { IndustryTemplateModal } from "@/components/alien-matrix/IndustryTemplateModal";
import type { CustomObject } from "@/lib/alien-matrix/types";

export default function CustomObjectsHubPage() {
  const [objects, setObjects] = useState<CustomObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isNewObjectModalOpen, setIsNewObjectModalOpen] = useState(false);

  // New Object Form state
  const [newObjName, setNewObjName] = useState("");
  const [newObjSlug, setNewObjSlug] = useState("");
  const [newObjSingular, setNewObjSingular] = useState("");
  const [newObjPlural, setNewObjPlural] = useState("");
  const [newObjDesc, setNewObjDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const fetchObjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/alien-matrix/objects");
      const json = await res.json();
      if (json.data) {
        setObjects(json.data);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchObjects();
  }, [fetchObjects]);

  const handleNameChange = (val: string) => {
    setNewObjName(val);
    const clean = val.trim();
    if (!newObjSingular) setNewObjSingular(clean);
    if (!newObjPlural) setNewObjPlural(clean ? `${clean}s` : "");
    if (!newObjSlug) setNewObjSlug(clean.toLowerCase().replace(/[^a-z0-9_]/g, "_"));
  };

  const handleCreateObject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newObjName.trim() || !newObjSlug.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/v1/alien-matrix/objects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newObjName.trim(),
          slug: newObjSlug.trim(),
          singular_name: newObjSingular.trim() || newObjName.trim(),
          plural_name: newObjPlural.trim() || `${newObjName.trim()}s`,
          description: newObjDesc.trim() || undefined,
        }),
      });
      if (res.ok) {
        setIsNewObjectModalOpen(false);
        setNewObjName("");
        setNewObjSlug("");
        setNewObjSingular("");
        setNewObjPlural("");
        setNewObjDesc("");
        await fetchObjects();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleApplyTemplate = async (templateSlug: string) => {
    const res = await fetch("/api/v1/alien-matrix/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template_slug: templateSlug }),
    });
    if (res.ok) {
      await fetchObjects();
    }
  };

  const filtered = objects.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase()) ||
      (o.description && o.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              AlienMatrix Custom Objects
            </h1>
            <Badge variant="outline" className="text-xs uppercase bg-primary/10 text-primary border-primary/20">
              Generic CRM Data Model
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Shape and customize the CRM data architecture for any industry or business vertical.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" onClick={() => setIsTemplateModalOpen(true)}>
            Industry Packs
          </Button>
          <Button onClick={() => setIsNewObjectModalOpen(true)}>
            + New Custom Object
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Filter objects by name, slug or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md text-sm"
        />
        <div className="text-xs text-muted-foreground font-mono">
          {filtered.length} object{filtered.length !== 1 ? "s" : ""} registered
        </div>
      </div>

      {/* Objects Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground text-sm">
          Loading custom objects...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center border rounded-lg bg-card p-6">
          <h3 className="font-semibold text-foreground mb-1">No custom objects found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create an object or install an industry template pack to get started.
          </p>
          <Button onClick={() => setIsTemplateModalOpen(true)}>
            Browse Industry Packs
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((obj) => (
            <Link key={obj.id} href={`/app/objects/${obj.slug}`} className="block group">
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                      {obj.name}
                    </CardTitle>
                    {obj.is_system ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Core CRM
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Custom
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs line-clamp-2">
                    {obj.description || `Manage ${obj.plural_name.toLowerCase()} and attributes.`}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground font-mono">
                    <span>
                      {obj.records_count ?? 0} record{(obj.records_count ?? 0) !== 1 ? "s" : ""}
                    </span>
                    <span className="text-primary group-hover:translate-x-0.5 transition-transform">
                      Open View &rarr;
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Industry Templates Modal */}
      <IndustryTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* New Object Modal */}
      <Dialog open={isNewObjectModalOpen} onOpenChange={setIsNewObjectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateObject}>
            <DialogHeader className="pb-3 border-b">
              <DialogTitle>Create Custom Object</DialogTitle>
              <DialogDescription>
                Add a new data entity to your CRM (e.g. Properties, Students, Patients, Projects).
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="obj_name">Object Name *</Label>
                <Input
                  id="obj_name"
                  required
                  placeholder="e.g. Property, Student, Patient"
                  value={newObjName}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="obj_singular">Singular Name *</Label>
                  <Input
                    id="obj_singular"
                    required
                    placeholder="e.g. Property"
                    value={newObjSingular}
                    onChange={(e) => setNewObjSingular(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="obj_plural">Plural Name *</Label>
                  <Input
                    id="obj_plural"
                    required
                    placeholder="e.g. Properties"
                    value={newObjPlural}
                    onChange={(e) => setNewObjPlural(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="obj_slug">API Identifier (Slug) *</Label>
                <Input
                  id="obj_slug"
                  required
                  className="font-mono text-xs"
                  placeholder="e.g. properties"
                  value={newObjSlug}
                  onChange={(e) => setNewObjSlug(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="obj_desc">Description</Label>
                <Input
                  id="obj_desc"
                  placeholder="What does this object track?"
                  value={newObjDesc}
                  onChange={(e) => setNewObjDesc(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewObjectModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Object"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
