import { describe, expect, it } from "vitest";
import { BUILT_IN_OBJECTS, INDUSTRY_TEMPLATES } from "@/lib/alien-matrix/templates";

describe("AlienMatrix Phase 1 — Custom Objects Engine", () => {
  it("defines standard built-in customizable objects", () => {
    expect(BUILT_IN_OBJECTS.length).toBeGreaterThanOrEqual(5);
    const slugs = BUILT_IN_OBJECTS.map((o) => o.slug);
    expect(slugs).toContain("contacts");
    expect(slugs).toContain("companies");
    expect(slugs).toContain("deals");
    expect(slugs).toContain("tasks");
    expect(slugs).toContain("products");
  });

  it("defines industry setup packs with objects and views", () => {
    expect(INDUSTRY_TEMPLATES.length).toBeGreaterThanOrEqual(5);
    const slugs = INDUSTRY_TEMPLATES.map((t) => t.slug);
    expect(slugs).toContain("real-estate");
    expect(slugs).toContain("education");
    expect(slugs).toContain("clinic");
    expect(slugs).toContain("agency");
    expect(slugs).toContain("retail");

    for (const tmpl of INDUSTRY_TEMPLATES) {
      expect(tmpl.objects.length).toBeGreaterThanOrEqual(1);
      for (const obj of tmpl.objects) {
        expect(obj.fields.length).toBeGreaterThan(0);
        expect(obj.primary_field_slug).toBeDefined();
      }
    }
  });

  it("ensures Real Estate pack has properties and viewings with kanban views", () => {
    const re = INDUSTRY_TEMPLATES.find((t) => t.slug === "real-estate");
    expect(re).toBeDefined();

    const prop = re?.objects.find((o) => o.slug === "properties");
    expect(prop).toBeDefined();
    expect(prop?.fields.map((f) => f.slug)).toContain("price");
    expect(prop?.fields.map((f) => f.slug)).toContain("property_type");
    expect(prop?.fields.map((f) => f.slug)).toContain("status");

    const kanban = prop?.views?.find((v) => v.view_type === "kanban");
    expect(kanban).toBeDefined();
    expect(kanban?.config.group_by_field).toBe("status");
  });
});
